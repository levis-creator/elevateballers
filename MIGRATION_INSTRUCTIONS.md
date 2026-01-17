# Production Migration Instructions - Add Match Winner

## Quick Method: Supabase SQL Editor (Recommended)

Since Prisma connection is having issues, the easiest way is to run the migration directly in Supabase:

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in and select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration SQL**
   ```sql
   -- AlterTable
   -- Add winner_id column to matches table
   ALTER TABLE "matches" ADD COLUMN "winner_id" TEXT;

   -- CreateIndex
   CREATE INDEX "matches_winner_id_idx" ON "matches"("winner_id");

   -- AddForeignKey
   -- Add foreign key constraint for winner relation
   ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   ```

4. **Run the Migration**
   - Click "Run" or press Ctrl+Enter
   - Wait for success confirmation

5. **Verify the Migration**
   - Check that the `winner_id` column was added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'matches' AND column_name = 'winner_id';
   ```

6. **Regenerate Prisma Client** (on your local machine)
   ```bash
   npx prisma generate
   ```

## Alternative: Fix Prisma Connection

If you want to use Prisma migrate deploy, you need to fix the connection:

### Option 1: Add SSL to Prisma Schema

Add SSL configuration to `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

Then use connection string with SSL:
```
DATABASE_URL="postgresql://postgres.zjnlvnyjsidnelgciqmz:Elevatedb1234!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true"
```

### Option 2: Use Direct Connection (if IP whitelisted)

If your IP is whitelisted in Supabase:
```
DATABASE_URL="postgresql://postgres:Elevatedb1234!@db.zjnlvnyjsidnelgciqmz.supabase.co:5432/postgres?sslmode=require"
```

### Option 3: Use Connection Pooling Port

Try port 6543 for connection pooling:
```
DATABASE_URL="postgresql://postgres.zjnlvnyjsidnelgciqmz:Elevatedb1234!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

## After Migration

Once the migration is applied:

1. ✅ The `winner_id` column will be added to `matches` table
2. ✅ Index will be created for performance
3. ✅ Foreign key constraint will link to `teams` table
4. ✅ Winner tracking will work automatically when matches end

## Troubleshooting

**If you get "column already exists" error:**
- The migration was already applied, you can skip it

**If you get "permission denied" error:**
- Make sure you're using a service role key or have proper permissions

**If foreign key constraint fails:**
- Check that the `teams` table exists and has an `id` column
