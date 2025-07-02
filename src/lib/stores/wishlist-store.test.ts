import { describe, it, expect, beforeEach } from "vitest";
import {
  $wishlistMenuStore,
  $wishlistCreatorStore,
  $wishlistDataStore,
  wishlistActions,
  wishlistEventHandlers,
  getWishlists,
  getSelectedWishlistIds,
  getWishlistMenuOpen,
  getHasSelectedWishlists,
  getHasWishlists,
  getSelectedWishlists,
  getIsLoading,
  getError,
} from "./wishlist/useWishlistStore";
import type { Wishlist } from "./wishlist/wishlist-data-store";

describe("Wishlist Store", () => {
  beforeEach(() => {
    // Reset all stores before each test
    wishlistActions.reset();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const menuState = $wishlistMenuStore.get();
      const creatorState = $wishlistCreatorStore.get();
      const dataState = $wishlistDataStore.get();

      expect(dataState.wishlists).toEqual([]);
      expect(dataState.selectedWishlistIds).toEqual([]);
      expect(menuState.isOpen).toBe(false);
      expect(creatorState.isFormOpen).toBe(false);
      expect(creatorState.formData).toEqual({ name: "", description: "" });
      expect(menuState.isLoading).toBe(false);
      expect(menuState.error).toBeNull();
      expect(creatorState.error).toBeNull();
    });
  });

  describe("Menu Actions", () => {
    it("should open and close menu", () => {
      expect(getWishlistMenuOpen()).toBe(false);

      wishlistActions.openMenu();
      expect(getWishlistMenuOpen()).toBe(true);

      wishlistActions.closeMenu();
      expect(getWishlistMenuOpen()).toBe(false);
    });

    it("should reset form when closing menu", () => {
      // Set some form data
      wishlistActions.updateFormData({
        name: "Test",
        description: "Test desc",
      });

      wishlistActions.closeMenu();

      const formData = $wishlistCreatorStore.get().formData;
      expect(formData.name).toBe("");
      expect(formData.description).toBe("");
    });
  });

  describe("Creator Form Actions", () => {
    it("should toggle creator form", () => {
      expect($wishlistCreatorStore.get().isFormOpen).toBe(false);

      wishlistActions.toggleCreatorForm();
      expect($wishlistCreatorStore.get().isFormOpen).toBe(true);

      wishlistActions.toggleCreatorForm();
      expect($wishlistCreatorStore.get().isFormOpen).toBe(false);
    });

    it("should reset form when closing creator form", () => {
      wishlistActions.updateFormData({
        name: "Test",
        description: "Test desc",
      });

      wishlistActions.closeCreatorForm();

      const formData = $wishlistCreatorStore.get().formData;
      expect(formData.name).toBe("");
      expect(formData.description).toBe("");
    });
  });

  describe("Wishlist Actions", () => {
    const testWishlist: Wishlist = {
      id: "test-1",
      name: "Test Wishlist",
      description: "Test Description",
    };

    it("should add wishlist", () => {
      wishlistActions.addWishlist(testWishlist);

      const wishlists = getWishlists();
      expect(wishlists).toHaveLength(1);
      expect(wishlists[0]).toEqual(testWishlist);
    });

    it("should auto-select newly created wishlist", () => {
      wishlistActions.addWishlist(testWishlist);

      const selectedIds = getSelectedWishlistIds();
      expect(selectedIds).toContain(testWishlist.id);
    });

    it("should remove wishlist", () => {
      wishlistActions.addWishlist(testWishlist);
      wishlistActions.removeWishlist(testWishlist.id);

      const wishlists = getWishlists();
      expect(wishlists).toHaveLength(0);
    });

    it("should remove from selected when deleting wishlist", () => {
      wishlistActions.addWishlist(testWishlist);
      expect(getSelectedWishlistIds()).toContain(testWishlist.id);

      wishlistActions.removeWishlist(testWishlist.id);
      expect(getSelectedWishlistIds()).not.toContain(testWishlist.id);
    });

    it("should update wishlist", () => {
      wishlistActions.addWishlist(testWishlist);
      wishlistActions.updateWishlist(testWishlist.id, { name: "Updated Name" });

      const wishlists = getWishlists();
      expect(wishlists[0].name).toBe("Updated Name");
      expect(wishlists[0].description).toBe("Test Description"); // Unchanged
    });
  });

  describe("Selection Actions", () => {
    const wishlist1: Wishlist = { id: "1", name: "Wishlist 1" };
    const wishlist2: Wishlist = { id: "2", name: "Wishlist 2" };

    beforeEach(() => {
      wishlistActions.addWishlist(wishlist1);
      wishlistActions.addWishlist(wishlist2);
    });

    it("should select and deselect wishlists", () => {
      wishlistActions.selectWishlist(wishlist1.id);
      expect(getSelectedWishlistIds()).toContain(wishlist1.id);

      wishlistActions.deselectWishlist(wishlist1.id);
      expect(getSelectedWishlistIds()).not.toContain(wishlist1.id);
    });

    it("should toggle wishlist selection", () => {
      wishlistActions.toggleWishlistSelection(wishlist1.id);
      expect(getSelectedWishlistIds()).toContain(wishlist1.id);

      wishlistActions.toggleWishlistSelection(wishlist1.id);
      expect(getSelectedWishlistIds()).not.toContain(wishlist1.id);
    });

    it("should select all wishlists", () => {
      wishlistActions.selectAllWishlists();

      const selectedIds = getSelectedWishlistIds();
      expect(selectedIds).toContain(wishlist1.id);
      expect(selectedIds).toContain(wishlist2.id);
    });

    it("should deselect all wishlists", () => {
      wishlistActions.selectAllWishlists();
      wishlistActions.deselectAllWishlists();

      expect(getSelectedWishlistIds()).toHaveLength(0);
    });
  });

  describe("Computed Values", () => {
    const wishlist1: Wishlist = { id: "1", name: "Wishlist 1" };
    const wishlist2: Wishlist = { id: "2", name: "Wishlist 2" };

    it("should return correct selected wishlists", () => {
      wishlistActions.addWishlist(wishlist1);
      wishlistActions.addWishlist(wishlist2);
      wishlistActions.selectWishlist(wishlist1.id);

      const selectedWishlists = getSelectedWishlists();
      expect(selectedWishlists).toHaveLength(1);
      expect(selectedWishlists[0]).toEqual(wishlist1);
    });

    it("should return correct has selected state", () => {
      expect(getHasSelectedWishlists()).toBe(false);

      wishlistActions.addWishlist(wishlist1);
      wishlistActions.selectWishlist(wishlist1.id);

      expect(getHasSelectedWishlists()).toBe(true);
    });

    it("should return correct has wishlists state", () => {
      expect(getHasWishlists()).toBe(false);

      wishlistActions.addWishlist(wishlist1);

      expect(getHasWishlists()).toBe(true);
    });
  });

  describe("Event Handlers", () => {
    it("should handle create wishlist with valid data", () => {
      wishlistActions.updateFormData({
        name: "New Wishlist",
        description: "Description",
      });

      const result = wishlistEventHandlers.handleCreateWishlist();

      expect(result).toBe(true);
      expect(getWishlists()).toHaveLength(1);
      expect(getWishlists()[0].name).toBe("New Wishlist");
      expect(getWishlists()[0].description).toBe("Description");
      expect($wishlistCreatorStore.get().isFormOpen).toBe(false);
    });

    it("should handle create wishlist with invalid data", () => {
      wishlistActions.updateFormData({ name: "", description: "Description" });

      const result = wishlistEventHandlers.handleCreateWishlist();

      expect(result).toBe(false);
      expect(getWishlists()).toHaveLength(0);
      expect($wishlistCreatorStore.get().error).toBe(
        "Wishlist name is required"
      );
    });

    it("should handle save with selected wishlists", () => {
      const wishlist: Wishlist = { id: "1", name: "Test" };
      wishlistActions.addWishlist(wishlist);
      wishlistActions.selectWishlist(wishlist.id);

      const result = wishlistEventHandlers.handleSave({
        slug: "test-gift",
        name: "Test Gift",
      });

      expect(result).toBe(true);
      expect($wishlistMenuStore.get().isLoading).toBe(true);
    });

    it("should handle save without selected wishlists", () => {
      const result = wishlistEventHandlers.handleSave({
        slug: "test-gift",
        name: "Test Gift",
      });

      expect(result).toBe(false);
      expect($wishlistMenuStore.get().error).toBe(
        "Please select at least one wishlist"
      );
    });
  });

  describe("Loading and Error States", () => {
    it("should set and clear loading state", () => {
      wishlistActions.setLoading(true);
      expect(getIsLoading()).toBe(true);

      wishlistActions.setLoading(false);
      expect(getIsLoading()).toBe(false);
    });

    it("should set and clear error state", () => {
      wishlistActions.setError("Test error");
      expect(getError()).toBe("Test error");

      wishlistActions.clearError();
      expect(getError()).toBeNull();
    });
  });

  describe("Store Separation", () => {
    it("should maintain separate state between stores", () => {
      // Menu state
      wishlistActions.openMenu();
      expect($wishlistMenuStore.get().isOpen).toBe(true);
      expect($wishlistCreatorStore.get().isFormOpen).toBe(false);

      // Creator state
      wishlistActions.openCreatorForm();
      expect($wishlistCreatorStore.get().isFormOpen).toBe(true);
      expect($wishlistDataStore.get().wishlists).toHaveLength(0);

      // Data state
      const wishlist: Wishlist = { id: "1", name: "Test" };
      wishlistActions.addWishlist(wishlist);
      expect($wishlistDataStore.get().wishlists).toHaveLength(1);
      expect($wishlistMenuStore.get().isOpen).toBe(true); // Unchanged
    });
  });
});
