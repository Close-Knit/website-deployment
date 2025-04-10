// ======================================================================
// Initialize Supabase
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
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`;
    }
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) {
          communityNameElement.textContent = "Error Loading Directory";
     }
     // Hide logo on error
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

    // --- Update Page Title/Heading & Set Up Logo ---
     const baseTitle = `${communityName}, ${provinceName}`;
     if (communityNameElement) communityNameElement.textContent = `Loading ${baseTitle} Directory...`; // Update during load
     if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;

     // Set Logo Dynamically - ADJUST PATHS AS NEEDED
     if (logoElement) {
         let logoPath = ""; // Default empty
         let logoAlt = `${communityName} Logo`; // Default alt text

         // Add specific logos based on community/province
         if (communityName === "Cluculz Lake" && provinceName === "British Columbia") {
              // *** IMPORTANT: CHANGE THIS PATH to your actual Cluculz Lake logo ***
              logoPath = "images/logos/cluculz_lake_logo.png";
              logoAlt = "Cluculz Lake Logo";
         }
         // Add more 'else if' blocks here for other specific community logos
         // else if (communityName === "SomeOtherCommunity" && provinceName === "SomeProvince") {
         //      logoPath = "images/logos/some_other_logo.png";
         //      logoAlt = "Some Other Logo";
         // }

         // Set logo source and alt text if a path was found
         if (logoPath) {
             logoElement.src = `images/logos/${logoFilename}`; 
             logoElement.alt = logoAlt;
             logoElement.style.display = 'block'; // Show the logo
         } else {
             logoElement.style.display = 'none'; // Hide if no specific logo found
         }
     }


    // --- Determine Provincial Table Name ---
    // Assumes table names match province names (e.g., "British_Columbia", "Ontario")
    const tableName = provinceName.replace(/ /g, '_');
    console.log(`Attempting to load directory for community: "${communityName}", province: "${provinceName}" (Table: "${tableName}")`);

    try {
        // --- Step 1: Get the Community ID from the communities table ---
        console.log(`Fetching ID for community name: "${communityName}"`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id')
            .eq('community_name', communityName)
            .limit(1)
            .single();

        if (communityError) {
            console.error("Supabase error fetching community ID:", communityError);
            throw new Error(`Could not verify community "${communityName}". ${communityError.message}`);
        }

        if (!communityData) {
            throw new Error(`Community "${communityName}" not found in the 'communities' database table.`);
        }

        const communityId = communityData.id;
        console.log(`Found Community ID: ${communityId} for "${communityName}"`);


        // --- Step 2: Fetch listings using the Community ID ---
         console.log(`Fetching listings from table "${tableName}" using community_id: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false }) // Group null categories last
            .then(response => { // Then sort by name within category
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

        // --- Step 3: Group Listings by Category ---
        resultsList.innerHTML = ''; // Clear loading message

        if (!listings || listings.length === 0) {
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
            // Update heading to reflect no listings
            if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (0 listings)`;
            return;
        }

        // Update heading with final count
        if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (${listings.length} listings)`;


        const groupedListings = listings.reduce((acc, listing) => {
            const category = listing.category || 'Uncategorized'; // Group nulls
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(listing);
            return acc;
        }, {});

        // Sort categories alphabetically, handle "Uncategorized" potentially
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => {
             if (a === 'Uncategorized') return 1; // Put Uncategorized last
             if (b === 'Uncategorized') return -1;
             return a.localeCompare(b); // Standard sort for others
        });


        // --- Step 4: Render Grouped Listings ---
        sortedCategories.forEach(category => {
            const categoryHeadingItem = document.createElement('li');
            categoryHeadingItem.className = 'category-heading';
            categoryHeadingItem.textContent = category;
            resultsList.appendChild(categoryHeadingItem);

            groupedListings[category].forEach(listing => {
                const listItem = document.createElement('li');
                listItem.className = 'directory-entry';
                listItem.innerHTML = `
                    <div class="entry-details">
                         <span class="name">${listing.name || 'N/A'}</span>
                         ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                    </div>
                    <span class="phone">${listing.phone_number ? `<a href="tel:${listing.phone_number}">${listing.phone_number}</a>` : ''}</span>
                `;
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
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');

    if (!searchBox || !resultsList) {
        console.warn("Search box or results list element not found. Search disabled.");
        return;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase().trim();
        const categoryHeadings = resultsList.querySelectorAll('.category-heading');
        const entries = resultsList.querySelectorAll('.directory-entry');
        let visibleCategories = new Set(); // Keep track of categories with visible entries

        // Filter individual entries first
        entries.forEach(entry => {
            const name = entry.querySelector('.name')?.textContent.toLowerCase() || '';
            const phone = entry.querySelector('.phone')?.textContent.toLowerCase() || '';
             // Search category text from the HEADING, not within the entry itself
            // const category = entry.querySelector('.category')?.textContent.toLowerCase() || ''; // Remove this line
            const notes = entry.querySelector('.notes')?.textContent.toLowerCase() || '';

            // Decide if the entry should be visible
             // Note: We are NOT filtering by the category text itself here, as it's a heading now.
             // Users search by name/phone/notes. Category is for browsing.
            const isVisible = name.includes(query) || phone.includes(query) || notes.includes(query);

            if (isVisible) {
                entry.style.display = ''; // Use default display (flex)
                 // Find the preceding category heading for this visible entry
                 let currentElement = entry;
                 while(currentElement.previousElementSibling) {
                     currentElement = currentElement.previousElementSibling;
                     if (currentElement.classList.contains('category-heading')) {
                         visibleCategories.add(currentElement); // Mark its category heading as needing to be visible
                         break;
                     }
                 }
            } else {
                entry.style.display = 'none';
            }
        });

        // Show/hide category headings based on whether they have visible entries
        categoryHeadings.forEach(heading => {
            if (visibleCategories.has(heading)) {
                heading.style.display = ''; // Show heading
            } else {
                 // Only hide if search query is not empty
                 if (query.length > 0) {
                    heading.style.display = 'none'; // Hide heading if no entries match and query exists
                 } else {
                     heading.style.display = ''; // Ensure heading is visible if query is empty
                 }

            }
        });
    });
}


// ======================================================================
// Initialize Print Functionality
// ======================================================================
function initializePrint() {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print(); // Trigger browser's print dialog
        });
    } else {
        console.warn("Print button element not found.");
    }
}


// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayError("Supabase library not loaded. Check script tag in community.html.");
        return;
    }
    fetchAndDisplayListings(); // Load listings
    initializeSearch();        // Set up search
    initializePrint();         // Set up print
});