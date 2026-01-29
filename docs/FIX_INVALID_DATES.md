# Fix Invalid Dates Error

## Problem

You're seeing this error:
```
Error fetching news articles: RangeError: Invalid time value
    at Date.toISOString (<anonymous>)
    at file:///home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/adapter-mariadb/dist/index.mjs:113:56
```

## Root Cause

MySQL/MariaDB allows invalid dates like `'0000-00-00 00:00:00'` which JavaScript `Date` objects cannot parse. When Prisma tries to convert these dates to ISO strings, it throws a `RangeError`.

This commonly happens when:
- Data was migrated from another database system
- Dates were set to default MySQL zero dates
- NULL dates were incorrectly stored as zero dates

## Solution

### Step 1: Fix Invalid Dates in Database

Run the fix script to clean up invalid dates:

**Via SSH:**
```bash
cd /home/elevateb/test.dev  # or your domain directory
export DATABASE_URL="mysql://user:password@host:3306/database"
npm run fix:dates
```

**What it does:**
- Finds all dates with `'0000-00-00 00:00:00'` or dates before 1970
- Sets them to `NULL` (which is safe for JavaScript)
- Fixes dates in:
  - `news_articles.published_at`
  - `match_events.undone_at`
  - `match_periods.end_time`
  - All other DateTime fields

### Step 2: Verify Fix

After running the script, check the output:
```
🔍 Starting to fix invalid dates in database...
📰 Fixing news_articles.published_at...
   ✅ Fixed X news articles
...
✅ All invalid dates have been fixed!
```

### Step 3: Restart Application

Restart your Node.js application in cPanel:
- Go to **Node.js Selector** → Your Application
- Click **Restart Application**

## Prevention

The code now includes:
1. **Date validation** - Filters out articles with invalid dates before returning
2. **Error handling** - Catches date errors gracefully and returns empty arrays instead of crashing
3. **Logging** - Warns when invalid dates are detected

## Manual SQL Fix (Alternative)

If you prefer to fix dates manually via SQL:

```sql
-- Fix news_articles.published_at
UPDATE news_articles 
SET published_at = NULL 
WHERE published_at = '0000-00-00 00:00:00' 
   OR published_at < '1970-01-01 00:00:00';

-- Fix match_events.undone_at
UPDATE match_events 
SET undone_at = NULL 
WHERE undone_at = '0000-00-00 00:00:00' 
   OR undone_at < '1970-01-01 00:00:00';

-- Fix match_periods.end_time
UPDATE match_periods 
SET end_time = NULL 
WHERE end_time = '0000-00-00 00:00:00' 
   OR end_time < '1970-01-01 00:00:00';
```

## Testing

After fixing:
1. Visit your news page: `http://test.elevateballers.com/news`
2. Check server logs - should see no more "Invalid time value" errors
3. Articles should load normally

## Notes

- The fix script is **safe** - it only sets invalid dates to `NULL`
- Articles with `NULL` published_at will still work, they just won't appear in date-sorted lists
- The application will continue to work even if some dates are invalid (they'll be filtered out)
