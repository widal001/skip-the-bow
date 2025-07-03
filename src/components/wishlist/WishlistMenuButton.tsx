import React from "react";
import { useStore } from "@nanostores/react";
import WishlistMenu from "./WishlistMenu";
import WishlistSelector from "./WishlistSelector";
import WishlistCreator from "./WishlistCreator";
import {
  wishlistActions,
  $wishlistMenuStore,
} from "../../lib/stores/wishlist/useWishlistStore";

const WishlistMenuIsland: React.FC = () => {
  // Use useStore to automatically subscribe to the menu state
  const menuState = useStore($wishlistMenuStore);

  const handleWishlistButtonClick = () => {
    wishlistActions.startWishlistSelection();
  };

  const handleCancel = () => {
    wishlistActions.cancelWishlistSelections();
  };

  const handleSave = () => {
    wishlistActions.saveSelectedWishlists();
  };

  return (
    <>
      <button
        type="button"
        className="button-primary"
        onClick={handleWishlistButtonClick}
      >
        Add to Wishlist
      </button>
      <WishlistMenu
        isOpen={menuState.isOpen}
        onCancel={handleCancel}
        onSave={handleSave}
        creatorSlot={<WishlistCreator />}
        selectorSlot={<WishlistSelector />}
      />
    </>
  );
};

export default WishlistMenuIsland;
