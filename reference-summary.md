# Project Reference Summary

## Key Files Structure
- `scripts/generate-homepage.js` - Generates the static homepage
- `scripts/generate-province-pages.js` - Generates province pages
- `scripts/generate-community-pages.js` - Generates community pages
- `scripts/generate-sitemap.js` - Creates sitemap for the site
- `scripts/test-pages.js` - Tests generated pages
- `home.js` - Client-side JS for homepage functionality

## URL Structure
Two different URL patterns appear to be in use:
1. Path-based URLs (static files):
   - Province: `/prince-edward-island/`
   - Community: `/prince-edward-island/summerside/`

2. Query parameter URLs (in JS code):
   - Community: `community.html?province=Prince%20Edward%20Island&community=Summerside`
   - Province: `province_page.html?province=Prince%20Edward%20Island`

## Page Structure
- Homepage lists provinces/territories with limited communities
- Province pages list all communities in that province
- Community pages contain business listings

## Dependencies
- Supabase for database
- Font Awesome for icons
- QR Code library for community pages

## JavaScript Files
- `common.js` - Contains shared functionality and Supabase client
- `home.js` - Homepage functionality
- `province_page.js` - Province page functionality
- `directory.js` - Community page functionality

## Generation Process
The site appears to be statically generated with scripts that:
1. Pull data from Supabase
2. Generate HTML files
3. Place them in the appropriate directory structure