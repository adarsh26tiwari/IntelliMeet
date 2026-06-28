# IntelliMeet

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,50:8b5cf6,100:06b6d4&height=180&section=header&text=IntelliMeet&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20Live%20Collaboration%20Platform&descAlignY=60&descSize=20"/>

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC143C?style=for-the-badge)](https://qdrant.tech/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-orange?style=for-the-badge)](https://groq.com/)
[![Cohere](https://img.shields.io/badge/Cohere-Embeddings-39594D?style=for-the-badge)](https://cohere.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

<br/>

> **IntelliMeet** is a full-stack AI-powered live meeting and collaboration platform. Host or join video sessions, upload study materials, and get instant AI-generated answers from your documents — all in one place.

</div>

---

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Security](#-security)
- [RAG Pipeline](#-rag-pipeline)
- [Database Models](#-database-models)
- [Pages and Routes](#-pages--routes)

---

## Features

### Live Video Conferencing
- Real-time multi-participant video sessions powered by **ZegoCloud**
- Host can create sessions and share a unique **Room ID**
- Participants can join existing active sessions by room code
- Full-screen video toggle support
- Sidebar with **People** and **Docs & AI** tabs

### AI Document Q&A (RAG Pipeline)
- **Upload documents** (PDF, DOCX, TXT) directly into a session
- Documents are automatically **chunked -> embedded -> stored** in Qdrant vector DB
- Ask natural language questions and get AI answers grounded in your uploaded materials
- **Multi-turn conversation memory** — follow-up questions retain context (last 10 Q&A pairs)
- AI answers powered by **Groq llama-3.1-8b-instant** (sub-100ms latency)
- Semantic embeddings via **Cohere embed-english-v3.0** (1024-dim vectors)

### Document Management
- Host-only document upload restricted via session guard middleware
- Files stored on **Cloudinary** (raw resource type for PDF/DOCX/TXT)
- Metadata stored in **MongoDB** (title, file type, size, chunk count, vector IDs)
- PDF inline preview via a server-side proxy (avoids browser CORS issues)
- Delete documents with full cleanup: Cloudinary + Qdrant vectors + MongoDB record

### Session Management
- Create sessions with auto-generated unique 12-character **Room IDs**
- Track session status: `active` / `ended`
- Participant list with join timestamps
- Host can end sessions; participants can leave
- Session history visible on the **Dashboard**

### Authentication & Security
- JWT-based authentication with **access tokens** (7-day expiry)
- Refresh token rotation — stored as **bcrypt hash** (not plaintext) for breach safety
- Passwords hashed with **bcrypt** (12 salt rounds)
- **Helmet** HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS lockdown** — only whitelisted frontend origins allowed
- **NoSQL injection prevention** — MongoDB operators stripped from all input
- **Rate limiting** at 3 tiers: global (100/15min), auth (10/15min), RAG (20/15min)
- JWT secret strength enforced at startup (>= 32 characters)

### UI/UX
- Light / Dark theme toggle with smooth transitions
- Fully responsive layout (mobile-friendly)
- Toast notifications via `react-hot-toast`
- Skeleton loaders for async data
- Protected routes — unauthenticated users redirected to login

---

## Architecture

```
+-----------------------------------------------------+
|                     CLIENT (React)                  |
|  Auth -> Dashboard -> HostSession / JoinSession     |
|               REST API calls                        |
+-----------------------------------------------------+
|                  SERVER (Express.js)                |
|                                                     |
|  /api/auth    -> authController  -> MongoDB (Users) |
|  /api/session -> sessionController -> MongoDB (Sessions) |
|  /api/rag     -> ragController   -> ragService      |
|                      |                              |
|            +---------+---------+                    |
|            |   RAG Service     |                    |
|            |  Cohere Embed     | <- Document chunks |
|            |  Qdrant Store     | -> Vector search   |
|            |  Groq Llama 3.1   | -> AI answer       |
|            +-------------------+                    |
|                                                     |
|  File storage: Cloudinary (raw: pdf/docx/txt)       |
+-----------------------------------------------------+
         ZegoCloud SDK (WebRTC video rooms)
```

---

## Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing & protected routes |
| Context API | Global state (Auth, Session, Theme) |
| ZegoCloud SDK | WebRTC video conferencing |
| react-hot-toast | Toast notifications |
| react-icons | UI icons |
| Axios | HTTP client |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Auth & password hashing |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| Multer | File upload middleware |
| Cloudinary | Cloud file storage |
| express-validator | Input validation |

### AI / ML
| Tech | Purpose |
|------|---------|
| Cohere embed-english-v3.0 | Text embeddings (1024-dim) |
| Qdrant Cloud | Vector database (Cosine similarity) |
| Groq llama-3.1-8b-instant | LLM inference for Q&A |
| pdf-parse | PDF text extraction |
| Mammoth | DOCX text extraction |

---

## Project Structure

```
IntelliMeet/
|-- client/                          # React frontend (Create React App)
|   |-- src/
|   |   |-- components/
|   |   |   |-- AuthForm.jsx          # Login / Register form
|   |   |   |-- Header.jsx            # Nav with theme toggle
|   |   |   |-- Footer.jsx
|   |   |   |-- ProtectedRoute.jsx    # Auth guard HOC
|   |   |   |-- SkeletonLoader.jsx
|   |   |   |-- Home/                 # Landing page components
|   |   |   |-- dashboard/
|   |   |   |   `-- SessionList.jsx   # Session history cards
|   |   |   `-- session/
|   |   |       |-- VideoContainer.jsx     # ZegoCloud player wrapper
|   |   |       |-- SessionHeader.jsx      # Room ID + controls bar
|   |   |       |-- SessionInfoCard.jsx    # Host / status info
|   |   |       |-- ParticipantsList.jsx   # Live participant list
|   |   |       `-- JoinForm.jsx           # Join by room ID form
|   |   |-- context/
|   |   |   |-- AuthContext.js        # User auth state
|   |   |   |-- ThemeContext.js       # Light/dark mode
|   |   |   `-- sessionContext.js     # Active session state
|   |   |-- hooks/
|   |   |   `-- useZego.js            # ZegoCloud room hook
|   |   |-- pages/
|   |   |   |-- Home.jsx              # Landing page
|   |   |   |-- Auth.jsx              # Login / Register page
|   |   |   |-- Dashboard.jsx         # My sessions overview
|   |   |   |-- HostSession.jsx       # Host view (video + docs + AI)
|   |   |   |-- JoinSession.jsx       # Participant view
|   |   |   `-- ReviewSession.jsx     # Post-session review
|   |   |-- service/
|   |   |   `-- api.js                # Axios instance with interceptors
|   |   `-- utils/
|   |       |-- constants.js          # Routes, API endpoints, config
|   |       `-- helpers.js            # Utility functions
|   `-- .env.example
|
`-- server/                          # Node.js + Express backend
    |-- config/
    |   |-- database.js               # MongoDB connection
    |   `-- cloudinary.js             # Cloudinary SDK config
    |-- controllers/
    |   |-- authController.js         # Register, login, refresh, logout
    |   |-- sessionControllers.js     # CRUD for sessions
    |   `-- ragController.js          # Upload, ask, list, delete docs
    |-- middleware/
    |   |-- auth.js                   # JWT verification middleware
    |   |-- sessionGuard.js           # Host-only route guard
    |   |-- uploadMiddleware.js       # Multer disk storage config
    |   `-- errorHandler.js           # Global error handler
    |-- model/
    |   |-- User.js                   # User schema
    |   |-- Session.js                # Session schema
    |   `-- Document.js               # Document schema
    |-- routes/
    |   |-- authRoute.js              # /api/auth
    |   |-- sessionRoute.js           # /api/session
    |   `-- rag.js                    # /api/rag
    |-- services/
    |   `-- ragService.js             # Full RAG pipeline
    |-- uploads/                      # Temp local files (auto-cleaned)
    `-- .env.example
```

---

## Environment Variables

### Server `server/.env`

```env
PORT=8000
FRONTEND_URL=http://localhost:3000

MONGO_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/IntelliMeet

# Must be >= 32 random characters
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_strong_32_char_secret_here
JWT_EXPIRES_IN=7d

QDRANT_URL=https://YOUR_CLUSTER_ID.eu-central-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

GROQ_API_KEY=gsk_your_groq_api_key

COHERE_API_KEY=your_cohere_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client `client/.env`

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ZEGO_APP_ID=your_zego_app_id
REACT_APP_ZEGO_SERVER_SECRET=your_zego_server_secret
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account
- Qdrant Cloud account
- Groq API key (free tier available)
- Cohere API key (free tier available)
- Cloudinary account
- ZegoCloud account

### 1. Clone the repository

```bash
git clone https://github.com/adarsh26tiwari/IntelliMeet.git
cd IntelliMeet
```

### 2. Setup the Server

```bash
cd server
npm install
cp .env.example .env
# Fill in your actual values in .env
npm run dev
# Starts on http://localhost:8000
```

### 3. Setup the Client

```bash
cd client
npm install
cp .env.example .env
# Fill in your actual values in .env
npm start
# Starts on http://localhost:3000
```

### 4. Verify the server

```bash
curl http://localhost:8000/api/health
# Response: { "status": "OK", "message": "IntelliMeet server is running" }
```

---

## API Reference

### Auth `/api/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/register` | No | Create a new account |
| `POST` | `/login` | No | Login, returns access + refresh tokens |
| `POST` | `/refresh` | No | Rotate refresh token, get new access token |
| `POST` | `/logout` | Yes | Invalidate refresh token |

> Rate limit: **10 requests / 15 min** per IP (brute-force protection)

### Sessions `/api/session`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/` | Yes | List all user sessions |
| `POST` | `/create` | Yes | Create a new session, returns roomId |
| `POST` | `/join` | Yes | Join a session by roomId |
| `GET` | `/:roomId` | Yes | Get session details |
| `PUT` | `/end/:sessionId` | Yes (Host) | End a session |
| `POST` | `/leave` | Yes | Leave a session |

### RAG / Documents `/api/rag`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/upload` | Yes (Host) | Upload PDF/DOCX/TXT to session |
| `POST` | `/ask` | Yes | Ask AI a question about uploaded docs |
| `GET` | `/documents?sessionId=` | Yes | List documents for a session |
| `GET` | `/download/:id` | Yes | Preview/download document via proxy |
| `DELETE` | `/documents/:id` | Yes (Host) | Delete document (full cleanup) |

> Rate limit for `/ask`: **20 requests / 15 min** per IP

---

## Security

| Layer | Implementation |
|-------|---------------|
| JWT Strength Check | Server refuses to start if secret < 32 chars |
| Password Hashing | bcrypt with 12 salt rounds |
| Refresh Token | Stored as bcrypt hash — never plaintext |
| HTTP Headers | Helmet: CSP, HSTS, X-Frame-Options |
| CORS Lockdown | Only whitelisted FRONTEND_URL origins |
| NoSQL Injection | Strips `$` operators and dot-keys from all inputs |
| Rate Limiting | 3-tier: global / auth / RAG |
| Host-Only Guard | Middleware verifies host before upload, delete, end |

---

## RAG Pipeline

```
Document Upload
      |
      v
  Text Extraction
  pdf-parse / mammoth / fs.readFileSync
      |
      v
  Chunking
  500 words per chunk, 50-word overlap
      |
      v
  Cohere Embeddings
  embed-english-v3.0 — 1024 dimensions
  Batched at 96 texts/call using Promise.all
      |
      v
  Qdrant Upsert
  UUID string IDs, cosine similarity
  Payload: documentId, sessionId, chunkIndex, text
      |
      v
  Cloudinary upload + MongoDB metadata saved


  User Question
      |
      v
  Cohere Query Embedding
  inputType: search_query (optimized separately from documents)
      |
      v
  Qdrant Semantic Search
  Top-5 chunks filtered by sessionId / documentId
      |
      v
  Groq llama-3.1-8b-instant
  Context: top-5 chunks + last 8 conversation messages
      |
      v
  AI Answer + Source Citations returned
```

**Key design decisions:**
- `search_query` vs `search_document` Cohere input types improve retrieval accuracy
- Conversation memory capped at 20 messages (10 Q&A pairs) to prevent memory bloat
- UUID string IDs for Qdrant vectors eliminate `Date.now()` collision risk on concurrent uploads
- Cohere batch size of 96 respects the hard API limit per call

---

## Database Models

### User
```js
{
  name:             String,   // max 50 chars
  email:            String,   // unique, lowercase
  password:         String,   // bcrypt hash, not returned by default
  refreshTokenHash: String,   // bcrypt hash, not returned by default
  timestamps:       true
}
```

### Session
```js
{
  roomId:       String,           // unique 12-char alphanumeric
  host:         ObjectId (User),
  hostName:     String,
  status:       "active" | "ended",
  participants: [{ userId, userName, joinedAt }],
  startedAt:    Date,
  endedAt:      Date,
  timestamps:   true
}
```

### Document
```js
{
  title:              String,
  originalName:       String,
  fileType:           "pdf" | "txt" | "docx",
  fileSize:           Number,
  uploadedBy:         ObjectId (User),
  sessionId:          ObjectId (Session),
  vectorIds:          [String],   // UUID strings in Qdrant
  chunkCount:         Number,
  isProcessed:        Boolean,
  processingError:    String,
  fileUrl:            String,     // Cloudinary secure URL
  cloudinaryPublicId: String,
  timestamps:         true
}
```

---

## Pages & Routes

| Route | Page | Auth | Description |
|-------|------|:----:|-------------|
| `/` | Home | No | Landing page |
| `/login` | Auth | No | Login form |
| `/register` | Auth | No | Register form |
| `/dashboard` | Dashboard | Yes | Session history, create/join buttons |
| `/host` | HostSession | Yes | Host view: video + docs upload + AI Q&A |
| `/join` | JoinSession | Yes | Participant view: video + AI Q&A |
| `/review` | ReviewSession | Yes | Post-session document review & Q&A |
| `*` | 404 | No | Custom not-found page |

---

## Author

**Adarsh Tiwari**
- GitHub: [@adarsh26tiwari](https://github.com/adarsh26tiwari)
- College: MNNIT Allahabad — 3rd Year CSE

---

<div align="center">
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:06b6d4,50:8b5cf6,100:6366f1&height=120&section=footer"/>
</div>
