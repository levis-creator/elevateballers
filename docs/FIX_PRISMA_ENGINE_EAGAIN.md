# Fix Prisma Schema Engine EAGAIN Error

## The Problem
Both `prisma migrate deploy` and `prisma db push` fail with:
```
Error: Schema engine exited. Error: Command failed with EAGAIN
spawn /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x EAGAIN
```

This is a system-level issue with the Prisma schema engine binary.

## Solution 1: Fix Binary Permissions (Try First)

```bash
# Check current permissions
ls -la /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x

# Make it executable
chmod +x /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x

# Try again
npx prisma db push
```

## Solution 2: Check System Resources

```bash
# Check available memory
free -h

# Check disk space
df -h

# Check process/file limits
ulimit -a

# Check if binary exists and is readable
file /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x
```

If memory is low or limits are too restrictive, you may need to:
- Free up memory
- Increase ulimit values
- Contact cPanel support

## Solution 3: Reinstall Prisma Engines

```bash
# Remove Prisma engines
rm -rf /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines

# Reinstall
npm install prisma @prisma/client --legacy-peer-deps

# Try again
npx prisma db push
```

## Solution 4: Run SQL Directly (Recommended Workaround)

Since Prisma engine is having issues, just run the SQL directly:

### Via MySQL Command Line:
```bash
mysql -u elevateb_test -p elevateb_test -e "ALTER TABLE teams ADD COLUMN nickname VARCHAR(191) NULL;"
```

### Via phpMyAdmin:
1. Log into cPanel → phpMyAdmin
2. Select database: `elevateb_test`
3. Click **SQL** tab
4. Run:
```sql
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
```

### Verify:
```sql
DESCRIBE teams;
```

You should see `nickname` in the column list.

## Solution 5: Use Different Prisma Binary

If the OpenSSL 1.0.x binary is problematic, try forcing a different one:

```bash
# Set environment variable to use different binary
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
export PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Or try
export PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

# Then try
npx prisma db push
```

## Solution 6: Check Binary Compatibility

```bash
# Check what system you're on
uname -a
cat /etc/os-release

# Check if binary is for correct architecture
file /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x

# Try running binary directly (should show usage)
/home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x --help
```

If the binary won't run directly, it's corrupted or incompatible.

## Recommended Approach

**For now (quick fix):**
1. ✅ Run SQL directly (bypasses Prisma engine completely)
2. ✅ Verify column exists
3. ✅ Your Prisma client is already generated, so your app will work

**Later (fix Prisma):**
1. Try Solution 1 (fix permissions)
2. If that fails, try Solution 3 (reinstall engines)
3. If still failing, contact cPanel support about system resource limits

## Why This Happens

EAGAIN typically means:
- **Resource temporarily unavailable** - System is out of memory, file descriptors, or process slots
- **Binary permissions** - Binary doesn't have execute permission
- **System limits** - ulimit restrictions preventing execution
- **Binary corruption** - Binary file is corrupted or incompatible

Since your Prisma client generated successfully, the schema is valid. The issue is specifically with the schema engine binary that Prisma uses for migrations and schema pushes.
