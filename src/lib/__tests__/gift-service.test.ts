import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { gifts, tags, giftTags } from "../../db/schema";
import {
  getGiftIdeas,
  getGiftsByCategory,
  getGiftBySlug,
  searchGifts,
} from "../gift-service";
import { createTestDb } from "./test-db";

describe("Gift Service", () => {
  const { db, client } = createTestDb();

  beforeEach(async () => {
    // Clear the database before each test
    await db.delete(giftTags);
    await db.delete(tags);
    await db.delete(gifts);

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

    await db.insert(giftTags).values([
      { giftId: gift1.id, tagId: tag1.id },
      { giftId: gift2.id, tagId: tag2.id },
    ]);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(giftTags);
    await db.delete(tags);
    await db.delete(gifts);
  });

  describe("getGiftIdeas", () => {
    it("should return all non-hidden gifts with their tags", async () => {
      const results = await getGiftIdeas(db);
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Test Gift 1");
      expect(results[1].name).toBe("Test Gift 2");
    });
  });

  describe("getGiftsByCategory", () => {
    it("should return gifts filtered by category", async () => {
      const results = await getGiftsByCategory(db, "experience");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Gift 2");
    });
  });

  describe("getGiftBySlug", () => {
    it("should return a gift by its slug", async () => {
      const gift = await getGiftBySlug(db, "test-gift-1");
      expect(gift).toBeDefined();
      expect(gift?.name).toBe("Test Gift 1");
    });

    it("should return undefined for non-existent slug", async () => {
      const gift = await getGiftBySlug(db, "non-existent");
      expect(gift).toBeUndefined();
    });
  });

  describe("searchGifts", () => {
    it("should filter gifts by text search", async () => {
      const results = await searchGifts(db, { query: "Another" });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Gift 2");
    });

    it("should filter gifts by category", async () => {
      const results = await searchGifts(db, { categories: ["experience"] });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Gift 2");
    });

    it("should filter gifts by price range", async () => {
      const results = await searchGifts(db, {
        priceRange: { min: 25, max: 35 },
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Gift 2");
    });

    it("should sort gifts by price ascending", async () => {
      const results = await searchGifts(db, { sortBy: "price-asc" });
      expect(results[0].name).toBe("Test Gift 1");
      expect(results[1].name).toBe("Test Gift 2");
    });
  });
});
