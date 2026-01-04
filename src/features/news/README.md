# News Feature

This feature contains shared components and utilities for news-related pages.

## Components

### NewsSidebar.astro

A reusable sidebar component that includes:
- Search widget
- Categories widget
- Archives widget
- Latest News widget
- Tags widget (optional)
- Instagram widget (optional)

**Props:**
- `searchQuery?: string` - Pre-filled search query value
- `showTags?: boolean` - Show tags widget (default: false)
- `showInstagram?: boolean` - Show Instagram widget (default: false)

**Usage:**
```astro
---
import NewsSidebar from '../../features/news/components/NewsSidebar.astro';
---

<NewsSidebar searchQuery={searchQuery || ''} showTags={true} showInstagram={true} />
```

### NewsBreadcrumbs.astro

A reusable breadcrumb navigation component for consistent navigation across news pages.

**Props:**
- `items: Array<{ label: string; url?: string }>` - Array of breadcrumb items. Items without a URL are treated as the current page.

**Usage:**
```astro
---
import NewsBreadcrumbs from '../../features/news/components/NewsBreadcrumbs.astro';
---

<NewsBreadcrumbs items={[
  { label: 'Elevate', url: '/' },
  { label: 'News', url: '/news/' },
  { label: 'Article Title' }
]} />
```

### NewsShareButtons.astro

A reusable share buttons component that provides social sharing functionality.

**Props:**
- `url: string` - The URL to share
- `title: string` - The title of the content to share
- `variant?: 'compact' | 'full'` - Display variant (default: 'compact')
  - `compact`: Icon-only buttons, no label
  - `full`: Buttons with labels and "SHARE" header

**Usage:**
```astro
---
import NewsShareButtons from '../../features/news/components/NewsShareButtons.astro';
---

<NewsShareButtons url={shareUrl} title={shareTitle} variant="full" />
```

## Design Principles

These components follow the DRY (Don't Repeat Yourself) principle by:
- Centralizing shared functionality
- Reducing code duplication
- Ensuring consistent styling and behavior
- Making maintenance easier

## Styling

All components include their own scoped styles to ensure consistent appearance across all news pages. The styles follow the existing design system with:
- Teko font for headings
- Rubik font for body text
- Consistent color scheme (#dd3333 for primary actions)
- Responsive design for mobile devices

