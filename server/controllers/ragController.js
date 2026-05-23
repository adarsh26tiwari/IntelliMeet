import Document from '../model/Document.js';
import Session from '../model/Session.js';
import {
  processAndStoreDocument,
  searchDocuments,
  generateAnswer,
  deleteDocumentVectors,
} from '../services/ragService.js';
import fs from 'fs';
import path from 'path';

// ── Host check helper ────────────────────────────────────────
const verifyHost = async (sessionId, userId) => {
  const session = await Session.findById(sessionId);
  if (!session) return { valid: false, error: 'Session not found' };
  if (session.host.toString() !== userId.toString()) {
    return { valid: false, error: 'Only the session host can perform this action' };
  }
  return { valid: true, session };
};

// POST /api/rag/upload — Host only
export const uploadDocument = async (req, res, next) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { title, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    // Verify host
    const hostCheck = await verifyHost(sessionId, req.user.userId);
    if (!hostCheck.valid) {
      fs.unlinkSync(uploadedFilePath);
      return res.status(403).json({
        success: false,
        error: hostCheck.error
      });
    }

    const fileType = path
      .extname(req.file.originalname)
      .replace('.', '')
      .toLowerCase();

    const document = await Document.create({
      title: title || req.file.originalname,
      originalName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      uploadedBy: req.user.userId,
      sessionId,
    });

    const { chunkCount, vectorIds } = await processAndStoreDocument(
      uploadedFilePath,
      fileType,
      document._id,
      {
        uploadedBy: req.user.userId,
        sessionId,
        title: document.title,
      }
    );

    document.isProcessed = true;
    document.chunkCount = chunkCount;
    document.vectorIds = vectorIds;
    await document.save();

    fs.unlinkSync(uploadedFilePath);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      document: {
        _id: document._id,
        title: document.title,
        fileType: document.fileType,
        chunkCount: document.chunkCount,
        isProcessed: document.isProcessed,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    next(error);
  }
};

// POST /api/rag/ask — Host + Attendee both
export const askQuestion = async (req, res, next) => {
  try {
    const { query, sessionId, documentId } = req.body;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid question (min 3 characters)',
      });
    }

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

    const answer = await generateAnswer(query, contextChunks);

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

// GET /api/rag/documents?sessionId=xxx — Host + Attendee both
export const getDocuments = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .select('-vectorIds')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/rag/documents/:id — Host only
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify host
    const hostCheck = await verifyHost(
      document.sessionId.toString(),
      req.user.userId
    );
    if (!hostCheck.valid) {
      return res.status(403).json({
        success: false,
        error: hostCheck.error
      });
    }

    await deleteDocumentVectors(document.vectorIds);
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};