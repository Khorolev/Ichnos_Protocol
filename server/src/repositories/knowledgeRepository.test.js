import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockDoc = vi.fn();

const mockUpload = vi.fn();
const mockGetFiles = vi.fn();
const mockFileDelete = vi.fn();
const mockGetSignedUrl = vi.fn();
const mockStorageFile = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    firestore: () => ({
      collection: () => ({
        where: mockWhere,
        limit: mockLimit,
        doc: mockDoc,
        add: mockAdd,
      }),
    }),
  },
  storage: {
    upload: mockUpload,
    getFiles: mockGetFiles,
    file: mockStorageFile,
    name: "test-bucket",
  },
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(() => true),
  statSync: vi.fn(() => ({ size: 1024 })),
}));

vi.mock("path", () => ({
  extname: vi.fn((p) => {
    const dot = p.lastIndexOf(".");
    return dot >= 0 ? p.slice(dot) : "";
  }),
}));

// Chain mocks for query building
mockWhere.mockReturnThis();
mockLimit.mockReturnValue({ get: mockGet });
mockStorageFile.mockReturnValue({
  delete: mockFileDelete,
  getSignedUrl: mockGetSignedUrl,
});

const {
  queryKnowledgeBase,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadPdfToStorage,
  listPdfsFromStorage,
  getPdfDownloadUrl,
  uploadMarkdownToStorage,
  listMarkdownFromStorage,
  deleteFileFromStorage,
} = await import("./knowledgeRepository.js");

const { existsSync, statSync } = await import("fs");

describe("knowledgeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnThis();
    mockLimit.mockReturnValue({ get: mockGet });
    mockStorageFile.mockReturnValue({
      delete: mockFileDelete,
      getSignedUrl: mockGetSignedUrl,
    });
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 1024 });
  });

  describe("queryKnowledgeBase", () => {
    it("queries by keywords using array-contains-any", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "doc-1", data: () => ({ title: "Battery Passport", tags: ["battery"] }) },
        ],
      });

      const result = await queryKnowledgeBase(["battery"], null);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("doc-1");
      expect(result[0].title).toBe("Battery Passport");
      expect(mockWhere).toHaveBeenCalledWith("tags", "array-contains-any", ["battery"]);
    });

    it("adds category filter when provided", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await queryKnowledgeBase(["test"], "services");

      expect(mockWhere).toHaveBeenCalledWith("tags", "array-contains-any", ["test"]);
      expect(mockWhere).toHaveBeenCalledWith("category", "==", "services");
    });

    it("limits keywords to 10 items", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const manyKeywords = Array.from({ length: 15 }, (_, i) => `kw${i}`);
      await queryKnowledgeBase(manyKeywords, null);

      expect(mockWhere).toHaveBeenCalledWith(
        "tags",
        "array-contains-any",
        manyKeywords.slice(0, 10),
      );
    });

    it("returns empty array when no documents match", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await queryKnowledgeBase(["nonexistent"], null);
      expect(result).toEqual([]);
    });
  });

  describe("getDocumentById", () => {
    it("returns document data when found", async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: "doc-1",
          data: () => ({ title: "Test" }),
        }),
      });

      const result = await getDocumentById("doc-1");

      expect(result).toEqual({ id: "doc-1", title: "Test" });
    });

    it("returns null when document does not exist", async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      const result = await getDocumentById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("createDocument", () => {
    it("adds document and returns it with the generated ID", async () => {
      mockAdd.mockResolvedValue({ id: "new-doc-1" });

      const data = { title: "New Doc", tags: ["test"] };
      const result = await createDocument(data);

      expect(result.id).toBe("new-doc-1");
      expect(result.title).toBe("New Doc");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Doc", tags: ["test"] }),
      );
    });
  });

  describe("updateDocument", () => {
    it("updates document and returns the updated data", async () => {
      mockDoc.mockReturnValue({
        update: mockUpdate,
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: "doc-1",
          data: () => ({ title: "Updated" }),
        }),
      });
      mockUpdate.mockResolvedValue();

      const result = await updateDocument("doc-1", { title: "Updated" });

      expect(result).toEqual({ id: "doc-1", title: "Updated" });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated" }),
      );
    });
  });

  describe("deleteDocument", () => {
    it("deletes the document by ID", async () => {
      mockDoc.mockReturnValue({ delete: mockDelete });
      mockDelete.mockResolvedValue();

      await deleteDocument("doc-1");

      expect(mockDoc).toHaveBeenCalledWith("doc-1");
      expect(mockDelete).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("queryKnowledgeBase logs and rethrows on Firestore error", async () => {
      mockGet.mockRejectedValue(new Error("Firestore unavailable"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(queryKnowledgeBase(["test"], null)).rejects.toThrow("Firestore unavailable");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.queryKnowledgeBase failed:",
        "Firestore unavailable",
      );
      spy.mockRestore();
    });

    it("getDocumentById logs and rethrows on Firestore error", async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("permission denied")),
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getDocumentById("doc-1")).rejects.toThrow("permission denied");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.getDocumentById failed:",
        "permission denied",
      );
      spy.mockRestore();
    });

    it("createDocument logs and rethrows on Firestore error", async () => {
      mockAdd.mockRejectedValue(new Error("quota exceeded"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(createDocument({ title: "Test" })).rejects.toThrow("quota exceeded");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.createDocument failed:",
        "quota exceeded",
      );
      spy.mockRestore();
    });

    it("deleteDocument logs and rethrows on Firestore error", async () => {
      mockDoc.mockReturnValue({
        delete: vi.fn().mockRejectedValue(new Error("not found")),
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(deleteDocument("doc-1")).rejects.toThrow("not found");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.deleteDocument failed:",
        "not found",
      );
      spy.mockRestore();
    });
  });
});

describe("knowledgeRepository — Storage operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFile.mockReturnValue({
      delete: mockFileDelete,
      getSignedUrl: mockGetSignedUrl,
    });
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 1024 });
  });

  describe("uploadPdfToStorage", () => {
    it("uploads a PDF and returns metadata", async () => {
      mockUpload.mockResolvedValue();

      const result = await uploadPdfToStorage("/tmp/test.pdf", "test.pdf");

      expect(mockUpload).toHaveBeenCalledWith("/tmp/test.pdf", {
        destination: "knowledge_sources/raw_pdfs/test.pdf",
        metadata: expect.objectContaining({ contentType: "application/pdf" }),
      });
      expect(result.fileName).toBe("test.pdf");
      expect(result.storagePath).toBe("knowledge_sources/raw_pdfs/test.pdf");
      expect(result.publicUrl).toContain("test-bucket");
    });

    it("passes custom metadata to upload", async () => {
      mockUpload.mockResolvedValue();

      await uploadPdfToStorage("/tmp/test.pdf", "test.pdf", { source: "manual" });

      expect(mockUpload).toHaveBeenCalledWith(
        "/tmp/test.pdf",
        expect.objectContaining({
          metadata: expect.objectContaining({
            metadata: expect.objectContaining({ source: "manual" }),
          }),
        }),
      );
    });

    it("throws when file does not exist", async () => {
      existsSync.mockReturnValue(false);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadPdfToStorage("/tmp/missing.pdf", "missing.pdf"))
        .rejects.toThrow("File not found");
      spy.mockRestore();
    });

    it("throws when file is not a PDF", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadPdfToStorage("/tmp/test.txt", "test.txt"))
        .rejects.toThrow("Invalid file type");
      spy.mockRestore();
    });

    it("throws when file exceeds max size", async () => {
      statSync.mockReturnValue({ size: 60 * 1024 * 1024 });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadPdfToStorage("/tmp/huge.pdf", "huge.pdf"))
        .rejects.toThrow("File exceeds max size");
      spy.mockRestore();
    });

    it("logs and rethrows on upload failure", async () => {
      mockUpload.mockRejectedValue(new Error("upload failed"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadPdfToStorage("/tmp/test.pdf", "test.pdf"))
        .rejects.toThrow("upload failed");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.uploadPdfToStorage failed:",
        "upload failed",
      );
      spy.mockRestore();
    });
  });

  describe("listPdfsFromStorage", () => {
    it("returns filtered list of PDF files", async () => {
      mockGetFiles.mockResolvedValue([[
        { name: "knowledge_sources/raw_pdfs/doc.pdf", metadata: { size: "2048", timeCreated: "2024-01-01", metadata: {} } },
        { name: "knowledge_sources/raw_pdfs/.keep", metadata: { size: "0", timeCreated: "2024-01-01" } },
      ]]);

      const result = await listPdfsFromStorage();

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe("doc.pdf");
      expect(result[0].size).toBe(2048);
    });

    it("returns empty array when no PDFs exist", async () => {
      mockGetFiles.mockResolvedValue([[]]);

      const result = await listPdfsFromStorage();
      expect(result).toEqual([]);
    });

    it("logs and rethrows on list failure", async () => {
      mockGetFiles.mockRejectedValue(new Error("access denied"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(listPdfsFromStorage()).rejects.toThrow("access denied");
      spy.mockRestore();
    });
  });

  describe("getPdfDownloadUrl", () => {
    it("returns a signed URL for the PDF", async () => {
      mockGetSignedUrl.mockResolvedValue(["https://storage.googleapis.com/signed-url"]);

      const url = await getPdfDownloadUrl("test.pdf");

      expect(mockStorageFile).toHaveBeenCalledWith("knowledge_sources/raw_pdfs/test.pdf");
      expect(url).toBe("https://storage.googleapis.com/signed-url");
    });

    it("logs and rethrows when file not found", async () => {
      mockGetSignedUrl.mockRejectedValue(new Error("file not found"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getPdfDownloadUrl("missing.pdf")).rejects.toThrow("file not found");
      spy.mockRestore();
    });
  });

  describe("uploadMarkdownToStorage", () => {
    it("uploads a Markdown file and returns metadata", async () => {
      mockUpload.mockResolvedValue();

      const result = await uploadMarkdownToStorage("/tmp/doc.md", "doc.md");

      expect(mockUpload).toHaveBeenCalledWith("/tmp/doc.md", {
        destination: "knowledge_sources/markdown_output/doc.md",
        metadata: expect.objectContaining({ contentType: "text/markdown" }),
      });
      expect(result.fileName).toBe("doc.md");
      expect(result.storagePath).toBe("knowledge_sources/markdown_output/doc.md");
    });

    it("throws when file is not Markdown", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadMarkdownToStorage("/tmp/test.pdf", "test.pdf"))
        .rejects.toThrow("Invalid file type");
      spy.mockRestore();
    });

    it("throws when Markdown file exceeds max size", async () => {
      statSync.mockReturnValue({ size: 15 * 1024 * 1024 });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(uploadMarkdownToStorage("/tmp/huge.md", "huge.md"))
        .rejects.toThrow("File exceeds max size");
      spy.mockRestore();
    });
  });

  describe("listMarkdownFromStorage", () => {
    it("returns filtered list of Markdown files", async () => {
      mockGetFiles.mockResolvedValue([[
        { name: "knowledge_sources/markdown_output/doc.md", metadata: { size: "4096", timeCreated: "2024-01-01", metadata: { sourceFile: "doc.pdf" } } },
      ]]);

      const result = await listMarkdownFromStorage();

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe("doc.md");
      expect(result[0].metadata.sourceFile).toBe("doc.pdf");
    });

    it("returns empty array when no Markdown files exist", async () => {
      mockGetFiles.mockResolvedValue([[]]);

      const result = await listMarkdownFromStorage();
      expect(result).toEqual([]);
    });
  });

  describe("deleteFileFromStorage", () => {
    it("deletes the file and returns true", async () => {
      mockFileDelete.mockResolvedValue();

      const result = await deleteFileFromStorage("knowledge_sources/raw_pdfs/test.pdf");

      expect(mockStorageFile).toHaveBeenCalledWith("knowledge_sources/raw_pdfs/test.pdf");
      expect(mockFileDelete).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it("returns true when file does not exist (404)", async () => {
      mockFileDelete.mockRejectedValue({ code: 404 });

      const result = await deleteFileFromStorage("knowledge_sources/raw_pdfs/missing.pdf");
      expect(result).toBe(true);
    });

    it("logs and rethrows on non-404 errors", async () => {
      mockFileDelete.mockRejectedValue(new Error("permission denied"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(deleteFileFromStorage("knowledge_sources/raw_pdfs/test.pdf"))
        .rejects.toThrow("permission denied");
      expect(spy).toHaveBeenCalledWith(
        "knowledgeRepository.deleteFileFromStorage failed:",
        "permission denied",
      );
      spy.mockRestore();
    });
  });
});
