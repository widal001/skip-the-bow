import type { Gift } from "../content/types";
import { GiftCategory } from "../content/types";
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
