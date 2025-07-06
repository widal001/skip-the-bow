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
const fetchWishlistsFromAPI = async (): Promise<{
  wishlists: Wishlist[];
  originallySelectedIds: string[];
}> => {
  // TODO: Implement actual API call
  // Example: return await api.get('/wishlists');

  // Simulate API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        wishlists: [
          {
            id: "1",
            name: "Birthday Wishlist",
            description: "Things I want for my birthday",
          },
          { id: "2", name: "Christmas List", description: "Holiday wishes" },
        ],
        originallySelectedIds: ["1"], // Simulate that wishlist "1" was originally selected
      });
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

const removeWishlistItemsViaAPI = async (
  wishlistIds: string[],
  giftData: { slug?: string; name?: string }
): Promise<void> => {
  // TODO: Implement actual API call
  // Example: await api.delete('/wishlist-items', { wishlistIds, giftData });

  // Simulate API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Removing gift from wishlists:", { wishlistIds, giftData });
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
      const { wishlists, originallySelectedIds } =
        await fetchWishlistsFromAPI();
      wishlistDataActions.setWishlists(wishlists, originallySelectedIds);
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
    const currentState = $wishlistDataStore.get();
    const newlySelectedIds = wishlistDataActions.getNewlySelectedWishlistIds();
    const deselectedIds = wishlistDataActions.getDeselectedWishlistIds();

    if (!wishlistDataActions.hasChanges()) {
      wishlistMenuActions.setError("No changes to save");
      return false;
    }

    wishlistMenuActions.setLoading(true);
    wishlistMenuActions.clearError();

    try {
      // Add to newly selected wishlists
      if (newlySelectedIds.length > 0) {
        await createWishlistItemsViaAPI(newlySelectedIds, giftData || {});
      }

      // Remove from deselected wishlists
      if (deselectedIds.length > 0) {
        await removeWishlistItemsViaAPI(deselectedIds, giftData || {});
      }

      wishlistMenuActions.close();

      // Reset the state after successful save
      const originallySelected = Array.from(
        currentState.originallySelectedWishlistIds
      );
      wishlistDataActions.setWishlists(
        currentState.wishlists,
        originallySelected
      );

      // Dispatch custom event for backward compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-saved", {
            detail: {
              newlySelectedWishlistIds: newlySelectedIds,
              deselectedWishlistIds: deselectedIds,
              giftData,
            },
          })
        );
      }

      return true;
    } catch (error) {
      wishlistMenuActions.setError("Failed to save wishlist changes");
      console.error("Error saving wishlist changes:", error);
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
      checkbox.checked = wishlistDataActions.isWishlistSelected(wishlistId);

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
      const hasChanges = wishlistDataActions.hasChanges();
      saveButton.disabled = !hasChanges;
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
