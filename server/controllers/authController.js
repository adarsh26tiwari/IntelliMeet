import User from '../model/User.js';
import bcryptjs from 'bcryptjs';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
} from '../utils/jwt.js';


export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email',
            });
        }

        const user = await User.create({ name, email, password });

        // Feature 1: Issue access + refresh token pair on registration
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Hash the refresh token before storing — if DB is breached, tokens can't be replayed
        const salt = await bcryptjs.genSalt(10);
        user.refreshTokenHash = await bcryptjs.hash(refreshToken, salt);
        await user.save({ validateBeforeSave: false });

        res.status(201).json({
            success: true,
            data: {
                user: { id: user._id, name: user.name, email: user.email },
                token: accessToken,         // Short-lived access token (15 min)
                refreshToken,               // Long-lived refresh token (7 days)
            },
            message: 'User registered successfully',
        });

    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password +refreshTokenHash');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Feature 1: Issue access + refresh token pair on login
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Rotate refresh token — invalidate old one, store new hash
        const salt = await bcryptjs.genSalt(10);
        user.refreshTokenHash = await bcryptjs.hash(refreshToken, salt);
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: {
                user: { id: user._id, name: user.name, email: user.email },
                token: accessToken,         // Short-lived access token (15 min)
                refreshToken,               // Long-lived refresh token (7 days)
            },
            message: 'User login successfully',
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Feature 1 — POST /auth/refresh
 * Accepts a refresh token → validates it → issues new access token + rotates refresh token.
 * Old refresh token is invalidated (its hash is replaced in DB).
 * This is refresh token rotation — a standard security pattern that prevents replay attacks.
 */
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: incomingToken } = req.body;
        if (!incomingToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token is required',
            });
        }

        // Verify JWT signature and expiry
        let decoded;
        try {
            decoded = verifyToken(incomingToken);
        } catch {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
            });
        }

        // Load user with their stored refresh token hash
        const user = await User.findById(decoded.userId).select('+refreshTokenHash');
        if (!user || !user.refreshTokenHash) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token — please log in again',
            });
        }

        // Verify the incoming token matches the stored hash
        const isValid = await bcryptjs.compare(incomingToken, user.refreshTokenHash);
        if (!isValid) {
            // Possible token reuse attack — clear the stored hash to force re-login
            user.refreshTokenHash = null;
            await user.save({ validateBeforeSave: false });
            return res.status(401).json({
                success: false,
                error: 'Refresh token has already been used — please log in again',
            });
        }

        // Issue new token pair (rotation: old refresh token is now invalidated)
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        const salt = await bcryptjs.genSalt(10);
        user.refreshTokenHash = await bcryptjs.hash(newRefreshToken, salt);
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken,
            },
            message: 'Token refreshed successfully',
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Feature 1 — POST /auth/logout
 * Deletes the refresh token hash from DB, effectively invalidating the session.
 */
export const logout = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, {
            refreshTokenHash: null,
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: { id: user._id, name: user.name, email: user.email },
            },
            message: 'User fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};