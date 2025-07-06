import { describe, it, expect, beforeEach } from "vitest";
import {
  $wishlistDataStore,
  wishlistDataActions,
  type Wishlist,
} from "../wishlist-data-store";

describe("WishlistDataStore", () => {
  beforeEach(() => {
    wishlistDataActions.reset();
  });

  describe("setWishlists", () => {
    it("should set wishlists with originally selected IDs", () => {
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
        { id: "3", name: "Wishlist 3" },
      ];
      const originallySelectedIds = ["1", "3"];

      wishlistDataActions.setWishlists(wishlists, originallySelectedIds);

      const state = $wishlistDataStore.get();
      expect(state.wishlists).toEqual(wishlists);
      expect(Array.from(state.selectedWishlistIds)).toEqual(["1", "3"]);
      expect(Array.from(state.originallySelectedWishlistIds)).toEqual([
        "1",
        "3",
      ]);
    });

    it("should initialize with empty sets when no originally selected IDs", () => {
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
      ];

      wishlistDataActions.setWishlists(wishlists);

      const state = $wishlistDataStore.get();
      expect(state.wishlists).toEqual(wishlists);
      expect(Array.from(state.selectedWishlistIds)).toEqual([]);
      expect(Array.from(state.originallySelectedWishlistIds)).toEqual([]);
    });
  });

  describe("selection actions", () => {
    beforeEach(() => {
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
        { id: "3", name: "Wishlist 3" },
      ];
      wishlistDataActions.setWishlists(wishlists, ["1", "2"]);
    });

    it("should select a wishlist", () => {
      wishlistDataActions.selectWishlist("3");

      const state = $wishlistDataStore.get();
      expect(Array.from(state.selectedWishlistIds)).toEqual(["1", "2", "3"]);
    });

    it("should deselect a wishlist", () => {
      wishlistDataActions.deselectWishlist("1");

      const state = $wishlistDataStore.get();
      expect(Array.from(state.selectedWishlistIds)).toEqual(["2"]);
    });

    it("should toggle wishlist selection", () => {
      // Deselect an originally selected wishlist
      wishlistDataActions.toggleWishlistSelection("1");
      expect(wishlistDataActions.isWishlistSelected("1")).toBe(false);

      // Select it again
      wishlistDataActions.toggleWishlistSelection("1");
      expect(wishlistDataActions.isWishlistSelected("1")).toBe(true);
    });
  });

  describe("utility methods", () => {
    beforeEach(() => {
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
        { id: "3", name: "Wishlist 3" },
      ];
      wishlistDataActions.setWishlists(wishlists, ["1", "2"]);
    });

    it("should check if wishlist is selected", () => {
      expect(wishlistDataActions.isWishlistSelected("1")).toBe(true);
      expect(wishlistDataActions.isWishlistSelected("3")).toBe(false);
    });

    it("should check if wishlist was originally selected", () => {
      expect(wishlistDataActions.wasOriginallySelected("1")).toBe(true);
      expect(wishlistDataActions.wasOriginallySelected("3")).toBe(false);
    });

    it("should detect changes", () => {
      // No changes initially
      expect(wishlistDataActions.hasChanges()).toBe(false);

      // Select a new wishlist
      wishlistDataActions.selectWishlist("3");
      expect(wishlistDataActions.hasChanges()).toBe(true);

      // Reset and deselect an originally selected wishlist
      wishlistDataActions.reset();
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
      ];
      wishlistDataActions.setWishlists(wishlists, ["1", "2"]);
      wishlistDataActions.deselectWishlist("1");
      expect(wishlistDataActions.hasChanges()).toBe(true);
    });

    it("should get newly selected and deselected IDs using set math", () => {
      // Deselect an originally selected wishlist
      wishlistDataActions.deselectWishlist("1");
      // Select a new wishlist
      wishlistDataActions.selectWishlist("3");

      expect(wishlistDataActions.getNewlySelectedWishlistIds()).toEqual(["3"]);
      expect(wishlistDataActions.getDeselectedWishlistIds()).toEqual(["1"]);
      expect(wishlistDataActions.getSelectedWishlistIds()).toEqual(["2", "3"]);
    });

    it("should handle complex selection scenarios", () => {
      // Start with wishlists 1 and 2 selected
      // Deselect 1, select 3, then reselect 1
      wishlistDataActions.deselectWishlist("1");
      wishlistDataActions.selectWishlist("3");
      wishlistDataActions.selectWishlist("1");

      // Now we have 1, 2, 3 selected, but only 3 is newly selected
      expect(wishlistDataActions.getNewlySelectedWishlistIds()).toEqual(["3"]);
      expect(wishlistDataActions.getDeselectedWishlistIds()).toEqual([]);
      expect(wishlistDataActions.getSelectedWishlistIds()).toEqual([
        "1",
        "2",
        "3",
      ]);
    });
  });

  describe("bulk actions", () => {
    beforeEach(() => {
      const wishlists: Wishlist[] = [
        { id: "1", name: "Wishlist 1" },
        { id: "2", name: "Wishlist 2" },
        { id: "3", name: "Wishlist 3" },
      ];
      wishlistDataActions.setWishlists(wishlists, ["1"]);
    });

    it("should select all wishlists", () => {
      wishlistDataActions.selectAllWishlists();

      const state = $wishlistDataStore.get();
      expect(Array.from(state.selectedWishlistIds)).toEqual(["1", "2", "3"]);
      expect(wishlistDataActions.getNewlySelectedWishlistIds()).toEqual([
        "2",
        "3",
      ]);
      expect(wishlistDataActions.getDeselectedWishlistIds()).toEqual([]);
    });

    it("should deselect all wishlists", () => {
      wishlistDataActions.deselectAllWishlists();

      const state = $wishlistDataStore.get();
      expect(Array.from(state.selectedWishlistIds)).toEqual([]);
      expect(wishlistDataActions.getNewlySelectedWishlistIds()).toEqual([]);
      expect(wishlistDataActions.getDeselectedWishlistIds()).toEqual(["1"]);
    });
  });
});
