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

export async function upsertGift(
  db: DrizzleDatabase,
  giftData: {
    slug: string;
    name: string;
    description: string;
    priceRange: { min: number; max: number };
    link: string;
    isHidden: boolean;
    category: GiftCategory;
    tags: string[];
  },
  tx?: DrizzleDatabase
): Promise<Gift> {
  const dbToUse = tx || db;

  // First, ensure all tags exist
  const tagMap = new Map<string, number>();
  for (const tagName of giftData.tags) {
    const existingTag = await dbToUse
      .select()
      .from(tags)
      .where(eq(tags.name, tagName))
      .then((rows) => rows[0]);

    if (existingTag) {
      tagMap.set(tagName, existingTag.id);
    } else {
      const [newTag] = await dbToUse
        .insert(tags)
        .values({ name: tagName })
        .returning();
      tagMap.set(tagName, newTag.id);
    }
  }

  // Check if gift exists
  const existingGift = await dbToUse
    .select()
    .from(gifts)
    .where(eq(gifts.slug, giftData.slug))
    .then((rows) => rows[0]);

  let giftId: number;
  if (existingGift) {
    // Update existing gift
    await dbToUse
      .update(gifts)
      .set({
        name: giftData.name,
        description: giftData.description,
        minPrice: giftData.priceRange.min,
        maxPrice: giftData.priceRange.max,
        link: giftData.link,
        isHidden: giftData.isHidden,
        category: giftData.category,
      })
      .where(eq(gifts.id, existingGift.id));
    giftId = existingGift.id;
  } else {
    // Insert new gift
    const [newGift] = await dbToUse
      .insert(gifts)
      .values({
        slug: giftData.slug,
        name: giftData.name,
        description: giftData.description,
        minPrice: giftData.priceRange.min,
        maxPrice: giftData.priceRange.max,
        link: giftData.link,
        isHidden: giftData.isHidden,
        category: giftData.category,
      })
      .returning();
    giftId = newGift.id;
  }

  // Get existing gift-tag relationships
  const existingGiftTags = await dbToUse
    .select()
    .from(giftTags)
    .where(eq(giftTags.giftId, giftId));
  const existingTagIds = new Set(existingGiftTags.map((gt) => gt.tagId));

  // Calculate which tags need to be added or removed
  const newTagIds = new Set(
    giftData.tags.map((tagName) => tagMap.get(tagName)!)
  );

  // Tags to insert: tags that are in newTagIds but not in existingTagIds
  const tagsToInsert = Array.from(newTagIds).filter(
    (tagId) => !existingTagIds.has(tagId)
  );

  // Tags to delete: tags that are in existingTagIds but not in newTagIds
  const tagsToDelete = Array.from(existingTagIds).filter(
    (tagId) => !newTagIds.has(tagId)
  );

  // Delete removed tags
  if (tagsToDelete.length > 0) {
    await dbToUse
      .delete(giftTags)
      .where(
        and(
          eq(giftTags.giftId, giftId),
          sql`${giftTags.tagId} IN (${tagsToDelete.join(",")})`
        )
      );
  }

  // Insert new tags
  if (tagsToInsert.length > 0) {
    const newGiftTagValues = tagsToInsert.map((tagId) => ({
      giftId,
      tagId,
    }));

    await dbToUse.insert(giftTags).values(newGiftTagValues);
  }

  // Return the updated gift
  return (await getGiftBySlug(db, giftData.slug))!;
}
