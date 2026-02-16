import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

const {
  createContactRequest,
  getRequestsByUserId,
  getRequestById,
  updateRequest,
  deleteRequest,
  getAllRequestsWithUserInfo,
} = await import("./contactRepository.js");

describe("contactRepository", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("createContactRequest", () => {
    it("inserts a contact request and returns the row", async () => {
      const row = { id: 1, user_id: "uid-1", status: "new" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await createContactRequest("uid-1", {
        consentTimestamp: "2026-01-01T00:00:00Z",
        consentVersion: "v1",
      });

      expect(result).toEqual(row);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO contact_requests"),
        ["uid-1", "2026-01-01T00:00:00Z", "v1"],
      );
    });
  });

  describe("getRequestsByUserId", () => {
    it("returns requests ordered by created_at DESC", async () => {
      const rows = [{ id: 2 }, { id: 1 }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getRequestsByUserId("uid-1");

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
        ["uid-1"],
      );
    });
  });

  describe("getRequestById", () => {
    it("returns the request when found", async () => {
      const row = { id: 1, status: "new" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await getRequestById(1);
      expect(result).toEqual(row);
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getRequestById(999);
      expect(result).toBeNull();
    });
  });

  describe("updateRequest", () => {
    it("updates status and returns the updated row", async () => {
      const row = { id: 1, status: "in_progress" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await updateRequest(1, { status: "in_progress" });

      expect(result).toEqual(row);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE contact_requests"),
        [1, "in_progress", null],
      );
    });

    it("returns null when request does not exist", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await updateRequest(999, { status: "resolved" });
      expect(result).toBeNull();
    });
  });

  describe("deleteRequest", () => {
    it("returns true when a row is deleted", async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await deleteRequest(1);
      expect(result).toBe(true);
    });

    it("returns false when no row is deleted", async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await deleteRequest(999);
      expect(result).toBe(false);
    });
  });

  describe("getAllRequestsWithUserInfo", () => {
    it("returns joined data ordered by created_at DESC", async () => {
      const rows = [
        { id: 2, name: "Jane", email: "jane@x.com" },
        { id: 1, name: "John", email: "john@x.com" },
      ];
      mockQuery.mockResolvedValue({ rows });

      const result = await getAllRequestsWithUserInfo();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("JOIN users u"),
      );
    });
  });

  describe("error handling", () => {
    it("createContactRequest logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("FK violation"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        createContactRequest("uid-1", { consentTimestamp: "2026-01-01T00:00:00Z", consentVersion: "v1" }),
      ).rejects.toThrow("FK violation");
      expect(spy).toHaveBeenCalledWith(
        "contactRepository.createContactRequest failed:",
        "FK violation",
      );
      spy.mockRestore();
    });

    it("getRequestById logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("timeout"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getRequestById(1)).rejects.toThrow("timeout");
      expect(spy).toHaveBeenCalledWith(
        "contactRepository.getRequestById failed:",
        "timeout",
      );
      spy.mockRestore();
    });

    it("updateRequest logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("connection lost"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        updateRequest(1, { status: "resolved" }),
      ).rejects.toThrow("connection lost");
      expect(spy).toHaveBeenCalledWith(
        "contactRepository.updateRequest failed:",
        "connection lost",
      );
      spy.mockRestore();
    });

    it("deleteRequest logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("permission denied"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(deleteRequest(1)).rejects.toThrow("permission denied");
      expect(spy).toHaveBeenCalledWith(
        "contactRepository.deleteRequest failed:",
        "permission denied",
      );
      spy.mockRestore();
    });
  });
});
