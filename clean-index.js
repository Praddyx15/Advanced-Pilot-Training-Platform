/**
 * Special HTML cleaner specifically for the client/index.html file
 * This handles the critical data-replit-metadata issue seen in the login page screenshot
 */

const fs = require('fs');
const path = require('path');

// Path to the client/index.html file
const indexHtmlPath = path.join(__dirname, 'client', 'index.html');

try {
  console.log(`Processing index.html at: ${indexHtmlPath}`);
  
  // Check if the file exists
  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`❌ File not found: ${indexHtmlPath}`);
    process.exit(1);
  }
  
  // Read the file content
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Remove the data-replit-* attributes with regex
  html = html.replace(/data-replit-[a-zA-Z0-9-]+="[^"]*"/g, '');
  
  // Remove any Replit-specific script tags
  html = html.replace(/<script[^>]*replit[^>]*>[\s\S]*?<\/script>/g, '');
  
  // Remove metadata JSON objects containing Replit data
  html = html.replace(/window\.REPLIT_DATA\s*=\s*{[\s\S]*?};/g, '');
  
  // Write the cleaned file
  fs.writeFileSync(indexHtmlPath, html);
  
  console.log(`✅ Successfully cleaned index.html file`);
} catch (error) {
  console.error(`❌ Error processing index.html:`, error);
  process.exit(1);
}