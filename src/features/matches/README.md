# Matches Feature

This feature provides comprehensive match management functionality for the Elevate Ballers application.

## Overview

The matches feature handles:
- Displaying upcoming fixtures
- Showing match results
- Match detail pages
- Match filtering and search
- Integration with home page components

## Structure

```
src/features/matches/
├── components/          # React components for displaying matches
│   ├── MatchCard.tsx   # Individual match card component
│   ├── MatchList.tsx   # List of matches with filtering
│   └── MatchDetail.tsx # Detailed match view
├── lib/                # Business logic and utilities
│   ├── queries.ts      # Database queries for matches
│   └── utils.ts        # Utility functions for formatting
├── types.ts            # TypeScript type definitions
└── README.md           # This file
```

## Components

### MatchCard
Displays a single match in card format with team logos, names, scores, and status.

**Props:**
- `match: Match` - The match data
- `showLeague?: boolean` - Show league name (default: true)
- `showDate?: boolean` - Show match date (default: true)
- `showTime?: boolean` - Show match time (default: true)
- `compact?: boolean` - Use compact layout (default: false)
- `onClick?: () => void` - Click handler

### MatchList
Displays a list of matches with filtering and sorting capabilities.

**Props:**
- `matches: Match[]` - Array of matches to display
- `showFilters?: boolean` - Show filter controls (default: false)
- `showLeague?: boolean` - Show league name (default: true)
- `compact?: boolean` - Use compact layout (default: false)
- `onMatchClick?: (match: Match) => void` - Click handler for matches

### MatchDetail
Displays detailed information about a single match.

**Props:**
- `match: Match` - The match data

## Queries

### getUpcomingMatches(limit?: number)
Fetches upcoming matches (date >= today, status UPCOMING or LIVE).

### getCompletedMatches(limit?: number)
Fetches completed matches (status COMPLETED).

### getLiveMatches()
Fetches currently live matches (status LIVE).

### getNextMatch()
Fetches the next upcoming match.

### getFilteredMatches(filter, sort, limit?)
Fetches matches with advanced filtering options.

## Pages

### `/upcoming-fixtures`
Displays all upcoming matches in a table format.

### `/matches/results`
Displays completed matches with filtering options.

### `/matches/[id]`
Displays detailed information about a specific match.

## Integration

The matches feature integrates with:
- **Home page**: MarqueeMatchup and NextMatchCarousel components
- **Admin CMS**: Match management (create, edit, delete)
- **API**: RESTful endpoints for match data

## Usage Example

```typescript
import { getUpcomingMatches } from '../features/matches/lib/queries';
import MatchList from '../features/matches/components/MatchList';

// In an Astro page
const matches = await getUpcomingMatches();

// In JSX
<MatchList 
  matches={matches}
  showFilters={true}
  onMatchClick={(match) => {
    window.location.href = `/matches/${match.id}`;
  }}
/>
```

## Best Practices

1. **Always use queries from lib/queries.ts** - Don't query the database directly
2. **Use utility functions** - Use functions from lib/utils.ts for formatting
3. **Handle empty states** - Always check if matches array is empty
4. **Error handling** - Wrap database queries in try-catch blocks
5. **Type safety** - Use TypeScript types from types.ts

## Future Enhancements

- Match statistics and analytics
- Live score updates
- Match predictions
- Team comparison
- Match highlights and media
- Integration with team pages

