#!/bin/bash
set -e

echo "=== FreEstream Build ==="

# Clean
echo "Cleaning dist..."
rm -rf dist release

# Build main process
echo "Building main process..."
npx tsc -p tsconfig.main.json

# Build renderer
echo "Building renderer..."
npx vite build

# Copy preload (already compiled by tsc)
echo "Build complete!"
echo ""
echo "To run in dev mode:  npm run dev && npm start -- --dev"
echo "To package:          npm run dist"
