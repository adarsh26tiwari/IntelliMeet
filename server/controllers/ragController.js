import Document from '../model/Document.js';
import Session from '../model/Session.js';
import cloudinary from '../config/cloudinary.js';
import {
  processAndStoreDocument,
  searchDocuments,
  generateAnswer,
  deleteDocumentVectors,
  getSessionHistory,
  appendToHistory,
} from '../services/ragService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Host check helper ────────────────────────────────────────
const verifyHost = async (sessionId, userId) => {
  const session = await Session.findById(sessionId);
  if (!session) return { valid: false, error: 'Session not found' };
  if (session.host.toString() !== userId.toString())
    return { valid: false, error: 'Only the session host can perform this action' };
  return { valid: true, session };
};

// ── POST /api/rag/upload — Host only ────────────────────────
export const uploadDocument = async (req, res, next) => {
  const localFilePath = req.file?.path;
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: 'No file uploaded' });

    const { title, sessionId } = req.body;

    if (!sessionId) {
      if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    const hostCheck = await verifyHost(sessionId, req.user.userId);
    if (!hostCheck.valid) {
      if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
      return res.status(403).json({ success: false, error: hostCheck.error });
    }

    const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    const document = await Document.create({
      title: title || req.file.originalname,
      originalName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      uploadedBy: req.user.userId,
      sessionId,
    });

    // RAG processing — chunk, embed, store in Qdrant
    const { chunkCount, vectorIds } = await processAndStoreDocument(
      localFilePath,
      fileType,
      document._id,
      { uploadedBy: req.user.userId, sessionId, title: document.title }
    );

    // Cloudinary upload — resource_type 'raw' for PDF/DOCX/TXT
    const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
      folder: 'intellimeet_docs',
      resource_type: 'raw',
      access_mode: 'public',
      type: 'upload',
      public_id: `${Date.now()}-${path
        .parse(req.file.originalname)
        .name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    });

    // Local file cleanup
    if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    // Document update with Cloudinary URL and vector IDs
    document.isProcessed = true;
    document.chunkCount = chunkCount;
    document.vectorIds = vectorIds;
    document.fileUrl = cloudinaryResult.secure_url;
    document.cloudinaryPublicId = cloudinaryResult.public_id;
    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      document: {
        _id: document._id,
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        chunkCount: document.chunkCount,
        isProcessed: document.isProcessed,
        fileUrl: document.fileUrl,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    next(error);
  }
};

// ── GET /api/rag/download/:id — PDF proxy server ────────────
// Server fetches from Cloudinary and serves with proper PDF headers
// This avoids browser CORS/redirect issues with raw Cloudinary URLs
export const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document)
      return res.status(404).json({ success: false, error: 'Document not found' });

    if (!document.fileUrl)
      return res.status(404).json({ success: false, error: 'File URL not found' });

    const axios = (await import('axios')).default;
    const response = await axios.get(document.fileUrl, {
      responseType: 'arraybuffer',
    });

    const isPdf = document.fileType === 'pdf';
    res.set({
      'Content-Type': isPdf ? 'application/pdf' : 'application/octet-stream',
      'Content-Disposition': isPdf
        ? `inline; filename="${document.originalName}"`
        : `attachment; filename="${document.originalName}"`,
      'Content-Length': response.data.byteLength,
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(Buffer.from(response.data));
  } catch (error) {
    next(error);
  }
};

// ── POST /api/rag/ask ─────────────────────────────────────────
// Feature 4: Reads session history, passes to generateAnswer, then appends to history
export const askQuestion = async (req, res, next) => {
  try {
    const { query, sessionId, documentId } = req.body;

    if (!query || query.trim().length < 3)
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid question (min 3 characters)',
      });

    const filters = {};
    if (sessionId) filters.sessionId = sessionId;
    if (documentId) filters.documentId = documentId;

    const contextChunks = await searchDocuments(query, filters, 5);

    if (contextChunks.length === 0) {
      return res.status(200).json({
        success: true,
        query,
        answer: 'No relevant documents found. Please make sure materials have been uploaded for this session.',
        sources: [],
      });
    }

    // Feature 4: Retrieve conversation history for this session for multi-turn context
    const conversationHistory = sessionId ? getSessionHistory(sessionId) : [];

    const answer = await generateAnswer(query, contextChunks, conversationHistory);

    // Feature 4: Persist this Q&A pair into the session's conversation history
    if (sessionId) {
      appendToHistory(sessionId, query, answer);
    }

    res.status(200).json({
      success: true,
      query,
      answer,
      sources: contextChunks.map((c) => ({
        documentId: c.metadata.documentId,
        title: c.metadata.title,
        relevanceScore: c.relevanceScore,
        excerpt: c.text.substring(0, 200) + '...',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/rag/documents?sessionId=xxx ────────────────────
export const getDocuments = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .select('-vectorIds')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/rag/documents/:id — Host only ────────────────
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document)
      return res.status(404).json({ success: false, error: 'Document not found' });

    const hostCheck = await verifyHost(document.sessionId.toString(), req.user.userId);
    if (!hostCheck.valid)
      return res.status(403).json({ success: false, error: hostCheck.error });

    if (document.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
        resource_type: 'raw',
      });
    }

    await deleteDocumentVectors(document.vectorIds);
    await document.deleteOne();

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};