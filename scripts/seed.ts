import { db } from "@/db";
import giftsData from "@/content/gifts.json";
import { upsertGift } from "@/lib/services/gift-service";

async function seed() {
  console.log("Starting database seeding...");

  for (const gift of giftsData) {
    await upsertGift(db, {
      slug: gift.slug,
      name: gift.name,
      description: gift.description,
      priceRange: gift.priceRange,
      link: gift.link,
      isHidden: gift.isHidden,
      category: gift.category as
        | "donation"
        | "subscription"
        | "experience"
        | "giftcard"
        | "other",
      tags: gift.tags,
    });
  }

  console.log("Database seeding completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
