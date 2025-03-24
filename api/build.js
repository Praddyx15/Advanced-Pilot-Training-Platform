/**
 * Custom build script for Vercel deployment
 * Builds both server-side TypeScript and client-side Vite app
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Vercel build process...');

// Function to execute shell commands
function exec(cmd, options = {}) {
  console.log(`Executing: ${cmd}`);
  try {
    execSync(cmd, {
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(error);
    process.exit(1);
  }
}

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Install dependencies if needed
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log('Installing dependencies...');
  exec('npm install');
}

// Build server-side TypeScript
console.log('Building server-side TypeScript...');
exec('npx tsc --project tsconfig.json');

// Build client-side Vite app
console.log('Building client-side Vite app...');
exec('npx vite build --outDir dist/public');

// Copy necessary files for Vercel
console.log('Preparing files for Vercel deployment...');
const apiDir = path.join(distDir, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create any additional files or directories needed for Vercel

console.log('Build process completed successfully!');