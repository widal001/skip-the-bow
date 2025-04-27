import type { Gift, GiftCategory, GiftSearchParams } from "../content/types";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { schema } from "../db";

const { gifts, tags, giftTags } = schema;

export async function getGiftIdeas(): Promise<Gift[]> {
  const results = await db
    .select({
      slug: gifts.slug,
      name: gifts.name,
      description: gifts.description,
      priceRange: {
        min: gifts.minPrice,
        max: gifts.maxPrice,
      },
      link: gifts.link,
      tags: sql<string>`GROUP_CONCAT(${tags.name})`.mapWith(String).as("tags"),
      isHidden: gifts.isHidden,
      category: gifts.category,
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(eq(gifts.isHidden, false))
    .groupBy(gifts.id);

  return results.map((result) => ({
    ...result,
    tags: result.tags ? result.tags.split(",") : [],
  }));
}

export async function getGiftsByCategory(
  category: GiftCategory
): Promise<Gift[]> {
  const results = await db
    .select({
      slug: gifts.slug,
      name: gifts.name,
      description: gifts.description,
      priceRange: {
        min: gifts.minPrice,
        max: gifts.maxPrice,
      },
      link: gifts.link,
      tags: sql<string>`GROUP_CONCAT(${tags.name})`.mapWith(String).as("tags"),
      isHidden: gifts.isHidden,
      category: gifts.category,
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(and(eq(gifts.category, category), eq(gifts.isHidden, false)))
    .groupBy(gifts.id);

  return results.map((result) => ({
    ...result,
    tags: result.tags ? result.tags.split(",") : [],
  }));
}

export async function getGiftBySlug(slug: string): Promise<Gift | undefined> {
  const results = await db
    .select({
      slug: gifts.slug,
      name: gifts.name,
      description: gifts.description,
      priceRange: {
        min: gifts.minPrice,
        max: gifts.maxPrice,
      },
      link: gifts.link,
      tags: sql<string>`GROUP_CONCAT(${tags.name})`.mapWith(String).as("tags"),
      isHidden: gifts.isHidden,
      category: gifts.category,
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(eq(gifts.slug, slug))
    .groupBy(gifts.id);

  if (results.length === 0) return undefined;

  const result = results[0];
  return {
    ...result,
    tags: result.tags ? result.tags.split(",") : [],
  };
}

export function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function searchGifts(props: GiftSearchParams): Promise<Gift[]> {
  let results = await getGiftIdeas();

  // Apply text search if query exists
  if (props.query) {
    const searchQuery = props.query.toLowerCase();
    results = results.filter(
      (gift) =>
        gift.name.toLowerCase().includes(searchQuery) ||
        gift.description.toLowerCase().includes(searchQuery)
    );
  }

  // Apply category filter if categories exist
  if (props.categories?.length) {
    results = results.filter((gift) =>
      props.categories!.includes(gift.category)
    );
  }

  // Apply tag filter if tags exist
  if (props.tags?.length) {
    results = results.filter((gift) =>
      props.tags!.some((tag) => gift.tags.includes(tag))
    );
  }

  // Apply price range filter if min/max exist
  if (props.priceRange?.min || props.priceRange?.max) {
    const min = props.priceRange?.min ?? 0;
    const max = props.priceRange?.max ?? Infinity;
    results = results.filter(
      (gift) => gift.priceRange.min >= min && gift.priceRange.max <= max
    );
  }

  // Apply sorting if sortBy exists
  if (props.sortBy) {
    switch (props.sortBy) {
      case "price-asc":
        results.sort((a, b) => a.priceRange.min - b.priceRange.min);
        break;
      case "price-desc":
        results.sort((a, b) => b.priceRange.max - a.priceRange.max);
        break;
      case "name-asc":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
  }

  return results;
}
