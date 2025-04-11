// --- START OF UPDATED directory.js (Address Display Fix) ---

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

    // Initial loading message is in HTML

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
    console.log(`Attempting to load directory for community: "${communityName}", province: "${provinceName}" (Table: "${tableName}")`);

    try {
        // --- Step 1: Get Community ID AND Logo Filename ---
        console.log(`Fetching ID and logo for community name: "${communityName}"`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename') 
            .eq('community_name', communityName)
            .limit(1)
            .single();

        if (communityError) { throw new Error(`Could not verify community "${communityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${communityName}" not found in the 'communities' database table.`); }

        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename; 

        console.log(`Found Community ID: ${communityId}, Logo Filename: ${logoFilename || 'None'}`);

        // --- Set Logo Dynamically using DB value ---
        if (logoElement && logoFilename) { 
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${communityName} Logo`; 
             logoElement.style.display = 'block'; 
        }

        // --- Set Suggest Change Link ---
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(provinceName)}&comm=${encodeURIComponent(communityName)}`;
        } else { console.warn("Suggest change link element (#suggestChangeLink) not found."); }


        // --- Step 2: Fetch listings using the Community ID ---
         console.log(`Fetching listings from table "${tableName}" using community_id: ${communityId}`);
         const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') 
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false }) 
            .then(response => { 
                if (response.data) {
                    response.data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                }
                return response;
            });


        if (listingsError) { 
            console.error("Supabase error fetching listings:", listingsError);
            if (listingsError.code === '42P01') { throw new Error(`Database table "${tableName}" not found.`); }
            if (listingsError.code === '42703') { throw new Error(`Column 'community_id' missing in table "${tableName}".`); }
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

        // Rendering logic
        sortedCategories.forEach(category => {
            const categoryHeadingItem = document.createElement('li');
            categoryHeadingItem.className = 'category-heading';
            categoryHeadingItem.textContent = category;
            resultsList.appendChild(categoryHeadingItem);

            groupedListings[category].forEach(listing => {
                const listItem = document.createElement('li');
                listItem.className = 'directory-entry';

                // ***** Corrected Section (Removed literal comment) *****
                listItem.innerHTML = `
                    <div class="entry-details">
                         <span class="name">${listing.name || 'N/A'}</span>
                         ${listing.address ? `<span class="address">${listing.address}</span>` : ''} 
                         ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                    </div>
                    <span class="phone">${listing.phone_number ? `<a href="tel:${listing.phone_number}">${listing.phone_number}</a>` : ''}</span>
                `;
                // ***** End: Corrected Section *****

                resultsList.appendChild(listItem);
            });
        });

    } catch (fetchError) {
        displayError(fetchError.message);
    }
}

// ======================================================================
// Initialize Search Functionality (Remains the same)
// ======================================================================
function initializeSearch() {
     const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');
    if (!searchBox || !resultsList) return;
    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase().trim();
        const categoryHeadings = resultsList.querySelectorAll('.category-heading');
        const entries = resultsList.querySelectorAll('.directory-entry');
        let visibleCategories = new Set();
        entries.forEach(entry => {
            const name = entry.querySelector('.name')?.textContent.toLowerCase() || '';
            const phone = entry.querySelector('.phone')?.textContent.toLowerCase() || '';
            const notes = entry.querySelector('.notes')?.textContent.toLowerCase() || '';
            // NOTE: Address is not searched by default
            const isVisible = name.includes(query) || phone.includes(query) || notes.includes(query);
            if (isVisible) {
                entry.style.display = '';
                 let currentElement = entry;
                 while(currentElement.previousElementSibling) { /* ... find heading ... */
                     currentElement = currentElement.previousElementSibling;
                     if (currentElement.classList.contains('category-heading')) {
                         visibleCategories.add(currentElement);
                         break;
                     }
                 }
            } else { entry.style.display = 'none'; }
        });
        categoryHeadings.forEach(heading => { /* ... show/hide logic ... */
            if (visibleCategories.has(heading) || query.length === 0) {
                heading.style.display = '';
            } else { heading.style.display = 'none'; }
        });
    });
}


// ======================================================================
// Initialize Print Functionality (Remains the same)
// ======================================================================
function initializePrint() {
    const printButton = document.getElementById('printButton');
    if (printButton) { printButton.addEventListener('click', () => window.print()); }
}


// ======================================================================
// Main Execution (Remains the same)
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