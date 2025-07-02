import React from "react";
import { useStore } from "@nanostores/react";
import {
  $wishlistDataStore,
  wishlistActions,
} from "@/lib/stores/wishlist/useWishlistStore";
import styles from "./WishlistSelector.module.css";

export const WishlistSelector: React.FC = () => {
  const state = useStore($wishlistDataStore);

  const handleChange = (wishlistId: string) => {
    wishlistActions.selectWishlist(wishlistId);
  };

  if (state.wishlists.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          No wishlists found. Create your first wishlist below.
        </p>
      </div>
    );
  }

  return (
    <div
      className={styles.list}
      role="group"
      aria-labelledby="wishlist-selector-legend"
    >
      {state.wishlists.map((wishlist) => (
        <label
          className={styles.item}
          htmlFor={`wishlist-${wishlist.id}`}
          key={wishlist.id}
        >
          <input
            type="checkbox"
            id={`wishlist-${wishlist.id}`}
            name="wishlists"
            value={wishlist.id}
            className={styles.checkbox}
            data-wishlist-id={wishlist.id}
            checked={state.selectedWishlistIds.includes(wishlist.id)}
            onChange={() => handleChange(wishlist.id)}
          />
          <div className={styles.content}>
            <span className={styles.name}>{wishlist.name}</span>
            {wishlist.description && (
              <span className={styles.description}>{wishlist.description}</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default WishlistSelector;
