import Session from '../model/Session.js';

/**
 * Fix 5 — Session Auth Guard
 *
 * Middleware that verifies the authenticated user is a participant (or host) of the
 * requested session. Applied to /api/rag/ask and /api/rag/documents routes.
 *
 * Flow:
 *  1. Extracts sessionId from req.body, req.query, or req.params (in that order).
 *  2. If no sessionId is provided, passes through (some endpoints are global).
 *  3. Fetches the session from MongoDB.
 *  4. Checks that req.user.userId is either the host or a registered participant.
 *  5. Returns 403 Forbidden with a clear message if the check fails.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const sessionGuard = async (req, res, next) => {
    try {
        // Extract sessionId from any location it might appear
        const sessionId = req.body?.sessionId || req.query?.sessionId || req.params?.sessionId;

        // If no sessionId provided, skip guard (allows global document queries)
        if (!sessionId) return next();

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
            });
        }

        const userId = req.user.userId.toString();
        const isHost = session.host.toString() === userId;
        const isParticipant = session.participants.some(
            (p) => p.userId.toString() === userId
        );

        if (!isHost && !isParticipant) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You are not a participant of this session',
            });
        }

        // Attach session to request for use in controller (avoids second DB lookup)
        req.session = session;
        next();
    } catch (error) {
        next(error);
    }
};

export default sessionGuard;
