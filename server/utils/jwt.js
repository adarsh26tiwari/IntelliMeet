import jwt from 'jsonwebtoken';


/**
 * Generates a short-lived access token (15 min).
 * Used to authenticate API requests. Should be kept in memory (not localStorage) in production.
 * @param {string} userId - MongoDB User._id
 * @returns {string} - Signed JWT access token
 */
export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

/**
 * Generates a long-lived refresh token (7 days).
 * Used ONLY to obtain new access tokens via POST /auth/refresh.
 * The plaintext version is sent to the client; a bcrypt hash is stored in MongoDB.
 * @param {string} userId - MongoDB User._id
 * @returns {string} - Signed JWT refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Backward-compatible alias — issues a 15-min access token.
 * Keeps existing callers working without changes.
 * @param {string} userId
 * @returns {string}
 */
export const generateToken = generateAccessToken;

/**
 * Verifies a JWT access or refresh token.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {{ userId: string }} - Decoded payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
