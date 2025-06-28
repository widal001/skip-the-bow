import { bookmarks } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { DrizzleDatabase } from "@/db";

export interface BookmarkInput {
  userId: string;
  giftId: number;
}

/**
 * Adds a gift to a user's bookmarks
 * @param input - The user and gift IDs
 * @returns The created bookmark
 */
export async function addGiftToBookmarks(
  db: DrizzleDatabase,
  input: BookmarkInput
) {
  const existingBookmark = await getBookmark(db, input.userId, input.giftId);

  if (existingBookmark) {
    return existingBookmark;
  }
  const [bookmark] = await db
    .insert(bookmarks)
    .values({
      userId: input.userId,
      giftId: input.giftId,
    })
    .returning();

  return bookmark;
}

/**
 * Removes a gift from a user's bookmarks
 * @param input - The wishlist and gift IDs
 */
export async function removeGiftFromBookmarks(
  db: DrizzleDatabase,
  input: BookmarkInput
) {
  const existingBookmark = await getBookmark(db, input.userId, input.giftId);

  if (!existingBookmark) {
    return;
  }

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, input.userId),
        eq(bookmarks.giftId, input.giftId)
      )
    );
}

/**
 * Checks if a gift is bookmarked by a user
 * @param userId - The ID of the user
 * @param giftId - The ID of the gift
 * @returns True if the gift is bookmarked, false otherwise
 */
export async function isGiftBookmarked(
  db: DrizzleDatabase,
  userId: string,
  giftId: number
) {
  const bookmark = await getBookmark(db, userId, giftId);

  return !!bookmark;
}

/**
 * Retrieves a specific bookmark
 * @param db - The database instance
 * @param userId - The ID of the user
 * @param giftId - The ID of the gift
 * @returns The bookmark
 */
export async function getBookmark(
  db: DrizzleDatabase,
  userId: string,
  giftId: number
) {
  const bookmark = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.giftId, giftId)),
  });

  return bookmark;
}

/**
 * Retrieves a specific user's bookmarks
 * @param userId - The ID of the user to retrieve
 * @returns The user's bookmarks
 */
export async function getUserBookmarks(db: DrizzleDatabase, userId: string) {
  const userBookmarks = await db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, userId),
    with: {
      gift: true,
    },
    orderBy: [asc(bookmarks.createdAt)],
  });

  return userBookmarks || [];
}
