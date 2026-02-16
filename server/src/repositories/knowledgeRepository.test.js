import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockDoc = vi.fn();

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
}));

// Chain mocks for query building
mockWhere.mockReturnThis();
mockLimit.mockReturnValue({ get: mockGet });

const {
  queryKnowledgeBase,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} = await import("./knowledgeRepository.js");

describe("knowledgeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnThis();
    mockLimit.mockReturnValue({ get: mockGet });
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
