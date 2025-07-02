import {
  $wishlistMenuStore,
  wishlistMenuActions,
  type WishlistMenuState,
} from "./wishlist-menu-store";
import {
  $wishlistCreatorStore,
  wishlistCreatorActions,
  type WishlistCreatorState,
  type WishlistFormData,
} from "./wishlist-creator-store";
import {
  $wishlistDataStore,
  wishlistDataActions,
  type WishlistDataState,
  type Wishlist,
} from "./wishlist-data-store";

// Combined state interface for convenience
export interface WishlistStoreState {
  menu: WishlistMenuState;
  creator: WishlistCreatorState;
  data: WishlistDataState;
}

// Computed values
export const getWishlists = () => $wishlistDataStore.get().wishlists;
export const getSelectedWishlistIds = () =>
  $wishlistDataStore.get().selectedWishlistIds;
export const getWishlistMenuOpen = () => $wishlistMenuStore.get().isOpen;
export const getCreatorFormOpen = () => $wishlistCreatorStore.get().isFormOpen;
export const getFormData = () => $wishlistCreatorStore.get().formData;
export const getIsLoading = () => $wishlistMenuStore.get().isLoading;
export const getError = () =>
  $wishlistMenuStore.get().error || $wishlistCreatorStore.get().error;

export const getSelectedWishlists = () => {
  const state = $wishlistDataStore.get();
  return state.wishlists.filter((wishlist) =>
    state.selectedWishlistIds.includes(wishlist.id)
  );
};

export const getHasSelectedWishlists = () => {
  return $wishlistDataStore.get().selectedWishlistIds.length > 0;
};

export const getHasWishlists = () => {
  return $wishlistDataStore.get().wishlists.length > 0;
};

// Combined actions
export const wishlistActions = {
  // Menu actions
  openMenu: () => {
    wishlistMenuActions.open();
  },

  closeMenu: () => {
    wishlistMenuActions.close();
    // Reset form when closing menu
    wishlistCreatorActions.resetForm();
  },

  // Creator form actions
  openCreatorForm: () => {
    wishlistCreatorActions.openForm();
  },

  closeCreatorForm: () => {
    wishlistCreatorActions.closeForm();
  },

  toggleCreatorForm: () => {
    wishlistCreatorActions.toggleForm();
  },

  // Form data actions
  updateFormData: (updates: Partial<WishlistFormData>) => {
    wishlistCreatorActions.updateFormData(updates);
  },

  resetForm: () => {
    wishlistCreatorActions.resetForm();
  },

  // Wishlist data actions
  setWishlists: (wishlists: Wishlist[]) => {
    wishlistDataActions.setWishlists(wishlists);
  },

  addWishlist: (wishlist: Wishlist) => {
    wishlistDataActions.addWishlist(wishlist);
  },

  removeWishlist: (wishlistId: string) => {
    wishlistDataActions.removeWishlist(wishlistId);
  },

  updateWishlist: (wishlistId: string, updates: Partial<Wishlist>) => {
    wishlistDataActions.updateWishlist(wishlistId, updates);
  },

  // Selection actions
  selectWishlist: (wishlistId: string) => {
    wishlistDataActions.selectWishlist(wishlistId);
  },

  deselectWishlist: (wishlistId: string) => {
    wishlistDataActions.deselectWishlist(wishlistId);
  },

  toggleWishlistSelection: (wishlistId: string) => {
    wishlistDataActions.toggleWishlistSelection(wishlistId);
  },

  selectAllWishlists: () => {
    wishlistDataActions.selectAllWishlists();
  },

  deselectAllWishlists: () => {
    wishlistDataActions.deselectAllWishlists();
  },

  // Loading and error actions
  setLoading: (isLoading: boolean) => {
    wishlistMenuActions.setLoading(isLoading);
  },

  setError: (error: string | null) => {
    wishlistMenuActions.setError(error);
    wishlistCreatorActions.setError(error);
  },

  clearError: () => {
    wishlistMenuActions.clearError();
    wishlistCreatorActions.clearError();
  },

  // Utility actions
  reset: () => {
    wishlistMenuActions.reset();
    wishlistCreatorActions.reset();
    wishlistDataActions.reset();
  },
};

// Event handlers for DOM integration
export const wishlistEventHandlers = {
  // Handle wishlist creation from form
  handleCreateWishlist: () => {
    const formData = $wishlistCreatorStore.get().formData;

    if (!formData.name.trim()) {
      wishlistCreatorActions.setError("Wishlist name is required");
      return false;
    }

    const newWishlist: Wishlist = {
      id: `wishlist-${Date.now()}`, // Temporary ID - would be replaced by server
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    wishlistDataActions.addWishlist(newWishlist);
    wishlistCreatorActions.closeForm();
    wishlistCreatorActions.clearError();

    // Dispatch custom event for backward compatibility
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("wishlist-created", {
          detail: newWishlist,
        })
      );
    }

    return true;
  },

  // Handle save action (add gift to selected wishlists)
  handleSave: (giftData?: { slug?: string; name?: string }) => {
    const selectedIds = $wishlistDataStore.get().selectedWishlistIds;

    if (selectedIds.length === 0) {
      wishlistMenuActions.setError("Please select at least one wishlist");
      return false;
    }

    // Here you would typically make an API call to add the gift to wishlists
    wishlistMenuActions.setLoading(true);

    // Simulate API call
    setTimeout(() => {
      wishlistMenuActions.setLoading(false);
      wishlistMenuActions.close();

      // Dispatch custom event for backward compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-saved", {
            detail: { wishlistIds: selectedIds, giftData },
          })
        );
      }
    }, 500);

    return true;
  },
};

// DOM integration helpers
export const wishlistDOMHelpers = {
  // Initialize wishlist selector checkboxes
  initializeCheckboxes: () => {
    if (typeof window === "undefined") return;

    const checkboxes = document.querySelectorAll(
      ".wishlist-selector__checkbox"
    ) as NodeListOf<HTMLInputElement>;

    checkboxes.forEach((checkbox) => {
      const wishlistId = checkbox.value;

      // Set initial state
      checkbox.checked = $wishlistDataStore
        .get()
        .selectedWishlistIds.includes(wishlistId);

      // Add event listener
      checkbox.addEventListener("change", () => {
        wishlistDataActions.toggleWishlistSelection(wishlistId);
      });
    });
  },

  // Update save button state
  updateSaveButton: () => {
    if (typeof window === "undefined") return;

    const saveButton = document.getElementById(
      "wishlist-menu-save"
    ) as HTMLButtonElement;
    if (saveButton) {
      const hasSelected =
        $wishlistDataStore.get().selectedWishlistIds.length > 0;
      saveButton.disabled = !hasSelected;
    }
  },

  // Sync DOM with store state
  syncDOMWithStore: () => {
    wishlistDOMHelpers.initializeCheckboxes();
    wishlistDOMHelpers.updateSaveButton();
  },
};

// Subscribe to store changes to update DOM
if (typeof window !== "undefined") {
  $wishlistDataStore.subscribe(() => {
    wishlistDOMHelpers.syncDOMWithStore();
  });
}

// Export stores for direct access when needed
export { $wishlistMenuStore, $wishlistCreatorStore, $wishlistDataStore };

// Export individual actions for granular control
export { wishlistMenuActions, wishlistCreatorActions, wishlistDataActions };

// Export aliases for backward compatibility
export const $wishlists = { get: getWishlists };
export const $wishlistMenuOpen = { get: getWishlistMenuOpen };
