# Feature Flags Documentation

## Overview

The feature flags system allows you to enable or disable modules and features throughout the application without modifying code. This is useful for:

- **A/B Testing**: Test new features with a subset of users
- **Gradual Rollouts**: Enable features progressively
- **Maintenance**: Temporarily disable features during maintenance
- **Environment-Specific Configuration**: Different features in dev vs production
- **Module Management**: Enable/disable entire modules (CMS, Media, etc.)

## Architecture

The feature flags system follows these principles:

- **KISS**: Simple boolean flags, easy to understand
- **SOLID**: Single responsibility, extensible design
- **DRY**: Centralized configuration, no code duplication

## Available Features

### Layout Features
- `layout.topbar` - Top navigation bar
- `layout.header` - Main header with logo and navigation
- `layout.footer` - Footer with contact info
- `layout.mobileMenu` - Mobile navigation menu

### Homepage Features
- `home.postSlider` - Hero post slider carousel
- `home.newsTicker` - Scrolling news ticker
- `home.marqueeMatchup` - Featured match display
- `home.nextMatchCarousel` - Upcoming matches carousel
- `home.latestNews` - Latest news grid
- `home.playerOfTheWeek` - Player of the week showcase
- `home.statsSection` - League statistics section
- `home.statsLeaders` - Stats leaders carousel
- `home.mediaGallery` - Media gallery section
- `home.sponsors` - Sponsors carousel
- `home.registrationCta` - Registration call-to-action

### Module Features
- `module.news` - News articles and blog functionality
- `module.matches` - Match fixtures and results
- `module.players` - Player profiles and directory
- `module.standings` - League standings and rankings
- `module.media` - Media gallery functionality
- `module.team` - Team pages and profiles
- `module.registration` - League registration functionality
- `module.comments` - Comments system
- `module.cms` - Content Management System

### CMS Sub-Features
- `cms.news` - CMS: News article management
- `cms.matches` - CMS: Match management
- `cms.players` - CMS: Player management
- `cms.media` - CMS: Media management
- `cms.teams` - CMS: Team management
- `cms.seasons` - CMS: Season management
- `cms.leagues` - CMS: League management
- `cms.staff` - CMS: Staff management

## Configuration

### Environment Variables

Feature flags can be configured via environment variables in two ways:

#### Method 1: Individual Flags

Set individual flags using the format: `FEATURE_FLAG_<FEATURE_KEY>`

Where `<FEATURE_KEY>` is the feature key in uppercase with dots replaced by underscores.

**Examples:**
```bash
# Disable post slider
FEATURE_FLAG_HOME_POST_SLIDER=false

# Disable news ticker
FEATURE_FLAG_HOME_NEWS_TICKER=false

# Disable media module
FEATURE_FLAG_MODULE_MEDIA=false
```

#### Method 2: JSON Configuration

Set multiple flags at once using JSON:

```bash
FEATURE_FLAGS={"home.postSlider":false,"home.newsTicker":false,"module.media":false}
```

### Default Behavior

- **All features are enabled by default** unless explicitly disabled
- If a feature flag is not set, it defaults to `true` (enabled)
- Environment variables override default values

## Usage

### Server-Side (Astro Components)

#### Using FeatureGate Component

Wrap components or sections with the `FeatureGate` component:

```astro
---
import FeatureGate from "../components/FeatureGate.astro";
import PostSlider from "../features/home/components/PostSlider";
---

<FeatureGate feature="home.postSlider">
  <PostSlider client:load />
</FeatureGate>
```

#### Using isFeatureEnabled Function

Check flags directly in component logic:

```astro
---
import { isFeatureEnabled } from "../lib/feature-flags";
import TopBar from "../features/layout/components/TopBar.astro";
---

{isFeatureEnabled('layout.topbar') && <TopBar />}
```

### Client-Side (React Components)

#### Using useFeatureFlag Hook

```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function MyComponent() {
  const isPostSliderEnabled = useFeatureFlag('home.postSlider');
  
  if (!isPostSliderEnabled) {
    return null;
  }
  
  return <PostSlider />;
}
```

#### Using FeatureGate Component

```tsx
import { FeatureGate } from '../components/FeatureGate';

function MyComponent() {
  return (
    <FeatureGate feature="home.postSlider" fallback={<div>Feature disabled</div>}>
      <PostSlider />
    </FeatureGate>
  );
}
```

#### Checking Multiple Features

```tsx
import { useFeatureFlags } from '../hooks/useFeatureFlag';

function MyComponent() {
  // All features must be enabled
  const allEnabled = useFeatureFlags(['home.postSlider', 'home.newsTicker'], true);
  
  // Any feature enabled
  const anyEnabled = useFeatureFlags(['home.postSlider', 'home.newsTicker'], false);
  
  return <div>...</div>;
}
```

### API Endpoint

Feature flags are exposed via API for client-side consumption:

```
GET /api/feature-flags
```

Returns JSON object with all feature flags:

```json
{
  "home.postSlider": true,
  "home.newsTicker": false,
  "module.media": true,
  ...
}
```

## Programmatic Access

### Server-Side (Node/Astro)

```typescript
import { 
  isFeatureEnabled, 
  getFeatureFlags, 
  areFeaturesEnabled 
} from '../lib/feature-flags';

// Check single feature
if (isFeatureEnabled('home.postSlider')) {
  // Feature is enabled
}

// Get all flags
const flags = getFeatureFlags();

// Check multiple features
if (areFeaturesEnabled(['home.postSlider', 'home.newsTicker'], true)) {
  // All features enabled
}
```

### Client-Side (Browser)

```typescript
import { 
  isClientFeatureEnabled,
  getClientFeatureFlags 
} from '../lib/feature-flags-client';

// Async check
const enabled = await isClientFeatureEnabled('home.postSlider');

// Get all flags
const flags = await getClientFeatureFlags();
```

## Best Practices

1. **Use FeatureGate Components**: Prefer wrapping components with `FeatureGate` rather than conditional rendering in multiple places
2. **Group Related Features**: Use module-level flags to disable entire feature sets
3. **Document Feature Dependencies**: If features depend on each other, document this clearly
4. **Test with Flags Disabled**: Ensure your application works correctly when features are disabled
5. **Use Descriptive Names**: Feature flag names should clearly indicate what they control
6. **Default to Enabled**: New features should default to enabled unless there's a specific reason

## Examples

### Disable Homepage Features

```bash
# .env
FEATURE_FLAG_HOME_POST_SLIDER=false
FEATURE_FLAG_HOME_NEWS_TICKER=false
FEATURE_FLAG_HOME_MEDIA_GALLERY=false
```

### Disable Entire Module

```bash
# .env
FEATURE_FLAG_MODULE_MEDIA=false
FEATURE_FLAG_MODULE_REGISTRATION=false
```

### Gradual Rollout

```bash
# Production - enable for 10% of users (requires additional logic)
FEATURE_FLAG_HOME_POST_SLIDER=true

# Development - always enabled
FEATURE_FLAG_HOME_POST_SLIDER=true
```

## Troubleshooting

### Feature Not Disabling

1. Check environment variable name matches exactly (uppercase, underscores)
2. Restart the development server after changing `.env` files
3. Verify the feature flag key exists in `FEATURE_FLAGS_CONFIG`
4. Check browser console for errors

### Client-Side Features Not Updating

1. Clear browser cache
2. Check `/api/feature-flags` endpoint returns correct values
3. Verify client-side code is using the hook correctly

### Cache Issues

The feature flags are cached for performance. To refresh:

```typescript
import { resetFeatureFlagsCache } from '../lib/feature-flags';
resetFeatureFlagsCache();
```

## Adding New Features

To add a new feature flag:

1. Add the feature key to `FeatureFlag` type in `src/lib/feature-flags.ts`
2. Add configuration to `FEATURE_FLAGS_CONFIG`
3. Use the feature flag in your components
4. Update this documentation

Example:

```typescript
// In src/lib/feature-flags.ts
export type FeatureFlag =
  | 'home.newFeature' // Add here
  | ...;

export const FEATURE_FLAGS_CONFIG: Record<FeatureFlag, FeatureFlagConfig> = {
  'home.newFeature': {
    key: 'home.newFeature',
    defaultEnabled: true,
    description: 'New homepage feature',
    category: 'homepage',
  },
  // ...
};
```

## Security Considerations

- Feature flags are **public** and exposed via API endpoint
- Do not use feature flags for security controls
- Feature flags control **visibility**, not **permissions**
- Use authentication/authorization for access control

