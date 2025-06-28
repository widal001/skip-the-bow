import { map } from "nanostores";
import { signIn } from "auth-astro/client";

// Initialize store from localStorage if available
const getInitialState = (): Record<string, boolean> => {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem("gift-bookmarks");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load bookmarks from localStorage:", error);
    return {};
  }
};

export const $bookmarkStore = map<Record<string, boolean>>(getInitialState());

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

function isBookmarked(slug: string): boolean {
  return $bookmarkStore.get()[slug] || false;
}

function hasBookmarkKey(slug: string): boolean {
  return slug in $bookmarkStore.get();
}

// API functions for bookmark operations
async function checkBookmarkStatus(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarked/${slug}`);
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

async function addBookmark(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarks/${slug}`, {
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

async function removeBookmark(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/bookmarks/${slug}`, {
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

async function setBookmarked(slug: string) {
  const success = await addBookmark(slug);
  if (success) {
    $bookmarkStore.setKey(slug, true);
  }
}

async function setNotBookmarked(slug: string) {
  const success = await removeBookmark(slug);
  if (success) {
    $bookmarkStore.setKey(slug, false);
  }
}

export {
  isBookmarked,
  hasBookmarkKey,
  setBookmarked,
  setNotBookmarked,
  checkBookmarkStatus,
  addBookmark,
  removeBookmark,
};
