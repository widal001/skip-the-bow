import { wishlists, wishlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { DrizzleDatabase } from "@/db";

export interface CreateWishlistInput {
  name: string;
  description?: string;
  userId: string;
}

export interface AddToWishlistInput {
  wishlistId: number;
  giftId: number;
}

/**
 * Creates a new wishlist for a user
 * @param input - The wishlist creation parameters
 * @returns The newly created wishlist
 */
export async function createWishlist(
  db: DrizzleDatabase,
  input: CreateWishlistInput
) {
  const [wishlist] = await db
    .insert(wishlists)
    .values({
      name: input.name,
      description: input.description,
      userId: input.userId,
    })
    .returning();

  return wishlist;
}

/**
 * Adds a gift to a wishlist
 * @param input - The wishlist and gift IDs
 * @returns The created bookmark
 */
export async function addToWishlist(
  db: DrizzleDatabase,
  input: AddToWishlistInput
) {
  const [bookmark] = await db
    .insert(wishlistItems)
    .values({
      wishlistId: input.wishlistId,
      giftId: input.giftId,
    })
    .returning();

  return bookmark;
}

/**
 * Removes a gift from a wishlist
 * @param input - The wishlist and gift IDs
 */
export async function removeFromWishlist(
  db: DrizzleDatabase,
  input: AddToWishlistInput
) {
  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.wishlistId, input.wishlistId),
        eq(wishlistItems.giftId, input.giftId)
      )
    );
}

/**
 * Retrieves a specific wishlist with all its bookmarked gifts
 * @param wishlistId - The ID of the wishlist to retrieve
 * @returns The wishlist with its bookmarked gifts
 */
export async function getWishlist(db: DrizzleDatabase, wishlistId: number) {
  const wishlist = await db.query.wishlists.findFirst({
    where: eq(wishlists.id, wishlistId),
    with: {
      wishlistItems: {
        with: {
          gift: true,
        },
      },
    },
  });

  return wishlist;
}

/**
 * Retrieves all wishlists for a specific user with their bookmarked gifts
 * @param userId - The ID of the user
 * @returns An array of wishlists with their bookmarked gifts
 */
export async function getUserWishlists(db: DrizzleDatabase, userId: string) {
  const userWishlists = await db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    with: {
      wishlistItems: {
        with: {
          gift: true,
        },
      },
    },
  });

  return userWishlists;
}
