# Wishlist Store Architecture

This directory contains a modular wishlist store implementation that separates concerns into focused, testable stores following the pattern from [agilesix/pb-tools-prototype](https://github.com/agilesix/pb-tools-prototype).

## Architecture Overview

The wishlist functionality is split into three focused stores:

### 1. `wishlist-menu-store.ts`
Manages the wishlist menu state:
- Menu open/closed state
- Loading states for menu operations
- Menu-specific error handling

### 2. `wishlist-creator-store.ts`
Manages the wishlist creation form:
- Form open/closed state
- Form data (name, description)
- Form validation errors

### 3. `wishlist-data-store.ts`
Manages wishlist data and selection:
- Array of wishlists
- Selected wishlist IDs
- CRUD operations for wishlists

## Usage

### Basic Usage (Recommended)

Import the unified hook for most use cases:

```typescript
import { 
  wishlistActions, 
  wishlistEventHandlers,
  getWishlists,
  getWishlistMenuOpen 
} from "@/lib/stores/useWishlistStore";

// Open menu
wishlistActions.openMenu();

// Add wishlist
wishlistActions.addWishlist({ id: "1", name: "My Wishlist" });

// Handle form submission
wishlistEventHandlers.handleCreateWishlist();

// Get current state
const wishlists = getWishlists();
const isMenuOpen = getWishlistMenuOpen();
```

### Granular Usage

For more control, import individual stores:

```typescript
import { 
  $wishlistMenuStore, 
  $wishlistCreatorStore, 
  $wishlistDataStore,
  wishlistMenuActions,
  wishlistCreatorActions,
  wishlistDataActions 
} from "@/lib/stores/useWishlistStore";

// Subscribe to specific store changes
$wishlistMenuStore.subscribe((menuState) => {
  console.log("Menu state changed:", menuState);
});

// Use specific actions
wishlistMenuActions.open();
wishlistCreatorActions.updateFormData({ name: "New Name" });
wishlistDataActions.selectWishlist("wishlist-1");
```

### Component Integration

Replace DOM state management with store actions:

```typescript
// OLD: Direct DOM manipulation
function toggleForm() {
  const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
  // ... DOM manipulation
}

// NEW: Use store actions
import { wishlistActions } from "@/lib/stores/useWishlistStore";

function toggleForm() {
  wishlistActions.toggleCreatorForm();
}
```

### Reactive Updates

Subscribe to store changes for reactive UI updates:

```typescript
import { $wishlistDataStore, wishlistActions } from "@/lib/stores/useWishlistStore";

// Subscribe to selection changes
$wishlistDataStore.subscribe((state) => {
  updateSaveButtonState(state.selectedWishlistIds.length > 0);
});
```

## Benefits

1. **Separation of Concerns**: Each store has a single responsibility
2. **Granular Subscriptions**: Subscribe only to the state you need
3. **Testability**: Each store can be tested in isolation
4. **Maintainability**: Changes to one aspect don't affect others
5. **Performance**: Components only re-render when relevant state changes
6. **Type Safety**: Full TypeScript support with proper interfaces

## Migration from Monolithic Store

The original `wishlist-store.ts` now re-exports everything from the new modular structure, so existing code continues to work without changes. You can gradually migrate to the new pattern:

1. Start using the unified `useWishlistStore` API
2. Gradually replace direct store access with focused imports
3. Update subscriptions to use specific stores
4. Remove unused imports from the old monolithic approach

## Testing

Each store can be tested independently:

```typescript
import { $wishlistMenuStore, wishlistMenuActions } from "./wishlist-menu-store";

describe("Wishlist Menu Store", () => {
  it("should open and close menu", () => {
    wishlistMenuActions.open();
    expect($wishlistMenuStore.get().isOpen).toBe(true);
    
    wishlistMenuActions.close();
    expect($wishlistMenuStore.get().isOpen).toBe(false);
  });
});
```

## Backward Compatibility

All existing APIs are maintained through re-exports in `wishlist-store.ts`, ensuring no breaking changes for existing code. 
