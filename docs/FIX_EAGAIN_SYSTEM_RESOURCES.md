# Fix EAGAIN Error - System Resource Limits

## The Problem
```
Error: spawn /opt/alt/alt-nodejs20/root/usr/bin/node EAGAIN
```

This is a **system resource limit** issue - your cPanel server can't spawn new processes. This is happening before Prisma even tries to generate the client.

## Solution 1: Check System Resources

```bash
# Check available memory
free -h

# Check disk space
df -h

# Check process limits
ulimit -a

# Check current processes
ps aux | wc -l  # Count running processes
```

If memory is low or process count is high, you may need to:
- Free up memory
- Kill unnecessary processes
- Contact cPanel support

## Solution 2: Skip Prisma Generate (If Already Generated)

If Prisma client was already generated earlier, you might not need to regenerate:

```bash
# Check if Prisma client exists
ls -la node_modules/.prisma/client/ 2>/dev/null && echo "✅ Prisma client exists" || echo "❌ Not found"

# Check if it's in the global location
ls -la /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/client/ 2>/dev/null && echo "✅ Found" || echo "❌ Not found"
```

If the client exists, you can skip generation and just build/run your app.

## Solution 3: Increase Process Limits (If Possible)

```bash
# Check current limits
ulimit -a

# Try to increase (may require admin/sudo)
ulimit -u 4096  # Increase max user processes
ulimit -n 4096  # Increase max open files

# Then try again
npx prisma generate
```

**Note:** On cPanel, you may not have permission to change these limits.

## Solution 4: Generate Prisma Client Locally, Then Upload

Since your local machine doesn't have these limits:

1. **On your local machine:**
```bash
cd /path/to/your/project
npx prisma generate
```

2. **Upload the generated client:**
```bash
# Upload node_modules/.prisma/client/ to your cPanel server
# Or upload the entire node_modules/.prisma/ folder
```

3. **On cPanel server, skip generation:**
```bash
# Modify package.json postinstall script temporarily
# Or just skip the postinstall hook
npm install --ignore-scripts
```

## Solution 5: Use Prisma Generate with Different Approach

Try generating without telemetry/checkpoint:

```bash
# Disable Prisma telemetry
export PRISMA_TELEMETRY_DISABLED=1
export CHECKPOINT_DISABLE=1

# Try generating
npx prisma generate
```

Or modify the command:

```bash
CHECKPOINT_DISABLE=1 PRISMA_TELEMETRY_DISABLED=1 npx prisma generate
```

## Solution 6: Contact cPanel Support

If none of the above work, this is a **server resource limit issue** that needs to be fixed at the hosting level:

1. **Contact your hosting provider/cPanel support**
2. **Explain:** "Getting EAGAIN errors when trying to spawn Node.js processes"
3. **Ask them to:**
   - Check system resource limits
   - Increase process limits for your account
   - Check if server is overloaded
   - Verify Node.js installation

## Solution 7: Work Around - Use Pre-Generated Client

If Prisma client was generated before, you can:

1. **Check if client exists:**
```bash
find . -name "index.d.ts" -path "*/@prisma/client/*" 2>/dev/null
```

2. **If found, skip generation in build:**
   - Temporarily remove `prisma generate` from `package.json` scripts
   - Or use `npm install --ignore-scripts`

3. **Build without regenerating:**
```bash
npm run build:cpanel --ignore-scripts
```

## Recommended Approach

**For now:**
1. ✅ Check if Prisma client already exists (it was generated earlier)
2. ✅ If it exists, skip generation and proceed with build
3. ✅ If it doesn't exist, try Solution 4 (generate locally, upload)

**Long-term:**
- Contact cPanel support about system resource limits
- Consider upgrading hosting plan if limits are too restrictive

## Quick Check Commands

```bash
# 1. Check if Prisma client exists
ls -la node_modules/.prisma/client/ 2>/dev/null || ls -la /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/client/ 2>/dev/null

# 2. Check system resources
free -h
ulimit -a

# 3. Check current processes
ps aux | wc -l

# 4. Try with telemetry disabled
CHECKPOINT_DISABLE=1 PRISMA_TELEMETRY_DISABLED=1 npx prisma generate
```
