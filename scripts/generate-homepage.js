// Script to generate the homepage
const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
    .trim();                  // Trim leading/trailing spaces
}

// Generate HTML for the homepage
function generateHomepageHTML(provinces) {
  // Create province list HTML
  const provinceListHTML = provinces.map(province => {
    const provinceSlug = createSlug(province.province_name);
    return `<li><a href="/${provinceSlug}/">${province.province_name}</a></li>`;
  }).join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bizly.ca - Canadian Local Business Directory</title>
    <link rel="canonical" href="https://bizly.ca/" />

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-QV1M0QM38B"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-QV1M0QM38B');
    </script>
    <!-- End Google tag -->

    <!-- Ahrefs Web Analytics -->
    <script src="https://analytics.ahrefs.com/analytics.js" data-key="xHgwmgxFTCLoO/gG1rfDoQ" async></script>
    <!-- End Ahrefs Web Analytics -->

    <!-- Meta description for SEO -->
    <meta name="description" content="Find local businesses and services across Canada. Browse our comprehensive directory of Canadian communities and businesses." />
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="Bizly.ca - Canadian Local Business Directory" />
    <meta property="og:description" content="Find local businesses and services across Canada. Browse our comprehensive directory of Canadian communities and businesses." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://bizly.ca/" />
    <meta property="og:image" content="https://bizly.ca/images/Bizly_Logo_150px.webp" />
    <meta property="og:site_name" content="Bizly.ca" />

    <!-- Schema.org markup for search engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Bizly.ca",
      "url": "https://bizly.ca/",
      "description": "Canadian local business directory",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://bizly.ca/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>

    <!-- Link CSS and Font Awesome -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <link rel="stylesheet" href="/styles.css">

    <!-- AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6284081740274174"
         crossorigin="anonymous"></script>
</head>
<body>
    <!-- Site Logo -->
    <div id="home-logo-container">
        <img src="/images/Bizly_Logo_150px.webp" alt="Bizly.ca Logo" id="home-logo">
    </div>

    <h1>Canadian Local Business Directory</h1>
    
    <div class="home-intro">
        <p>Welcome to Bizly.ca, your comprehensive directory of local businesses across Canada.</p>
        <p>Select a province or territory below to explore communities and find local businesses.</p>
    </div>

    <!-- Search Box -->
    <div id="search-container" class="home-search">
        <input type="text" id="search-input" placeholder="Search for a community...">
        <button id="search-button">
            <i class="fa-solid fa-magnifying-glass"></i>
        </button>
    </div>

    <!-- Provinces List -->
    <div class="provinces-container">
        <h2>Provinces & Territories</h2>
        <ul class="provinces-list">
        ${provinceListHTML}
        </ul>
    </div>

    <!-- About Section -->
    <div class="home-about">
        <h2>About Bizly.ca</h2>
        <p>Bizly.ca is a comprehensive directory of local businesses across Canada. Our mission is to connect Canadians with the local businesses and services they need in their communities.</p>
        <p>For business owners: <a href="/add-listing.html">Add your business</a> to our directory for free to increase your online visibility.</p>
    </div>

    <!-- Footer -->
    <footer>
        <div class="footer-links">
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/terms.html">Terms of Service</a>
        </div>
        <p>&copy; 2023-${new Date().getFullYear()} Bizly.ca. All rights reserved.</p>
    </footer>

    <!-- Load Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/home.js" defer></script>
    <script src="/common.js" defer></script>

    <!-- Back to Top Button -->
    <button id="backToTopBtn" title="Go to top">
        <i class="fa-solid fa-arrow-up"></i>
    </button>
</body>
</html>`;
}

// Main function to generate the homepage
async function generateHomepage() {
  console.log('Starting homepage generation...');
  
  try {
    // Get all provinces
    const { data: provinces, error: provincesError } = await supabase
      .from('provinces')
      .select('id, province_name')
      .order('province_name');
    
    if (provincesError) {
      throw new Error(`Error fetching provinces: ${provincesError.message}`);
    }
    
    console.log(`Found ${provinces.length} provinces/territories`);
    
    // Generate HTML content
    const htmlContent = generateHomepageHTML(provinces);
    
    // Write HTML file
    const htmlFilePath = path.join('..', 'index.html');
    await fs.writeFile(htmlFilePath, htmlContent);
    
    console.log('Homepage generated successfully!');
    
  } catch (error) {
    console.error('Error generating homepage:', error);
    process.exit(1);
  }
}

// Run the main function
generateHomepage();