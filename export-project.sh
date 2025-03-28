#!/bin/bash

# Advanced Pilot Training Platform - Export Script
# This script prepares the project for deployment outside of Replit
# by replacing Replit-specific files with standard versions

echo "🚀 Advanced Pilot Training Platform - Export Preparation"
echo "==========================================================="

# Create export directory
EXPORT_DIR="export-$(date +%Y%m%d-%H%M%S)"
echo "📁 Creating export directory: $EXPORT_DIR"
mkdir -p $EXPORT_DIR

# Copy all project files to export directory
echo "📋 Copying project files..."
rsync -av --exclude node_modules --exclude .git --exclude $EXPORT_DIR . $EXPORT_DIR/

# Replace Replit-specific files with standard versions
echo "🔄 Replacing Replit-specific files with standard versions..."
cd $EXPORT_DIR

# Replace Vite configuration
if [ -f "export-vite.config.ts" ]; then
  echo "  ✅ Replacing vite.config.ts"
  cp export-vite.config.ts vite.config.ts
else
  echo "  ❌ export-vite.config.ts not found"
fi

# Replace WebSocket implementation
if [ -f "client/src/vite-hmr-fix-standard.ts" ]; then
  echo "  ✅ Replacing WebSocket implementation"
  cp client/src/vite-hmr-fix-standard.ts client/src/vite-hmr-fix.ts
else
  echo "  ❌ client/src/vite-hmr-fix-standard.ts not found"
fi

# Replace routes file
if [ -f "server/routes-standard.ts" ]; then
  echo "  ✅ Replacing routes implementation"
  cp server/routes-standard.ts server/routes.ts
else
  echo "  ❌ server/routes-standard.ts not found"
fi

# Clean HTML files
echo "🧹 Cleaning Replit metadata from HTML files..."
if [ -f "clean-html.js" ]; then
  node clean-html.js
  echo "  ✅ Cleaned HTML files"
else
  echo "  ❌ clean-html.js not found"
fi

if [ -f "clean-index.js" ]; then
  node clean-index.js
  echo "  ✅ Cleaned index.html"
else
  echo "  ❌ clean-index.js not found"
fi

if [ -f "remove-replit-metadata.js" ]; then
  node remove-replit-metadata.js
  echo "  ✅ Removed Replit metadata from all files"
else
  echo "  ❌ remove-replit-metadata.js not found"
fi

# Remove export-specific files
echo "🗑️  Removing export-specific files..."
rm -f export-vite.config.ts
rm -f client/src/vite-hmr-fix-standard.ts
rm -f server/routes-standard.ts
rm -f clean-html.js
rm -f clean-index.js
rm -f remove-replit-metadata.js
rm -f export-project.sh

# Create .env file template
echo "📝 Creating .env.example file..."
cat > .env.example << EOL
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/advanced_pilot_training

# Session
SESSION_SECRET=your-secure-session-secret

# API Keys (if needed)
XAI_API_KEY=your-xai-api-key
EOL

# Create production package.json
echo "📦 Creating production package.json..."
node -e "
const pkg = require('./package.json');
// Remove dev-only scripts
const prodScripts = {
  'start': pkg.scripts.start || 'node dist/server/index.js',
  'build': pkg.scripts.build || 'npm run build:server && npm run build:client',
  'build:client': pkg.scripts['build:client'] || 'vite build',
  'build:server': pkg.scripts['build:server'] || 'tsc -p tsconfig.build.json',
  'db:push': pkg.scripts['db:push'] || 'drizzle-kit push:pg'
};
pkg.scripts = prodScripts;
// Add engines
pkg.engines = { 'node': '>=18.0.0' };
// Add repository
if (!pkg.repository) {
  pkg.repository = {
    'type': 'git',
    'url': 'https://github.com/your-username/advanced-pilot-training-platform.git'
  };
}
// Write modified package.json
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Create production README.md
echo "📄 Creating production README.md..."
cat > README.md << EOL
# Advanced Pilot Training Platform

A cutting-edge aviation training platform leveraging advanced educational technologies to create an adaptive, personalized learning experience for aspiring pilots.

## Features

- Comprehensive training management system
- 3D risk assessment matrix visualizations
- Document processing and OCR capabilities
- AI-powered syllabus generator
- Knowledge graph visualization
- Role-specific dashboards
- Real-time collaboration via WebSockets

## Quick Start

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Set up environment variables (see \`.env.example\`)
4. Initialize database: \`npm run db:push\`
5. Start the application: \`npm run dev\`

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## License

Copyright © 2025 Advanced Pilot Training. All rights reserved.
EOL

# Create a ZIP archive
echo "📦 Creating ZIP archive..."
cd ..
zip -r $EXPORT_DIR.zip $EXPORT_DIR

echo "==========================================================="
echo "✅ Export completed successfully!"
echo "📁 Export directory: $EXPORT_DIR"
echo "📦 ZIP archive: $EXPORT_DIR.zip"
echo "🔍 Next steps:"
echo "  1. Copy the ZIP archive to your deployment environment"
echo "  2. Extract the archive: unzip $EXPORT_DIR.zip"
echo "  3. Follow the instructions in DEPLOYMENT_GUIDE.md"
echo "==========================================================="