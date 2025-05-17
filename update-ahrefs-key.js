// Script to update Ahrefs Web Analytics key in all HTML files
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// The correct key to use
const correctKey = 'xHgwmgxFTCLoO/gG1rIDoQ';

// Function to update the Ahrefs key in a file
async function updateAhrefsKey(filePath) {
  try {
    // Read the file content
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if the file contains the Ahrefs script
    if (content.includes('analytics.ahrefs.com/analytics.js')) {
      // Replace the incorrect key with the correct one
      const updatedContent = content.replace(
        /data-key="xHgwmgxFTCLoO\/gG1rfDoQ"/g, 
        `data-key="${correctKey}"`
      );
      
      // Write the updated content back to the file
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent);
        return true; // File was updated
      }
    }
    return false; // File didn't need updating
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Main function to update all HTML files
async function updateAllFiles() {
  console.log('Starting Ahrefs key update process...');
  
  // Find all HTML files
  const files = glob.sync('**/*.html', { ignore: ['node_modules/**', 'scripts/**'] });
  
  console.log(`Found ${files.length} HTML files to check.`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  // Process each file
  for (const file of files) {
    const wasUpdated = await updateAhrefsKey(file);
    if (wasUpdated) {
      console.log(`Updated: ${file}`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log('\nUpdate completed!');
  console.log(`Files updated: ${updatedCount}`);
  console.log(`Files skipped: ${skippedCount}`);
}

// Run the script
updateAllFiles();
