import React, { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
  $wishlistDataStore,
  wishlistDataActions,
} from "@/lib/stores/wishlist/useWishlistStore";
import styles from "./WishlistMenu.module.css";

type WishlistMenuProps = {
  isOpen: boolean;
  giftSlug?: string;
  onCancel: () => void; // Called when menu is closed/canceled
  onSave?: () => void; // Called when Save is clicked
  creatorSlot?: React.ReactNode;
  selectorSlot?: React.ReactNode;
};

const WishlistMenu: React.FC<WishlistMenuProps> = ({
  isOpen,
  onCancel,
  onSave,
  creatorSlot,
  selectorSlot,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Subscribe to wishlist data to determine save button state
  const wishlistData = useStore($wishlistDataStore);

  // Reactive state calculations
  const hasChanges = wishlistDataActions.hasChanges();
  const canSave = hasChanges;

  // Focus management: focus close button when menu opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;
    const menu = menuRef.current;
    if (!menu) return;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements =
      menu.querySelectorAll<HTMLElement>(focusableSelectors);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
      if (e.key === "Tab" && focusableElements.length > 0) {
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    menu.addEventListener("keydown", handleKeyDown);
    return () => {
      menu.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Handle save button click
  const handleSaveClick = () => {
    if (canSave && onSave) {
      onSave();
    }
  };

  return (
    <div
      className={`${styles.menu} ${isOpen ? styles.menuOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-menu-title"
      aria-describedby="wishlist-menu-description"
      ref={menuRef}
      tabIndex={-1}
      style={{ zIndex: 1000 }}
      onClick={handleOverlayClick}
    >
      <div className={styles.overlay} id="wishlist-menu-overlay"></div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="wishlist-menu-title" className={styles.title}>
            Add to wishlist
          </h2>
          <button
            className="button-close"
            id="wishlist-menu-close"
            aria-label="Close wishlist menu"
            ref={closeButtonRef}
            onClick={onCancel}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.body}>
            {creatorSlot}
            <div className={styles.separator}></div>
            {selectorSlot}
          </div>
          <div className={styles.actions}>
            <button
              className="button-secondary"
              id="wishlist-menu-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="button-primary"
              id="wishlist-menu-save"
              onClick={handleSaveClick}
              disabled={!canSave}
              title={!hasChanges ? "No changes to save" : "Save changes"}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistMenu;
