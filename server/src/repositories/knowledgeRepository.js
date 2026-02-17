/**
 * Knowledge Repository
 *
 * Data access functions for the Firestore knowledge_base collection
 * and Firebase Storage operations for PDF and Markdown files.
 *
 * Storage folder structure:
 *   knowledge_sources/raw_pdfs/       — Source PDF files
 *   knowledge_sources/markdown_output/ — Converted Markdown files
 */
import firebaseAdmin, { storage } from "../config/firebase.js";
import { existsSync, statSync } from "fs";
import { extname } from "path";

const COLLECTION = "knowledge_base";
const MAX_RESULTS = 5;
const PDF_PREFIX = "knowledge_sources/raw_pdfs/";
const MD_PREFIX = "knowledge_sources/markdown_output/";
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const MAX_MD_SIZE = 10 * 1024 * 1024;

function getDb() {
  return firebaseAdmin.firestore();
}

function validateFile(filePath, extension, maxSize) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  if (extname(filePath).toLowerCase() !== extension) {
    throw new Error(`Invalid file type. Expected ${extension}`);
  }
  if (statSync(filePath).size > maxSize) {
    throw new Error(`File exceeds max size of ${maxSize} bytes`);
  }
}

async function uploadFile(filePath, fileName, prefix, contentType, meta) {
  const storagePath = `${prefix}${fileName}`;
  const uploadedAt = new Date().toISOString();
  await storage.upload(filePath, {
    destination: storagePath,
    metadata: { contentType, metadata: { ...meta, uploadedAt } },
  });
  const publicUrl = `https://storage.googleapis.com/${storage.name}/${storagePath}`;
  return { fileName, storagePath, publicUrl, uploadedAt };
}

async function listFiles(prefix, extension) {
  const [files] = await storage.getFiles({ prefix });
  return files
    .filter((f) => f.name.endsWith(extension))
    .map((f) => ({
      fileName: f.name.split("/").pop(),
      storagePath: f.name,
      size: Number(f.metadata.size),
      timeCreated: f.metadata.timeCreated,
      metadata: f.metadata.metadata || {},
    }));
}

// --- Firestore Knowledge Base ---

export async function queryKnowledgeBase(keywords, category) {
  try {
    const db = getDb();
    let ref = db.collection(COLLECTION);

    if (keywords && keywords.length > 0) {
      ref = ref.where("tags", "array-contains-any", keywords.slice(0, 10));
    }

    if (category) {
      ref = ref.where("category", "==", category);
    }

    const snapshot = await ref.limit(MAX_RESULTS).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("knowledgeRepository.queryKnowledgeBase failed:", error.message);
    throw error;
  }
}

export async function getDocumentById(docId) {
  try {
    const db = getDb();
    const doc = await db.collection(COLLECTION).doc(docId).get();

    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("knowledgeRepository.getDocumentById failed:", error.message);
    throw error;
  }
}

export async function createDocument(documentData) {
  try {
    const db = getDb();
    const docRef = await db.collection(COLLECTION).add({
      ...documentData,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...documentData };
  } catch (error) {
    console.error("knowledgeRepository.createDocument failed:", error.message);
    throw error;
  }
}

export async function updateDocument(docId, updates) {
  try {
    const db = getDb();
    await db
      .collection(COLLECTION)
      .doc(docId)
      .update({ ...updates, updatedAt: new Date() });
    const updated = await getDocumentById(docId);
    return updated;
  } catch (error) {
    console.error("knowledgeRepository.updateDocument failed:", error.message);
    throw error;
  }
}

export async function deleteDocument(docId) {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(docId).delete();
  } catch (error) {
    console.error("knowledgeRepository.deleteDocument failed:", error.message);
    throw error;
  }
}

// --- Firebase Storage Operations ---

export async function uploadPdfToStorage(filePath, fileName, metadata = {}) {
  try {
    validateFile(filePath, ".pdf", MAX_PDF_SIZE);
    return await uploadFile(filePath, fileName, PDF_PREFIX, "application/pdf", metadata);
  } catch (error) {
    console.error("knowledgeRepository.uploadPdfToStorage failed:", error.message);
    throw error;
  }
}

export async function listPdfsFromStorage(prefix = PDF_PREFIX) {
  try {
    return await listFiles(prefix, ".pdf");
  } catch (error) {
    console.error("knowledgeRepository.listPdfsFromStorage failed:", error.message);
    throw error;
  }
}

export async function getPdfDownloadUrl(fileName) {
  try {
    const file = storage.file(`${PDF_PREFIX}${fileName}`);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error("knowledgeRepository.getPdfDownloadUrl failed:", error.message);
    throw error;
  }
}

export async function uploadMarkdownToStorage(filePath, fileName, metadata = {}) {
  try {
    validateFile(filePath, ".md", MAX_MD_SIZE);
    return await uploadFile(filePath, fileName, MD_PREFIX, "text/markdown", metadata);
  } catch (error) {
    console.error("knowledgeRepository.uploadMarkdownToStorage failed:", error.message);
    throw error;
  }
}

export async function listMarkdownFromStorage(prefix = MD_PREFIX) {
  try {
    return await listFiles(prefix, ".md");
  } catch (error) {
    console.error("knowledgeRepository.listMarkdownFromStorage failed:", error.message);
    throw error;
  }
}

export async function deleteFileFromStorage(storagePath) {
  try {
    await storage.file(storagePath).delete();
    return true;
  } catch (error) {
    if (error.code === 404) return true;
    console.error("knowledgeRepository.deleteFileFromStorage failed:", error.message);
    throw error;
  }
}
