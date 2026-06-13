import express from "express";
import { protect } from "../middleware/auth.js";
import sessionGuard from "../middleware/sessionGuard.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  askQuestion,
  getDocuments,
  deleteDocument,
  downloadDocument,
} from "../controllers/ragController.js";

const router = express.Router();

// Upload — host only (host verification handled inside controller)
router.post("/upload", protect, upload.single("document"), uploadDocument);

// Ask AI — requires auth + session membership (Fix 5)
router.post("/ask", protect, sessionGuard, askQuestion);

// Get documents — requires auth + session membership (Fix 5)
router.get("/documents", protect, sessionGuard, getDocuments);

// Delete document — host only (host verification handled inside controller)
router.delete("/documents/:id", protect, deleteDocument);

// Download proxy — no auth (used for direct PDF viewing in browser)
router.get("/download/:id", downloadDocument);

export default router;
