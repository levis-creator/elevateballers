#!/bin/bash
# Quick update script - pulls and rebuilds
# Usage: ./scripts/update.sh

set -e  # Exit on error

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Detect current branch
CURRENT_BRANCH=$(git branch --show-current || echo "main")
echo "📥 Pulling latest changes from branch: $CURRENT_BRANCH..."
git pull origin "$CURRENT_BRANCH"

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🏗️  Building..."
npm run build:cpanel

echo ""
echo "✅ Update complete!"
echo "💡 Don't forget to restart your app in Node.js Selector"
