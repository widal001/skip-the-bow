import { describe, it, expect, beforeEach, vi } from "vitest";
import { $bookmarkStore, isBookmarked } from "@/lib/stores/bookmark-store";

// Mock fetch for testing
global.fetch = vi.fn();

describe("Bookmark Store", () => {
  beforeEach(() => {
    // Reset store before each test
    $bookmarkStore.set({});

    // Clear all mocks
    vi.clearAllMocks();
  });

  it("should initialize with empty bookmarks", () => {
    const state = $bookmarkStore.get();
    expect(state).toEqual({});
  });

  it("should check if item is bookmarked", () => {
    // Initially not bookmarked
    expect(isBookmarked("test-slug")).toBe(false);

    // Add bookmark
    $bookmarkStore.setKey("test-slug", true);
    expect(isBookmarked("test-slug")).toBe(true);
  });

  it("should handle multiple bookmarks", () => {
    $bookmarkStore.setKey("slug1", true);
    $bookmarkStore.setKey("slug2", false);
    $bookmarkStore.setKey("slug3", true);

    expect(isBookmarked("slug1")).toBe(true);
    expect(isBookmarked("slug2")).toBe(false);
    expect(isBookmarked("slug3")).toBe(true);
    expect(isBookmarked("slug4")).toBe(false);
  });
});
