import { map } from "nanostores";

export interface Wishlist {
  id: string;
  name: string;
  description?: string;
  isSelected?: boolean;
}

export interface WishlistDataState {
  wishlists: Wishlist[];
  selectedWishlistIds: Set<string>;
  originallySelectedWishlistIds: Set<string>;
}

const initialState: WishlistDataState = {
  wishlists: [],
  selectedWishlistIds: new Set(),
  originallySelectedWishlistIds: new Set(),
};

export const $wishlistDataStore = map<WishlistDataState>(initialState);

export const wishlistDataActions = {
  setWishlists: (
    wishlists: Wishlist[],
    originallySelectedIds: string[] = []
  ) => {
    const originallySelectedSet = new Set(originallySelectedIds);
    $wishlistDataStore.setKey("wishlists", wishlists);
    $wishlistDataStore.setKey(
      "originallySelectedWishlistIds",
      originallySelectedSet
    );
    $wishlistDataStore.setKey(
      "selectedWishlistIds",
      new Set(originallySelectedIds)
    );
  },

  addWishlist: (wishlist: Wishlist) => {
    const currentWishlists = $wishlistDataStore.get().wishlists;
    $wishlistDataStore.setKey("wishlists", [wishlist, ...currentWishlists]);

    // Auto-select newly created wishlist
    wishlistDataActions.selectWishlist(wishlist.id);
  },

  removeWishlist: (wishlistId: string) => {
    const currentWishlists = $wishlistDataStore.get().wishlists;
    const filteredWishlists = currentWishlists.filter(
      (w) => w.id !== wishlistId
    );
    $wishlistDataStore.setKey("wishlists", filteredWishlists);

    // Remove from selected if it was selected
    wishlistDataActions.deselectWishlist(wishlistId);
  },

  updateWishlist: (wishlistId: string, updates: Partial<Wishlist>) => {
    const currentWishlists = $wishlistDataStore.get().wishlists;
    const updatedWishlists = currentWishlists.map((w) =>
      w.id === wishlistId ? { ...w, ...updates } : w
    );
    $wishlistDataStore.setKey("wishlists", updatedWishlists);
  },

  selectWishlist: (wishlistId: string) => {
    const currentState = $wishlistDataStore.get();
    const newSelected = new Set(currentState.selectedWishlistIds);
    newSelected.add(wishlistId);
    $wishlistDataStore.setKey("selectedWishlistIds", newSelected);
  },

  deselectWishlist: (wishlistId: string) => {
    const currentState = $wishlistDataStore.get();
    const newSelected = new Set(currentState.selectedWishlistIds);
    newSelected.delete(wishlistId);
    $wishlistDataStore.setKey("selectedWishlistIds", newSelected);
  },

  toggleWishlistSelection: (wishlistId: string) => {
    const currentState = $wishlistDataStore.get();
    if (currentState.selectedWishlistIds.has(wishlistId)) {
      wishlistDataActions.deselectWishlist(wishlistId);
    } else {
      wishlistDataActions.selectWishlist(wishlistId);
    }
  },

  selectAllWishlists: () => {
    const currentWishlists = $wishlistDataStore.get().wishlists;
    const allIds = new Set(currentWishlists.map((w) => w.id));
    $wishlistDataStore.setKey("selectedWishlistIds", allIds);
  },

  deselectAllWishlists: () => {
    $wishlistDataStore.setKey("selectedWishlistIds", new Set());
  },

  // Get newly selected wishlist IDs (current - original)
  getNewlySelectedWishlistIds: (): string[] => {
    const currentState = $wishlistDataStore.get();
    const newlySelected = new Set(currentState.selectedWishlistIds);
    for (const id of currentState.originallySelectedWishlistIds) {
      newlySelected.delete(id);
    }
    return Array.from(newlySelected);
  },

  // Get deselected wishlist IDs (original - current)
  getDeselectedWishlistIds: (): string[] => {
    const currentState = $wishlistDataStore.get();
    const deselected = new Set(currentState.originallySelectedWishlistIds);
    for (const id of currentState.selectedWishlistIds) {
      deselected.delete(id);
    }
    return Array.from(deselected);
  },

  // Check if there are any changes (new selections or deselections)
  hasChanges: (): boolean => {
    const newlySelected = wishlistDataActions.getNewlySelectedWishlistIds();
    const deselected = wishlistDataActions.getDeselectedWishlistIds();
    return newlySelected.length > 0 || deselected.length > 0;
  },

  // Check if a wishlist is selected
  isWishlistSelected: (wishlistId: string): boolean => {
    return $wishlistDataStore.get().selectedWishlistIds.has(wishlistId);
  },

  // Check if a wishlist was originally selected
  wasOriginallySelected: (wishlistId: string): boolean => {
    return $wishlistDataStore
      .get()
      .originallySelectedWishlistIds.has(wishlistId);
  },

  reset: () => {
    $wishlistDataStore.set(initialState);
  },
};
