// Script to update database schema documentation
// Run with: node update_schema_docs.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Check for environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  console.log('You can set them temporarily with:');
  console.log('SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npm run update-schema');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for schema access
const supabase = createClient(supabaseUrl, supabaseKey);

// Output file path
const outputFile = path.join(__dirname, 'database_schema.md');

async function generateSchemaDocs() {
  console.log('Fetching schema information from Supabase...');
  
  try {
    // Call the PostgreSQL function we created
    const { data, error } = await supabase.rpc('get_schema_info');
    
    if (error) {
      console.error('Error fetching schema info:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.error('No schema data returned. Check if the function exists and you have proper permissions.');
      return;
    }
    
    console.log(`Retrieved information for ${new Set(data.map(row => row.table_name)).size} tables.`);
    
    // Group by table
    const tableGroups = {};
    data.forEach(row => {
      if (!tableGroups[row.table_name]) {
        tableGroups[row.table_name] = [];
      }
      tableGroups[row.table_name].push(row);
    });
    
    // Generate markdown
    let markdown = `# Database Schema Documentation\n\n`;
    markdown += `Last updated: ${new Date().toISOString().split('T')[0]}\n\n`;
    markdown += `This document contains the current schema of all tables in the Supabase database.\n\n`;
    
    // Tables overview section
    markdown += `## Tables Overview\n\n`;
    
    // Group tables by type
    const provinceTables = [];
    const systemTables = [];
    
    Object.keys(tableGroups).sort().forEach(tableName => {
      if (['categories', 'communities', 'provinces', 'suggested_changes'].includes(tableName)) {
        systemTables.push(tableName);
      } else {
        // Assume it's a province table
        provinceTables.push(tableName);
      }
    });
    
    markdown += `### System Tables\n`;
    systemTables.forEach(tableName => {
      markdown += `- \`${tableName}\`\n`;
    });
    
    markdown += `\n### Province Tables\n`;
    provinceTables.forEach(tableName => {
      markdown += `- \`${tableName}\`\n`;
    });
    
    // Detailed table schemas
    markdown += `\n## Table Schemas\n\n`;
    
    // System tables first
    markdown += `### System Tables\n\n`;
    systemTables.forEach(tableName => {
      markdown += `#### ${tableName}\n`;
      markdown += `| Column Name | Data Type | Nullable | Default | Description |\n`;
      markdown += `|-------------|-----------|----------|---------|-------------|\n`;
      
      tableGroups[tableName].forEach(column => {
        const defaultValue = column.column_default ? column.column_default.replace(/::.*$/, '') : '';
        markdown += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${defaultValue} | ${column.column_description || ''} |\n`;
      });
      
      markdown += `\n`;
    });
    
    // Then province tables
    markdown += `### Province Tables\n\n`;
    markdown += `All province tables follow a similar structure. Here's an example from one province:\n\n`;
    
    // Use the first province table as an example
    if (provinceTables.length > 0) {
      const exampleTable = provinceTables[0];
      markdown += `#### ${exampleTable} (Example)\n`;
      markdown += `| Column Name | Data Type | Nullable | Default | Description |\n`;
      markdown += `|-------------|-----------|----------|---------|-------------|\n`;
      
      tableGroups[exampleTable].forEach(column => {
        const defaultValue = column.column_default ? column.column_default.replace(/::.*$/, '') : '';
        markdown += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${defaultValue} | ${column.column_description || ''} |\n`;
      });
    }
    
    // Write to file
    fs.writeFileSync(outputFile, markdown);
    console.log(`Schema documentation updated successfully! File saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('Error generating schema documentation:', error);
  }
}

// Run the function
generateSchemaDocs();