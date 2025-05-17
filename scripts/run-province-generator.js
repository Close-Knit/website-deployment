// Script to run the province page generator
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('Starting province page generation process...');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

// Path to the generator script
const generatorScript = path.join(__dirname, 'generate-province-pages.js');

// Execute the generator script
exec(`node ${generatorScript}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing generator script: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Generator script stderr: ${stderr}`);
  }
  
  console.log(`Generator script output:\n${stdout}`);
  console.log('Province page generation completed.');
});