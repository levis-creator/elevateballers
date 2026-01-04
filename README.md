# Elevate Ballers League Website

A modern, feature-rich basketball league website built with Astro and React. This platform serves as the central hub for the Elevate Ballers League, providing comprehensive information about teams, players, matches, statistics, and league news.

## 🎯 Purpose

The Elevate Ballers website is designed to:

- **Showcase League Information**: Display match schedules, results, team profiles, and league standings
- **Highlight Players & Teams**: Feature player of the week, player statistics, team rosters, and performance metrics
- **Publish News & Media**: Share articles, interviews, match reports, and media galleries
- **Engage Community**: Provide registration functionality, sponsor showcases, and social sharing
- **Track Statistics**: Display comprehensive match statistics, player performance metrics, and league-wide analytics

## 🚀 Tech Stack

- **Framework**: [Astro](https://astro.build/) v5.16.6 - Static site generator with component islands
- **UI Library**: [React](https://react.dev/) v19.2.3 - For interactive components
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) v5.0.9 - Lightweight state management
- **Styling**: Bootstrap 5.3.8, Custom CSS
- **Icons**: Font Awesome 7.1.0
- **Language**: TypeScript with strict mode
- **Build Tool**: Astro CLI

## 📁 Project Structure

```
elevateballers/
├── public/                 # Static assets
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript libraries
│   ├── images/           # Image assets
│   └── fonts/            # Font files
├── src/
│   ├── assets/           # Source assets
│   ├── components/       # Shared components
│   ├── features/         # Feature-based modules
│   │   ├── fixtures/     # Match fixtures feature
│   │   ├── home/         # Homepage feature
│   │   ├── layout/       # Layout components
│   │   ├── media/        # Media gallery feature
│   │   ├── standings/    # League standings feature
│   │   └── team/         # Team pages feature
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   ├── shared/           # Shared utilities & components
│   ├── store/            # Global state management
│   └── styles/           # Global styles
├── astro.config.mjs      # Astro configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🏗️ Architecture

### Feature-Based Organization

The project follows a **feature-based architecture** where related components, stores, data, and types are grouped together:

```
src/features/[feature-name]/
├── components/      # Feature-specific components
├── stores/          # Feature-specific state (Zustand)
├── data/            # Static data and utilities
├── types.ts         # TypeScript type definitions
└── README.md        # Feature documentation
```

### Component Architecture

- **Astro Components** (`.astro`): Static, server-rendered components for layout and static content
- **React Components** (`.tsx`): Interactive, client-side components with state management
- **Hybrid Approach**: Astro for static content, React for interactivity (component islands)

### State Management

State is managed using **Zustand** with a feature-based approach:

- **Global Store**: `src/store/useStore.ts` - Shared application state
- **Feature Stores**: Each feature can have its own store (e.g., `useNewsStore`, `useMediaStore`)
- **Type Safety**: Full TypeScript support with strict typing

## 📦 Features

### Homepage Features

- **Post Slider**: Hero carousel displaying featured posts
- **News Ticker**: Scrolling ticker with latest news items
- **Marquee Matchup**: Highlighted upcoming match display
- **Next Match Carousel**: Upcoming matches carousel
- **Latest News**: News grid with category filtering (All, Interviews, Championships, Match report, Analysis)
- **Player of the Week**: Featured player showcase
- **Stats Section**: League statistics (matches, players, teams, awards)
- **Media Gallery**: Image and video gallery with filtering
- **Sponsors**: Sponsor carousel

### Layout Components

- **TopBar**: Top navigation with login/signup, cart, and social links
- **Header**: Main header with logo, navigation menu, and search
- **MobileMenu**: Responsive mobile navigation with hamburger menu
- **Footer**: Footer with contact info, newsletter, and social links

### Pages

- **Home** (`/`): Main landing page with all homepage features
- **Standings** (`/standings`): League standings and rankings
- **Players** (`/players`): Player directory and profiles
- **Upcoming Fixtures** (`/upcoming-fixtures`): Match schedule
- **League Registration** (`/league-registration`): Registration form
- **About Club** (`/about-club`): About page
- **Contacts** (`/contacts`): Contact information

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or use `pnpm`/`yarn`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd elevateballers
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:4321`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |

## 🎛️ Feature Flags

The application includes a comprehensive feature flags system that allows you to enable or disable modules and features without modifying code.

### Quick Start

Control features via environment variables in `.env`:

```bash
# Disable specific features
FEATURE_FLAG_HOME_POST_SLIDER=false
FEATURE_FLAG_HOME_NEWS_TICKER=false

# Disable entire modules
FEATURE_FLAG_MODULE_MEDIA=false
FEATURE_FLAG_MODULE_REGISTRATION=false
```

### Usage

**Server-Side (Astro):**
```astro
---
import FeatureGate from "../components/FeatureGate.astro";
---

<FeatureGate feature="home.postSlider">
  <PostSlider client:load />
</FeatureGate>
```

**Client-Side (React):**
```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function MyComponent() {
  const isEnabled = useFeatureFlag('home.postSlider');
  return isEnabled ? <PostSlider /> : null;
}
```

For complete documentation, see [Feature Flags Documentation](./src/lib/FEATURE_FLAGS.md).

## 💻 Development Guidelines

### Code Organization Principles

The project follows these core principles:

- **KISS (Keep It Simple, Stupid)**: Prefer simple, straightforward solutions over complex ones
- **SOLID Principles**: Follow SOLID design principles for maintainability and scalability
  - **Single Responsibility**: Each component has one clear purpose
  - **Open/Closed**: Components are open for extension but closed for modification
  - **Liskov Substitution**: Components can be substituted with their implementations
  - **Interface Segregation**: Use specific interfaces rather than general ones
  - **Dependency Inversion**: Depend on abstractions, not concretions
- **DRY (Don't Repeat Yourself)**: Reuse components and utilities to avoid code duplication
- **Feature-Based Architecture**: Group related code by feature, not by type, for better organization and maintainability

### Professional State Management

- Use Zustand stores for component state that needs to be shared
- Keep state as local as possible - only lift state when necessary
- Use TypeScript for type-safe state management
- Follow the feature-based store pattern (stores in feature directories)

### Component Development

#### Creating a New Feature

1. Create feature directory: `src/features/[feature-name]/`
2. Add components: `components/`
3. Add state management: `stores/` (if needed)
4. Add data: `data/`
5. Define types: `types.ts`
6. Add documentation: `README.md`

#### Component Patterns

**Astro Component (Static)**:
```astro
---
// Component logic
const title = "Hello";
---

<div>
  <h1>{title}</h1>
</div>
```

**React Component (Interactive)**:
```tsx
import { useStore } from '../stores/useStore';

export default function MyComponent() {
  const { state, setState } = useStore();
  
  return <div>{/* JSX */}</div>;
}
```

**Using React in Astro**:
```astro
---
import MyReactComponent from '../components/MyComponent';
---

<MyReactComponent client:load />
```

### State Management

#### Creating a Feature Store

```typescript
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

#### Using Stores

```tsx
import { useMyStore } from '../stores/useMyStore';

export default function Component() {
  const { value, setValue } = useMyStore();
  // Component logic
}
```

### TypeScript

- **Strict Mode**: Enabled in `tsconfig.json`
- **Type Definitions**: Define types in feature `types.ts` files
- **Type Safety**: All components and functions should be properly typed

### Data Management

- **Static Data**: Store in `data/` directories within features
- **Data Types**: Define interfaces in `types.ts`
- **Data Utilities**: Create utility functions for filtering, sorting, etc.

Example:
```typescript
// data/myData.ts
import type { MyType } from '../types';

export const myData: MyType[] = [
  // data items
];

export function filterMyData(data: MyType[], filter: string): MyType[] {
  return data.filter(item => item.category === filter);
}
```

## 🎨 Styling

- **Bootstrap 5**: Used for base styling and grid system
- **Custom CSS**: Feature-specific styles in `public/css/`
- **Component Styles**: Scoped styles in component files
- **Theme Styles**: Global theme in `src/styles/theme.css`

## 📊 State Management Details

### Global Store (`src/store/useStore.ts`)

Manages application-wide state:
- Mobile menu visibility
- News filtering
- Media filtering
- Cart state
- Authentication state

### Feature Stores

Each feature can have its own store:
- `useNewsStore`: News filtering state
- `useMediaStore`: Media gallery filtering
- `useCarouselStore`: Carousel/slider state
- `useLayoutStore`: Layout UI state (mobile menu)

## 🧪 Testing

Currently, the project does not include automated tests. Consider adding:
- Unit tests for utilities and stores
- Component tests for React components
- E2E tests for critical user flows

## 🚀 Build & Deployment

### Production Build

```bash
npm run build
```

This generates a static site in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deployment

The site can be deployed to any static hosting service:
- **Vercel**: Automatic deployments from Git
- **Netlify**: Drag-and-drop or Git integration
- **GitHub Pages**: Static site hosting
- **AWS S3 + CloudFront**: Scalable static hosting

## 📝 Documentation

### Feature Documentation

Each feature has its own README:
- `src/features/home/README.md` - Homepage feature documentation
- `src/features/layout/README.md` - Layout components documentation
- `src/features/media/README.md` - Media gallery documentation
- `src/store/README.md` - State management documentation

### Project History

See `REFACTORING_SUMMARY.md` for details about the refactoring from a monolithic structure to the current feature-based architecture.

## 🤝 Contributing

1. Follow the established code organization patterns
2. Maintain TypeScript type safety
3. Update documentation when adding features
4. Follow KISS, SOLID, and DRY principles
5. Test changes locally before committing

## 📄 License

[Add your license information here]

## 🔗 Links

- **Website**: https://elevateballers.com
- **Astro Documentation**: https://docs.astro.build
- **React Documentation**: https://react.dev
- **Zustand Documentation**: https://docs.pmnd.rs/zustand

---

Built with ❤️ for the Elevate Ballers League
