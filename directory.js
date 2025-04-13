// --- START OF UPDATED directory.js (Delayed Supabase Init) ---

// ======================================================================
// Declare Supabase Client Variable Globally (but initialize later)
// ======================================================================
let supabaseClient = null; // Use 'let' as it will be assigned later

// ======================================================================
// Helper to display error messages 
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message); 
    const resultsList = document.getElementById('results');
    if (resultsList) {
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
    // Ensure client is initialized before proceeding
    if (!supabaseClient) {
        displayError("Supabase client not initialized. Cannot fetch data.");
        return;
    }

    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');

    if (resultsList) {
        resultsList.innerHTML = '<li>Loading...</li>'; 
    } else {
        console.error("Fatal Error: Results list element (#results) not found.");
        return; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL."); 
        return;
    }

    const baseTitle = `${communityName}, ${provinceName}`;
     if (communityNameElement) communityNameElement.textContent = `Loading ${baseTitle} Directory...`;
     if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
     if (logoElement) logoElement.style.display = 'none';

    const tableName = provinceName.replace(/ /g, '_');
    // console.log(`Attempting load: C:"${communityName}", P:"${provinceName}", T:"${tableName}"`); 

    try {
        // --- Step 1: Get Community ID AND Logo Filename ---
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename') 
            .eq('community_name', communityName)
            .limit(1)
            .single();

        if (communityError) { throw new Error(`Could not verify community "${communityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${communityName}" not found.`); }

        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename; 

        // --- Set Logo ---
        if (logoElement && logoFilename) { 
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${communityName} Logo`; 
             logoElement.style.display = 'block'; 
        }

        // --- Set Suggest Change Link ---
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(provinceName)}&comm=${encodeURIComponent(communityName)}`;
        }

        // --- Step 2: Fetch listings ---
         const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') 
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false }) 
            .then(response => { 
                if (response.data) { response.data.sort((a, b) => (a.name || '').localeCompare(b.name || '')); }
                return response;
            });

        if (listingsError) { 
            if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found.`); }
            if (listingsError.code === '42703') { throw new Error(`Col 'community_id' missing in "${tableName}".`); }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        // --- Step 3 & 4: Group and Render Listings ---
        resultsList.innerHTML = ''; 

        if (!listings || listings.length === 0) { 
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
            if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (0 listings)`;
            return;
        }

        if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (${listings.length} listings)`;

        const groupedListings = listings.reduce(/* ... */); // Simplified for brevity
        const sortedCategories = Object.keys(groupedListings).sort(/* ... */); // Simplified

        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li'); /*...*/
             resultsList.appendChild(categoryHeadingItem);
             groupedListings[category].forEach(listing => {
                 const listItem = document.createElement('li'); /*...*/
                 listItem.innerHTML = `...`; // Render HTML
                 resultsList.appendChild(listItem);
             });
        });

    } catch (fetchError) {
        displayError(fetchError.message); 
    }
}

// ======================================================================
// Initialize Search Functionality 
// ======================================================================
function initializeSearch() { /* ... */ }

// ======================================================================
// Initialize Print Functionality 
// ======================================================================
function initializePrint() { /* ... */ }

// ======================================================================
// Main Execution 
// ======================================================================
document.addEventListener('DOMContentLoaded', () => { 
    // --- Start: Moved Supabase Init Here ---
    console.log("[DEBUG] DOMContentLoaded fired."); // Add log

    // Check if Supabase library itself loaded
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
         displayError("Supabase library failed to load. Check script tags in HTML.");
         console.error("Supabase library failed to load."); 
         return; 
    }
    
    console.log("[DEBUG] Supabase library found. Initializing client...");

    // Initialize Supabase Client HERE
    const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
    const { createClient } = supabase; // Destructure createClient here
    supabaseClient = createClient(supabaseUrl, supabaseKey); // Assign to the global 'let' variable

    console.log("[DEBUG] Supabase client initialized.");
    // --- End: Moved Supabase Init Here ---

    // Now call functions that rely on supabaseClient
    fetchAndDisplayListings();
    initializeSearch();
    initializePrint();
});

// --- END OF UPDATED directory.js ---