const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xyzcompany.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'your-supabase-key'; // Replace with your actual key
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

// Generate HTML for a province page
function generateProvincePageHTML(province) {
  const provinceSlug = createSlug(province.province_name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${province.province_name} Communities | Bizly.ca</title>
    <link rel="canonical" href="https://bizly.ca/${provinceSlug}/" />

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
    <script src="https://analytics.ahrefs.com/analytics.js" data-key="xHgwmgxFTCLoO/gG1rIDoQ" async></script>
    <!-- End Ahrefs Web Analytics -->

    <!-- Meta description for SEO -->
    <meta name="description" content="Find local businesses and services in ${province.province_name} communities. Browse our comprehensive directory of ${province.province_name} towns and cities." />

    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="${province.province_name} Communities | Bizly.ca" />
    <meta property="og:description" content="Find local businesses and services in ${province.province_name} communities. Browse our comprehensive directory of ${province.province_name} towns and cities." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://bizly.ca/${provinceSlug}/" />
    <meta property="og:image" content="https://bizly.ca/images/Bizly_Logo_150px.webp" />
    <meta property="og:site_name" content="Bizly.ca" />

    <!-- Schema.org markup for search engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${province.province_name} Communities",
      "description": "Directory of communities in ${province.province_name} with local business listings",
      "url": "https://bizly.ca/${provinceSlug}/",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Bizly.ca",
        "url": "https://bizly.ca/"
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

    <!-- AdSense Script (Consistency) -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6284081740274174"
         crossorigin="anonymous"></script>
</head>
<body>
    <!-- Site Logo Link -->
    <a href="/" id="site-logo-link" title="Go to Home Page">
       <img src="/images/Bizly_Logo_150px.webp" alt="Bizly Logo - Go to Home" id="site-logo">
    </a>

    <h1 id="province-name-heading">Loading Province...</h1>

    <!-- Breadcrumb Placeholder -->
    <nav aria-label="breadcrumb" id="breadcrumb-container" class="breadcrumb-nav">
        <!-- Breadcrumbs will be loaded here by JS -->
    </nav>

    <!-- Container for the list of communities -->
    <ul id="community-list-province" class="community-list-grouped">
        <!-- Communities will be loaded here by JS -->
        <li>Loading communities...</li>
    </ul>

    <!-- Load Supabase library FIRST -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

    <!-- Load the specific JS for this page -->
    <script src="/common.js"></script>
    <script src="/province_page.js"></script>

    <!-- Back to Top Button -->
    <button id="backToTopBtn" title="Go to top">
        <i class="fa-solid fa-arrow-up"></i>
    </button>
</body>
</html>`;
}

// Main function to generate all province pages
async function generateAllProvincePages() {
  console.log('Starting province pages generation...');

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

    // Create province pages
    for (const province of provinces) {
      const provinceSlug = createSlug(province.province_name);
      const provinceDirPath = path.join('..', provinceSlug);

      // Create province directory if it doesn't exist
      await fs.ensureDir(provinceDirPath);

      // Generate HTML content
      const htmlContent = generateProvincePageHTML(province);

      // Write HTML file
      const htmlFilePath = path.join(provinceDirPath, 'index.html');
      await fs.writeFile(htmlFilePath, htmlContent);

      console.log(`Generated page for ${province.province_name}`);
    }

    console.log('All province pages generated successfully!');

  } catch (error) {
    console.error('Error generating province pages:', error);
  }
}

// Run the script
generateAllProvincePages();