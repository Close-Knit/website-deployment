// --- START OF UPDATED directory.js (Fix Loading Message) ---

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
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) {
        // *** Ensure list is cleared on error ***
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`; 
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
    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');

    // *** Start: Modified Section - Clear loading message earlier ***
    // Clear any initial placeholder content immediately
    if (resultsList) {
        resultsList.innerHTML = '<li>Loading...</li>'; // Show a temporary loading state
    } else {
        console.error("Fatal Error: Results list element (#results) not found.");
        return; // Cannot proceed without the results container
    }
    // *** End: Modified Section ***

    // Initial message is now set above, comment out or remove duplicate if present in HTML

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL."); // displayError now clears the list
        return;
    }

    const baseTitle = `${communityName}, ${provinceName}`;
     if (communityNameElement) communityNameElement.textContent = `Loading ${baseTitle} Directory...`;
     if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
     if (logoElement) logoElement.style.display = 'none';

    const tableName = provinceName.replace(/ /g, '_');
    console.log(`Attempting to load directory for community: "${communityName}", province: "${provinceName}" (Table: "${tableName}")`);

    try {
        // --- Step 1: Get Community ID AND Logo Filename --- (Same as before)
        // ... fetch communityData ...
        if (communityError) { throw new Error(/*...*/); }
        if (!communityData) { throw new Error(/*...*/); }
        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename; 
        console.log(`Found Community ID: ${communityId}, Logo Filename: ${logoFilename || 'None'}`);

        // --- Set Logo Dynamically using DB value --- (Same as before)
        // ... set logo src ...
         if (logoElement && logoFilename) { /* ... */ }

        // --- Set Suggest Change Link --- (Same as before)
        // ... set suggestChangeLink href ...
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) { /* ... */ }


        // --- Step 2: Fetch listings --- (Same as before)
         console.log(`Fetching listings from table "${tableName}" using community_id: ${communityId}`);
         const { data: listings, error: listingsError } = await supabaseClient.from(tableName).select('*').eq('community_id', communityId).order(/*...*/).then(/*...*/);


        if (listingsError) { /* ... handle listing fetch error ... */ }


        // --- Step 3 & 4: Group and Render Listings ---
        // *** Ensure list is cleared BEFORE rendering results or 'no results' message ***
        resultsList.innerHTML = ''; // Clear "Loading..." message reliably here

        if (!listings || listings.length === 0) { // Handle no listings found
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
            if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (0 listings)`;
            return;
        }

        // Update heading with final count
        if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (${listings.length} listings)`;

        // Grouping logic (Same as before)
        const groupedListings = listings.reduce(/*...*/);
        const sortedCategories = Object.keys(groupedListings).sort(/*...*/);

        // Rendering logic (Same as before)
        sortedCategories.forEach(category => {
            const categoryHeadingItem = document.createElement('li'); /*...*/ 
            resultsList.appendChild(categoryHeadingItem);

            groupedListings[category].forEach(listing => {
                const listItem = document.createElement('li'); /*...*/
                listItem.innerHTML = `...`; // Corrected HTML structure
                resultsList.appendChild(listItem);
            });
        });

    } catch (fetchError) {
        // Ensure displayError clears the list
        displayError(fetchError.message); 
    }
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