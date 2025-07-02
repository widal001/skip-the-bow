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

// API functions (to be implemented based on your backend)
const fetchWishlistsFromAPI = async (): Promise<Wishlist[]> => {
  // TODO: Implement actual API call
  // Example: return await api.get('/wishlists');

  // Simulate API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          name: "Birthday Wishlist",
          description: "Things I want for my birthday",
        },
        { id: "2", name: "Christmas List", description: "Holiday wishes" },
      ]);
    }, 500);
  });
};

const createWishlistViaAPI = async (
  wishlistData: Omit<Wishlist, "id">
): Promise<Wishlist> => {
  // TODO: Implement actual API call
  // Example: return await api.post('/wishlists', wishlistData);

  // Simulate API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `wishlist-${Date.now()}`,
        ...wishlistData,
      });
    }, 300);
  });
};

const createWishlistItemsViaAPI = async (
  wishlistIds: string[],
  giftData: { slug?: string; name?: string }
): Promise<void> => {
  // TODO: Implement actual API call
  // Example: await api.post('/wishlist-items', { wishlistIds, giftData });

  // Simulate API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Adding gift to wishlists:", { wishlistIds, giftData });
      resolve();
    }, 500);
  });
};

// Compound actions focused on UX flows
export const wishlistActions = {
  // Start wishlist selection flow
  startWishlistSelection: async () => {
    wishlistMenuActions.open();
    wishlistMenuActions.setLoading(true);
    wishlistMenuActions.clearError();

    try {
      const wishlists = await fetchWishlistsFromAPI();
      wishlistDataActions.setWishlists(wishlists);
    } catch (error) {
      wishlistMenuActions.setError("Failed to load wishlists");
      console.error("Error fetching wishlists:", error);
    } finally {
      wishlistMenuActions.setLoading(false);
    }
  },

  // Start create form flow
  startCreateForm: () => {
    wishlistCreatorActions.openForm();
    wishlistCreatorActions.resetForm();
    wishlistCreatorActions.clearError();
  },

  // Cancel create form flow
  cancelCreateForm: () => {
    wishlistCreatorActions.closeForm();
    wishlistCreatorActions.resetForm();
    wishlistCreatorActions.clearError();
  },

  // Submit create form flow
  submitCreateForm: async () => {
    const formData = $wishlistCreatorStore.get().formData;

    if (!formData.name.trim()) {
      wishlistCreatorActions.setError("Wishlist name is required");
      return false;
    }

    wishlistCreatorActions.setLoading(true);
    wishlistCreatorActions.clearError();

    try {
      const newWishlist = await createWishlistViaAPI({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      wishlistDataActions.addWishlist(newWishlist);
      wishlistCreatorActions.closeForm();
      wishlistCreatorActions.resetForm();

      // Dispatch custom event for backward compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-created", {
            detail: newWishlist,
          })
        );
      }

      return true;
    } catch (error) {
      wishlistCreatorActions.setError("Failed to create wishlist");
      console.error("Error creating wishlist:", error);
      return false;
    } finally {
      wishlistCreatorActions.setLoading(false);
    }
  },

  // Update form data (for real-time form updates)
  updateFormData: (updates: Partial<WishlistFormData>) => {
    wishlistCreatorActions.updateFormData(updates);
  },

  // Select a specific wishlist
  selectWishlist: (wishlistId: string) => {
    wishlistDataActions.toggleWishlistSelection(wishlistId);
  },

  // Cancel wishlist selection flow
  cancelWishlistSelections: () => {
    wishlistDataActions.deselectAllWishlists();
    wishlistMenuActions.close();
    wishlistMenuActions.clearError();
  },

  // Save selected wishlists flow
  saveSelectedWishlists: async (giftData?: {
    slug?: string;
    name?: string;
  }) => {
    const selectedIds = $wishlistDataStore.get().selectedWishlistIds;

    if (selectedIds.length === 0) {
      wishlistMenuActions.setError("Please select at least one wishlist");
      return false;
    }

    wishlistMenuActions.setLoading(true);
    wishlistMenuActions.clearError();

    try {
      await createWishlistItemsViaAPI(selectedIds, giftData || {});
      wishlistMenuActions.close();
      wishlistDataActions.deselectAllWishlists();

      // Dispatch custom event for backward compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-saved", {
            detail: { wishlistIds: selectedIds, giftData },
          })
        );
      }

      return true;
    } catch (error) {
      wishlistMenuActions.setError("Failed to save to wishlists");
      console.error("Error saving to wishlists:", error);
      return false;
    } finally {
      wishlistMenuActions.setLoading(false);
    }
  },

  // Utility actions for edge cases
  reset: () => {
    wishlistMenuActions.reset();
    wishlistCreatorActions.reset();
    wishlistDataActions.reset();
  },

  // Direct access to individual actions for advanced use cases
  _actions: {
    menu: wishlistMenuActions,
    creator: wishlistCreatorActions,
    data: wishlistDataActions,
  },
};

// Event handlers for DOM integration
export const wishlistEventHandlers = {
  // Handle wishlist creation from form
  handleCreateWishlist: () => {
    return wishlistActions.submitCreateForm();
  },

  // Handle save action (add gift to selected wishlists)
  handleSave: (giftData?: { slug?: string; name?: string }) => {
    return wishlistActions.saveSelectedWishlists(giftData);
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
export const $wishlists = { get: () => $wishlistDataStore.get().wishlists };
export const $wishlistMenuOpen = { get: () => $wishlistMenuStore.get().isOpen };
