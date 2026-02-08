# Player Contact Information Protection - Implementation Summary

## Overview
This document summarizes all changes made to protect player and team contact information from being exposed in public-facing fields.

## Database Schema Changes

### Player Model (`prisma/schema.prisma`)
Added two new optional fields to store private contact information:
- `email String?` - Player's email address (private)
- `phone String?` - Player's phone number (private)

These fields are separate from the public `bio` field and are only accessible to administrators.

## API Changes

### 1. Player Registration API (`src/pages/api/registration/player.ts`)
**Changes:**
- Removed `email` and `phone` from the `bioParts` construction
- Email and phone are now passed as separate arguments to `createPlayer()`
- Contact info is stored in dedicated private fields instead of the public bio

**Before:**
```typescript
const bioParts = [
  data.email && `Email: ${data.email}`,
  data.phone && `Phone: ${data.phone}`,
  // ... other parts
].filter(Boolean).join('\n');
```

**After:**
```typescript
const bioParts = [
  data.additionalInfo && `Additional Info: ${data.additionalInfo}`,
].filter(Boolean).join('\n');

const player = await createPlayer({
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,  // Separate field
  phone: data.phone,  // Separate field
  // ... other fields
  bio: bioParts || undefined,
});
```

### 2. Team Registration API (`src/pages/api/registration/team.ts`)
**Changes:**
- Removed `contactEmail` and `contactPhone` from team description
- Contact information is managed through Staff records instead

**Before:**
```typescript
const description = [
  leagueName && `League: ${leagueName}`,
  data.coachName && `Coach: ${data.coachName}`,
  data.contactEmail && `Contact Email: ${data.contactEmail}`,
  data.contactPhone && `Contact Phone: ${data.contactPhone}`,
  // ...
].filter(Boolean).join('\n');
```

**After:**
```typescript
const description = [
  leagueName && `League: ${leagueName}`,
  data.coachName && `Coach: ${data.coachName}`,
  data.additionalInfo && `Additional Info: ${data.additionalInfo}`,
].filter(Boolean).join('\n');
```

### 3. Player Query Functions (`src/features/cms/lib/queries.ts`)

#### `getPlayers(teamId?, isAdmin)`
**Changes:**
- Added `isAdmin` parameter (default: `false`)
- Uses Prisma `select` to conditionally include `email` and `phone` fields
- Only includes contact info when `isAdmin` is `true`

```typescript
export async function getPlayers(teamId?: string, isAdmin: boolean = false): Promise<Player[]> {
  const select: any = {
    id: true,
    firstName: true,
    lastName: true,
    // ... other public fields
  };

  // Only include contact info for admins
  if (isAdmin) {
    select.email = true;
    select.phone = true;
  }

  return await prisma.player.findMany({
    where,
    select,
    // ...
  }) as unknown as Player[];
}
```

#### `getPlayerById(id, isAdmin)`
**Changes:**
- Added `isAdmin` parameter (default: `false`)
- Same conditional field selection as `getPlayers`

### 4. Player API Routes

#### `src/pages/api/players/index.ts` (GET handler)
**Changes:**
- Checks if the request is from an admin using `requireAdmin(request)`
- Passes `isAdmin` status to `getPlayers()`

```typescript
export const GET: APIRoute = async ({ request }) => {
  let includeUnapproved = false;
  try {
    await requireAdmin(request);
    includeUnapproved = true; // Admins can see unapproved players and contact info
  } catch {
    includeUnapproved = false;
  }

  const players = await getPlayers(teamId, includeUnapproved);
  // ...
};
```

#### `src/pages/api/players/[id].ts` (GET handler)
**Changes:**
- Checks admin status and passes `isAdmin` flag to `getPlayerById()`

```typescript
export const GET: APIRoute = async ({ params, request }) => {
  let isAdmin = false;
  try {
    await requireAdmin(request);
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  const player = await getPlayerById(params.id!, isAdmin);
  // ...
};
```

## Admin UI Changes

### PlayerEditor Component (`src/features/cms/components/PlayerEditor.tsx`)
**Changes:**
- Added `email` and `phone` to form state
- Fetches email and phone when loading player data
- Displays input fields for email and phone (marked as private)
- Includes email and phone in submission payload

```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',      // Added
  phone: '',      // Added
  height: '',
  weight: '',
  // ... other fields
});
```

## Type Definitions

### `src/features/cms/types.ts`
**Changes:**
- Added `email?: string` and `phone?: string` to `CreatePlayerInput` type
- These fields are available in `UpdatePlayerInput` through `Partial<CreatePlayerInput>`

```typescript
export type CreatePlayerInput = {
  firstName?: string;
  lastName?: string;
  email?: string;     // Added
  phone?: string;     // Added
  height?: string;
  weight?: string;
  // ... other fields
};
```

## Data Cleanup Script

### `scripts/cleanup-private-info.ts`
A utility script to clean up existing data that may have exposed contact information.

**Features:**
- Uses `mysql2` for direct database access (bypasses Prisma client issues)
- Scans all players for `Email:` and `Phone:` patterns in bio
- Extracts contact info and moves it to dedicated fields
- Removes contact info from public bio
- Scans teams for `Contact Email:` and `Contact Phone:` in description
- Removes contact info from team descriptions

**Usage:**
```bash
npm run cleanup:private
```

**What it does:**
1. Connects to database using `DATABASE_URL`
2. Finds all players with contact info in bio
3. Extracts email/phone using regex patterns
4. Updates player records:
   - Moves email to `email` field (if currently empty)
   - Moves phone to `phone` field (if currently empty)
   - Removes contact lines from `bio`
5. Finds all teams with contact info in description
6. Removes contact lines from team `description`
7. Reports summary of updates

## Security Benefits

1. **Separation of Concerns**: Contact information is stored separately from public content
2. **Access Control**: Contact info only returned when explicitly requested by admins
3. **API Security**: All player API endpoints check admin status before including sensitive data
4. **Type Safety**: TypeScript types updated to reflect new fields
5. **Data Migration**: Cleanup script ensures existing data is properly secured

## Testing Checklist

- [ ] Public player pages don't show email/phone
- [ ] Admin player editor shows email/phone fields
- [ ] New player registrations store contact info in separate fields
- [ ] API returns contact info only to authenticated admins
- [ ] Team descriptions don't contain contact information
- [ ] Cleanup script successfully migrates existing data

## Database Migration

After making schema changes, run:
```bash
npx prisma db push
```

This will add the `email` and `phone` columns to the `players` table.

## Notes

- The `bio` field remains public and should not contain sensitive information
- Team contact information is managed through `Staff` records
- The `isAdmin` flag controls visibility of sensitive data throughout the application
- Type assertions (`as unknown as Player[]`) are used in queries due to Prisma's type system limitations with dynamic `select` objects
