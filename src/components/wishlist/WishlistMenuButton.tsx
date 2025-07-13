import React from "react";
import { useStore } from "@nanostores/react";
import WishlistMenu from "./WishlistMenu";
import WishlistSelector from "./WishlistSelector";
import WishlistCreator from "./WishlistCreator";
import {
  wishlistActions,
  $wishlistMenuStore,
} from "../../lib/stores/wishlist/useWishlistStore";

interface WishlistMenuButtonProps {
  giftSlug?: string;
  giftName?: string;
}

const WishlistMenuButton: React.FC<WishlistMenuButtonProps> = ({
  giftSlug,
  giftName,
}) => {
  // Use useStore to automatically subscribe to the menu state
  const menuState = useStore($wishlistMenuStore);

  const handleWishlistButtonClick = () => {
    wishlistActions.startWishlistSelection(giftSlug);
  };

  const handleCancel = () => {
    wishlistActions.cancelWishlistSelections();
  };

  const handleSave = () => {
    wishlistActions.saveSelectedWishlists({
      slug: giftSlug,
      name: giftName,
    });
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
        giftSlug={giftSlug}
        onCancel={handleCancel}
        onSave={handleSave}
        creatorSlot={<WishlistCreator />}
        selectorSlot={<WishlistSelector />}
      />
    </>
  );
};

export default WishlistMenuButton;
