// --- START OF UPDATED directory.js (Refined Supabase Init) ---

// ======================================================================
// Declare Supabase Client Variable Globally
// ======================================================================
let supabaseClient = null;

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) {
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`;
    } else {
        console.error("Could not find #results element to display error.");
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

        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li');
             categoryHeadingItem.className = 'category-heading';
             categoryHeadingItem.textContent = category;
             resultsList.appendChild(categoryHeadingItem);

             groupedListings[category].forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // --- START: MODIFIED CODE FOR STEP 1 ---
                 // Store the phone number safely. Handle cases where it might be missing.
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = ''; // Default to empty string if no phone number

                 // Only create a button if there IS a phone number
                 if (phoneNumber) {
                     phoneHtml = `
                         <button class="revealPhoneBtn" data-phone="${phoneNumber}">
                             <i class="fa-solid fa-phone"></i> Show Phone
                         </button>
                     `;
                 } else {
                    // Optional: display something if no phone number, or just leave it blank
                    // phoneHtml = '<span class="no-phone">No Phone Listed</span>';
                 }

                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}</span>
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                     </div>
                     <div class="phone-container"> ${phoneHtml} </div>
                 `;
                 // --- END: MODIFIED CODE FOR STEP 1 ---

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
        console.warn("Search box or results list not found, search disabled.");
        return;
    }

    searchBox.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const listItems = resultsList.getElementsByClassName('directory-entry'); // Get only listing items
        const categoryHeadings = resultsList.getElementsByClassName('category-heading'); // Get category headings

        let visibleCategories = new Set(); // Track which categories have visible items

        // Filter list items first
        Array.from(listItems).forEach(item => {
            const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
            // Find the category heading associated with this item
            let currentElement = item;
            let categoryText = '';
            while (currentElement = currentElement.previousElementSibling) {
                if (currentElement.classList.contains('category-heading')) {
                    categoryText = currentElement.textContent.toLowerCase();
                    break;
                }
            }

            const matchesSearch = name.includes(searchTerm) || categoryText.includes(searchTerm);

            if (matchesSearch) {
                item.style.display = ''; // Show item
                if (categoryText) {
                    visibleCategories.add(categoryText); // Mark this category as having visible items
                }
            } else {
                item.style.display = 'none'; // Hide item
            }
        });

        // Show/hide category headings based on whether they have visible items
        Array.from(categoryHeadings).forEach(heading => {
            const categoryText = heading.textContent.toLowerCase();
            // A category heading should be visible if its text matches OR if it has visible items under it
             if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) {
                 heading.style.display = ''; // Show heading
             } else {
                 heading.style.display = 'none'; // Hide heading
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
            window.print();
        });
    } else {
        console.warn("Print button not found, print functionality disabled.");
    }
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");

    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
         displayError("Supabase library failed to load. Check script tags in HTML.");
         console.error("Supabase library failed to load.");
         return;
    }

    console.log("[DEBUG] Supabase library found. Initializing client...");

    // --- Start: Refined Supabase Init ---
    // Directly use supabase.createClient
    const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

    // Assign directly using the global supabase object
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    // --- End: Refined Supabase Init ---

    // Check if initialization was successful before proceeding
    if (!supabaseClient) {
        displayError("Failed to initialize Supabase client.");
        console.error("Failed to initialize Supabase client.");
        return;
    }

    console.log("[DEBUG] Supabase client initialized.");

    // Now call functions that rely on supabaseClient
    fetchAndDisplayListings();
    initializeSearch();
    initializePrint();
});

// --- END OF UPDATED directory.js ---