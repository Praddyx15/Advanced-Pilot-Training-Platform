/**
 * Script to remove all Replit-specific metadata from HTML and JavaScript files
 * This script targets data-replit-* attributes and any other Replit-specific markers
 * To run: node remove-replit-metadata.js
 */

const fs = require('fs');
const path = require('path');

// File extensions to process
const EXTENSIONS_TO_PROCESS = ['.html', '.js', '.jsx', '.ts', '.tsx', '.css', '.json'];

// Text patterns to remove or replace
const PATTERNS = [
  // HTML attributes
  { regex: /data-replit-[a-zA-Z0-9-]+="[^"]*"/g, replacement: '' },
  
  // JavaScript object references
  { regex: /window\.REPLIT_DATA\s*=\s*{[\s\S]*?};/g, replacement: '' },
  { regex: /REPLIT_DATA\.[a-zA-Z0-9_.]+/g, replacement: 'null' },
  
  // Replit.com URLs
  { regex: /(["'])https?:\/\/replit\.com[^"']*\1/g, replacement: '$1#$1' },
  { regex: /(["'])https?:\/\/\w+\.replit\.app[^"']*\1/g, replacement: '$1#$1' },
  
  // Import statements for Replit packages
  { regex: /import .*? from ["']@replit\/.*?["'];?\n?/g, replacement: '' },
  { regex: /require\(["']@replit\/.*?["']\);?\n?/g, replacement: '' },
  
  // Replit-specific environment variables
  { regex: /process\.env\.REPLIT_[A-Z_]+/g, replacement: 'undefined' },
  { regex: /import\.meta\.env\.REPLIT_[A-Z_]+/g, replacement: 'undefined' },
  
  // Plugin registrations
  { regex: /replitPlugin\s*\([\s\S]*?\),?/g, replacement: '' },
  { regex: /@replit\/.*?Plugin\s*\([\s\S]*?\),?/g, replacement: '' }
];

/**
 * Find all files with specified extensions in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
function findFiles(dir) {
  let results = [];
  
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    // Skip node_modules and .git directories
    if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findFiles(filePath));
    } else if (EXTENSIONS_TO_PROCESS.includes(path.extname(file).toLowerCase())) {
      // Add files with matching extensions to results
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Process a single file to remove Replit-specific code
 * @param {string} filePath - Path to the file
 */
function processFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Apply all patterns
    for (const pattern of PATTERNS) {
      content = content.replace(pattern.regex, pattern.replacement);
    }
    
    // Only write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main function to clean all files
 */
function main() {
  console.log('🧹 Starting Replit metadata removal process...');
  
  // Find all files to process
  const files = findFiles('.');
  console.log(`Found ${files.length} files to process`);
  
  // Process each file
  let processed = 0;
  for (const filePath of files) {
    processFile(filePath);
    processed++;
    
    // Show progress every 100 files
    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${files.length} files (${Math.round(processed/files.length*100)}%)`);
    }
  }
  
  console.log('✅ Replit metadata removal process completed successfully');
  console.log(`Processed ${processed} files total`);
}

// Run the main function
main();