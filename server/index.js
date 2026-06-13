import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDb from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoute from './routes/authRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import ragRoute from './routes/rag.js';

dotenv.config();

// ── Security 4: JWT Secret strength check ─────────────────────
// Server will refuse to start if secret is missing or too weak.
// Update JWT_SECRET in .env to a 32+ character random string before deploying.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET is missing or too weak (must be ≥32 characters). Server will not start.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;

// ── Security 1: Helmet — HTTP security headers ────────────────
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, CSP, and more.
// Must be first middleware for maximum coverage.
app.use(helmet());

// ── Security 2: CORS lockdown ─────────────────────────────────
// Only allows requests from the configured frontend URL.
// FRONTEND_URL must be set in .env (e.g., https://intellimeet.vercel.app)
const corsOptions = {
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Security 3: MongoDB sanitization ─────────────────────────
// Strips MongoDB operators ($where, $gt, etc.) from user input.
// Prevents NoSQL injection attacks.
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (key.startsWith('$') || key.includes('.')) {
                        delete obj[key];
                    } else {
                        sanitize(obj[key]);
                    }
                }
            }
        }
    };
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
});

// ── Feature 2: Rate Limiting ──────────────────────────────────

// Global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

// Auth routes: 10 requests per 15 minutes (prevents brute-force login)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
});

// RAG /ask route: 20 requests per 15 minutes (prevents Groq API abuse + controls LLM costs)
const ragLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests. Please try again later.' },
});

app.use(globalLimiter);

// Health check (exempt from rate limiting via placement before global)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'IntelliMeet server is running',
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoute);          // stricter auth rate limit
app.use('/api/session', sessionRoute);
app.use('/api/rag', ragRoute);                          // /ask sub-route gets ragLimiter below

// Apply RAG-specific rate limit to the ask endpoint only
app.use('/api/rag/ask', ragLimiter);

app.use(errorHandler);

connectDb();

app.listen(PORT, () => {
    console.log(`IntelliMeet server running on port ${PORT}`);
});