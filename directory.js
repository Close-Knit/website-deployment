// --- START OF UPDATED directory.js (Enhanced Debugging) ---

// ======================================================================
// Initialize Supabase (Same as before)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages 
// ======================================================================
function displayError(message) {
    console.error("[DEBUG] displayError called with:", message); // Debug error display
    const resultsList = document.getElementById('results');
    if (resultsList) {
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`; 
    } else {
        console.error("[DEBUG] resultsList element not found in displayError!");
    }
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) {
          communityNameElement.textContent = "Error Loading Directory";
     }
     const logoElement = document.getElementById('logo');
     if(logoElement) logoElement.style.display = 'none';
}

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    console.log("[DEBUG] fetchAndDisplayListings called"); // Log function start
    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');

    // Clear placeholder and set initial loading message
    if (resultsList) {
        resultsList.innerHTML = '<li>Loading...</li>'; 
        console.log("[DEBUG] Initial 'Loading...' message set.");
    } else {
        console.error("[DEBUG] Fatal Error: Results list element (#results) not found.");
        return; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");
    console.log(`[DEBUG] Params: province=${provinceName}, community=${communityName}`);

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL."); 
        return;
    }

    const baseTitle = `${communityName}, ${provinceName}`;
     if (communityNameElement) communityNameElement.textContent = `Loading ${baseTitle} Directory...`;
     if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
     if (logoElement) logoElement.style.display = 'none';

    const tableName = provinceName.replace(/ /g, '_');
    console.log(`[DEBUG] Determined table name: ${tableName}`);

    try {
        console.log("[DEBUG] Entering try block.");
        // --- Step 1: Get Community ID AND Logo Filename ---
        console.log(`[DEBUG] Fetching community data for: "${communityName}"`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename') 
            .eq('community_name', communityName)
            .limit(1)
            .single();
        console.log("[DEBUG] Community data fetch completed.");

        if (communityError) { 
            console.error("[DEBUG] Error fetching community data:", communityError);
            throw new Error(`Could not verify community "${communityName}". ${communityError.message}`); 
        }
        if (!communityData) { 
            console.error("[DEBUG] Community data not found in DB.");
            throw new Error(`Community "${communityName}" not found in the 'communities' database table.`); 
        }

        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename; 
        console.log(`[DEBUG] Found Community ID: ${communityId}, Logo Filename: ${logoFilename || 'None'}`);

        // --- Set Logo Dynamically ---
        console.log("[DEBUG] Setting logo...");
        if (logoElement && logoFilename) { 
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${communityName} Logo`; 
             logoElement.style.display = 'block'; 
        }
        console.log("[DEBUG] Logo set (or skipped).");

        // --- Set Suggest Change Link ---
        console.log("[DEBUG] Setting suggest change link...");
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(provinceName)}&comm=${encodeURIComponent(communityName)}`;
        } else { console.warn("[DEBUG] Suggest change link element (#suggestChangeLink) not found."); }
        console.log("[DEBUG] Suggest change link set (or skipped).");

        // --- Step 2: Fetch listings ---
         console.log(`[DEBUG] Fetching listings from table "${tableName}" using community_id: ${communityId}`);
         const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') 
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false }) 
            .then(response => { 
                if (response.data) { response.data.sort((a, b) => (a.name || '').localeCompare(b.name || '')); }
                return response;
            });
        console.log("[DEBUG] Listings fetch completed.");

        if (listingsError) { 
            console.error("[DEBUG] Error fetching listings data:", listingsError);
            if (listingsError.code === '42P01') { throw new Error(`Database table "${tableName}" not found.`); }
            if (listingsError.code === '42703') { throw new Error(`Column 'community_id' missing in table "${tableName}".`); }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }
        console.log(`[DEBUG] Fetched ${listings?.length || 0} listings.`);

        // --- Step 3 & 4: Group and Render Listings ---
        console.log("[DEBUG] Clearing results list before rendering.");
        resultsList.innerHTML = ''; // Clear "Loading..." message

        if (!listings || listings.length === 0) { 
            console.log("[DEBUG] No listings found, displaying message.");
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
            if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (0 listings)`;
            console.log("[DEBUG] Exiting fetchAndDisplayListings after no listings found.");
            return;
        }

        console.log("[DEBUG] Updating heading with count.");
        if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (${listings.length} listings)`;

        console.log("[DEBUG] Grouping listings by category...");
        const groupedListings = listings.reduce((acc, listing) => { 
            const category = listing.category || 'Uncategorized';
            if (!acc[category]) { acc[category] = []; }
            acc[category].push(listing);
            return acc;
        }, {});
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => { 
             if (a === 'Uncategorized') return 1; if (b === 'Uncategorized') return -1;
             return a.localeCompare(b);
        });
        console.log(`[DEBUG] Grouped into ${sortedCategories.length} categories.`);

        console.log("[DEBUG] Starting render loop...");
        sortedCategories.forEach(category => {
            // ... render category heading ...
            const categoryHeadingItem = document.createElement('li'); /*...*/ 
            categoryHeadingItem.className = 'category-heading';
            categoryHeadingItem.textContent = category;
            resultsList.appendChild(categoryHeadingItem);

            groupedListings[category].forEach(listing => {
                // ... render list item ...
                 const listItem = document.createElement('li'); /*...*/
                 listItem.className = 'directory-entry';
                 listItem.innerHTML = `...`; // Corrected HTML structure
                 resultsList.appendChild(listItem);
            });
        });
        console.log("[DEBUG] Render loop finished.");

    } catch (fetchError) {
        console.error("[DEBUG] Error caught in try...catch block:", fetchError);
        displayError(fetchError.message); // Display the error message
    }
    console.log("[DEBUG] fetchAndDisplayListings finished."); // Log function end
}

// ======================================================================
// Initialize Search Functionality (Remains the same)
// ======================================================================
function initializeSearch() { /* ... */ }

// ======================================================================
// Initialize Print Functionality (Remains the same)
// ======================================================================
function initializePrint() { /* ... */ }

// ======================================================================
// Main Execution (Remains the same)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => { /* ... */ });

// --- END OF UPDATED directory.js ---