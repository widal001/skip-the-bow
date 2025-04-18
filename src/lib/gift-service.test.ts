import { describe, it, expect, vi } from "vitest";
import { searchGifts } from "./gift-service";
import type { GiftCategory } from "../content/types";

// Mock the getCollection function
vi.mock("astro:content", () => ({
  getCollection: vi.fn().mockResolvedValue([
    {
      data: {
        slug: "gift-1",
        name: "Gift Card",
        description: "A versatile gift card",
        priceRange: { min: 10, max: 50 },
        link: "https://example.com/gift-1",
        tags: ["digital", "flexible"],
        category: "giftcard" as GiftCategory,
        isHidden: false,
      },
    },
    {
      data: {
        slug: "gift-2",
        name: "Charity Donation",
        description: "Donate to a good cause",
        priceRange: { min: 5, max: 100 },
        link: "https://example.com/gift-2",
        tags: ["charity", "meaningful"],
        category: "donation" as GiftCategory,
        isHidden: false,
      },
    },
    {
      data: {
        slug: "gift-3",
        name: "Streaming Subscription",
        description: "Entertainment for a year",
        priceRange: { min: 125, max: 150 },
        link: "https://example.com/gift-3",
        tags: ["digital", "entertainment"],
        category: "subscription" as GiftCategory,
        isHidden: false,
      },
    },
  ]),
}));

describe("searchGifts", () => {
  it("should return all gifts when no filters are applied", async () => {
    const results = await searchGifts({});
    expect(results).toHaveLength(3);
  });

  it("should filter by search query", async () => {
    const results = await searchGifts({ query: "gift" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Gift Card");
  });

  it("should filter by category", async () => {
    const results = await searchGifts({ categories: ["donation"] });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Charity Donation");
  });

  it("should filter by multiple categories", async () => {
    const results = await searchGifts({ categories: ["donation", "giftcard"] });
    expect(results).toHaveLength(2);
  });

  it("should filter by tags", async () => {
    const results = await searchGifts({ tags: ["digital"] });
    expect(results).toHaveLength(2);
  });

  it("should filter by price range", async () => {
    const results = await searchGifts({
      priceRange: { min: 125, max: 175 },
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Streaming Subscription");
  });

  it("should sort by price ascending", async () => {
    const results = await searchGifts({ sortBy: "price-asc" });
    expect(results[0].priceRange.min).toBeLessThan(results[1].priceRange.min);
    expect(results[1].priceRange.min).toBeLessThan(results[2].priceRange.min);
  });

  it("should sort by price descending", async () => {
    const results = await searchGifts({ sortBy: "price-desc" });
    expect(results[0].priceRange.max).toBeGreaterThan(
      results[1].priceRange.max
    );
    expect(results[1].priceRange.max).toBeGreaterThan(
      results[2].priceRange.max
    );
  });

  it("should sort by name ascending", async () => {
    const results = await searchGifts({ sortBy: "name-asc" });
    expect(results[0].name).toBe("Charity Donation");
    expect(results[1].name).toBe("Gift Card");
    expect(results[2].name).toBe("Streaming Subscription");
  });

  it("should sort by name descending", async () => {
    const results = await searchGifts({ sortBy: "name-desc" });
    expect(results[0].name).toBe("Streaming Subscription");
    expect(results[1].name).toBe("Gift Card");
    expect(results[2].name).toBe("Charity Donation");
  });

  it("should combine multiple filters", async () => {
    const results = await searchGifts({
      query: "versatile",
      categories: ["giftcard"],
      tags: ["flexible"],
      priceRange: { min: 5, max: 60 },
      sortBy: "name-asc",
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Gift Card");
  });
});
