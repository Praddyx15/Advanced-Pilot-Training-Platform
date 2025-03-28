/**
 * Specialized HTML cleaner to remove Replit-specific metadata from HTML files
 * This script uses cheerio to parse and modify the HTML DOM safely
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Process a single HTML file, removing all Replit-specific metadata
 * @param {string} filePath - Path to the HTML file
 */
function processHtmlFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    // Read the file
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Find all elements with Replit-specific attributes
    $('[data-replit-init]').removeAttr('data-replit-init');
    $('[data-replit-host]').removeAttr('data-replit-host');
    $('[data-replit-id]').removeAttr('data-replit-id');
    $('[data-replit-user-id]').removeAttr('data-replit-user-id');
    $('[data-replit-user-name]').removeAttr('data-replit-user-name');
    $('[data-replit-cluster-name]').removeAttr('data-replit-cluster-name');
    $('[data-replit-user-profile-image]').removeAttr('data-replit-user-profile-image');
    $('[data-replit-user-teams]').removeAttr('data-replit-user-teams');
    $('[data-replit-slug]').removeAttr('data-replit-slug');
    $('[data-replit-environment]').removeAttr('data-replit-environment');
    $('[data-replit-ws-url]').removeAttr('data-replit-ws-url');
    $('[data-replit-metadata]').removeAttr('data-replit-metadata');
    
    // Remove any Replit-specific scripts
    $('script[src*="replit"]').remove();
    
    // Remove any script blocks that reference Replit
    $('script').each((i, el) => {
      const content = $(el).html();
      if (content && content.includes('replit')) {
        $(el).remove();
      }
    });

    // Remove meta tags that reference Replit
    $('meta[name*="replit"], meta[content*="replit"]').remove();
    
    // Write the cleaned file
    fs.writeFileSync(filePath, $.html());
    
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Find all HTML files in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of HTML file paths
 */
function findHtmlFiles(dir) {
  let results = [];
  
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    // Skip node_modules and .git directories
    if (file === 'node_modules' || file === '.git') {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findHtmlFiles(filePath));
    } else if (path.extname(file).toLowerCase() === '.html') {
      // Add HTML files to results
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Main function to clean all HTML files in the project
 */
async function main() {
  console.log('🧹 Starting HTML cleaning process...');
  
  try {
    // Check if cheerio is installed
    require.resolve('cheerio');
  } catch (error) {
    console.error('❌ Cheerio is not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install cheerio', { stdio: 'inherit' });
    console.log('✅ Cheerio installed successfully');
  }
  
  // Find all HTML files
  const htmlFiles = findHtmlFiles('.');
  console.log(`Found ${htmlFiles.length} HTML files to process`);
  
  // Process each file
  for (const filePath of htmlFiles) {
    processHtmlFile(filePath);
  }
  
  console.log('✅ HTML cleaning process completed successfully');
}

// Run the main function
main().catch(error => {
  console.error('❌ An error occurred:', error);
  process.exit(1);
});