# Game Tracking Feature

Comprehensive basketball game tracking system for real-time game state management, play-by-play logging, and game control.

## Overview

The game tracking feature provides:
- Real-time game state management (clock, score, quarters, fouls, timeouts)
- Play-by-play event logging
- Game rules configuration
- Timeout tracking
- Substitution tracking
- Quarter management

## Architecture

```
src/features/game-tracking/
├── lib/
│   ├── queries.ts      # Database read operations
│   ├── mutations.ts    # Database write operations
│   └── utils.ts        # Utility functions (clock formatting, quarter management)
├── types.ts            # TypeScript type definitions
└── README.md           # This file
```

## Database Models

### GameRules
Customizable game rules per match/league:
- Number of quarters, minutes per quarter
- Halftime configuration (which quarter ends at halftime, halftime duration)
- Timeout configuration (60s, 30s, overtime)
- Foul limits (bonus, double bonus, foul out)
- Feature flags (track turnover types, foul types, shot locations, etc.)

### GameState
Real-time game state snapshot:
- Quarter, clock seconds, clock running
- Scores, fouls, timeouts per team
- Possession team

### MatchPeriod
Quarter tracking with start/end times and quarter-specific scores/fouls.

### Timeout
Timeout records with team, quarter, type (60s/30s), and timing.

### Substitution
Substitution records with players in/out, quarter, and timing.

## API Routes

All routes are under `/api/games/[matchId]/`:

- `GET /api/games/[matchId]/state` - Get current game state
- `PUT /api/games/[matchId]/state` - Update game state (admin)
- `POST /api/games/[matchId]/start` - Start game (admin)
- `POST /api/games/[matchId]/pause` - Pause/resume clock (admin)
- `POST /api/games/[matchId]/timeout` - Record timeout (admin)
- `POST /api/games/[matchId]/substitution` - Record substitution (admin)
- `GET /api/games/[matchId]/play-by-play` - Get play-by-play log
- `GET /api/games/[matchId]/rules` - Get game rules

## Usage Examples

### Start a Game

```typescript
const response = await fetch(`/api/games/${matchId}/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ gameRulesId: 'optional-rules-id' }),
});
const state = await response.json();
```

### Update Game State

```typescript
const response = await fetch(`/api/games/${matchId}/state`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clockSeconds: 600,
    clockRunning: true,
    team1Score: 10,
    team2Score: 8,
  }),
});
```

### Record Timeout

```typescript
const response = await fetch(`/api/games/${matchId}/timeout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: 'team-id',
    period: 1,
    timeoutType: 'SIXTY_SECOND',
    secondsRemaining: 540,
  }),
});
```

### Get Play-by-Play

```typescript
const response = await fetch(`/api/games/${matchId}/play-by-play`);
const { events, periods } = await response.json();
```

## Utility Functions

### Clock Formatting

```typescript
import { formatClockTime } from '../features/game-tracking/lib/utils';

const display = formatClockTime(600); // "10:00"
const parsed = parseClockTime("10:00"); // 600
```

### Quarter Management

```typescript
import { getPeriodLabel, isOvertimePeriod } from '../features/game-tracking/lib/utils';

const label = getPeriodLabel(1); // "1st"
const labelOT = getPeriodLabel(5, 4); // "OT1"
const isOT = isOvertimePeriod(5, 4); // true
```

## Integration with Match Events

Match events now include:
- `period` - Quarter number
- `secondsRemaining` - Seconds remaining in quarter
- `sequenceNumber` - Event sequence for ordering
- `isUndone` - Soft delete flag for undo functionality

## Components

All frontend components are implemented:
- ✅ Game scoreboard component (`GameScoreboard`)
- ✅ Game clock component (`GameClock`)
- ✅ Play-by-play log component (`PlayByPlayLog`)
- ✅ Timeout controls (`TimeoutControls`)
- ✅ Substitution panel (`SubstitutionPanel`)
- ✅ Quick event buttons (`QuickEventButtons`)
- ✅ Game tracking panel (`GameTrackingPanel`) - Main container component
