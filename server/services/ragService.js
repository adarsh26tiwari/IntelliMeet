import dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto'; // Fix 1: built-in UUID — no Date.now() collision risk
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
const COLLECTION_NAME = 'intellimeet_docs_v2'; // v2 — Cohere 1024-dim vectors
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const VECTOR_SIZE = 1024; // Cohere embed-english-v3.0 output dimensions
const EMBED_MODEL = 'embed-english-v3.0';
const CHAT_MODEL = 'llama-3.1-8b-instant';

/**
 * Feature 4: In-memory conversation history store.
 * Maps sessionId → array of {role, content} message objects.
 * Cleared on server restart — acceptable for MVP.
 * For production: replace with Redis for persistence across restarts/instances.
 * @type {Map<string, Array<{role: string, content: string}>>}
 */
const sessionConversations = new Map();

// ── Collection setup ─────────────────────────────────────────

/**
 * Ensures the Qdrant collection exists with correct vector config,
 * and that sessionId + documentId payload indexes are created for fast filtering.
 * Safe to call multiple times — ignores "already exists" errors on index creation.
 * @returns {Promise<void>}
 */
const ensureCollection = async () => {
  try {
    await qdrant.getCollection(COLLECTION_NAME);
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
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
    // Indexes already exist — ignore
  }
};

// ── Text Extraction ──────────────────────────────────────────

/**
 * Extracts plain text from a local file based on its type.
 * Supports PDF (via pdf-parse), TXT (raw read), and DOCX (via mammoth).
 * @param {string} filePath - Absolute path to the local file
 * @param {'pdf' | 'txt' | 'docx'} fileType - File type identifier
 * @returns {Promise<string>} - Extracted plain text content
 */
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

/**
 * Splits text into overlapping word-level chunks for semantic search.
 * Each chunk is CHUNK_SIZE words with CHUNK_OVERLAP word overlap between chunks.
 * Overlap ensures that context spanning a chunk boundary is captured.
 * @param {string} text - Raw extracted text to chunk
 * @returns {string[]} - Array of text chunk strings
 */
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

/**
 * Feature 3: Embeds text chunks using Cohere embed-english-v3.0.
 * Automatically batches into groups of 96 (Cohere API hard limit per call)
 * and runs all batches in parallel using Promise.all for maximum throughput.
 * Before this fix: sending >96 chunks in one call threw a silent API error.
 * @param {string[]} texts - Array of text chunks to embed
 * @returns {Promise<number[][]>} - Array of float embedding vectors (1024 dimensions each)
 */
const getBatchEmbeddings = async (texts) => {
  const COHERE_BATCH_SIZE = 96; // Cohere hard limit per API call

  // Split texts into batches of 96
  const batches = [];
  for (let i = 0; i < texts.length; i += COHERE_BATCH_SIZE) {
    batches.push(texts.slice(i, i + COHERE_BATCH_SIZE));
  }

  // Run all batches in parallel — faster for large documents
  const batchResults = await Promise.all(
    batches.map((batch) =>
      cohere.embed({
        texts: batch,
        model: EMBED_MODEL,
        inputType: 'search_document',
        embeddingTypes: ['float'],
      })
    )
  );

  // Flatten results from all batches into a single array
  return batchResults.flatMap((r) => r.embeddings.float);
};

/**
 * Embeds a single query string using Cohere's search_query input type.
 * Uses a different inputType than documents — Cohere optimizes embedding differently
 * for queries vs stored documents, improving retrieval accuracy.
 * @param {string} query - The user's question or search query
 * @returns {Promise<number[]>} - A single float embedding vector (1024 dimensions)
 */
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

/**
 * Full RAG ingestion pipeline for a single document:
 * 1. Ensures Qdrant collection exists.
 * 2. Extracts text from the local file.
 * 3. Chunks the text with sliding overlap.
 * 4. Embeds all chunks via Cohere (batched at 96 texts/call).
 * 5. Upserts all vectors into Qdrant with payload metadata.
 * 6. Returns chunk count and UUID vector IDs for storage in MongoDB.
 *
 * Fix 1: Each chunk gets a randomUUID() ID — eliminates the previous Date.now()+i
 * collision risk when two documents are uploaded within the same millisecond.
 *
 * @param {string} filePath - Absolute path to local temp file
 * @param {'pdf' | 'txt' | 'docx'} fileType - File type
 * @param {string} documentId - MongoDB Document._id (stored as payload for filtering)
 * @param {{ uploadedBy?: string, sessionId?: string, title?: string }} metadata - Extra payload fields
 * @returns {Promise<{ chunkCount: number, vectorIds: string[] }>}
 */
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

  const embeddings = await getBatchEmbeddings(chunks);

  // Fix 1: Use randomUUID() string IDs — Qdrant supports UUID strings natively.
  // Previous code used Date.now() + i which caused silent overwrites on simultaneous uploads.
  const points = chunks.map((text, i) => ({
    id: randomUUID(),
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

  // Return UUID string IDs (as strings) for storage in MongoDB vectorIds field
  const vectorIds = points.map((p) => p.id);
  return { chunkCount: chunks.length, vectorIds };
};

// ── Search Documents ─────────────────────────────────────────

/**
 * Performs semantic search over Qdrant using cosine similarity.
 * Optionally filters by sessionId and/or documentId payload fields.
 * Returns the top-K most relevant chunks with their metadata and relevance score.
 * @param {string} query - Natural language question from the user
 * @param {{ sessionId?: string, documentId?: string }} filters - Optional payload filters
 * @param {number} [topK=5] - Number of results to return
 * @returns {Promise<Array<{ text: string, metadata: object, relevanceScore: number }>>}
 */
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

/**
 * Feature 4: Generates a grounded answer using Groq's llama-3.1-8b-instant model.
 * Uses a context-window of the last 4 Q&A pairs (8 messages) so that follow-up
 * questions like "explain that more simply" work correctly.
 *
 * Message structure: system → last 8 history messages → current user query.
 * The system prompt strictly grounds answers in document context only.
 *
 * @param {string} query - The user's current question
 * @param {Array<{ text: string }>} contextChunks - Relevant document chunks from Qdrant search
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} [conversationHistory=[]] - Prior Q&A pairs
 * @returns {Promise<string>} - AI-generated answer string
 */
export const generateAnswer = async (query, contextChunks, conversationHistory = []) => {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] ${c.text}`)
    .join('\n\n');

  // Build the message array: system prompt + recent history (last 4 pairs = 8 messages) + current query
  const messages = [
    {
      role: 'system',
      content: `You are a helpful teaching assistant for IntelliMeet — a smart AI-powered video classroom.
Answer using ONLY the provided document context below.
If the answer is not in the context, say: "I couldn't find this in the uploaded materials."
Be concise and clear. Use bullet points for lists.

Document context:
${context}`,
    },
    // Inject last 4 Q&A pairs (8 messages) so follow-up questions have memory context
    ...conversationHistory.slice(-8),
    { role: 'user', content: query },
  ];

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 512,
  });

  return completion.choices[0].message.content;
};

// ── Conversation History Helpers ─────────────────────────────

/**
 * Feature 4: Retrieves the conversation history for a given session.
 * Returns an empty array if no history exists yet.
 * @param {string} sessionId - The session ID
 * @returns {Array<{ role: 'user' | 'assistant', content: string }>}
 */
export const getSessionHistory = (sessionId) => {
  return sessionConversations.get(sessionId) || [];
};

/**
 * Feature 4: Appends a user question and assistant answer to the session's conversation history.
 * The history is automatically capped at the last 20 messages (10 Q&A pairs)
 * to prevent unbounded memory growth in long sessions.
 * @param {string} sessionId - The session ID
 * @param {string} userMessage - The user's question
 * @param {string} assistantMessage - The AI's answer
 */
export const appendToHistory = (sessionId, userMessage, assistantMessage) => {
  const history = sessionConversations.get(sessionId) || [];
  history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantMessage }
  );
  // Cap at 20 messages (10 Q&A pairs) to prevent unbounded memory growth
  if (history.length > 20) history.splice(0, history.length - 20);
  sessionConversations.set(sessionId, history);
};

// ── Delete Document Vectors ──────────────────────────────────

/**
 * Deletes all Qdrant vectors associated with a document.
 * Fix 1: Removed parseInt() — IDs are now UUID strings, not numbers.
 * Qdrant accepts both integer and UUID string IDs natively.
 * @param {string[]} vectorIds - Array of UUID string vector IDs to delete
 * @returns {Promise<void>}
 */
export const deleteDocumentVectors = async (vectorIds) => {
  if (!vectorIds || vectorIds.length === 0) return;
  // Pass IDs directly as strings — no parseInt() needed (Fix 1)
  await qdrant.delete(COLLECTION_NAME, { points: vectorIds });
};