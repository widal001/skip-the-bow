import { map } from "nanostores";

export interface Wishlist {
  id: string;
  name: string;
  description?: string;
  isSelected?: boolean;
}

export interface WishlistDataState {
  wishlists: Wishlist[];
  selectedWishlistIds: string[];
}

const initialState: WishlistDataState = {
  wishlists: [],
  selectedWishlistIds: [],
};

export const $wishlistDataStore = map<WishlistDataState>(initialState);

export const wishlistDataActions = {
  setWishlists: (wishlists: Wishlist[]) => {
    $wishlistDataStore.setKey("wishlists", wishlists);
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
    const currentSelected = $wishlistDataStore.get().selectedWishlistIds;
    if (!currentSelected.includes(wishlistId)) {
      $wishlistDataStore.setKey("selectedWishlistIds", [
        ...currentSelected,
        wishlistId,
      ]);
    }
  },

  deselectWishlist: (wishlistId: string) => {
    const currentSelected = $wishlistDataStore.get().selectedWishlistIds;
    $wishlistDataStore.setKey(
      "selectedWishlistIds",
      currentSelected.filter((id) => id !== wishlistId)
    );
  },

  toggleWishlistSelection: (wishlistId: string) => {
    const currentSelected = $wishlistDataStore.get().selectedWishlistIds;
    if (currentSelected.includes(wishlistId)) {
      wishlistDataActions.deselectWishlist(wishlistId);
    } else {
      wishlistDataActions.selectWishlist(wishlistId);
    }
  },

  selectAllWishlists: () => {
    const currentWishlists = $wishlistDataStore.get().wishlists;
    const allIds = currentWishlists.map((w) => w.id);
    $wishlistDataStore.setKey("selectedWishlistIds", allIds);
  },

  deselectAllWishlists: () => {
    $wishlistDataStore.setKey("selectedWishlistIds", []);
  },

  reset: () => {
    $wishlistDataStore.set(initialState);
  },
};
