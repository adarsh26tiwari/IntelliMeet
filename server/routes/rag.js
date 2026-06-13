import express from "express";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  askQuestion,
  getDocuments,
  deleteDocument,
  downloadDocument,
} from "../controllers/ragController.js";

const router = express.Router();

router.post("/upload", protect, upload.single("document"), uploadDocument);
router.post("/ask", protect, askQuestion);
router.get("/documents", protect, getDocuments);
router.delete("/documents/:id", protect, deleteDocument);
router.get("/download/:id", downloadDocument);

export default router;
