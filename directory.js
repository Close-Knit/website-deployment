// --- START OF UPDATED directory.js ---

// ======================================================================
// Initialize Supabase (Same as before)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages (Same as before)
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) {
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">${message}</li>`;
    }
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) {
          communityNameElement.textContent = "Error Loading Directory";
     }
}

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');

    if (resultsList) resultsList.innerHTML = '<li>Loading listings...</li>';
    if (communityNameElement) communityNameElement.textContent = 'Loading Directory...';

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL.");
        return;
    }

     if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory`;
     if (pageTitle) pageTitle.textContent = `${communityName}, ${provinceName} Directory`;

    const tableName = provinceName.replace(/ /g, '_');
    console.log(`Attempting to load directory for community: "${communityName}", province: "${provinceName}" (Table: "${tableName}")`);

    try {
        // --- Step 1: Get the Community ID from the communities table ---
        console.log(`Fetching ID for community name: "${communityName}"`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id') // Select only the id column
            .eq('community_name', communityName) // Filter by the name from the URL
            .limit(1) // We only expect one match
            .single(); // Return a single object or null

        if (communityError) {
            console.error("Supabase error fetching community ID:", communityError);
            throw new Error(`Failed to find community ID: ${communityError.message}`);
        }

        if (!communityData) {
            throw new Error(`Community "${communityName}" not found in the communities database table.`);
        }

        const communityId = communityData.id; // Get the ID
        console.log(`Found Community ID: ${communityId} for "${communityName}"`);


        // --- Step 2: Fetch listings using the Community ID ---
         console.log(`Fetching listings from table "${tableName}" using community_id: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_id', communityId) // **** Use community_id here ****
            .order('name', { ascending: true });

        if (listingsError) {
            console.error("Supabase error fetching listings:", listingsError);
            // Check for common errors like incorrect table name again
             if (listingsError.code === '42P01') {
                 throw new Error(`Database table "${tableName}" not found. Check table naming.`);
            } else if (listingsError.code === '42703') { // undefined_column
                 throw new Error(`Column 'community_id' does not exist in table "${tableName}". Check your database schema.`);
            }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        // --- Step 3: Display Listings (Same rendering logic as before) ---
        resultsList.innerHTML = '';

        if (!listings || listings.length === 0) {
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
            if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory (0 listings)`;
            return;
        }

        if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory (${listings.length} listings)`;

        listings.forEach(listing => {
            const listItem = document.createElement('li');
            listItem.className = 'directory-entry';
            listItem.innerHTML = `
                <span class="name">${listing.name || 'N/A'}</span>
                <span class="phone">${listing.phone_number ? `<a href="tel:${listing.phone_number}">${listing.phone_number}</a>` : 'N/A'}</span>
                <span class="category">${listing.category || 'General'}</span>
                ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
            `;
            resultsList.appendChild(listItem);
        });

    } catch (fetchError) {
        displayError(fetchError.message); // Display the specific error caught
    }
}

// ======================================================================
// Initialize Search Functionality (Same as before)
// ======================================================================
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');
    if (!searchBox || !resultsList) return;
    searchBox.addEventListener('input', () => { /* ...search logic... */ });
     // The existing search logic should still work fine
     searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase().trim();
        const entries = resultsList.querySelectorAll('.directory-entry');
        entries.forEach(entry => {
            const name = entry.querySelector('.name')?.textContent.toLowerCase() || '';
            const phone = entry.querySelector('.phone')?.textContent.toLowerCase() || '';
            const category = entry.querySelector('.category')?.textContent.toLowerCase() || '';
            const notes = entry.querySelector('.notes')?.textContent.toLowerCase() || '';
            if (name.includes(query) || category.includes(query) || phone.includes(query) || notes.includes(query)) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    });
}

// ======================================================================
// Initialize Print Functionality (Same as before)
// ======================================================================
function initializePrint() {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', () => window.print());
    }
}

// ======================================================================
// Main Execution (Same as before)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayError("Supabase library not loaded."); return;
    }
    fetchAndDisplayListings();
    initializeSearch();
    initializePrint();
});

// --- END OF UPDATED directory.js ---