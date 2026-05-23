import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import mammoth from 'mammoth';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse/lib/pdf-parse.js');
const pdfParse = pdfParseModule.default || pdfParseModule;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});



const COLLECTION_NAME = 'intellimeet_docs';
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const VECTOR_SIZE = 3072;

// ── Collection setup ─────────────────────────────────────────
const ensureCollection = async () => {
  try {
    await qdrant.getCollection(COLLECTION_NAME);
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
  }

  // Index banana zaroori hai filtering ke liye
  try {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'sessionId',
      field_schema: 'keyword',
    });
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'documentId',
      field_schema: 'keyword',
    });
  } catch {
    // Index already exists — ignore
  }
};

// ── Text Extraction ──────────────────────────────────────────
const extractTextFromFile = async (filePath, fileType) => {
  if (fileType === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (fileType === 'txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${fileType}`);
};

// ── Chunking ─────────────────────────────────────────────────
const chunkText = (text) => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
    if (chunk.trim().length > 0) chunks.push(chunk);
  }
  return chunks;
};

// ── Embeddings ───────────────────────────────────────────────
// Isse
const getEmbedding = async (text) => {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  return response.embeddings[0].values;
};

const getBatchEmbeddings = async (texts) => {
  const embeddings = [];
  for (const text of texts) {
    const embedding = await getEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
};

// ── Process & Store Document ─────────────────────────────────
export const processAndStoreDocument = async (
  filePath, fileType, documentId, metadata = {}
) => {
  await ensureCollection();

  const rawText = await extractTextFromFile(filePath, fileType);
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Document appears to be empty or unreadable');
  }

  const chunks = chunkText(rawText);
  const embeddings = await getBatchEmbeddings(chunks);

  const points = chunks.map((text, i) => ({
    id: i + Date.now(),
    vector: embeddings[i],
    payload: {
      documentId: documentId.toString(),
      chunkIndex: i,
      text,
      uploadedBy: metadata.uploadedBy?.toString() || '',
      sessionId: metadata.sessionId?.toString() || 'global',
      title: metadata.title || 'Untitled',
      fileType,
    },
  }));

  await qdrant.upsert(COLLECTION_NAME, { points });

  const vectorIds = points.map((p) => p.id.toString());
  return { chunkCount: chunks.length, vectorIds };
};

// ── Search Documents ─────────────────────────────────────────
export const searchDocuments = async (query, filters = {}, topK = 5) => {
  await ensureCollection();

  const queryEmbedding = await getEmbedding(query);

  const mustConditions = [];
  if (filters.sessionId) {
    mustConditions.push({
      key: 'sessionId',
      match: { value: filters.sessionId.toString() },
    });
  }
  if (filters.documentId) {
    mustConditions.push({
      key: 'documentId',
      match: { value: filters.documentId.toString() },
    });
  }

  const searchParams = {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
    ...(mustConditions.length > 0 && {
      filter: { must: mustConditions },
    }),
  };

  const results = await qdrant.search(COLLECTION_NAME, searchParams);

  return results.map((r) => ({
    text: r.payload.text,
    metadata: r.payload,
    relevanceScore: parseFloat(r.score.toFixed(4)),
  }));
};

// ── Generate Answer ──────────────────────────────────────────
export const generateAnswer = async (query, contextChunks) => {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] ${c.text}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a helpful teaching assistant for IntelliMeet.
Answer using ONLY the provided document context.
If answer not in context, say "I couldn't find this in the uploaded materials."
Be concise and clear.

Context:
${context}

Question: ${query}

Answer:`,
  });

  return response.text;
};

// ── Delete Document Vectors ──────────────────────────────────
export const deleteDocumentVectors = async (vectorIds) => {
  if (!vectorIds || vectorIds.length === 0) return;

  const ids = vectorIds.map((id) => parseInt(id));
  await qdrant.delete(COLLECTION_NAME, {
    points: ids,
  });
};