#!/bin/bash

# Abort on errors
set -e

# Build
echo "Building..."
npm run build

# Add all files (source changes + the rebuilt docs/ folder)
git add .

# Commit changes (don't fail if there's nothing to commit)
git commit -m "deploy: build application to docs for GitHub Pages" || true

# Push to the 'main' branch
echo "Pushing to main..."
git push origin main

echo "Deployed to main!"
