import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

const {
  createUser,
  upsertProfile,
  getUserById,
  getUserByEmail,
  updateUserActivity,
  deleteUserData,
} = await import("./userRepository.js");

describe("userRepository", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("createUser", () => {
    it("inserts a user and returns the created row", async () => {
      const user = { firebase_uid: "uid-1", created_at: new Date() };
      mockQuery.mockResolvedValue({ rows: [user] });

      const result = await createUser("uid-1");

      expect(result).toEqual(user);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        ["uid-1"],
      );
    });
  });

  describe("upsertProfile", () => {
    it("inserts or updates profile and returns the row", async () => {
      const profile = { user_id: "uid-1", name: "John", surname: "Doe", email: "j@d.com" };
      mockQuery.mockResolvedValue({ rows: [profile] });

      const result = await upsertProfile("uid-1", {
        name: "John",
        surname: "Doe",
        email: "j@d.com",
      });

      expect(result).toEqual(profile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT"),
        ["uid-1", "John", "Doe", "j@d.com", null, null, null],
      );
    });

    it("passes optional fields when provided", async () => {
      mockQuery.mockResolvedValue({ rows: [{}] });

      await upsertProfile("uid-1", {
        name: "Jane",
        surname: "Doe",
        email: "jane@d.com",
        phone: "+123",
        company: "Acme",
        linkedin: "https://linkedin.com/in/jane",
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ["uid-1", "Jane", "Doe", "jane@d.com", "+123", "Acme", "https://linkedin.com/in/jane"],
      );
    });
  });

  describe("getUserById", () => {
    it("returns user with profile when found", async () => {
      const row = { firebase_uid: "uid-1", name: "John" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await getUserById("uid-1");
      expect(result).toEqual(row);
    });

    it("returns null when user is not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getUserById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("returns user when found by email", async () => {
      const row = { firebase_uid: "uid-1", email: "j@d.com" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await getUserByEmail("j@d.com");
      expect(result).toEqual(row);
    });

    it("returns null when email not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getUserByEmail("nobody@nowhere.com");
      expect(result).toBeNull();
    });
  });

  describe("updateUserActivity", () => {
    it("executes update query with correct uid", async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      await updateUserActivity("uid-1");

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET updated_at"),
        ["uid-1"],
      );
    });
  });

  describe("deleteUserData", () => {
    it("wipes PII from profile and soft-deletes user", async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      await deleteUserData("uid-1");

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("UPDATE user_profiles"),
        ["uid-1"],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE users SET deleted_at"),
        ["uid-1"],
      );
    });
  });

  describe("error handling", () => {
    it("createUser logs and rethrows on DB error", async () => {
      const dbError = new Error("connection refused");
      mockQuery.mockRejectedValue(dbError);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(createUser("uid-1")).rejects.toThrow("connection refused");
      expect(spy).toHaveBeenCalledWith(
        "userRepository.createUser failed:",
        "connection refused",
      );
      spy.mockRestore();
    });

    it("upsertProfile logs and rethrows on DB error", async () => {
      const dbError = new Error("unique violation");
      mockQuery.mockRejectedValue(dbError);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        upsertProfile("uid-1", { name: "A", surname: "B", email: "a@b.com" }),
      ).rejects.toThrow("unique violation");
      expect(spy).toHaveBeenCalledWith(
        "userRepository.upsertProfile failed:",
        "unique violation",
      );
      spy.mockRestore();
    });

    it("getUserById logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("timeout"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getUserById("uid-1")).rejects.toThrow("timeout");
      expect(spy).toHaveBeenCalledWith(
        "userRepository.getUserById failed:",
        "timeout",
      );
      spy.mockRestore();
    });

    it("deleteUserData logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("FK constraint"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(deleteUserData("uid-1")).rejects.toThrow("FK constraint");
      expect(spy).toHaveBeenCalledWith(
        "userRepository.deleteUserData failed:",
        "FK constraint",
      );
      spy.mockRestore();
    });
  });
});
