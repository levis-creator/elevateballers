#!/bin/bash

# cPanel Installation Fix Script
# Run this on your cPanel terminal

echo "========================================="
echo "cPanel Node.js Installation Fix"
echo "========================================="
echo ""

# Navigate to project directory
cd ~/prod || { echo "Error: ~/prod directory not found"; exit 1; }

echo "Step 1: Cleaning up old installations..."
rm -rf node_modules
rm -f package-lock.json
echo "✓ Cleanup complete"
echo ""

echo "Step 2: Clearing npm cache..."
npm cache clean --force
echo "✓ Cache cleared"
echo ""

echo "Step 3: Installing dependencies..."
echo "This may take several minutes. Please be patient..."
echo ""

# Try different installation methods in order of preference
if npm install --omit=dev --prefer-offline --no-audit --no-fund; then
    echo "✓ Installation successful!"
elif npm install --production --prefer-offline --no-audit; then
    echo "✓ Installation successful (production mode)!"
elif npm ci --production --prefer-offline; then
    echo "✓ Installation successful (using npm ci)!"
else
    echo "❌ Installation failed. Please use local installation method."
    echo ""
    echo "Next steps:"
    echo "1. Install dependencies on your local machine"
    echo "2. Compress node_modules: tar -czf node_modules.tar.gz node_modules/"
    echo "3. Upload node_modules.tar.gz to ~/prod via File Manager"
    echo "4. Extract: tar -xzf node_modules.tar.gz"
    exit 1
fi

echo ""
echo "Step 4: Generating Prisma client..."
npx prisma generate || echo "⚠ Prisma generation failed (you may need to run this manually)"

echo ""
echo "========================================="
echo "✓ Installation Complete!"
echo "========================================="
echo ""
echo "You can now start your application with:"
echo "  npm start"
echo ""
