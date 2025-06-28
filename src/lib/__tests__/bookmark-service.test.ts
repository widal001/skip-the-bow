import { describe, it, expect, afterAll } from "vitest";
import { users, gifts } from "@/db/schema";
import {
  addGiftToBookmarks,
  removeGiftFromBookmarks,
  isGiftBookmarked,
  getUserBookmarks,
} from "@/lib/services/bookmark-service";
import { createTestDb, cleanupTestDb, withTransaction } from "./test-db";

describe("Bookmark Service", async () => {
  const { db, client } = await createTestDb();

  const testUser = {
    id: "test-user-1",
    email: "test@example.com",
    name: "Test User",
  };

  const testGift = {
    slug: "test-gift",
    name: "Test Gift",
    description: "A test gift",
    minPrice: 10.0,
    maxPrice: 50.0,
    link: "https://example.com/gift",
    category: "other" as const,
  };

  const testGift2 = {
    slug: "test-gift-2",
    name: "Test Gift 2",
    description: "Another test gift",
    minPrice: 20.0,
    maxPrice: 100.0,
    link: "https://example.com/gift2",
    category: "experience" as const,
  };

  afterAll(async () => {
    await cleanupTestDb(client);
  });

  describe("addGiftToBookmarks", () => {
    it("should add a gift to user's bookmarks successfully", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const bookmarkInput = {
          userId: testUser.id,
          giftId: createdGift.id,
        };

        const bookmark = await addGiftToBookmarks(db, bookmarkInput);

        expect(bookmark).toBeDefined();
        expect(bookmark.userId).toBe(testUser.id);
        expect(bookmark.giftId).toBe(createdGift.id);
        expect(bookmark.createdAt).toBeDefined();
        expect(bookmark.updatedAt).toBeDefined();
      });
    });

    it("should set timestamps correctly on creation", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const now = new Date();
        const bookmark = await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });

        // Verify timestamps are Date objects
        expect(bookmark.createdAt instanceof Date).toBe(true);
        expect(bookmark.updatedAt instanceof Date).toBe(true);

        // Verify timestamps are recent (within last 5 seconds)
        const fiveSecondsAgo = new Date(now.getTime() - 5000);
        expect(bookmark.createdAt.getTime()).toBeGreaterThan(
          fiveSecondsAgo.getTime()
        );
        expect(bookmark.updatedAt.getTime()).toBeGreaterThan(
          fiveSecondsAgo.getTime()
        );

        // Verify created_at and updated_at are the same on creation
        expect(bookmark.createdAt.getTime()).toBe(bookmark.updatedAt.getTime());
      });
    });

    it("should be idempotent - should not throw on duplicate bookmark", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const bookmarkInput = {
          userId: testUser.id,
          giftId: createdGift.id,
        };

        // First call should succeed
        const firstBookmark = await addGiftToBookmarks(db, bookmarkInput);
        expect(firstBookmark).toBeDefined();
        expect(firstBookmark.userId).toBe(testUser.id);
        expect(firstBookmark.giftId).toBe(createdGift.id);

        // Verify bookmark exists
        const isBookmarked = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarked).toBe(true);

        // Second call should not throw error (idempotent)
        await expect(
          addGiftToBookmarks(db, bookmarkInput)
        ).resolves.not.toThrow();

        // Third call should not throw error (idempotent)
        await expect(
          addGiftToBookmarks(db, bookmarkInput)
        ).resolves.not.toThrow();

        // Verify only one bookmark exists
        const userBookmarks = await getUserBookmarks(db, testUser.id);
        expect(userBookmarks).toHaveLength(1);
        expect(userBookmarks[0].giftId).toBe(createdGift.id);
      });
    });
  });

  describe("removeGiftFromBookmarks", () => {
    it("should remove a gift from user's bookmarks successfully", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Add bookmark first
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });

        // Verify bookmark exists
        const isBookmarkedBefore = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarkedBefore).toBe(true);

        // Remove bookmark
        await removeGiftFromBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });

        // Verify bookmark is removed
        const isBookmarkedAfter = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarkedAfter).toBe(false);
      });
    });

    it("should not throw error when removing non-existent bookmark", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Try to remove a bookmark that doesn't exist
        await expect(
          removeGiftFromBookmarks(db, {
            userId: testUser.id,
            giftId: createdGift.id,
          })
        ).resolves.not.toThrow();
      });
    });

    it("should be idempotent - multiple calls should not throw errors", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const removeInput = {
          userId: testUser.id,
          giftId: createdGift.id,
        };

        // First call should not throw error (no bookmark exists)
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Second call should not throw error
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Third call should not throw error
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Verify no bookmarks exist
        const userBookmarks = await getUserBookmarks(db, testUser.id);
        expect(userBookmarks).toHaveLength(0);
      });
    });

    it("should be idempotent - removing existing bookmark multiple times", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Add bookmark first
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });

        // Verify bookmark exists
        const isBookmarkedBefore = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarkedBefore).toBe(true);

        const removeInput = {
          userId: testUser.id,
          giftId: createdGift.id,
        };

        // First removal should succeed
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Verify bookmark is removed
        const isBookmarkedAfterFirst = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarkedAfterFirst).toBe(false);

        // Second removal should not throw error
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Third removal should not throw error
        await expect(
          removeGiftFromBookmarks(db, removeInput)
        ).resolves.not.toThrow();

        // Verify bookmark is still removed
        const isBookmarkedAfterMultiple = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );
        expect(isBookmarkedAfterMultiple).toBe(false);

        // Verify no bookmarks exist
        const userBookmarks = await getUserBookmarks(db, testUser.id);
        expect(userBookmarks).toHaveLength(0);
      });
    });
  });

  describe("isGiftBookmarked", () => {
    it("should return true when gift is bookmarked", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Add bookmark
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });

        const isBookmarked = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );

        expect(isBookmarked).toBe(true);
      });
    });

    it("should return false when gift is not bookmarked", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const isBookmarked = await isGiftBookmarked(
          db,
          testUser.id,
          createdGift.id
        );

        expect(isBookmarked).toBe(false);
      });
    });

    it("should return false for non-existent user", async () => {
      await withTransaction(db, async (db) => {
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const isBookmarked = await isGiftBookmarked(
          db,
          "non-existent-user",
          createdGift.id
        );

        expect(isBookmarked).toBe(false);
      });
    });

    it("should return false for non-existent gift", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(users).values(testUser);

        const isBookmarked = await isGiftBookmarked(
          db,
          testUser.id,
          99999 // Non-existent gift ID
        );

        expect(isBookmarked).toBe(false);
      });
    });
  });

  describe("getUserBookmarks", () => {
    it("should return empty array when user has no bookmarks", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(users).values(testUser);

        const userBookmarks = await getUserBookmarks(db, testUser.id);

        expect(userBookmarks).toEqual([]);
      });
    });

    it("should return user's bookmarks with gift details", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gifts
        await db.insert(users).values(testUser);
        const [createdGift1] = await db
          .insert(gifts)
          .values(testGift)
          .returning();
        const [createdGift2] = await db
          .insert(gifts)
          .values(testGift2)
          .returning();

        // Add bookmarks
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift1.id,
        });
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift2.id,
        });

        const userBookmarks = await getUserBookmarks(db, testUser.id);

        expect(userBookmarks).toHaveLength(2);
        expect(userBookmarks[0].gift).toBeDefined();
        expect(userBookmarks[1].gift).toBeDefined();
        expect(userBookmarks[0].gift.id).toBe(createdGift1.id);
        expect(userBookmarks[1].gift.id).toBe(createdGift2.id);
        expect(userBookmarks[0].userId).toBe(testUser.id);
        expect(userBookmarks[1].userId).toBe(testUser.id);
      });
    });

    it("should return bookmarks ordered by creation date (ascending)", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gifts
        await db.insert(users).values(testUser);
        const [createdGift1] = await db
          .insert(gifts)
          .values(testGift)
          .returning();
        const [createdGift2] = await db
          .insert(gifts)
          .values(testGift2)
          .returning();

        // Add bookmarks with a delay to ensure different timestamps
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift1.id,
        });

        // Small delay to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));

        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift2.id,
        });

        const userBookmarks = await getUserBookmarks(db, testUser.id);

        expect(userBookmarks).toHaveLength(2);
        // First bookmark should be the one created first (gift1)
        expect(userBookmarks[0].giftId).toBe(createdGift1.id);
        expect(userBookmarks[1].giftId).toBe(createdGift2.id);
        expect(userBookmarks[0].createdAt.getTime()).toBeLessThanOrEqual(
          userBookmarks[1].createdAt.getTime()
        );
      });
    });

    it("should only return bookmarks for the specified user", async () => {
      await withTransaction(db, async (db) => {
        // Create two users
        const user2 = {
          id: "test-user-2",
          email: "test2@example.com",
          name: "Test User 2",
        };
        await db.insert(users).values([testUser, user2]);

        // Create gifts
        const [createdGift1] = await db
          .insert(gifts)
          .values(testGift)
          .returning();
        const [createdGift2] = await db
          .insert(gifts)
          .values(testGift2)
          .returning();

        // Add bookmarks for both users
        await addGiftToBookmarks(db, {
          userId: testUser.id,
          giftId: createdGift1.id,
        });
        await addGiftToBookmarks(db, {
          userId: user2.id,
          giftId: createdGift2.id,
        });

        // Get bookmarks for user1
        const user1Bookmarks = await getUserBookmarks(db, testUser.id);
        expect(user1Bookmarks).toHaveLength(1);
        expect(user1Bookmarks[0].giftId).toBe(createdGift1.id);

        // Get bookmarks for user2
        const user2Bookmarks = await getUserBookmarks(db, user2.id);
        expect(user2Bookmarks).toHaveLength(1);
        expect(user2Bookmarks[0].giftId).toBe(createdGift2.id);
      });
    });

    it("should return empty array for non-existent user", async () => {
      await withTransaction(db, async (db) => {
        const userBookmarks = await getUserBookmarks(db, "non-existent-user");
        expect(userBookmarks).toEqual([]);
      });
    });
  });
});
