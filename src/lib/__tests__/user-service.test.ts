import { describe, it, expect, afterAll } from "vitest";
import { users } from "../../db/schema";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  findOrCreateUser,
} from "../user-service";
import { createTestDb, cleanupTestDb, withTransaction } from "./test-db";

describe("User Service", async () => {
  const { db, client } = await createTestDb();
  const testUser = {
    id: "test-user-1",
    email: "test@example.com",
    name: "Test User",
  };

  afterAll(async () => {
    await cleanupTestDb(client);
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      await withTransaction(db, async (db) => {
        const newUser = {
          id: "test-user-3",
          email: "test3@example.com",
          name: "Test User 3",
        };
        const createdUser = await createUser(db, newUser);

        expect(createdUser).toBeDefined();
        expect(createdUser.id).toBe(newUser.id);
        expect(createdUser.email).toBe(newUser.email);
        expect(createdUser.name).toBe(newUser.name);
        expect(createdUser.createdAt).toBeDefined();
        expect(createdUser.updatedAt).toBeDefined();
      });
    });

    it("should set timestamps correctly on creation", async () => {
      await withTransaction(db, async (db) => {
        const newUser = {
          id: "test-user-4",
          email: "test4@example.com",
          name: "Test User 4",
        };
        const now = new Date();
        const createdUser = await createUser(db, newUser);

        // Verify timestamps are Date objects
        expect(createdUser.createdAt instanceof Date).toBe(true);
        expect(createdUser.updatedAt instanceof Date).toBe(true);

        // Verify timestamps are recent (within last 5 seconds)
        const fiveSecondsAgo = new Date(now.getTime() - 5000);
        expect(createdUser.createdAt.getTime()).toBeGreaterThan(
          fiveSecondsAgo.getTime()
        );
        expect(createdUser.updatedAt.getTime()).toBeGreaterThan(
          fiveSecondsAgo.getTime()
        );

        // Verify created_at and updated_at are the same on creation
        expect(createdUser.createdAt.getTime()).toBe(
          createdUser.updatedAt.getTime()
        );
      });
    });

    it("should throw error when creating user with duplicate email", async () => {
      await withTransaction(db, async (db) => {
        // Create initial user
        await createUser(db, testUser);

        // Try to create user with same email
        await expect(
          createUser(db, {
            id: "test-user-2",
            email: testUser.email,
            name: "Another User",
          })
        ).rejects.toThrow();
      });
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      await withTransaction(db, async (db) => {
        await createUser(db, testUser);
        const foundUser = await getUserById(db, testUser.id);

        expect(foundUser).toBeDefined();
        expect(foundUser?.id).toBe(testUser.id);
      });
    });

    it("should return undefined when user not found", async () => {
      await withTransaction(db, async (db) => {
        const foundUser = await getUserById(db, "non-existent-id");
        expect(foundUser).toBeUndefined();
      });
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      await withTransaction(db, async (db) => {
        await createUser(db, testUser);
        const foundUser = await getUserByEmail(db, testUser.email);

        expect(foundUser).toBeDefined();
        expect(foundUser?.email).toBe(testUser.email);
      });
    });

    it("should return undefined when user not found", async () => {
      await withTransaction(db, async (db) => {
        const foundUser = await getUserByEmail(db, "nonexistent@example.com");
        expect(foundUser).toBeUndefined();
      });
    });
  });

  describe("updateUser", () => {
    it("should return undefined when updating non-existent user", async () => {
      await withTransaction(db, async (db) => {
        const updatedUser = await updateUser(db, "non-existent-id", {
          name: "New Name",
        });
        expect(updatedUser).toBeUndefined();
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      await withTransaction(db, async (db) => {
        await createUser(db, testUser);
        await deleteUser(db, testUser.id);

        const deletedUser = await getUserById(db, testUser.id);
        expect(deletedUser).toBeUndefined();
      });
    });

    it("should not throw error when deleting non-existent user", async () => {
      await withTransaction(db, async (db) => {
        await expect(deleteUser(db, "non-existent-id")).resolves.not.toThrow();
      });
    });
  });

  describe("findOrCreateUser", () => {
    it("should create a new user if one does not exist", async () => {
      await withTransaction(db, async (db) => {
        const email = "test@example.com";
        const name = "Test User";
        const countBefore = await db.select().from(users).execute();
        expect(countBefore.length).toBe(0);

        const user = await findOrCreateUser(db, email, name);
        const countAfter = await db.select().from(users).execute();
        expect(countAfter.length).toBe(1);

        expect(user).toBeDefined();
        expect(user?.email).toBe(email);
        expect(user?.name).toBe(name);
      });
    });

    it("should return existing user if one exists", async () => {
      await withTransaction(db, async (db) => {
        await createUser(db, testUser);
        const countBefore = await db.select().from(users).execute();
        expect(countBefore.length).toBe(1);

        const user = await findOrCreateUser(db, testUser.email, testUser.name);
        const countAfter = await db.select().from(users).execute();
        expect(countAfter.length).toBe(1);

        expect(user).toBeDefined();
        expect(user?.email).toBe(testUser.email);
        expect(user?.name).toBe(testUser.name);
      });
    });
  });
});
