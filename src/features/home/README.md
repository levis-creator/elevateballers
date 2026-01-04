# Home Feature

This feature contains all homepage-specific components and functionality.

## Structure

```
src/features/home/
├── components/          # React components for homepage
│   ├── PostSlider.tsx      # Hero post slider
│   ├── NewsTicker.tsx      # Scrolling news ticker
│   ├── NextMatchCarousel.tsx # Upcoming matches carousel
│   ├── LatestNews.tsx       # News grid with category tabs
│   └── Sponsors.tsx         # Sponsor carousel
├── stores/              # Zustand stores
│   ├── useCarouselStore.ts  # Carousel/slider state
│   ├── useNewsStore.ts      # News filtering state
│   └── useHomeStore.ts      # Homepage-specific state
├── data/                # Static data
│   ├── homeData.ts         # Homepage data (matches, players, stats, etc.)
│   └── newsData.ts         # News items data
├── types.ts             # TypeScript type definitions
└── README.md            # This file
```

## Components

### PostSlider
Hero post slider component that displays featured posts with navigation.

### NewsTicker
Scrolling news ticker that displays latest news items.

### NextMatchCarousel
Carousel displaying upcoming matches.

### LatestNews
News grid component with category filtering tabs (All, Interviews, Championships, Match report, Analysis).

### Sponsors
Sponsor carousel component.

## State Management

- **useCarouselStore**: Manages carousel/slider state (current slide, navigation)
- **useNewsStore**: Manages news filtering state (active tab)
- **useHomeStore**: Placeholder for future homepage-specific state

## Data

Static data is stored in the `data/` directory:
- `homeData.ts`: Contains matches, player of the week, stats, post slides, ticker items, and sponsors
- `newsData.ts`: Contains news items and filtering utilities
