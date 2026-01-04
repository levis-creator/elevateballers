# State Management with Zustand and TypeScript

This project uses Zustand for state management with full TypeScript support.

## Store Structure

The store (`useStore.ts`) manages the following state:

### UI State
- **Mobile Menu**: Controls the mobile navigation menu visibility
- **News Filter**: Manages the active filter for news articles (All, Interviews, Championships, Match report, Analysis)
- **Media Filter**: Manages the active filter for media gallery (All, Images, Audio)

### Cart State
- **Cart Items**: Tracks the number of items in the shopping cart
- **Cart Actions**: Add, remove, and clear cart items

### Authentication State
- **User**: Stores authenticated user information
- **Authentication Status**: Tracks if user is logged in

## Usage

### In React Components

```tsx
import { useStore } from '../store/useStore';

function MyComponent() {
  const { newsFilter, setNewsFilter, isMobileMenuOpen, toggleMobileMenu } = useStore();
  
  return (
    <div>
      <p>Current filter: {newsFilter}</p>
      <button onClick={() => setNewsFilter('Interviews')}>
        Filter Interviews
      </button>
    </div>
  );
}
```

### Selecting Specific State

For better performance, you can select only the state you need:

```tsx
import { useStore } from '../store/useStore';

function MyComponent() {
  const newsFilter = useStore((state) => state.newsFilter);
  const setNewsFilter = useStore((state) => state.setNewsFilter);
  
  // Component only re-renders when newsFilter changes
}
```

## Type Safety

All state and actions are fully typed with TypeScript:

```typescript
import { useStore, type NewsFilter, type MediaFilter } from '../store/useStore';

const filter: NewsFilter = 'Championships'; // Type-safe!
```

## Available Actions

### Mobile Menu
- `toggleMobileMenu()` - Toggle mobile menu open/closed
- `closeMobileMenu()` - Close mobile menu

### News Filter
- `setNewsFilter(filter: NewsFilter)` - Set active news filter

### Media Filter
- `setMediaFilter(filter: MediaFilter)` - Set active media filter

### Cart
- `addToCart()` - Increment cart items
- `removeFromCart()` - Decrement cart items
- `clearCart()` - Reset cart to 0

### Authentication
- `login(user: { name: string; email: string })` - Log in user
- `logout()` - Log out user

