# Fix Script Permission Denied Error

## The Problem
```bash
./scripts/deploy.sh
bash: ./scripts/deploy.sh: Permission denied
```

The script file doesn't have execute permissions.

## Solution: Add Execute Permissions

### Option 1: Make Script Executable (Recommended)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Option 2: Run with Bash Explicitly

```bash
bash scripts/deploy.sh
```

### Option 3: Run with Sh

```bash
sh scripts/deploy.sh
```

## Check Current Permissions

```bash
ls -la scripts/deploy.sh
```

You'll see something like:
```
-rw-r--r-- 1 user user 1234 Jan 29 18:00 scripts/deploy.sh
```

The `-rw-r--r--` means:
- Owner: read/write (no execute)
- Group: read only
- Others: read only

After `chmod +x`, it should show:
```
-rwxr-xr-x 1 user user 1234 Jan 29 18:00 scripts/deploy.sh
```

The `x` means executable.

## Make All Scripts Executable

If you have multiple scripts:

```bash
chmod +x scripts/*.sh
```

## Verify It Works

```bash
ls -la scripts/deploy.sh
./scripts/deploy.sh
```

## Common Permission Issues

### If chmod doesn't work:
- Check if you're the file owner: `ls -la scripts/deploy.sh`
- Check filesystem permissions (some systems mount with `noexec`)
- Try: `chmod 755 scripts/deploy.sh` (more explicit)

### If script still fails:
- Check shebang line: `head -1 scripts/deploy.sh` (should be `#!/bin/bash` or `#!/usr/bin/env bash`)
- Check file encoding (should be Unix line endings)
- Check for syntax errors: `bash -n scripts/deploy.sh`

## Quick Fix Command

```bash
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

This makes it executable and runs it in one command.
