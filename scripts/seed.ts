import { db } from "../src/db";
import { gifts, tags, giftTags } from "../src/db/schema";
import giftsData from "../src/content/gifts.json";
import config from "../drizzle.config";

// Check if we're running in a local environment
const isLocalEnvironment =
  config.dbCredentials.url.startsWith("./") ||
  config.dbCredentials.url.startsWith("file:");

if (!isLocalEnvironment) {
  console.error("This script can only be run in a local environment.");
  console.error("Database URL must start with './' or 'file:'");
  process.exit(1);
}

async function seed() {
  console.log("Starting database seeding...");

  // Use a transaction to ensure data consistency
  await db.transaction(async (tx) => {
    // Clear existing data in the correct order (respecting foreign key constraints)
    await tx.delete(giftTags);
    await tx.delete(gifts);
    await tx.delete(tags);

    // First, insert all unique tags
    const allTags = new Set<string>();
    giftsData.forEach((gift) => {
      gift.tags.forEach((tag) => allTags.add(tag));
    });

    const tagRecords = await Promise.all(
      Array.from(allTags).map(async (tagName) => {
        const [newTag] = await tx
          .insert(tags)
          .values({ name: tagName })
          .returning();
        return newTag;
      })
    );

    // Create a map of tag names to tag IDs
    const tagMap = new Map(tagRecords.map((tag) => [tag.name, tag.id]));

    // Then insert all gifts
    for (const gift of giftsData) {
      const [insertedGift] = await tx
        .insert(gifts)
        .values({
          slug: gift.slug,
          name: gift.name,
          description: gift.description,
          minPrice: gift.priceRange.min,
          maxPrice: gift.priceRange.max,
          link: gift.link,
          isHidden: gift.isHidden,
          category: gift.category as
            | "donation"
            | "subscription"
            | "experience"
            | "giftcard"
            | "other",
        })
        .returning();

      // Finally, create the gift-tag relationships
      const giftTagValues = gift.tags.map((tagName) => ({
        giftId: insertedGift.id,
        tagId: tagMap.get(tagName)!,
      }));

      await tx.insert(giftTags).values(giftTagValues);
    }
  });

  console.log("Database seeding completed successfully!");
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
