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

// API functions using actual endpoints
const fetchWishlistsFromAPI = async (): Promise<{
  wishlists: Wishlist[];
  originallySelectedIds: string[];
}> => {
  const response = await fetch("/api/user/wishlists");

  if (!response.ok) {
    throw new Error(`Failed to fetch wishlists: ${response.statusText}`);
  }

  const { wishlists } = await response.json();

  // For now, return empty originallySelectedIds since we don't have gift context
  // This will be updated when we have gift-specific wishlist fetching
  return {
    wishlists: wishlists.map((wishlist: any) => ({
      id: wishlist.id,
      name: wishlist.name,
      description: wishlist.description,
    })),
    originallySelectedIds: [],
  };
};

const createWishlistViaAPI = async (
  wishlistData: Omit<Wishlist, "id">
): Promise<Wishlist> => {
  const response = await fetch("/api/user/wishlists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(wishlistData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create wishlist: ${response.statusText}`);
  }

  const { wishlist } = await response.json();
  return {
    id: wishlist.id,
    name: wishlist.name,
    description: wishlist.description,
  };
};

const fetchGiftWishlistsFromAPI = async (
  giftSlug: string
): Promise<string[]> => {
  const response = await fetch(`/api/user/gifts/${giftSlug}/wishlists`);

  if (!response.ok) {
    throw new Error(`Failed to fetch gift wishlists: ${response.statusText}`);
  }

  const { wishlistIds } = await response.json();
  return wishlistIds;
};

const updateGiftWishlistsViaAPI = async (
  giftSlug: string,
  wishlistIds: string[]
): Promise<{ wishlistIds: string[]; added: string[]; removed: string[] }> => {
  const response = await fetch(`/api/user/gifts/${giftSlug}/wishlists`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wishlistIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update gift wishlists: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    wishlistIds: result.wishlistIds,
    added: result.added,
    removed: result.removed,
  };
};

// Compound actions focused on UX flows
export const wishlistActions = {
  // Start wishlist selection flow
  startWishlistSelection: async (giftSlug?: string) => {
    wishlistMenuActions.open();
    wishlistMenuActions.setLoading(true);
    wishlistMenuActions.clearError();

    try {
      const { wishlists } = await fetchWishlistsFromAPI();

      // If we have a gift slug, fetch the current wishlist state for this gift
      let originallySelectedIds: string[] = [];
      if (giftSlug) {
        try {
          originallySelectedIds = await fetchGiftWishlistsFromAPI(giftSlug);
        } catch (error) {
          console.warn(
            "Could not fetch gift wishlists, using empty selection:",
            error
          );
        }
      }

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
    if (!giftData?.slug) {
      wishlistMenuActions.setError(
        "Gift slug is required to save wishlist changes"
      );
      return false;
    }

    const currentState = $wishlistDataStore.get();
    const selectedWishlistIds = Array.from(currentState.selectedWishlistIds);

    if (!wishlistDataActions.hasChanges()) {
      wishlistMenuActions.setError("No changes to save");
      return false;
    }

    wishlistMenuActions.setLoading(true);
    wishlistMenuActions.clearError();

    try {
      // Update the gift's wishlists using the API
      const result = await updateGiftWishlistsViaAPI(
        giftData.slug,
        selectedWishlistIds
      );

      wishlistMenuActions.close();

      // Reset the state after successful save
      wishlistDataActions.setWishlists(
        currentState.wishlists,
        selectedWishlistIds
      );

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

// Export stores for direct access when needed
export { $wishlistMenuStore, $wishlistCreatorStore, $wishlistDataStore };

// Export individual actions for granular control
export { wishlistMenuActions, wishlistCreatorActions, wishlistDataActions };
