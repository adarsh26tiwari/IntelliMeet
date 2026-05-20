import express from 'express';
import {body,validationResult} from 'express-validator'
import { getMe, login, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const handleValidationError = (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            success:false,
            error:errors.array()[0].msg
        })
    }
    next();
}

router.post(
    '/register',
    [
        body('name')
        .trim()
        .isLength({min:2, max:50})
        .withMessage('Name must be between 2 and 50 characters'),
        body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
        body('password')
        .isLength({min:6})
        .withMessage('Password must be at least 6 characters')
    ],
    handleValidationError,
    register
)

router.post(
    '/login',
    [
        body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
        body('password')
        .isLength({min:6})
        .withMessage('Password must be at least 6 characters')
    ],
    handleValidationError,
    login
)

router.get('/me', protect, getMe)

export default router;