import { map } from "nanostores";

export interface WishlistMenuState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistMenuState = {
  isOpen: false,
  isLoading: false,
  error: null,
};

export const $wishlistMenuStore = map<WishlistMenuState>(initialState);

export const wishlistMenuActions = {
  open: () => {
    $wishlistMenuStore.setKey("isOpen", true);
  },

  close: () => {
    $wishlistMenuStore.setKey("isOpen", false);
  },

  setLoading: (isLoading: boolean) => {
    $wishlistMenuStore.setKey("isLoading", isLoading);
  },

  setError: (error: string | null) => {
    $wishlistMenuStore.setKey("error", error);
  },

  clearError: () => {
    $wishlistMenuStore.setKey("error", null);
  },

  reset: () => {
    $wishlistMenuStore.set(initialState);
  },
};
