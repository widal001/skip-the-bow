import type { Gift, GiftCategory, GiftSearchParams } from "../content/types";
import { eq, and, sql } from "drizzle-orm";
import { gifts, tags, giftTags } from "../db/schema";
import type { DrizzleDatabase } from "../db";

export async function getGiftIdeas(db: DrizzleDatabase): Promise<Gift[]> {
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
      isHidden: gifts.isHidden,
      category: gifts.category,
      tags: sql<string[]>`COALESCE(
        JSON_ARRAYAGG(
          NULLIF(${tags.name}, NULL)
        ),
        JSON_ARRAY()
      )`.as("tags"),
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(eq(gifts.isHidden, false))
    .groupBy(gifts.id);

  return results as Gift[];
}

export async function getGiftsByCategory(
  db: DrizzleDatabase,
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
      isHidden: gifts.isHidden,
      category: gifts.category,
      tags: sql<string[]>`COALESCE(
        JSON_ARRAYAGG(
          NULLIF(${tags.name}, NULL)
        ),
        JSON_ARRAY()
      )`.as("tags"),
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(and(eq(gifts.category, category), eq(gifts.isHidden, false)))
    .groupBy(gifts.id);

  return results as Gift[];
}

export async function getGiftBySlug(
  db: DrizzleDatabase,
  slug: string
): Promise<Gift | undefined> {
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
      isHidden: gifts.isHidden,
      category: gifts.category,
      tags: sql<string[]>`COALESCE(
        JSON_ARRAYAGG(
          NULLIF(${tags.name}, NULL)
        ),
        JSON_ARRAY()
      )`.as("tags"),
    })
    .from(gifts)
    .leftJoin(giftTags, eq(gifts.id, giftTags.giftId))
    .leftJoin(tags, eq(giftTags.tagId, tags.id))
    .where(eq(gifts.slug, slug))
    .groupBy(gifts.id);

  if (results.length === 0) return undefined;
  return results[0] as Gift;
}

export function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function searchGifts(
  db: DrizzleDatabase,
  props: GiftSearchParams
): Promise<Gift[]> {
  let results = await getGiftIdeas(db);

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
      (gift) => gift.priceRange.min <= max && gift.priceRange.max >= min
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
