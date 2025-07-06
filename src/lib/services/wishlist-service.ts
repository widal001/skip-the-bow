import { wishlists, wishlistItems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { DrizzleDatabase } from "@/db";

export interface CreateWishlistInput {
  name: string;
  description?: string;
  userId: string;
}

export interface AddToWishlistInput {
  wishlistId: string;
  giftId: number;
}

export interface UpdateGiftWishlistsInput {
  userId: string;
  giftId: number;
  wishlistIds: string[];
}

export interface UpdateGiftWishlistsResult {
  wishlistIds: string[];
  added: string[];
  removed: string[];
}

export interface GetGiftWishlistsInput {
  userId: string;
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
export async function getWishlist(db: DrizzleDatabase, wishlistId: string) {
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

/**
 * Updates the wishlists for a specific gift using complete state replacement
 * The provided wishlistIds become the new state for the gift
 * @param input - The update parameters including user, gift, and desired wishlist IDs
 * @returns The result with final wishlist IDs and what was added/removed
 */
export async function updateGiftWishlists(
  db: DrizzleDatabase,
  input: UpdateGiftWishlistsInput
): Promise<UpdateGiftWishlistsResult> {
  // Validate that all wishlist IDs belong to the user
  if (input.wishlistIds.length > 0) {
    const userWishlists = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, input.userId),
          inArray(wishlists.id, input.wishlistIds)
        )
      );

    const validWishlistIds = userWishlists.map((w) => w.id);
    const invalidWishlistIds = input.wishlistIds.filter(
      (id) => !validWishlistIds.includes(id)
    );

    if (invalidWishlistIds.length > 0) {
      throw new Error(`Invalid wishlist IDs: ${invalidWishlistIds.join(", ")}`);
    }
  }

  // Get current wishlist items for this gift (only from user's wishlists)
  const currentWishlistItems = await db
    .select({ wishlistId: wishlistItems.wishlistId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .where(
      and(
        eq(wishlistItems.giftId, input.giftId),
        eq(wishlists.userId, input.userId)
      )
    );

  const currentWishlistIds = currentWishlistItems.map(
    (item) => item.wishlistId
  );

  // Calculate what needs to be added and removed
  const toAdd = input.wishlistIds.filter(
    (id) => !currentWishlistIds.includes(id)
  );
  const toRemove = currentWishlistIds.filter(
    (id) => !input.wishlistIds.includes(id)
  );

  // Remove items that are no longer in the desired state
  if (toRemove.length > 0) {
    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.giftId, input.giftId),
          inArray(wishlistItems.wishlistId, toRemove)
        )
      );
  }

  // Add new items
  if (toAdd.length > 0) {
    await db.insert(wishlistItems).values(
      toAdd.map((wishlistId) => ({
        wishlistId,
        giftId: input.giftId,
      }))
    );
  }

  return {
    wishlistIds: input.wishlistIds,
    added: toAdd,
    removed: toRemove,
  };
}

/**
 * Gets the current wishlist IDs for a specific gift for a user
 * @param input - The user and gift IDs
 * @returns Array of wishlist IDs that contain this gift
 */
export async function getGiftWishlists(
  db: DrizzleDatabase,
  input: GetGiftWishlistsInput
): Promise<string[]> {
  const items = await db
    .select({ wishlistId: wishlistItems.wishlistId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .where(
      and(
        eq(wishlistItems.giftId, input.giftId),
        eq(wishlists.userId, input.userId)
      )
    );

  return items.map((item: { wishlistId: string }) => item.wishlistId);
}
