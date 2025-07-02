import { map } from "nanostores";

export interface WishlistFormData {
  name: string;
  description: string;
}

export interface WishlistCreatorState {
  isFormOpen: boolean;
  formData: WishlistFormData;
  error: string | null;
}

const initialState: WishlistCreatorState = {
  isFormOpen: false,
  formData: {
    name: "",
    description: "",
  },
  error: null,
};

export const $wishlistCreatorStore = map<WishlistCreatorState>(initialState);

export const wishlistCreatorActions = {
  openForm: () => {
    $wishlistCreatorStore.setKey("isFormOpen", true);
  },

  closeForm: () => {
    $wishlistCreatorStore.setKey("isFormOpen", false);
    wishlistCreatorActions.resetForm();
  },

  toggleForm: () => {
    const currentState = $wishlistCreatorStore.get();
    $wishlistCreatorStore.setKey("isFormOpen", !currentState.isFormOpen);
    if (!currentState.isFormOpen) {
      wishlistCreatorActions.resetForm();
    }
  },

  updateFormData: (updates: Partial<WishlistFormData>) => {
    const currentFormData = $wishlistCreatorStore.get().formData;
    $wishlistCreatorStore.setKey("formData", {
      ...currentFormData,
      ...updates,
    });
  },

  resetForm: () => {
    $wishlistCreatorStore.setKey("formData", { name: "", description: "" });
  },

  setError: (error: string | null) => {
    $wishlistCreatorStore.setKey("error", error);
  },

  clearError: () => {
    $wishlistCreatorStore.setKey("error", null);
  },

  reset: () => {
    $wishlistCreatorStore.set(initialState);
  },
};
