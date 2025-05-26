import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { users } from "../../db/schema";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
} from "../user-service";
import { createTestDb } from "./test-db";
import { eq } from "drizzle-orm";

describe("User Service", () => {
  const { db, sqlite } = createTestDb();
  const testUser = {
    id: "test-user-1",
    email: "test@example.com",
    name: "Test User",
  };

  beforeEach(async () => {
    // Clean up any existing test data
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const createdUser = await createUser(db, testUser);

      // Check raw database values
      const rawUser = sqlite
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(testUser.id);
      console.log("Raw database values:", rawUser);

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBe(testUser.id);
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.name).toBe(testUser.name);
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });

    it("should set timestamps correctly on creation", async () => {
      const now = new Date();
      const createdUser = await createUser(db, testUser);

      // Log the actual values we're getting
      console.log("Created user timestamps:", {
        createdAt: createdUser.createdAt,
        createdAtType: typeof createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
        updatedAtType: typeof createdUser.updatedAt,
      });

      // Verify timestamps are strings
      expect(typeof createdUser.createdAt).toBe("string");
      expect(typeof createdUser.updatedAt).toBe("string");

      // Parse timestamps to Date objects for comparison
      const createdAt = new Date(createdUser.createdAt);
      const updatedAt = new Date(createdUser.updatedAt);

      // Verify timestamps are recent (within last 5 seconds)
      const fiveSecondsAgo = new Date(now.getTime() - 5000);
      expect(createdAt.getTime()).toBeGreaterThan(fiveSecondsAgo.getTime());
      expect(updatedAt.getTime()).toBeGreaterThan(fiveSecondsAgo.getTime());

      // Verify created_at and updated_at are the same on creation
      expect(createdAt.getTime()).toBe(updatedAt.getTime());
    });

    it("should throw error when creating user with duplicate email", async () => {
      await createUser(db, testUser);

      await expect(
        createUser(db, {
          id: "test-user-2",
          email: testUser.email,
          name: "Another User",
        })
      ).rejects.toThrow();
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      await createUser(db, testUser);
      const foundUser = await getUserById(db, testUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
    });

    it("should return undefined when user not found", async () => {
      const foundUser = await getUserById(db, "non-existent-id");
      expect(foundUser).toBeUndefined();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      await createUser(db, testUser);
      const foundUser = await getUserByEmail(db, testUser.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });

    it("should return undefined when user not found", async () => {
      const foundUser = await getUserByEmail(db, "nonexistent@example.com");
      expect(foundUser).toBeUndefined();
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const user = await createUser(db, testUser);
      const oldUpdatedAt = new Date(user.updatedAt);
      const updatedName = "Updated Name";

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedUser = await updateUser(db, testUser.id, {
        name: updatedName,
      });

      const newUpdatedAt = new Date(updatedUser?.updatedAt);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe(updatedName);
      expect(updatedUser?.email).toBe(testUser.email); // Email should remain unchanged
      expect(newUpdatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should return undefined when updating non-existent user", async () => {
      const updatedUser = await updateUser(db, "non-existent-id", {
        name: "New Name",
      });
      expect(updatedUser).toBeUndefined();
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      await createUser(db, testUser);
      await deleteUser(db, testUser.id);

      const deletedUser = await getUserById(db, testUser.id);
      expect(deletedUser).toBeUndefined();
    });

    it("should not throw error when deleting non-existent user", async () => {
      await expect(deleteUser(db, "non-existent-id")).resolves.not.toThrow();
    });
  });
});
