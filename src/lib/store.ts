import { map } from "nanostores";

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

function setBookmarked(slug: string) {
  $bookmarkStore.setKey(slug, true);
}

function setNotBookmarked(slug: string) {
  $bookmarkStore.setKey(slug, false);
}

export { isBookmarked, setBookmarked, setNotBookmarked };
