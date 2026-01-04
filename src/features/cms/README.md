# CMS Feature Documentation

## Overview

The CMS (Content Management System) feature provides a complete content management solution integrated directly into the Astro application. It allows administrators to manage news articles, matches, players, and media items through a user-friendly admin interface.

## Architecture

The CMS follows the feature-based architecture pattern:

```
src/features/cms/
├── lib/
│   ├── queries.ts      # Database read operations
│   ├── mutations.ts    # Database write operations
│   ├── auth.ts         # Authentication utilities
│   └── errorHandler.ts # Error handling utilities
├── components/
│   ├── Dashboard.tsx           # Admin dashboard
│   ├── AdminLayout.astro        # Admin layout with navigation
│   ├── NewsList.tsx             # News articles list
│   ├── NewsEditor.tsx           # News article editor
│   ├── MatchList.tsx            # Matches list
│   ├── MatchEditor.tsx          # Match editor
│   ├── PlayerList.tsx           # Players list
│   ├── PlayerEditor.tsx         # Player editor
│   ├── MediaGallery.tsx         # Media gallery (admin)
│   ├── MediaEditor.tsx          # Media editor
│   └── LoginForm.tsx            # Admin login form
└── types.ts                     # TypeScript type definitions
```

## Database Schema

The CMS uses Prisma with PostgreSQL. Key models:

- **User**: Admin users with authentication
- **NewsArticle**: News articles with categories
- **Match**: Match fixtures and results
- **Player**: Player profiles with stats
- **Media**: Media items (images, videos, audio)

## API Routes

All API routes are located in `src/pages/api/`:

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current user

### News Articles
- `GET /api/news` - List articles (public: published only, admin: all)
- `POST /api/news` - Create article (admin only)
- `GET /api/news/[id]` - Get single article
- `PUT /api/news/[id]` - Update article (admin only)
- `DELETE /api/news/[id]` - Delete article (admin only)

### Matches
- `GET /api/matches` - List matches (optional status filter)
- `POST /api/matches` - Create match (admin only)
- `GET /api/matches/[id]` - Get single match
- `PUT /api/matches/[id]` - Update match (admin only)
- `DELETE /api/matches/[id]` - Delete match (admin only)

### Players
- `GET /api/players` - List players (optional team filter)
- `POST /api/players` - Create player (admin only)
- `GET /api/players/[id]` - Get single player
- `PUT /api/players/[id]` - Update player (admin only)
- `DELETE /api/players/[id]` - Delete player (admin only)

### Media
- `GET /api/media` - List media items (optional type filter)
- `POST /api/media` - Create media item (admin only)
- `GET /api/media/[id]` - Get single media item
- `PUT /api/media/[id]` - Update media item (admin only)
- `DELETE /api/media/[id]` - Delete media item (admin only)

## Admin Pages

All admin pages are located in `src/pages/admin/`:

- `/admin` - Dashboard
- `/admin/login` - Login page
- `/admin/news` - News management
- `/admin/news/new` - Create news article
- `/admin/news/[id]` - Edit news article
- `/admin/matches` - Matches management
- `/admin/matches/new` - Create match
- `/admin/matches/[id]` - Edit match
- `/admin/players` - Players management
- `/admin/players/new` - Create player
- `/admin/players/[id]` - Edit player
- `/admin/media` - Media management
- `/admin/media/new` - Add media
- `/admin/media/[id]` - Edit media

## Authentication

The CMS uses JWT-based authentication:

1. Admin logs in via `/admin/login`
2. JWT token is stored in HTTP-only cookie
3. Token is validated on each admin API request
4. Admin routes require authentication

### Creating Admin Users

Use the script to create admin users:

```bash
npm run create-admin
```

Or set environment variables:
- `ADMIN_EMAIL` - Admin email (default: admin@elevateballers.com)
- `ADMIN_PASSWORD` - Admin password (default: admin123)
- `ADMIN_NAME` - Admin name (default: Admin User)

## Usage Examples

### Fetching News Articles (Public)

```typescript
const response = await fetch('/api/news?category=Championships');
const articles = await response.json();
```

### Creating News Article (Admin)

```typescript
const response = await fetch('/api/news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Article Title',
    slug: 'article-slug',
    content: 'Article content...',
    category: 'CHAMPIONSHIPS',
    published: true,
  }),
});
```

### Fetching Matches

```typescript
const response = await fetch('/api/matches?status=upcoming');
const matches = await response.json();
```

## Integration with Frontend Components

The CMS is integrated with existing frontend components:

- **LatestNews**: Fetches from `/api/news`
- **PostSlider**: Fetches featured articles from `/api/news`
- **NextMatchCarousel**: Fetches from `/api/matches?status=upcoming`
- **PlayerOfTheWeek**: Fetches from players database
- **MediaGallery**: Fetches from `/api/media`

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Database Migrations

Run migrations:

```bash
npm run db:migrate
```

Generate Prisma Client:

```bash
npm run db:generate
```

Open Prisma Studio:

```bash
npm run db:studio
```

## Best Practices

1. **Always validate input** - API routes validate required fields
2. **Use authentication** - Admin operations require authentication
3. **Handle errors gracefully** - Components include error handling
4. **Type safety** - All operations are type-safe with TypeScript
5. **Follow feature structure** - Keep CMS code in `src/features/cms/`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in `.env` file
- Ensure PostgreSQL is running
- Check database credentials

### Authentication Issues

- Verify `JWT_SECRET` is set
- Check cookie settings in browser
- Ensure admin user exists in database

### API Errors

- Check browser console for error messages
- Verify API route paths are correct
- Ensure authentication token is valid

## Future Enhancements

Potential improvements:

- File upload functionality for media
- Rich text editor for content
- Image optimization
- Search functionality
- Bulk operations
- Content scheduling
- Revision history

