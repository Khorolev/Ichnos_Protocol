import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUserById = vi.fn();
const mockCreateUser = vi.fn();
const mockUpsertProfile = vi.fn();
const mockUpdateUserActivity = vi.fn();
const mockVerifyIdToken = vi.fn();
const mockGetUser = vi.fn();
const mockSetCustomUserClaims = vi.fn();

vi.mock("../repositories/userRepository.js", () => ({
  getUserById: (...args) => mockGetUserById(...args),
  createUser: (...args) => mockCreateUser(...args),
  upsertProfile: (...args) => mockUpsertProfile(...args),
  updateUserActivity: (...args) => mockUpdateUserActivity(...args),
}));

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken,
      getUser: mockGetUser,
      setCustomUserClaims: mockSetCustomUserClaims,
    }),
  },
}));

const {
  syncProfile,
  verifyToken,
  getUser,
  updateProfile,
  setAdminClaim,
  computeProfileState,
} = await import("./authService.js");

const profileData = {
  name: "John",
  surname: "Doe",
  email: "john@example.com",
};

describe("authService", () => {
  beforeEach(() => {
    mockGetUserById.mockReset();
    mockCreateUser.mockReset();
    mockUpsertProfile.mockReset();
    mockUpdateUserActivity.mockReset();
    mockVerifyIdToken.mockReset();
    mockGetUser.mockReset();
    mockSetCustomUserClaims.mockReset();
  });

  describe("syncProfile", () => {
    it("creates user when not found and syncs profile", async () => {
      mockGetUserById.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({ ...profileData, user_id: "uid-1" });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: { admin: false },
      });

      const result = await syncProfile("uid-1", profileData);

      expect(mockCreateUser).toHaveBeenCalledWith("uid-1");
      expect(mockUpdateUserActivity).toHaveBeenCalledWith("uid-1");
      expect(result.isAdmin).toBe(false);
      expect(result.profile).toEqual({ ...profileData, user_id: "uid-1" });
      expect(result.profileState.isProfileComplete).toBe(true);
      expect(result.profileState.missingRequiredFields).toEqual([]);
    });

    it("skips user creation when user already exists", async () => {
      const existingUser = { firebase_uid: "uid-1" };
      mockGetUserById.mockResolvedValue(existingUser);
      mockUpsertProfile.mockResolvedValue({ ...profileData, user_id: "uid-1" });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: { admin: true },
      });

      const result = await syncProfile("uid-1", profileData);

      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(result.user).toEqual(existingUser);
      expect(result.isAdmin).toBe(true);
      expect(result.profileState.isProfileComplete).toBe(true);
    });

    it("sets isAdmin true when custom claim is admin", async () => {
      mockGetUserById.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({ ...profileData });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: { admin: true },
      });

      const result = await syncProfile("uid-1", profileData);

      expect(result.isAdmin).toBe(true);
    });

    it("sets isAdmin false when no custom claims", async () => {
      mockGetUserById.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({ ...profileData });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: undefined,
      });

      const result = await syncProfile("uid-1", profileData);

      expect(result.isAdmin).toBe(false);
    });

    it("propagates database errors", async () => {
      mockGetUserById.mockRejectedValue(new Error("DB connection lost"));

      await expect(syncProfile("uid-1", profileData)).rejects.toThrow(
        "DB connection lost",
      );
    });

    it("returns incomplete profileState for partial input", async () => {
      mockGetUserById.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({
        user_id: "uid-1",
        email: "john@firebase.com",
      });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "john@firebase.com",
        customClaims: {},
      });

      const result = await syncProfile("uid-1", {});

      expect(result.profileState.isProfileComplete).toBe(false);
      expect(result.profileState.missingRequiredFields).toContain("name");
      expect(result.profileState.missingRequiredFields).toContain("surname");
      expect(result.profile.email).toBe("john@firebase.com");
    });

    it("uses canonical Firebase email over provided email", async () => {
      mockGetUserById.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({
        ...profileData,
        email: "canonical@firebase.com",
      });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "canonical@firebase.com",
        customClaims: {},
      });

      await syncProfile("uid-1", {
        ...profileData,
        email: "user@input.com",
      });

      const upsertCall = mockUpsertProfile.mock.calls[0][1];
      expect(upsertCall.email).toBe("canonical@firebase.com");
    });

    it("merges partial input with existing profile fields", async () => {
      const existingUser = {
        firebase_uid: "uid-1",
        name: "John",
        surname: "Doe",
        email: "old@example.com",
      };
      mockGetUserById.mockResolvedValue(existingUser);
      mockUpsertProfile.mockResolvedValue({
        ...existingUser,
        email: "canonical@firebase.com",
      });
      mockUpdateUserActivity.mockResolvedValue();
      mockGetUser.mockResolvedValue({
        email: "canonical@firebase.com",
        customClaims: {},
      });

      await syncProfile("uid-1", {});

      const upsertCall = mockUpsertProfile.mock.calls[0][1];
      expect(upsertCall.name).toBe("John");
      expect(upsertCall.surname).toBe("Doe");
      expect(upsertCall.email).toBe("canonical@firebase.com");
    });
  });

  describe("verifyToken", () => {
    it("returns decoded token and custom claims", async () => {
      const decoded = { uid: "uid-1", email: "john@example.com" };
      mockVerifyIdToken.mockResolvedValue(decoded);

      const result = await verifyToken("valid-token");

      expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token");
      expect(result.decoded).toEqual(decoded);
    });

    it("propagates Firebase verification errors", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      await expect(verifyToken("bad-token")).rejects.toThrow("Invalid token");
    });
  });

  describe("getUser", () => {
    it("returns user with isAdmin flag and profileState", async () => {
      const user = {
        firebase_uid: "uid-1",
        name: "John",
        surname: "Doe",
        email: "john@example.com",
      };
      mockGetUserById.mockResolvedValue(user);
      mockGetUser.mockResolvedValue({ customClaims: { admin: true } });

      const result = await getUser("uid-1");

      expect(result.user).toEqual(user);
      expect(result.isAdmin).toBe(true);
      expect(result.profileState.isProfileComplete).toBe(true);
      expect(result.profileState.missingRequiredFields).toEqual([]);
    });

    it("throws 404 when user not found", async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(getUser("nonexistent")).rejects.toThrow("User not found");
    });

    it("throws with statusCode 404 when user not found", async () => {
      mockGetUserById.mockResolvedValue(null);

      const error = await getUser("nonexistent").catch((e) => e);
      expect(error.statusCode).toBe(404);
    });

    it("does not call Firebase when user not found", async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(getUser("nonexistent")).rejects.toThrow();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("returns incomplete profileState for user missing fields", async () => {
      const user = { firebase_uid: "uid-1", name: "John" };
      mockGetUserById.mockResolvedValue(user);
      mockGetUser.mockResolvedValue({ customClaims: {} });

      const result = await getUser("uid-1");

      expect(result.profileState.isProfileComplete).toBe(false);
      expect(result.profileState.missingRequiredFields).toContain("surname");
      expect(result.profileState.missingRequiredFields).toContain("email");
    });

    it("overlays Firebase email when DB email is null", async () => {
      const user = {
        firebase_uid: "uid-1",
        name: "John",
        surname: "Doe",
        email: null,
      };
      mockGetUserById.mockResolvedValue(user);
      mockGetUser.mockResolvedValue({
        email: "canonical@firebase.com",
        customClaims: {},
      });

      const result = await getUser("uid-1");

      expect(result.user.email).toBe("canonical@firebase.com");
      expect(result.profileState.isProfileComplete).toBe(true);
      expect(result.profileState.missingRequiredFields).toEqual([]);
    });

    it("overlays Firebase email when DB email is outdated", async () => {
      const user = {
        firebase_uid: "uid-1",
        name: "John",
        surname: "Doe",
        email: "old@example.com",
      };
      mockGetUserById.mockResolvedValue(user);
      mockGetUser.mockResolvedValue({
        email: "new@firebase.com",
        customClaims: { admin: true },
      });

      const result = await getUser("uid-1");

      expect(result.user.email).toBe("new@firebase.com");
      expect(result.isAdmin).toBe(true);
      expect(result.profileState.isProfileComplete).toBe(true);
    });
  });

  describe("updateProfile", () => {
    it("merges updates with existing profile", async () => {
      const existing = {
        firebase_uid: "uid-1",
        name: "John",
        surname: "Doe",
        email: "john@example.com",
      };
      mockGetUserById.mockResolvedValue(existing);
      mockUpsertProfile.mockResolvedValue({ ...existing, name: "Jane" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await updateProfile("uid-1", { name: "Jane" });

      expect(mockUpsertProfile).toHaveBeenCalledWith("uid-1", {
        ...existing,
        name: "Jane",
      });
      expect(result.name).toBe("Jane");
    });

    it("throws 404 when user not found", async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(
        updateProfile("nonexistent", { name: "Jane" }),
      ).rejects.toThrow("User not found");
    });

    it("updates user activity after profile change", async () => {
      mockGetUserById.mockResolvedValue({ firebase_uid: "uid-1" });
      mockUpsertProfile.mockResolvedValue({});
      mockUpdateUserActivity.mockResolvedValue();

      await updateProfile("uid-1", { name: "Jane" });

      expect(mockUpdateUserActivity).toHaveBeenCalledWith("uid-1");
    });
  });

  describe("computeProfileState", () => {
    it("returns complete for profile with all required fields", () => {
      const result = computeProfileState({
        name: "John",
        surname: "Doe",
        email: "john@example.com",
      });

      expect(result.isProfileComplete).toBe(true);
      expect(result.missingRequiredFields).toEqual([]);
    });

    it("returns all fields missing for null profile", () => {
      const result = computeProfileState(null);

      expect(result.isProfileComplete).toBe(false);
      expect(result.missingRequiredFields).toEqual([
        "name",
        "surname",
        "email",
      ]);
    });

    it("returns all fields missing for undefined profile", () => {
      const result = computeProfileState(undefined);

      expect(result.isProfileComplete).toBe(false);
      expect(result.missingRequiredFields).toEqual([
        "name",
        "surname",
        "email",
      ]);
    });

    it("detects partially missing fields", () => {
      const result = computeProfileState({
        name: "John",
        surname: null,
        email: null,
      });

      expect(result.isProfileComplete).toBe(false);
      expect(result.missingRequiredFields).toEqual(["surname", "email"]);
    });

    it("treats whitespace-only fields as missing", () => {
      const result = computeProfileState({
        name: "  ",
        surname: "Doe",
        email: "a@b.com",
      });

      expect(result.isProfileComplete).toBe(false);
      expect(result.missingRequiredFields).toEqual(["name"]);
    });

    it("treats empty string fields as missing", () => {
      const result = computeProfileState({
        name: "",
        surname: "Doe",
        email: "a@b.com",
      });

      expect(result.isProfileComplete).toBe(false);
      expect(result.missingRequiredFields).toEqual(["name"]);
    });
  });

  describe("setAdminClaim", () => {
    it("sets admin custom claim to true", async () => {
      mockSetCustomUserClaims.mockResolvedValue();

      const result = await setAdminClaim("uid-1", true);

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
        admin: true,
      });
      expect(result).toEqual({ firebaseUid: "uid-1", admin: true });
    });

    it("sets admin custom claim to false", async () => {
      mockSetCustomUserClaims.mockResolvedValue();

      const result = await setAdminClaim("uid-1", false);

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
        admin: false,
      });
      expect(result).toEqual({ firebaseUid: "uid-1", admin: false });
    });

    it("propagates Firebase errors", async () => {
      mockSetCustomUserClaims.mockRejectedValue(new Error("User not found"));

      await expect(setAdminClaim("bad-uid", true)).rejects.toThrow(
        "User not found",
      );
    });
  });
});
