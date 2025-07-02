import React, { useRef, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  wishlistActions,
  $wishlistCreatorStore,
} from "@/lib/stores/wishlist/useWishlistStore";
import styles from "./WishlistCreator.module.css";

const WishlistCreator: React.FC = () => {
  const state = useStore($wishlistCreatorStore);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [descCount, setDescCount] = useState(0);

  // Focus management for accessibility
  useEffect(() => {
    if (state.isFormOpen) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [state.isFormOpen]);

  // Reset form fields when form closes
  useEffect(() => {
    if (!state.isFormOpen && nameRef.current && descRef.current) {
      nameRef.current.value = "";
      descRef.current.value = "";
      setDescCount(0);
    }
  }, [state.isFormOpen]);

  const handleToggle = () => {
    if (state.isFormOpen) {
      wishlistActions.cancelCreateForm();
    } else {
      wishlistActions.startCreateForm();
    }
  };

  const handleCancel = () => {
    wishlistActions.cancelCreateForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() || "";
    const description = descRef.current?.value.trim() || "";
    wishlistActions.updateFormData({ name, description });
    const success = await wishlistActions.submitCreateForm();
    if (success) {
      // Form will close automatically
    }
  };

  const handleDescInput = () => {
    setDescCount(descRef.current?.value.length || 0);
  };

  const isInactive = !state.isFormOpen;

  return (
    <div>
      <button
        type="button"
        className={styles.toggle}
        id="wishlist-creator-toggle"
        aria-expanded={state.isFormOpen}
        aria-controls="wishlist-creator-form"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <svg
          className={styles.toggleIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Create New Wishlist
      </button>

      <div
        className={`${styles.formContainer} ${state.isFormOpen ? styles.formContainerOpen : ""}`}
        id="wishlist-creator-form"
        aria-hidden={!state.isFormOpen}
        inert={isInactive ? true : undefined}
      >
        <form
          className={styles.form}
          id="wishlist-creator-form-element"
          onSubmit={handleSubmit}
        >
          <div className={styles.field}>
            <label htmlFor="wishlist-name" className={styles.label}>
              Wishlist Name{" "}
              <span className={styles.required} aria-label="required">
                *
              </span>
            </label>
            <input
              type="text"
              id="wishlist-name"
              name="wishlistName"
              className={styles.input}
              placeholder="e.g., Birthday Wishlist"
              required
              maxLength={50}
              ref={nameRef}
              defaultValue={state.formData.name}
              tabIndex={isInactive ? -1 : 0}
              disabled={isInactive}
            />
            <div className={styles.helpText}>
              Choose a descriptive name for your wishlist
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="wishlist-description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="wishlist-description"
              name="wishlistDescription"
              className={styles.textarea}
              placeholder="Add a description to help you remember what this wishlist is for..."
              rows={3}
              maxLength={255}
              ref={descRef}
              defaultValue={state.formData.description}
              onInput={handleDescInput}
              tabIndex={isInactive ? -1 : 0}
              disabled={isInactive}
            />
            <div className={styles.helpText}>{descCount}/255 characters</div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="button-secondary"
              id="wishlist-creator-cancel"
              onClick={handleCancel}
              tabIndex={isInactive ? -1 : 0}
              disabled={isInactive || state.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              id="wishlist-creator-submit"
              tabIndex={isInactive ? -1 : 0}
              disabled={isInactive || state.isLoading}
            >
              {state.isLoading ? "Creating..." : "Create Wishlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WishlistCreator;
