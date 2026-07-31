# Media Feature

This feature owns the media domain and its presentation. New media code should be added here rather than under `features/cms`.

## Structure

```
src/features/media/
├── application/         # Use cases exposed to routes and adapters
├── data/                # Prisma-backed repositories and datasources
├── domain/              # Media entities and business types
├── presentation/        # Public/admin React UI, stores, and view models
│   └── admin/            # Extracted media-management UI
├── lib/                 # Compatibility-free media query/mutation helpers
└── README.md
```

## Components

The application layer is the only layer API routes should call for media reads and writes. The data layer owns Prisma and storage-facing persistence details; the domain layer has no framework imports.

## State Management

- **useMediaStore**: Manages media filtering state (active media tab)

## Data

`data/mediaData.ts` is retained as a legacy fixture for the older gallery and should not be used for new features. CMS media paths now only re-export the implementations from this feature for backward compatibility.

Reusable presentation pieces such as `MediaTags` belong in `presentation/admin`; shared formatting, type, and icon behavior belongs in `domain/usecases/mediaUtils`. Query and mutation logic has one canonical implementation under `data/datasources`.

