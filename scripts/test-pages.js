// Simple test script to verify generated pages
const fs = require('fs-extra');
const path = require('path');

async function testPages() {
  console.log('Testing generated pages...');
  
  // 1. Test homepage
  console.log('\nTesting homepage:');
  const homepagePath = path.join('..', 'index.html');
  if (await fs.pathExists(homepagePath)) {
    console.log('✅ Homepage exists');
    
    // Check if it contains province links
    const homepageContent = await fs.readFile(homepagePath, 'utf8');
    if (homepageContent.includes('provinces-list') || 
        homepageContent.includes('region-container')) {
      console.log('✅ Homepage contains province listings');
    } else {
      console.log('❌ Homepage may be missing province listings');
    }
  } else {
    console.log('❌ Homepage not found');
  }
  
  // 2. Test a province page (British Columbia)
  console.log('\nTesting province page:');
  const provincePath = path.join('..', 'british-columbia', 'index.html');
  if (await fs.pathExists(provincePath)) {
    console.log('✅ British Columbia province page exists');
    
    // Check if it contains community list container
    const provinceContent = await fs.readFile(provincePath, 'utf8');
    if (provinceContent.includes('community-list-province')) {
      console.log('✅ Province page contains community list container');
    } else {
      console.log('❌ Province page may be missing community list container');
    }
  } else {
    console.log('❌ British Columbia province page not found');
  }
  
  // 3. Test a community page (Vancouver)
  console.log('\nTesting community page:');
  const communityPath = path.join('..', 'british-columbia', 'vancouver', 'index.html');
  if (await fs.pathExists(communityPath)) {
    console.log('✅ Vancouver community page exists');
    
    // Check if it contains directory container
    const communityContent = await fs.readFile(communityPath, 'utf8');
    if (communityContent.includes('directory-container') || 
        communityContent.includes('business-listings')) {
      console.log('✅ Community page contains business listings container');
    } else {
      console.log('❌ Community page may be missing business listings container');
    }
  } else {
    console.log('❌ Vancouver community page not found');
  }
  
  // 4. Check JavaScript files
  console.log('\nTesting JavaScript files:');
  const jsFiles = ['common.js', 'home.js', 'province_page.js'];
  
  for (const jsFile of jsFiles) {
    const jsPath = path.join('..', jsFile);
    if (await fs.pathExists(jsPath)) {
      console.log(`✅ ${jsFile} exists`);
    } else {
      console.log(`❌ ${jsFile} not found`);
    }
  }
  
  console.log('\nTest completed!');
}

testPages();