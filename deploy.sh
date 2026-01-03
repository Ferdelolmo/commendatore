#!/bin/bash

# Abort on errors
set -e

# Build
echo "Building..."
npm run build

# Navigate into the build output directory
cd dist

# Initialize a new git repo
git init
git checkout -b gh-pages

# Add all files
git add -A

# Commit
git commit -m "deploy"

# Push to the 'gh-pages' branch of the original repository
# We use the remote URL from the parent directory
REMOTE_URL=$(git -C .. remote get-url origin)

echo "Pushing to $REMOTE_URL..."
git push -f $REMOTE_URL gh-pages

cd -
echo "Deployed to gh-pages!"
