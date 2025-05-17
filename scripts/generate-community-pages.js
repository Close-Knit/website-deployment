// scripts/generate-community-pages.js

const fs = require('fs-extra');
const cheerio = require('cheerio');
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

async function generateCommunityPages() {
    // --- Dynamic import for node-fetch ---
    // Ensure you have node-fetch installed (npm install node-fetch)
    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
    // ---

    console.log('Starting community page generation...');
    const templateHtmlPath = path.resolve(__dirname, '../templates/community-template.html');
    const outputBaseDir = path.resolve(__dirname, '..');

    try {
        // 1. Fetch necessary data from Supabase (Provinces, Communities)
        console.log('Fetching provinces and communities from Supabase...');

        // Fetch all provinces
        const { data: provincesData, error: provinceError } = await supabase
            .from('provinces')
            .select('id, province_name');

        if (provinceError) throw new Error(`Failed to fetch provinces: ${provinceError.message}`);
        if (!provincesData || provincesData.length === 0) throw new Error('No provinces found.');
        const provinceMap = new Map(provincesData.map(p => [p.id, p.province_name]));
        console.log(`Fetched ${provincesData.length} provinces.`);

        // Fetch all communities (NO latitude/longitude selected from DB)
        const { data: communitiesData, error: communityError } = await supabase
            .from('communities')
            .select(`
                id,
                community_name,
                province_id,
                status,
                logo_filename
            `); // <<< CORRECT: No lat/lon here

        if (communityError) throw new Error(`Failed to fetch communities: ${communityError.message}`);
        if (!communitiesData || communitiesData.length === 0) {
             console.log('No communities found. Exiting generation.');
             return;
        }
        console.log(`Fetched ${communitiesData.length} communities.`);

        // --- Fetch all listings efficiently ---
        console.log('Fetching all business listings...');
        const allListings = [];
        // Fetch listings province by province to avoid hitting potential query limits
        // and to construct the correct table names
        for (const province of provincesData) {
            const tableName = province.province_name.replace(/\s+/g, '_'); // Dynamic table name
            console.log(`Fetching listings from table: ${tableName}`);
            try {
                const { data: listings, error: listingError } = await supabase
                    .from(tableName)
                    .select('*'); // Fetch all columns for listings

                if (listingError) {
                    // Log specific table errors but continue if possible (maybe table doesn't exist yet)
                    console.warn(`Warning fetching listings from ${tableName}: ${listingError.message}`);
                    if (listingError.code === '42P01') { // 'undefined_table'
                         console.warn(`Table "${tableName}" not found. Skipping.`);
                    } else {
                        // Rethrow other unexpected errors
                        throw new Error(`Failed to fetch listings from ${tableName}: ${listingError.message}`);
                    }
                } else if (listings && listings.length > 0) {
                    allListings.push(...listings); // Add fetched listings to the main array
                    console.log(`Fetched ${listings.length} listings from ${tableName}.`);
                }
            } catch (tableError) {
                 console.error(`Error processing table ${tableName}:`, tableError);
                 // Decide if you want to stop the whole build or just skip this table
                 // For now, we log and continue, but you might want `throw tableError;`
            }
        }
        console.log(`Total listings fetched: ${allListings.length}`);

        // --- Group listings by community_id for easy access ---
        const listingsByCommunityId = allListings.reduce((acc, listing) => {
            const communityId = listing.community_id;
            if (!acc[communityId]) {
                acc[communityId] = [];
            }
            acc[communityId].push(listing);
            return acc;
        }, {});
        console.log('Listings grouped by community ID.');

        // 2. Read the template file
        console.log(`Reading template file from: ${templateHtmlPath}`);
        const templateHtml = await fs.readFile(templateHtmlPath, 'utf-8');
        console.log('Template file read successfully.');

        // 3. Loop through communities and generate pages
        console.log(`Starting page generation loop for ${communitiesData.length} communities...`);

        for (const community of communitiesData) {
            const communityId = community.id;
            const communityName = community.community_name;
            const provinceId = community.province_id;
            const provinceName = provinceMap.get(provinceId); // Get province name from map

            if (!provinceName) {
                console.warn(`Skipping community "${communityName}" (ID: ${communityId}) due to missing province mapping.`);
                continue; // Skip if province isn't found
            }

            // --- Calculate Slugs and Paths ---
            const provinceSlug = createSlug(provinceName);
            const communitySlug = createSlug(communityName);
            const communityOutputDir = path.join(outputBaseDir, provinceSlug, communitySlug);
            const outputFilePath = path.join(communityOutputDir, 'index.html');
            const canonicalUrl = `https://bizly.ca/${provinceSlug}/${communitySlug}/`; // Assuming your domain

            // Create directory if it doesn't exist
            await fs.ensureDir(communityOutputDir);

            // --- Load Template with Cheerio for each page ---
            const $ = cheerio.load(templateHtml);

            // --- Inject Core Community Data ---
            const pageTitle = `${communityName}, ${provinceName} Business Directory | Bizly.ca`;
            $('title').text(pageTitle); // Set the <title>
            $('#canonicalLink').attr('href', canonicalUrl); // Set the canonical URL
            $('#community-name').text(`${communityName}, ${provinceName}`); // Set the H1 heading

            // Set Open Graph and Meta Description tags (Example - adapt as needed)
            const metaDescription = `Find local businesses and services in ${communityName}, ${provinceName}. Browse the Bizly.ca directory.`;
            $('meta[name="description"]').attr('content', metaDescription);
            $('meta[property="og:title"]').attr('content', pageTitle);
            $('meta[property="og:description"]').attr('content', metaDescription);
            $('meta[property="og:url"]').attr('content', canonicalUrl);
            // Add Twitter card tags similarly if present in template

            // Add community/province data to the hidden meta tag for potential client-side use (like breadcrumbs)
            $('#community-data') // Assuming you add this to your template
                .attr('data-community', communityName)
                .attr('data-province', provinceName)
                .attr('data-community-slug', communitySlug)
                .attr('data-province-slug', provinceSlug)
                .attr('data-latitude', community.latitude || '')   // Added latitude
                .attr('data-longitude', community.longitude || ''); // Added longitude

            // --- Update AI Summary Placeholders ---
            // Target the H2 inside .ai-summary
            const aiSummaryHeading = $('.ai-summary h2');
            if (aiSummaryHeading.length > 0) {
                aiSummaryHeading.text(`About ${communityName}, ${provinceName}`); // Use .text() to set content
            } else {
                console.warn(`AI Summary H2 not found for ${communityName}`);
            }

            // Target the paragraph with the specific ID
            const aiSummaryDesc = $('#ai-community-description'); // Target by ID
            if (aiSummaryDesc.length > 0) {
                 // Use .text() to set content, replacing the placeholder
                 aiSummaryDesc.text(`This page contains a comprehensive business directory for ${communityName}, ${provinceName}. Users can find local businesses, contact information, and services available in this community.`);
            } else {
                 console.warn(`AI Summary description p#ai-community-description not found for ${communityName}`);
            }

            // --- Set Suggest Change Link ---
            const suggestChangeLink = $('#suggestChangeLink'); // Target the link by ID
            if (suggestChangeLink.length > 0) {
                // Construct URL parameters - Ensure these match what suggest_change.js expects
                const suggestParams = new URLSearchParams({
                    cid: communityId,
                    prov: provinceName, // Use full name
                    comm: communityName // Use full name
                });
                // Construct relative path from /province/community/ to /suggest_change.html
                const suggestUrl = `../../suggest_change.html?${suggestParams.toString()}`;
                suggestChangeLink.attr('href', suggestUrl);
                suggestChangeLink.attr('target', '_blank'); // Open in new tab
                suggestChangeLink.attr('rel', 'noopener noreferrer'); // Security best practice for target="_blank"
                console.log(`Set Suggest Change link for ${communityName} to: ${suggestUrl}`);
            } else {
                console.warn(`Suggest Change link (#suggestChangeLink) not found for ${communityName}`);
            }

            // --- Inject Listings (Detailed logic in next step) ---
            const communityListings = listingsByCommunityId[communityId] || [];
            $('#listing-count').text(communityListings.length); // Update listing count
            console.log(`Processing ${communityListings.length} listings for ${communityName}`);
            
            // --- Generate Listings HTML ---
            const resultsList = $('#results'); // Target the results ul (ensure template has id="results")
            resultsList.empty(); // Clear any template placeholders or loading messages

            if (communityListings.length === 0) {
                resultsList.append('<li class="no-results">No business listings found for this community.</li>');
            } else {
                // Group listings by category
                const categorizedListings = {};
                communityListings.forEach(listing => {
                    const category = listing.category || 'Uncategorized'; // Handle null/empty categories
                    if (!categorizedListings[category]) {
                        categorizedListings[category] = [];
                    }
                    categorizedListings[category].push(listing);
                });

                // Sort categories alphabetically, putting 'Uncategorized' last
                const sortedCategories = Object.keys(categorizedListings).sort((a, b) => {
                    if (a === 'Uncategorized') return 1;
                    if (b === 'Uncategorized') return -1;
                    return a.localeCompare(b);
                });

                const now = new Date(); // For checking promotion expiry

                // Add each category and its listings
                sortedCategories.forEach(category => {
                    // Create category header DIV (Using div based on recent CSS/JS)
                    const categoryHeaderHtml = `<div class="category-header">${category}</div>`;
                    resultsList.append(categoryHeaderHtml); // Append header div

                    const listingsInCategory = categorizedListings[category];

                    // Separate promoted from regular listings within the category
                    const promotedInCategory = [];
                    const regularInCategory = [];

                    listingsInCategory.forEach(listing => {
                        const isPromoted = listing.is_promoted === true;
                        const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                        // Check if expiresAt is a valid date object before comparing
                        const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;

                        if (isActivePromotion) {
                            promotedInCategory.push(listing);
                        } else {
                            regularInCategory.push(listing);
                        }
                    });

                    // Sort promoted listings (e.g., alphabetically or by tier if needed)
                    // TODO: Add tier sorting here if applicable (e.g., Gold > Silver > Bronze > Alpha)
                    promotedInCategory.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    // Sort regular listings alphabetically
                    regularInCategory.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                    // Combine lists: promoted first, then regular
                    const categorySortedListings = promotedInCategory.concat(regularInCategory);

                    // Generate HTML for each listing in the sorted category list
                    categorySortedListings.forEach(listing => {
                        // Determine promotion status again for styling/label
                        const isPromoted = listing.is_promoted === true;
                        const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                        const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;

                        let listItemClass = 'business-listing'; // Base class from template/CSS
                        let sponsoredLabelHtml = '';
                        // Add promotion tier classes if needed based on duration or another field
                        // Example:
                        // if (isActivePromotion) {
                        //    if (listing.promotion_duration_months === 12) listItemClass += ' promoted-gold';
                        //    else if (listing.promotion_duration_months === 6) listItemClass += ' promoted-silver';
                        //    else listItemClass += ' promoted-bronze';
                        //    sponsoredLabelHtml = '<span class="sponsored-label ' + listing.promotion_tier + '">Sponsored</span>'; // Add tier class to label too
                        // }
                        // Simplified for now:
                        if (isActivePromotion) {
                             // listItemClass += ' promoted-listing'; // Add a general class if needed by CSS
                             sponsoredLabelHtml = '<span class="sponsored-label">Sponsored</span>'; // You might add tier class here later
                        }

                        // Basic HTML escaping for display data (IMPORTANT!)
                        const escapeHtml = (unsafe) => unsafe ? unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '';

                        // Escape data *before* using it in attributes or content
                        const safeName = escapeHtml(listing.name);
                        const safeContactPerson = escapeHtml(listing.contact_person);
                        const safeNotes = escapeHtml(listing.notes);
                        const safeAddress = escapeHtml(listing.address);
                        const safePhone = escapeHtml(listing.phone_number);
                        const safeEmail = escapeHtml(listing.email);
                        const safeWebsite = escapeHtml(listing.website_url); // Keep original for logic, escape for display/attr

                        // Generate action buttons HTML (split left and right)
                        let leftActionsHtml = '';
                        let rightActionsHtml = '';

                        // RIGHT side button (Phone)
                        if (safePhone) {
                            rightActionsHtml += `<button class="show-phone-btn" data-phone="${safePhone}"><i class="fa-solid fa-phone"></i> Show Phone</button>`;
                        }

                        // LEFT side buttons (Adjust Order)
                        // Website button removed as requested
                        
                        // vCard Button (Change Text from "Card" to "vCard")
                        leftActionsHtml += ` <button class="vcard-btn button-style" data-id="${listing.id}" data-name="${safeName}" data-phone="${safePhone}" data-email="${safeEmail}" data-website="${listing.website_url || ''}" data-address="${safeAddress}" title="View vCard">
                                                 <i class="fa-solid fa-address-card"></i> vCard
                                             </button>`;
                        
                        // Promote Button (Add target="_blank")
                        if (!isActivePromotion) {
                            const rawListingName = listing.name || '';
                            const rawProvinceName = provinceName || '';
                            const rawCommunityName = communityName || '';
                            const tableName = provinceName.replace(/\s+/g, '_');

                            const promoteUrlParams = new URLSearchParams({
                                lid: listing.id,
                                cid: communityId,
                                prov: rawProvinceName,
                                comm: rawCommunityName,
                                name: rawListingName,
                                table: tableName,
                                address: listing.address || '',
                                phone: listing.phone_number || ''
                            });
                            const promoteUrl = `../../promote.html?${promoteUrlParams.toString()}`;

                            leftActionsHtml += ` <a href="${promoteUrl}" class="promote-btn button-style" target="_blank" title="Promote ${safeName}">
                                                    <i class="fa-solid fa-bullhorn"></i> Promote
                                                </a>`;
                        }

                        // Construct the final list item HTML using NEW structure
                        const listingHtml = `
                            <li class="${listItemClass}">
                                <div class="listing-details">
                                    <h3 class="business-name">${safeName} ${sponsoredLabelHtml}</h3>
                                    ${safeContactPerson ? `<p class="contact-person">Contact: ${safeContactPerson}</p>` : ''}
                                    ${safeNotes ? `<p class="business-description">${safeNotes}</p>` : ''}
                                    ${safeAddress ? `<p class="address">${safeAddress}</p>` : ''}
                                    <div class="business-actions-left">
                                        ${leftActionsHtml}
                                    </div>
                                </div>
                                <div class="business-actions-right">
                                    ${rightActionsHtml}
                                </div>
                            </li>`;
                        resultsList.append(listingHtml); // Append the generated HTML
                    }); // End listing loop for category
                }); // End category loop
            } // End else (if listings exist)

            // --- Generate Breadcrumbs ---
            const breadcrumbContainer = $('#breadcrumb-container'); // Target by ID
            breadcrumbContainer.empty(); // Clear existing template content
            const breadcrumbHtml = `
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/">Home</a></li>
                    <li class="breadcrumb-item"><a href="/${provinceSlug}/">${provinceName}</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${communityName}</li>
                </ol>`;
            breadcrumbContainer.html(breadcrumbHtml); // Inject breadcrumb HTML

            // --- Adjust Asset Paths (Detailed logic in a later step) ---
            // --- Adjust Asset Paths ---
            // Calculate the relative path from the community page back to the root directory
            const relativePathPrefix = path.relative(communityOutputDir, outputBaseDir)
                                        .replace(/\\/g, '/') // Ensure forward slashes
                                        || '.'; // Use '.' if it's the same directory (shouldn't happen here)

            console.log(`Adjusting paths for ${communityName} using prefix: ${relativePathPrefix}`);

            // Adjust CSS links (href starting with / but not //)
            $('link[rel="stylesheet"]').each((i, el) => {
                const link = $(el);
                const href = link.attr('href');
                if (href && href.startsWith('/') && !href.startsWith('//')) {
                    const newHref = `${relativePathPrefix}${href}`; // Prepend relative path
                    link.attr('href', newHref);
                    // console.log(`Adjusted CSS href: ${href} -> ${newHref}`);
                }
            });

            // Adjust JS script links (src starting with / but not //, and avoid external libs)
            $('script[src]').each((i, el) => {
                 const script = $(el);
                 const src = script.attr('src');
                 // Check if src exists, starts with /, isn't protocol-relative (//), and isn't an external URL
                  if (src && src.startsWith('/') && !src.startsWith('//') &&
                     !src.includes('cdn.jsdelivr.net') &&
                     !src.includes('cdnjs.cloudflare.com') && // Added FontAwesome CDN
                     !src.includes('googletagmanager.com') &&
                     !src.includes('google-analytics.com') &&
                     !src.includes('pagead2.googlesyndication.com') && // Added AdSense
                     !src.includes('analytics.ahrefs.com')) { // Added Ahrefs
                      const newSrc = `${relativePathPrefix}${src}`; // Prepend relative path
                      script.attr('src', newSrc);
                      // console.log(`Adjusted JS src: ${src} -> ${newSrc}`);
                 }
             });

            // Adjust image paths (src starting with / but not //) - e.g., for logo in header/footer
            $('img').each((i, el) => {
                const img = $(el);
                const src = img.attr('src');
                if (src && src.startsWith('/') && !src.startsWith('//')) {
                    const newSrc = `${relativePathPrefix}${src}`; // Prepend relative path
                    img.attr('src', newSrc);
                    // console.log(`Adjusted img src: ${src} -> ${newSrc}`);
                }
            });

             // Adjust anchor links (href starting with / but not // and not just #)
             $('a').each((i, el) => {
                 const link = $(el);
                 const href = link.attr('href');
                 if (href && href.startsWith('/') && !href.startsWith('//') && href !== '/') {
                     const newHref = `${relativePathPrefix}${href}`; // Prepend relative path
                     link.attr('href', newHref);
                     // console.log(`Adjusted anchor href: ${href} -> ${newHref}`);
                 } else if (href === '/') {
                     // Special case: Links pointing to the absolute root "/" should point relative to the root
                      link.attr('href', `${relativePathPrefix}/`);
                     // console.log(`Adjusted root anchor href: ${href} -> ${relativePathPrefix}/`);
                 }
             });

            // --- Set Community Logo ---
            const logoFilename = community.logo_filename;
            const logoElement = $('#logo'); // Target the img tag directly

            if (logoElement.length > 0) {
                if (logoFilename) {
                    // Construct the relative path to the logo image
                    const logoSrc = `${relativePathPrefix}/images/logos/${logoFilename}`;
                    logoElement.attr('src', logoSrc);
                    logoElement.attr('alt', `${communityName} Logo`);
                    
                    // --- FORCE INLINE STYLES ---
                    logoElement.css({
                        'display': 'block',
                        'width': '150px',
                        'height': '150px',
                        'padding': '0',
                        'border': 'none',
                        'box-shadow': 'none',
                        'object-fit': 'cover',
                        'box-sizing': 'border-box',
                        'margin': '0',
                        'background-color': '#f8f9fa'
                    });
                    // --- END FORCE INLINE STYLES ---
                    
                    console.log(`Set logo for ${communityName} to: ${logoSrc}`);
                } else {
                    // Hide the logo IMG element if no filename exists in DB
                    logoElement.css('display', 'none');
                    console.log(`No logo filename found for ${communityName}. Hiding logo element.`);
                }
            } else {
                 console.warn(`Template is missing the #logo image element.`);
            }

            // --- Write the processed HTML file ---
            await fs.writeFile(outputFilePath, $.html());
            // console.log(`Generated: ${outputFilePath}`); // Keep console less noisy for many files

        } // End community loop

        console.log('Finished page generation loop.');
        console.log('Community page generation finished successfully.');

    } catch (error) {
        console.error('Error during community page generation:', error);
        process.exit(1); // Exit with error code
    }
}

// --- Helper Functions ---

// Create URL-friendly slugs
function createSlug(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .trim();                  // Trim leading/trailing spaces
}

// --- Run the generation function ---
generateCommunityPages();
