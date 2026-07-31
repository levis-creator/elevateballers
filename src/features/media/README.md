# Media Feature

The media feature is the application’s central library for images, video, audio, and other uploaded files. It owns the media domain, media-management UI, folder association, storage abstraction, and media CRUD behavior.

New media functionality belongs under `src/features/media`. The older CMS media paths are compatibility shims for existing imports and should not contain new implementations.

## What the feature provides

- Media library and gallery views.
- Admin upload, preview, edit, rename, tag, move, duplicate, download, feature, and delete actions.
- Public image, audio, and video rendering.
- Media types: `IMAGE`, `VIDEO`, `AUDIO`, and `DOCUMENT`.
- Folder-based organization and privacy metadata.
- Media metadata: title, URL, thumbnail, file path, MIME type, size, compression data, tags, uploader, and featured status.
- Batch upload support for images, video, and audio.
- Permission-protected media APIs.
- Compatibility with existing Supabase-backed files and new Cloudflare R2 files.

## Architecture

```text
Presentation (React, hooks, Zustand)
        ↓
Application (media use cases)
        ↓
Data (Prisma queries/mutations and storage adapters)
        ↓
Database + file storage (MariaDB/MySQL, Supabase legacy files, or R2)
```

### Directories

```text
src/features/media/
├── application/                 # Use cases exposed to routes and adapters
├── data/datasources/             # Prisma queries, mutations, and repositories
├── domain/entities/              # Media entities and folder constants
├── domain/usecases/              # Media business utilities
├── presentation/admin/           # Admin gallery and management UI
├── presentation/components/      # Public media UI
├── presentation/hooks/           # Media operations and interaction hooks
├── presentation/stores/          # Media gallery state
├── types.ts                      # Canonical media types
└── README.md
```

## Database model

The `folders` and `media` tables are application database tables accessed through Prisma. They are not Supabase Storage tables.

Each media record may reference one folder through `media.folderId`:

```text
folders.id  ←  media.folderId
```

The folder is created once and reused. Uploading ten player photos creates one `players` folder and ten media rows linked to that folder.

Default module folders are:

- `general`
- `players`
- `teams`
- `news`
- `staff`
- `leagues`
- `matches`
- `documents`

## Upload flow

### Media library upload

1. The media page selects a folder or falls back to `general`.
2. The client sends the file to `POST /api/media/batch-upload`.
3. The endpoint authenticates the user with `media:batch_upload`.
4. The folder is looked up or created in `folders`.
5. The file is written through `saveFile()`.
6. A `media` row is created with the resulting URL, file path, folder ID, type, size, and uploader.
7. The response returns the media record and the gallery refreshes.

### Feature-specific upload

Feature forms should send their canonical folder name to `POST /api/upload/image` or the appropriate media endpoint. For example, the player form sends `players`:

```text
Player photo → players folder → media.folderId → player image URL saved on player
```

Use the shared constants in `domain/entities/mediaFolders.ts` instead of hard-coded folder names.

## Storage behavior

The database stores both the file URL and the logical file path. Storage is selected by `STORAGE_TYPE`.

### New files

New uploads use Cloudflare R2 when configured:

```env
STORAGE_TYPE=r2
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=elevateballers
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_URL=https://media.example.com
```

R2 object keys use the folder prefix:

```text
public/players/filename.jpg
private/players/filename.jpg
public/teams/logo.png
```

R2 has prefixes rather than real directories. The initialization command creates `.keep` objects so the prefixes are visible in the dashboard:

```bash
npm run initialize:r2-media-folders
```

### Existing files

Existing records with Supabase URLs remain on Supabase. They continue to display and support CRUD operations. The application identifies legacy records from their persisted Supabase URL and routes deletion, duplication, cleanup, and private-file reads appropriately.

This allows a phased migration: no bulk file migration is required before using R2 for new uploads.

## Folder CRUD synchronization

Folder operations are synchronized with R2 for R2-backed objects:

- Create: creates the database folder and an R2 prefix.
- Rename or privacy change: moves R2 objects to the new prefix and updates related media paths and URLs.
- Delete: removes an empty R2 prefix. Folders containing media cannot be deleted.

Legacy Supabase objects are not moved into R2 when a folder is renamed; their existing Supabase URLs remain valid.

## Important APIs

- `GET /api/media` — permission-protected media listing.
- `POST /api/media` — create a URL-based media record.
- `GET /api/media/:id` — retrieve a media record.
- `PUT /api/media/:id` — update metadata.
- `DELETE /api/media/:id` — delete a media record and its unshared file.
- `POST /api/media/batch-upload` — upload files and create media rows.
- `POST /api/upload/image` — feature-form image upload and media-row creation.
- `/api/folders` — folder listing and creation.
- `/api/folders/:id` — folder update and deletion.

All mutating routes require the relevant RBAC permission.

## Troubleshooting

- If a file exists in R2 but no media row exists, inspect the upload response and server logs. The database insert occurs after the storage write.
- If a folder exists but no media rows exist, the folder was probably created before a storage or database failure.
- If `SignatureDoesNotMatch` appears, verify that the R2 access key and secret belong to the same API token and Cloudflare account. Never commit or share credentials.
- Standalone scripts load `.env` through `dotenv/config`; application runtime loads environment variables through the shared helper.
- Verify media and folder rows in the database configured by `DATABASE_URL`, not in the Supabase Storage dashboard.
