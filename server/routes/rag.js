import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  uploadDocument,
  askQuestion,
  getDocuments,
  deleteDocument,
} from '../controllers/ragController.js';

const router = express.Router();

// Host only — upload
router.post('/upload', protect, upload.single('document'), uploadDocument);

// Host + Attendee — ask AI
router.post('/ask', protect, askQuestion);

// Host + Attendee — documents list
router.get('/documents', protect, getDocuments);

// Host only — delete
router.delete('/documents/:id', protect, deleteDocument);

export default router;