import type { Gift, GiftCategory, GiftSearchParams } from "../content/types";
import { getCollection } from "astro:content";

export async function getGiftIdeas(): Promise<Gift[]> {
  const ideas = await getCollection("gifts");
  return ideas.map((idea) => idea.data);
}

export async function getGiftsByCategory(
  category: GiftCategory
): Promise<Gift[]> {
  const ideas = await getCollection("gifts");
  return ideas
    .map((idea) => idea.data)
    .filter((gift) => gift.category === category);
}

export async function getGiftBySlug(slug: string): Promise<Gift | undefined> {
  const ideas = await getCollection("gifts");
  const idea = ideas.find((idea) => idea.data.slug === slug);
  return idea?.data;
}

export function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function searchGifts(props: GiftSearchParams): Promise<Gift[]> {
  const ideas = await getCollection("gifts");
  let results = ideas.map((idea) => idea.data);

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
    results = results.filter((gift) => {
      const min = props.priceRange?.min ?? 0;
      const max = props.priceRange?.max ?? Infinity;
      // Check if there's any overlap between the gift's price range and the filter range
      return gift.priceRange.min <= max && gift.priceRange.max >= min;
    });
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
