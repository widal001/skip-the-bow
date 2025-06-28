import { map } from "nanostores";
import { signIn } from "auth-astro/client";

// ############################################################################
// $bookmarkStore
// ############################################################################

export const $bookmarkStore = map<Record<string, boolean>>(getInitialState());

// ############################################################################
// Store operations
// ############################################################################

/**
 * Check if a gift is bookmarked by the current user
 * @param giftSlug - The giftSlug of the gift to check
 * @returns True if the gift is bookmarked, false otherwise
 */
export function isBookmarked(giftSlug: string): boolean {
  return $bookmarkStore.get()[giftSlug] || false;
}

/**
 * Check if a gift has a bookmark key in the store
 * @param giftSlug - The giftSlug of the gift to check
 * @returns True if the gift has a bookmark key, false otherwise
 */
export function hasBookmarkKey(giftSlug: string): boolean {
  return giftSlug in $bookmarkStore.get();
}

/**
 * Check if a gift is bookmarked by the current user using the API
 *
 * This is a fallback function to check if a gift is bookmarked by the current user
 * if the store doesn't yet have the bookmark status for the gift.
 *
 * @param giftSlug - The giftSlug of the gift to check
 * @returns True if the gift is bookmarked, false otherwise
 */
export async function checkBookmarkStatus(giftSlug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarked/${giftSlug}`);
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, return false
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.isBookmarked;
  } catch (error) {
    console.error("Failed to check bookmark status:", error);
    return false;
  }
}

/**
 * Add a bookmark to the user's bookmarks and update the store
 * @param giftSlug - The slug of the gift to add to the bookmarks
 * @returns True if the bookmark was added, false otherwise
 */
export async function setBookmarked(giftSlug: string) {
  const success = await addBookmark(giftSlug);
  if (success) {
    $bookmarkStore.setKey(giftSlug, true);
  }
}

/**
 * Remove a bookmark from the user's bookmarks and update the store
 * @param giftSlug - The slug of the gift to remove from the bookmarks
 * @returns True if the bookmark was removed, false otherwise
 */
export async function setNotBookmarked(giftSlug: string) {
  const success = await removeBookmark(giftSlug);
  if (success) {
    $bookmarkStore.setKey(giftSlug, false);
  }
}

// ############################################################################
// Store initialization
// ############################################################################

// Initialize store from localStorage if available
function getInitialState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem("gift-bookmarks");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load bookmarks from localStorage:", error);
    return {};
  }
}

// Subscribe to store changes and persist to localStorage
if (typeof window !== "undefined") {
  $bookmarkStore.subscribe((state) => {
    try {
      localStorage.setItem("gift-bookmarks", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save bookmarks to localStorage:", error);
    }
  });
}

// ############################################################################
// Helper functions
// ############################################################################

/**
 * Add a bookmark to the user's bookmarks using the API
 * @param giftSlug - The giftSlug of the gift to add to the bookmarks
 * @returns True if the bookmark was added, false otherwise
 */
async function addBookmark(giftSlug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarks/${giftSlug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, redirect to login
        await signIn("github");
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to add bookmark:", error);
    return false;
  }
}

/**
 * Remove a bookmark from the user's bookmarks using the API
 * @param giftSlug - The giftSlug of the gift to remove from the bookmarks
 * @returns True if the bookmark was removed, false otherwise
 */
async function removeBookmark(giftSlug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarks/${giftSlug}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, redirect to login
        await signIn("github");
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to remove bookmark:", error);
    return false;
  }
}
