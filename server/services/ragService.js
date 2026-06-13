import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';
import { CohereClient } from 'cohere-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import mammoth from 'mammoth';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse/lib/pdf-parse.js');
const pdfParse = pdfParseModule.default || pdfParseModule;

// ── Clients ──────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// ── Config ───────────────────────────────────────────────────
const COLLECTION_NAME = 'intellimeet_docs_v2'; // v2 — Gemini vectors incompatible the
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const VECTOR_SIZE = 1024; // Cohere embed-english-v3.0 output
const EMBED_MODEL = 'embed-english-v3.0';
const CHAT_MODEL = 'llama-3.1-8b-instant';

// ── Collection setup ─────────────────────────────────────────
const ensureCollection = async () => {
  try {
    await qdrant.getCollection(COLLECTION_NAME);
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created`);
  }
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
    // already exists — ignore
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

// ── Embeddings (Cohere batch) ────────────────────────────────
const getBatchEmbeddings = async (texts) => {
  const response = await cohere.embed({
    texts,
    model: EMBED_MODEL,
    inputType: 'search_document',
    embeddingTypes: ['float'],
  });
  return response.embeddings.float;
};

const getQueryEmbedding = async (query) => {
  const response = await cohere.embed({
    texts: [query],
    model: EMBED_MODEL,
    inputType: 'search_query',
    embeddingTypes: ['float'],
  });
  return response.embeddings.float[0];
};

// ── Process & Store Document ─────────────────────────────────
export const processAndStoreDocument = async (
  filePath,
  fileType,
  documentId,
  metadata = {}
) => {
  await ensureCollection();

  const rawText = await extractTextFromFile(filePath, fileType);
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Document appears to be empty or unreadable');
  }

  const chunks = chunkText(rawText);
  console.log(`📄 ${chunks.length} chunks extracted`);

  const embeddings = await getBatchEmbeddings(chunks);
  console.log(`✅ ${embeddings.length} embeddings generated via Cohere`);

  const baseId = Date.now();
  const points = chunks.map((text, i) => ({
    id: baseId + i,
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
  console.log(`✅ ${points.length} vectors stored in Qdrant`);

  const vectorIds = points.map((p) => p.id.toString());
  return { chunkCount: chunks.length, vectorIds };
};

// ── Search Documents ─────────────────────────────────────────
export const searchDocuments = async (query, filters = {}, topK = 5) => {
  await ensureCollection();

  const queryEmbedding = await getQueryEmbedding(query);

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

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
    ...(mustConditions.length > 0 && {
      filter: { must: mustConditions },
    }),
  });

  return results.map((r) => ({
    text: r.payload.text,
    metadata: r.payload,
    relevanceScore: parseFloat(r.score.toFixed(4)),
  }));
};

// ── Generate Answer (Groq Llama 3.1) ────────────────────────
export const generateAnswer = async (query, contextChunks) => {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] ${c.text}`)
    .join('\n\n');

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a helpful teaching assistant for IntelliMeet — a smart video meeting platform.
Answer using ONLY the provided document context.
If the answer is not in the context, say: "I couldn't find this in the uploaded materials."
Be concise and clear. Use bullet points for lists.`,
      },
      {
        role: 'user',
        content: `Document context:\n\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
      },
    ],
    temperature: 0.3,
    max_tokens: 512,
  });

  return completion.choices[0].message.content;
};

// ── Delete Document Vectors ──────────────────────────────────
export const deleteDocumentVectors = async (vectorIds) => {
  if (!vectorIds || vectorIds.length === 0) return;
  const ids = vectorIds.map((id) => parseInt(id));
  await qdrant.delete(COLLECTION_NAME, { points: ids });
  console.log(`🗑️ ${ids.length} vectors deleted`);
};