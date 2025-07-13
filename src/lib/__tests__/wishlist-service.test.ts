import { describe, it, expect, afterAll } from "vitest";
import { users, gifts } from "@/db/schema";
import {
  createWishlist,
  addToWishlist,
  updateGiftWishlists,
  getGiftWishlists,
} from "@/lib/services/wishlist-service";
import { createTestDb, cleanupTestDb, withTransaction } from "./test-db";

describe("Wishlist Service", async () => {
  const { db, client } = await createTestDb();

  const testUser = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  };

  const testGift = {
    slug: "test-gift",
    name: "Test Gift",
    description: "A test gift",
    minPrice: 10.0,
    maxPrice: 50.0,
    link: "https://example.com",
    category: "other" as const,
  };

  afterAll(async () => {
    await cleanupTestDb(client);
  });

  describe("updateGiftWishlists", () => {
    it("should add gift to new wishlists", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Create wishlists
        const wishlist1 = await createWishlist(db, {
          name: "Wishlist 1",
          userId: testUser.id,
        });
        const wishlist2 = await createWishlist(db, {
          name: "Wishlist 2",
          userId: testUser.id,
        });

        // Update gift wishlists
        const result = await updateGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
          wishlistIds: [wishlist1.id, wishlist2.id],
        });

        expect(result.wishlistIds).toEqual([wishlist1.id, wishlist2.id]);
        expect(result.added).toEqual([wishlist1.id, wishlist2.id]);
        expect(result.removed).toEqual([]);

        // Verify in database
        const currentWishlists = await getGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });
        expect(currentWishlists).toEqual([wishlist1.id, wishlist2.id]);
      });
    });

    it("should remove gift from wishlists not in new state", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Create wishlists
        const wishlist1 = await createWishlist(db, {
          name: "Wishlist 1",
          userId: testUser.id,
        });
        const wishlist2 = await createWishlist(db, {
          name: "Wishlist 2",
          userId: testUser.id,
        });

        // Add gift to both wishlists initially
        await addToWishlist(db, {
          wishlistId: wishlist1.id,
          giftId: createdGift.id,
        });
        await addToWishlist(db, {
          wishlistId: wishlist2.id,
          giftId: createdGift.id,
        });

        // Update to only include wishlist1
        const result = await updateGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
          wishlistIds: [wishlist1.id],
        });

        expect(result.wishlistIds).toEqual([wishlist1.id]);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([wishlist2.id]);

        // Verify in database
        const currentWishlists = await getGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });
        expect(currentWishlists).toEqual([wishlist1.id]);
      });
    });

    it("should handle empty wishlist array", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Create wishlist and add gift
        const wishlist = await createWishlist(db, {
          name: "Wishlist 1",
          userId: testUser.id,
        });
        await addToWishlist(db, {
          wishlistId: wishlist.id,
          giftId: createdGift.id,
        });

        // Remove from all wishlists
        const result = await updateGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
          wishlistIds: [],
        });

        expect(result.wishlistIds).toEqual([]);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([wishlist.id]);

        // Verify in database
        const currentWishlists = await getGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });
        expect(currentWishlists).toEqual([]);
      });
    });

    it("should throw error for invalid wishlist IDs", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        await expect(
          updateGiftWishlists(db, {
            userId: testUser.id,
            giftId: createdGift.id,
            wishlistIds: ["00000000-0000-0000-0000-000000000000"], // Valid UUID format but non-existent
          })
        ).rejects.toThrow(
          "Invalid wishlist IDs: 00000000-0000-0000-0000-000000000000"
        );
      });
    });
  });

  describe("getGiftWishlists", () => {
    it("should return empty array when gift is not in any wishlists", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        const wishlistIds = await getGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });
        expect(wishlistIds).toEqual([]);
      });
    });

    it("should return wishlist IDs when gift is in wishlists", async () => {
      await withTransaction(db, async (db) => {
        // Create test user and gift
        await db.insert(users).values(testUser);
        const [createdGift] = await db
          .insert(gifts)
          .values(testGift)
          .returning();

        // Create wishlists and add gift
        const wishlist1 = await createWishlist(db, {
          name: "Wishlist 1",
          userId: testUser.id,
        });
        const wishlist2 = await createWishlist(db, {
          name: "Wishlist 2",
          userId: testUser.id,
        });

        await addToWishlist(db, {
          wishlistId: wishlist1.id,
          giftId: createdGift.id,
        });
        await addToWishlist(db, {
          wishlistId: wishlist2.id,
          giftId: createdGift.id,
        });

        const wishlistIds = await getGiftWishlists(db, {
          userId: testUser.id,
          giftId: createdGift.id,
        });
        expect(wishlistIds).toContain(wishlist1.id);
        expect(wishlistIds).toContain(wishlist2.id);
        expect(wishlistIds).toHaveLength(2);
      });
    });
  });
});
