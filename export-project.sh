#!/bin/bash

# Script to prepare the project for export from Replit
# This script:
# 1. Creates a copy of the project
# 2. Removes Replit-specific dependencies and configurations
# 3. Adds standard configurations for deployment elsewhere

echo "Preparing project for export from Replit..."

# Create an export directory
EXPORT_DIR="./export-project"
mkdir -p $EXPORT_DIR

# Copy all project files except node_modules, .git, and the export directory itself
echo "Copying project files..."
rsync -av --progress ./ $EXPORT_DIR \
  --exclude node_modules \
  --exclude .git \
  --exclude export-project \
  --exclude .replit \
  --exclude replit.nix

# Enter the export directory
cd $EXPORT_DIR

# Replace vite.config.ts with the export version
echo "Updating Vite configuration..."
cp export-vite.config.ts vite.config.ts

# Replace the Replit-specific WebSocket fix with the standard version
echo "Updating WebSocket fix..."
cp client/src/vite-hmr-fix-standard.ts client/src/vite-hmr-fix.ts

# Update package.json to remove Replit-specific dependencies
echo "Updating package.json..."
# Use jq to manipulate the package.json if available
if command -v jq > /dev/null; then
  # Remove Replit-specific dependencies
  jq 'del(.dependencies."@replit/vite-plugin-shadcn-theme-json")' package.json > temp.json && mv temp.json package.json
  jq 'del(.dependencies."@replit/vite-plugin-runtime-error-modal")' package.json > temp.json && mv temp.json package.json
  jq 'del(.dependencies."@replit/vite-plugin-cartographer")' package.json > temp.json && mv temp.json package.json
else
  echo "Warning: jq not available. Manual editing of package.json required to remove Replit dependencies."
  echo "Please remove @replit/vite-plugin-shadcn-theme-json, @replit/vite-plugin-runtime-error-modal, and @replit/vite-plugin-cartographer from dependencies."
fi

# Create a standard theme.json if it doesn't exist
if [ ! -f theme.json ]; then
  echo "Creating standard theme.json..."
  echo '{
  "primary": "#6366f1",
  "variant": "vibrant",
  "appearance": "system",
  "radius": 0.5
}' > theme.json
fi

# Remove Replit-specific files
rm -f .replit replit.nix export-vite.config.ts export-project.sh

# Create a README for deployment instructions
echo "Creating deployment instructions..."
echo "# Advanced Pilot Training Platform

This is the exported version of the Advanced Pilot Training Platform from Replit, prepared for deployment to other environments.

## Deployment Instructions

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`
   npm run build
   \`\`\`

4. Start the production server:
   \`\`\`
   npm start
   \`\`\`

## Configuration

- Database: Make sure to set the DATABASE_URL environment variable to point to your PostgreSQL database.
- Environment variables: Copy the .env.local file and update values as needed for your deployment environment.

## Important Note

This version has been modified to remove Replit-specific dependencies and configurations. If you encounter any issues,
please check the WebSocket configuration in client/src/vite-hmr-fix.ts and the Vite configuration in vite.config.ts.
" > README.export.md

echo "Project prepared for export at $EXPORT_DIR"
echo "Please review the code and make any necessary adjustments before deploying."