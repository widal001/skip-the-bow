import { describe, it, expect, afterAll } from "vitest";
import { gifts, tags, giftTags } from "@/db/schema";
import {
  getGiftIdeas,
  getGiftsByCategory,
  getGiftBySlug,
  searchGifts,
  upsertGift,
} from "@/lib/services/gift-service";
import { createTestDb, cleanupTestDb, withTransaction } from "./test-db";

describe("Gift Service", async () => {
  const { db, client } = await createTestDb();

  afterAll(async () => {
    await cleanupTestDb(client);
  });

  describe("getGiftIdeas", () => {
    it("should return all non-hidden gifts with their tags", async () => {
      await withTransaction(db, async (db) => {
        // Insert test data
        const [gift1] = await db
          .insert(gifts)
          .values({
            slug: "test-gift-1",
            name: "Test Gift 1",
            description: "A test gift",
            minPrice: 10,
            maxPrice: 20,
            link: "https://example.com/gift1",
            isHidden: false,
            category: "other",
          })
          .returning();

        const [gift2] = await db
          .insert(gifts)
          .values({
            slug: "test-gift-2",
            name: "Test Gift 2",
            description: "Another test gift",
            minPrice: 30,
            maxPrice: 40,
            link: "https://example.com/gift2",
            isHidden: false,
            category: "experience",
          })
          .returning();

        const [tag1] = await db
          .insert(tags)
          .values({ name: "test-tag-1" })
          .returning();

        const [tag2] = await db
          .insert(tags)
          .values({ name: "test-tag-2" })
          .returning();

        // Create gift tags
        await db.insert(giftTags).values([
          { giftId: gift1.id, tagId: tag1.id },
          { giftId: gift2.id, tagId: tag2.id },
        ]);

        const results = await getGiftIdeas(db);
        expect(results).toHaveLength(2);
      });
    });
  });

  describe("getGiftsByCategory", () => {
    it("should return gifts filtered by category", async () => {
      await withTransaction(db, async (db) => {
        // Insert test data
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        await db.insert(gifts).values({
          slug: "test-gift-2",
          name: "Test Gift 2",
          description: "Another test gift",
          minPrice: 30,
          maxPrice: 40,
          link: "https://example.com/gift2",
          isHidden: false,
          category: "experience",
        });

        const results = await getGiftsByCategory(db, "experience");
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Test Gift 2");
      });
    });
  });

  describe("getGiftBySlug", () => {
    it("should return a gift by its slug", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        const gift = await getGiftBySlug(db, "test-gift-1");
        expect(gift).toBeDefined();
        expect(gift?.name).toBe("Test Gift 1");
      });
    });

    it("should return undefined for non-existent slug", async () => {
      await withTransaction(db, async (db) => {
        const gift = await getGiftBySlug(db, "non-existent-slug");
        expect(gift).toBeUndefined();
      });
    });
  });

  describe("searchGifts", () => {
    it("should filter gifts by text search", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        await db.insert(gifts).values({
          slug: "test-gift-2",
          name: "Test Gift 2",
          description: "Another test gift",
          minPrice: 30,
          maxPrice: 40,
          link: "https://example.com/gift2",
          isHidden: false,
          category: "experience",
        });

        const results = await searchGifts(db, { query: "Another" });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Test Gift 2");
      });
    });

    it("should filter gifts by category", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        await db.insert(gifts).values({
          slug: "test-gift-2",
          name: "Test Gift 2",
          description: "Another test gift",
          minPrice: 30,
          maxPrice: 40,
          link: "https://example.com/gift2",
          isHidden: false,
          category: "experience",
        });

        const results = await searchGifts(db, { categories: ["experience"] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Test Gift 2");
      });
    });

    it("should filter gifts by price range", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        await db.insert(gifts).values({
          slug: "test-gift-2",
          name: "Test Gift 2",
          description: "Another test gift",
          minPrice: 30,
          maxPrice: 40,
          link: "https://example.com/gift2",
          isHidden: false,
          category: "experience",
        });

        const results = await searchGifts(db, {
          priceRange: { min: 25, max: 35 },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Test Gift 2");
      });
    });

    it("should sort gifts by price ascending", async () => {
      await withTransaction(db, async (db) => {
        await db.insert(gifts).values({
          slug: "test-gift-1",
          name: "Test Gift 1",
          description: "A test gift",
          minPrice: 10,
          maxPrice: 20,
          link: "https://example.com/gift1",
          isHidden: false,
          category: "other",
        });

        await db.insert(gifts).values({
          slug: "test-gift-2",
          name: "Test Gift 2",
          description: "Another test gift",
          minPrice: 30,
          maxPrice: 40,
          link: "https://example.com/gift2",
          isHidden: false,
          category: "experience",
        });

        const results = await searchGifts(db, { sortBy: "price-asc" });
        expect(results[0].name).toBe("Test Gift 1");
        expect(results[1].name).toBe("Test Gift 2");
      });
    });
  });

  describe("upsertGift", () => {
    it("should create a new gift with tags", async () => {
      await withTransaction(db, async (tx) => {
        const giftData = {
          slug: "new-gift",
          name: "New Gift",
          description: "A new test gift",
          priceRange: { min: 10, max: 20 },
          link: "https://example.com/new-gift",
          isHidden: false,
          category: "other" as const,
          tags: ["new-tag-1", "new-tag-2"],
        };

        const result = await upsertGift(db, giftData, tx);

        expect(result).toBeDefined();
        expect(result.slug).toBe(giftData.slug);
        expect(result.name).toBe(giftData.name);
        expect(result.tags).toHaveLength(2);
        expect(result.tags).toContain("new-tag-1");
        expect(result.tags).toContain("new-tag-2");

        // Verify the gift exists in the database
        const gift = await getGiftBySlug(db, giftData.slug);
        expect(gift).toBeDefined();
        expect(gift?.name).toBe(giftData.name);
      });
    });

    it("should update an existing gift and its tags", async () => {
      await withTransaction(db, async (tx) => {
        // First create a gift
        const initialGift = await upsertGift(
          db,
          {
            slug: "existing-gift",
            name: "Existing Gift",
            description: "An existing test gift",
            priceRange: { min: 10, max: 20 },
            link: "https://example.com/existing-gift",
            isHidden: false,
            category: "other" as const,
            tags: ["old-tag"],
          },
          tx
        );

        // Then update it
        const updatedGift = await upsertGift(
          db,
          {
            slug: "existing-gift", // Same slug
            name: "Updated Gift",
            description: "An updated test gift",
            priceRange: { min: 15, max: 25 },
            link: "https://example.com/updated-gift",
            isHidden: true,
            category: "experience" as const,
            tags: ["new-tag-1", "new-tag-2"],
          },
          tx
        );

        expect(updatedGift).toBeDefined();
        expect(updatedGift.name).toBe("Updated Gift");
        expect(updatedGift.description).toBe("An updated test gift");
        expect(updatedGift.priceRange.min).toBe(15);
        expect(updatedGift.priceRange.max).toBe(25);
        expect(updatedGift.isHidden).toBe(true);
        expect(updatedGift.category).toBe("experience");
        expect(updatedGift.tags).toHaveLength(2);
        expect(updatedGift.tags).toContain("new-tag-1");
        expect(updatedGift.tags).toContain("new-tag-2");
        expect(updatedGift.tags).not.toContain("old-tag");

        // Verify the gift was updated in the database
        const gift = await getGiftBySlug(db, "existing-gift");
        expect(gift).toBeDefined();
        expect(gift?.name).toBe("Updated Gift");
      });
    });

    it("should reuse existing tags", async () => {
      await withTransaction(db, async (tx) => {
        // First create a gift with some tags
        await upsertGift(
          db,
          {
            slug: "gift-1",
            name: "Gift 1",
            description: "First test gift",
            priceRange: { min: 10, max: 20 },
            link: "https://example.com/gift1",
            isHidden: false,
            category: "other" as const,
            tags: ["shared-tag", "unique-tag-1"],
          },
          tx
        );

        // Then create another gift reusing one of the tags
        const gift2 = await upsertGift(
          db,
          {
            slug: "gift-2",
            name: "Gift 2",
            description: "Second test gift",
            priceRange: { min: 30, max: 40 },
            link: "https://example.com/gift2",
            isHidden: false,
            category: "other" as const,
            tags: ["shared-tag", "unique-tag-2"],
          },
          tx
        );

        expect(gift2.tags).toHaveLength(2);
        expect(gift2.tags).toContain("shared-tag");
        expect(gift2.tags).toContain("unique-tag-2");

        // Verify both gifts have the correct tags
        const gift1 = await getGiftBySlug(db, "gift-1");
        expect(gift1?.tags).toContain("shared-tag");
        expect(gift1?.tags).toContain("unique-tag-1");
      });
    });

    it("should properly manage tag additions and removals", async () => {
      await withTransaction(db, async (tx) => {
        // First create a gift with initial tags
        const initialGift = await upsertGift(
          db,
          {
            slug: "tag-test-gift",
            name: "Tag Test Gift",
            description: "A gift for testing tag management",
            priceRange: { min: 10, max: 20 },
            link: "https://example.com/tag-test",
            isHidden: false,
            category: "other" as const,
            tags: ["tag1", "tag2", "tag3"],
          },
          tx
        );

        expect(initialGift.tags).toHaveLength(3);
        expect(initialGift.tags).toContain("tag1");
        expect(initialGift.tags).toContain("tag2");
        expect(initialGift.tags).toContain("tag3");

        // Update the gift with some tags removed and some new ones added
        const updatedGift = await upsertGift(
          db,
          {
            slug: "tag-test-gift",
            name: "Tag Test Gift",
            description: "A gift for testing tag management",
            priceRange: { min: 10, max: 20 },
            link: "https://example.com/tag-test",
            isHidden: false,
            category: "other" as const,
            tags: ["tag2", "tag3", "tag4", "tag5"],
          },
          tx
        );

        expect(updatedGift.tags).toHaveLength(4);
        expect(updatedGift.tags).not.toContain("tag1"); // Removed
        expect(updatedGift.tags).toContain("tag2"); // Kept
        expect(updatedGift.tags).toContain("tag3"); // Kept
        expect(updatedGift.tags).toContain("tag4"); // Added
        expect(updatedGift.tags).toContain("tag5"); // Added

        // Verify the changes persist
        const gift = await getGiftBySlug(db, "tag-test-gift");
        expect(gift?.tags).toHaveLength(4);
        expect(gift?.tags).not.toContain("tag1");
        expect(gift?.tags).toContain("tag2");
        expect(gift?.tags).toContain("tag3");
        expect(gift?.tags).toContain("tag4");
        expect(gift?.tags).toContain("tag5");
      });
    });
  });
});
