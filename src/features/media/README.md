# Media Feature

This feature contains media gallery components and functionality.

## Structure

```
src/features/media/
├── components/          # React components
│   └── MediaGallery.tsx    # Media gallery with type tabs
├── stores/              # Zustand stores
│   └── useMediaStore.ts     # Media filtering state
├── data/                # Static data
│   └── mediaData.ts         # Media items data
├── types.ts             # TypeScript type definitions
└── README.md            # This file
```

## Components

### MediaGallery
Media gallery component with type filtering tabs (All, Images, Audio, Video).

## State Management

- **useMediaStore**: Manages media filtering state (active media tab)

## Data

Static data is stored in `data/mediaData.ts`:
- Contains media items (images, audio, video)
- Provides filtering utilities by media type

