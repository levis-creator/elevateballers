# Step-by-Step: Apply Winner Migration to Production

## Current Status
❌ **Migration NOT applied** - The `winner_id` column does not exist in your production database.

## Quick Steps (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. Log in with your Supabase account
3. Select your project: **zjnlvnyjsidnelgciqmz**

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click the **"New query"** button (top right)

### Step 3: Copy the SQL
Copy this entire SQL block:

```sql
-- Add winner_id column to matches table
ALTER TABLE "matches" ADD COLUMN "winner_id" TEXT;

-- Create index for performance
CREATE INDEX "matches_winner_id_idx" ON "matches"("winner_id");

-- Add foreign key constraint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Step 4: Paste and Run
1. Paste the SQL into the SQL Editor
2. Click the **"Run"** button (or press `Ctrl+Enter`)
3. Wait for the success message: ✅ "Success. No rows returned"

### Step 5: Verify (Optional)
Run this verification query to confirm:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'matches' AND column_name = 'winner_id';
```

You should see:
- `column_name`: winner_id
- `data_type`: text
- `is_nullable`: YES

## What This Migration Does

1. ✅ Adds `winner_id` column to `matches` table
2. ✅ Creates an index for fast queries
3. ✅ Links `winner_id` to `teams.id` with foreign key

## After Migration

Once applied, the winner tracking feature will automatically:
- Calculate winners when matches end
- Handle draws (ties) correctly
- Display winner information in the UI

## Troubleshooting

**Error: "column already exists"**
- ✅ Migration was already applied - you're all set!

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check that you have admin access to the database

**Error: "relation teams does not exist"**
- This shouldn't happen, but verify your `teams` table exists

## Need Help?

After running the migration, I can verify it was applied successfully. Just let me know!
