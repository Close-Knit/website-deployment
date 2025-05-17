// Script to validate all province pages for proper structure and script loading
const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
require('dotenv').config();

async function validateProvincePages() {
  console.log('Starting province page validation...');
  
  // Get all directories in the root (excluding node_modules, scripts, etc.)
  const rootDir = path.join(__dirname, '..');
  const allDirs = await fs.readdir(rootDir, { withFileTypes: true });
  
  // Filter for likely province directories (those with index.html)
  const provinceDirs = [];
  for (const dirent of allDirs) {
    if (dirent.isDirectory() && 
        !['node_modules', 'scripts', 'images', '.git'].includes(dirent.name)) {
      const indexPath = path.join(rootDir, dirent.name, 'index.html');
      if (await fs.pathExists(indexPath)) {
        provinceDirs.push(dirent.name);
      }
    }
  }
  
  console.log(`Found ${provinceDirs.length} potential province directories`);
  
  // Validation results
  const results = {
    valid: [],
    invalid: []
  };
  
  // Check each province page
  for (const provinceDir of provinceDirs) {
    const indexPath = path.join(rootDir, provinceDir, 'index.html');
    const issues = [];
    
    try {
      // Read the HTML file
      const html = await fs.readFile(indexPath, 'utf8');
      const $ = cheerio.load(html);
      
      // Check 1: Supabase library loaded first
      const scripts = $('script').map((i, el) => $(el).attr('src')).get();
      const supabaseScriptIndex = scripts.findIndex(src => src && src.includes('supabase-js'));
      const commonJsIndex = scripts.findIndex(src => src && src.includes('common.js'));
      const provincePageJsIndex = scripts.findIndex(src => src && src.includes('province_page.js'));
      
      if (supabaseScriptIndex === -1) {
        issues.push('Supabase library script not found');
      }
      
      if (commonJsIndex === -1) {
        issues.push('common.js script not found');
      }
      
      if (provincePageJsIndex === -1) {
        issues.push('province_page.js script not found');
      }
      
      // Check script order
      if (supabaseScriptIndex > commonJsIndex && commonJsIndex !== -1 && supabaseScriptIndex !== -1) {
        issues.push('Supabase library should be loaded before common.js');
      }
      
      if (commonJsIndex > provincePageJsIndex && commonJsIndex !== -1 && provincePageJsIndex !== -1) {
        issues.push('common.js should be loaded before province_page.js');
      }
      
      // Check 2: Essential elements
      if (!$('#province-name-heading').length) {
        issues.push('Missing province name heading element');
      }
      
      if (!$('#community-list-province').length) {
        issues.push('Missing community list container');
      }
      
      if (!$('#breadcrumb-container').length) {
        issues.push('Missing breadcrumb container');
      }
      
      if (!$('#backToTopBtn').length) {
        issues.push('Missing back to top button');
      }
      
      // Check 3: Meta tags
      if (!$('meta[name="description"]').length) {
        issues.push('Missing meta description');
      }
      
      if (!$('link[rel="canonical"]').length) {
        issues.push('Missing canonical link');
      }
      
      // Check 4: Title format
      const title = $('title').text();
      if (!title.includes('Communities') || !title.includes('Bizly.ca')) {
        issues.push('Title format incorrect');
      }
      
      // Add to results
      if (issues.length === 0) {
        results.valid.push(provinceDir);
      } else {
        results.invalid.push({
          province: provinceDir,
          issues: issues
        });
      }
      
    } catch (error) {
      console.error(`Error validating ${provinceDir}:`, error);
      results.invalid.push({
        province: provinceDir,
        issues: [`Error reading/parsing file: ${error.message}`]
      });
    }
  }
  
  // Print results
  console.log('\n=== VALIDATION RESULTS ===\n');
  
  console.log(`✅ Valid province pages (${results.valid.length}):`);
  results.valid.forEach(province => {
    console.log(`  - ${province}`);
  });
  
  console.log(`\n❌ Invalid province pages (${results.invalid.length}):`);
  results.invalid.forEach(item => {
    console.log(`  - ${item.province}:`);
    item.issues.forEach(issue => {
      console.log(`    • ${issue}`);
    });
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total pages checked: ${provinceDirs.length}`);
  console.log(`Valid: ${results.valid.length}`);
  console.log(`Invalid: ${results.invalid.length}`);
  
  if (results.invalid.length > 0) {
    console.log('\nRecommendation: Run the province page generator script again after fixing the template issues.');
  } else {
    console.log('\nAll province pages look good!');
  }
}

// Run the validation
validateProvincePages();