# Layout Feature

This feature contains all layout-related components used across the application.

## Components

### TopBar.astro
Top navigation bar with login/signup links, cart, and social media links.

### Header.astro
Main header with logo, navigation menu, and search functionality.

### MobileMenu.tsx
React component for mobile navigation menu with Zustand state management.
- Uses `useLayoutStore` for mobile menu toggle state
- Includes hamburger menu animation
- Closes menu on link click

### Footer.astro
Footer component with contact information, newsletter signup, and social links.

## Store

### useLayoutStore.ts
Zustand store managing layout UI state:
- `isMobileMenuOpen`: Boolean state for mobile menu visibility
- `toggleMobileMenu()`: Toggle mobile menu open/closed
- `closeMobileMenu()`: Close mobile menu
- `openMobileMenu()`: Open mobile menu

## Usage

```astro
---
import TopBar from '../features/layout/components/TopBar.astro';
import Header from '../features/layout/components/Header.astro';
import MobileMenu from '../features/layout/components/MobileMenu';
import Footer from '../features/layout/components/Footer.astro';
---

<TopBar />
<Header />
<MobileMenu client:load />
<!-- Page content -->
<Footer />
```

## Types

See `types.ts` for TypeScript interfaces used in this feature.

