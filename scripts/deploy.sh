#!/bin/bash
# Deployment script for cPanel
# Usage: ./scripts/deploy.sh [branch]
# Example: ./scripts/deploy.sh main

set -e  # Exit on error

# Default to current branch, or 'main' if not in git repo
BRANCH=${1:-$(git branch --show-current 2>/dev/null || echo "main")}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting deployment from branch: $BRANCH"
echo "📁 Working directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Please initialize git first."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Switching from $CURRENT_BRANCH to $BRANCH"
    git checkout "$BRANCH"
fi
git pull origin "$BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: Uncommitted changes detected. Stashing..."
    git stash
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Build application
echo "🏗️  Building application..."
npm run build:cpanel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your Node.js application in cPanel Node.js Selector"
echo "   2. Check server logs for any errors"
echo "   3. Test your application"
echo ""
echo "💡 Tip: If you have uncommitted changes, restore them with: git stash pop"
