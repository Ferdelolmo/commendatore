---
description: Build and deploy the application to GitHub Pages
---

1. Build the production assets (updates `docs/` folder)
// turbo
npm run build

2. Stage all changes including the new build
// turbo
git add .

3. Commit the changes
git commit -m "chore: deploy updates"

4. Push to remote
// turbo
git push
