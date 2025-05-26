import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { wishlists, bookmarks, gifts, users } from "../../db/schema";
import {
  createWishlist,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getUserWishlists,
} from "../wishlist-service";
import { createTestDb } from "./test-db";

describe("Wishlist Service", () => {
  const { db, sqlite } = createTestDb();
  const testUser = {
    id: "test-user-1",
    email: "test@example.com",
    name: "Test User",
  };

  const testUser2 = {
    id: "test-user-2",
    email: "test2@example.com",
    name: "Test User 2",
  };

  beforeEach(async () => {
    // Clear the database before each test
    await db.delete(bookmarks);
    await db.delete(wishlists);
    await db.delete(gifts);
    await db.delete(users);

    // Create test user
    await db.insert(users).values(testUser);
    await db.insert(users).values(testUser2);

    // Insert test gift
    const [gift] = await db
      .insert(gifts)
      .values({
        slug: "test-gift",
        name: "Test Gift",
        description: "A test gift",
        minPrice: 10,
        maxPrice: 20,
        link: "https://example.com/gift",
        isHidden: false,
        category: "other",
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(bookmarks);
    await db.delete(wishlists);
    await db.delete(gifts);
    await db.delete(users);
  });

  describe("createWishlist", () => {
    it("should create a new wishlist", async () => {
      const wishlist = await createWishlist(db, {
        name: "Test Wishlist",
        description: "A test wishlist",
        userId: testUser.id,
      });

      expect(wishlist).toBeDefined();
      expect(wishlist.name).toBe("Test Wishlist");
      expect(wishlist.description).toBe("A test wishlist");
      expect(wishlist.userId).toBe(testUser.id);
    });
  });

  describe("addToWishlist", () => {
    it("should add a gift to a wishlist", async () => {
      // Create a wishlist first
      const [wishlist] = await db
        .insert(wishlists)
        .values({
          name: "Test Wishlist",
          userId: testUser.id,
        })
        .returning();

      // Get the test gift
      const [gift] = await db.select().from(gifts).limit(1);

      const bookmark = await addToWishlist(db, {
        wishlistId: wishlist.id,
        giftId: gift.id,
      });

      expect(bookmark).toBeDefined();
      expect(bookmark.wishlistId).toBe(wishlist.id);
      expect(bookmark.giftId).toBe(gift.id);
    });
  });

  describe("removeFromWishlist", () => {
    it("should remove a gift from a wishlist", async () => {
      // Create a wishlist first
      const [wishlist] = await db
        .insert(wishlists)
        .values({
          name: "Test Wishlist",
          userId: testUser.id,
        })
        .returning();

      // Get the test gift
      const [gift] = await db.select().from(gifts).limit(1);

      // Add the gift to the wishlist
      await addToWishlist(db, {
        wishlistId: wishlist.id,
        giftId: gift.id,
      });

      // Remove the gift from the wishlist
      await removeFromWishlist(db, {
        wishlistId: wishlist.id,
        giftId: gift.id,
      });

      // Verify the gift was removed
      const wishlistAfter = await getWishlist(db, wishlist.id);
      expect(wishlistAfter?.bookmarks).toHaveLength(0);
    });
  });

  describe("getWishlist", () => {
    it("should return a wishlist with its bookmarked gifts", async () => {
      // Create a wishlist first
      const [wishlist] = await db
        .insert(wishlists)
        .values({
          name: "Test Wishlist",
          userId: testUser.id,
        })
        .returning();

      // Get the test gift
      const [gift] = await db.select().from(gifts).limit(1);

      // Add the gift to the wishlist
      await addToWishlist(db, {
        wishlistId: wishlist.id,
        giftId: gift.id,
      });

      const result = await getWishlist(db, wishlist.id);
      expect(result).toBeDefined();
      expect(result?.name).toBe("Test Wishlist");
      expect(result?.bookmarks).toHaveLength(1);
      expect(result?.bookmarks[0].gift.name).toBe("Test Gift");
    });
  });

  describe("getUserWishlists", () => {
    it("should return all wishlists for a user", async () => {
      // Create two wishlists for the user
      await db.insert(wishlists).values([
        {
          name: "Test Wishlist 1",
          userId: testUser.id,
        },
        {
          name: "Test Wishlist 2",
          userId: testUser.id,
        },
      ]);

      const results = await getUserWishlists(db, testUser.id);
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Test Wishlist 1");
      expect(results[1].name).toBe("Test Wishlist 2");
    });

    it("should not return wishlists for other users", async () => {
      // Create a wishlist for the test user
      await db.insert(wishlists).values({
        name: "Test Wishlist",
        userId: testUser.id,
      });

      // Create a wishlist for another user
      await db.insert(wishlists).values({
        name: "Other User Wishlist",
        userId: testUser2.id,
      });

      const results = await getUserWishlists(db, testUser.id);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Wishlist");
    });
  });
});
