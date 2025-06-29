import { map } from "nanostores";
import { signIn } from "auth-astro/client";

// ############################################################################
// $bookmarkStore
// ############################################################################

export const $bookmarkStore = map<Record<string, boolean>>(getInitialState());

// Fetch bookmark data from localStorage if available
function getInitialState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem("gift-bookmarks");
    const initialState = stored ? JSON.parse(stored) : {};

    return initialState;
  } catch (error) {
    console.error("Failed to load bookmarks from localStorage:", error);
    return {};
  }
}

// Set up localStorage subscription only once during initialization
$bookmarkStore.subscribe((state) => {
  try {
    localStorage.setItem("gift-bookmarks", JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save bookmarks to localStorage:", error);
  }
});

// ############################################################################
// Public store operations
// ############################################################################

/**
 * Initialize bookmark status for a gift, checking API if not in local store
 * @param giftSlug - The slug of the gift to initialize
 * @returns Promise that resolves when initialization is complete
 */
export async function addBookmarkStatusToStore(
  giftSlug: string
): Promise<void> {
  // If we already have the status in the store, no need to check the API
  if (giftSlug in $bookmarkStore.get()) {
    return;
  }

  // Otherwise, check the API for the bookmark status
  try {
    const apiBookmarkStatus = await checkBookmarkStatusViaAPI(giftSlug);
    $bookmarkStore.setKey(giftSlug, apiBookmarkStatus);
  } catch (error) {
    console.error("Failed to initialize bookmark status:", error);
    // Set to false as fallback
    $bookmarkStore.setKey(giftSlug, false);
  }
}

/**
 * Toggle bookmark status for a gift
 * @param giftSlug - The slug of the gift to toggle
 * @returns Promise that resolves when toggle is complete
 */
export async function toggleBookmark(giftSlug: string): Promise<void> {
  const currentlyBookmarked = isBookmarked(giftSlug);

  if (currentlyBookmarked) {
    await setNotBookmarked(giftSlug);
  } else {
    await setBookmarked(giftSlug);
  }
}

// ############################################################################
// Private store operations
// ############################################################################

/**
 * Check if a gift is bookmarked by the current user
 * @param giftSlug - The giftSlug of the gift to check
 * @returns True if the gift is bookmarked, false otherwise
 */
function isBookmarked(giftSlug: string): boolean {
  return $bookmarkStore.get()[giftSlug] || false;
}

/**
 * Add a bookmark to the user's bookmarks and update the store
 * @param giftSlug - The slug of the gift to add to the bookmarks
 * @returns True if the bookmark was added, false otherwise
 */
async function setBookmarked(giftSlug: string) {
  const success = await addBookmarkViaAPI(giftSlug);
  if (success) {
    $bookmarkStore.setKey(giftSlug, true);
  }
}

/**
 * Remove a bookmark from the user's bookmarks and update the store
 * @param giftSlug - The slug of the gift to remove from the bookmarks
 * @returns True if the bookmark was removed, false otherwise
 */
async function setNotBookmarked(giftSlug: string) {
  const success = await removeBookmarkViaAPI(giftSlug);
  if (success) {
    $bookmarkStore.setKey(giftSlug, false);
  }
}

// ############################################################################
// Helper functions
// ############################################################################

/**
 * Check if a gift is bookmarked by the current user using the API
 *
 * This is a fallback function to check if a gift is bookmarked by the current user
 * if the store doesn't yet have the bookmark status for the gift.
 *
 * @param giftSlug - The giftSlug of the gift to check
 * @returns True if the gift is bookmarked, false otherwise
 */
export async function checkBookmarkStatusViaAPI(
  giftSlug: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarked/${giftSlug}`);
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, return false
        console.log("User not authenticated");
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
 * Add a bookmark to the user's bookmarks using the API
 * @param giftSlug - The giftSlug of the gift to add to the bookmarks
 * @returns True if the bookmark was added, false otherwise
 */
async function addBookmarkViaAPI(giftSlug: string): Promise<boolean> {
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
        console.log("User not authenticated, redirecting to login");
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
async function removeBookmarkViaAPI(giftSlug: string): Promise<boolean> {
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
        console.log("User not authenticated, redirecting to login");
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
