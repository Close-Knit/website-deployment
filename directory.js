// --- START OF UPDATED directory.js (With Breadcrumbs) ---

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
     // Also clear breadcrumbs on error
     const breadcrumbContainer = document.getElementById('breadcrumb-container');
     if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
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

    // Clear previous results/breadcrumbs
    if (resultsList) resultsList.innerHTML = '<li>Loading...</li>';
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (breadcrumbContainer) breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    if (!resultsList) { // Check resultsList after attempting to clear
        console.error("Fatal Error: Results list element (#results) not found.");
        return; // Cannot proceed without results list
    }

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL.");
        return;
    }

    // Decode names early for use in UI elements
    const decodedProvinceName = decodeURIComponent(provinceName);
    const decodedCommunityName = decodeURIComponent(communityName);

    const baseTitle = `${decodedCommunityName}, ${decodedProvinceName}`;
    if (communityNameElement) communityNameElement.textContent = `Loading ${baseTitle} Directory...`;
    if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
    if (logoElement) logoElement.style.display = 'none'; // Ensure logo starts hidden

    // --- START: Breadcrumb Generation ---
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                <li class="breadcrumb-item"><a href="province_page.html?province=${encodeURIComponent(decodedProvinceName)}">${decodedProvinceName}</a></li>
                <li class="breadcrumb-item active" aria-current="page">${decodedCommunityName}</li>
            </ol>
        `;
    } else {
        console.warn("Breadcrumb container not found.");
    }
    // --- END: Breadcrumb Generation ---


    const tableName = decodedProvinceName.replace(/ /g, '_'); // Use decoded name for table lookup consistency

    try {
        // Fetch Community ID and Logo (using decodedCommunityName)
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename')
            .eq('community_name', decodedCommunityName) // Use decoded name for lookup
            .limit(1)
            .single();

        if (communityError) { throw new Error(`Could not verify community "${decodedCommunityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found.`); }

        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename;

        // Display logo if available
        if (logoElement && logoFilename) {
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${decodedCommunityName} Logo`; // Use decoded name
             logoElement.style.display = 'block';
        } else if (logoElement) {
             logoElement.style.display = 'none'; // Explicitly hide if no logo
        }

        // Set Suggest Change Link
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            // Use original encoded names for URL parameters if needed, but decodedProvinceName should be safe here
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`;
        } else {
            console.warn("Suggest change link element not found.")
        }

        // Fetch Listings
         const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_id', communityId)
            // Simpler sorting: category first, then name
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });


        if (listingsError) {
            if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
            if (listingsError.code === '42703') { throw new Error(`Column 'community_id' missing in table "${tableName}".`); }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        resultsList.innerHTML = ''; // Clear loading message

        if (!listings || listings.length === 0) {
            resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`;
            if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (0 listings)`;
            return;
        }

        if (communityNameElement) communityNameElement.textContent = `${baseTitle} Directory (${listings.length} listings)`;

        // Group listings by category
        const groupedListings = listings.reduce((acc, listing) => {
            const category = listing.category || 'Uncategorized';
            if (!acc[category]) { acc[category] = []; }
            acc[category].push(listing);
            return acc;
         }, {});

        // Sort categories alphabetically, placing 'Uncategorized' last
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => {
             if (a === 'Uncategorized') return 1; // Uncategorized goes last
             if (b === 'Uncategorized') return -1; // Uncategorized goes last
             return a.localeCompare(b); // Regular sort for others
         });

        // Render listings grouped by category
        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li');
             categoryHeadingItem.className = 'category-heading';
             categoryHeadingItem.textContent = category;
             resultsList.appendChild(categoryHeadingItem);

             // Listings within this category (already sorted by name from DB query)
             groupedListings[category].forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) {
                     // Added title attribute for accessibility/hover info
                     phoneHtml = `
                         <button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}">
                             <i class="fa-solid fa-phone"></i> Show Phone
                         </button>
                     `;
                 }
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}</span>
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                     </div>
                     <div class="phone-container"> ${phoneHtml} </div>
                 `;
                 resultsList.appendChild(listItem);
             });
        });

    } catch (fetchError) {
        // Catch block now uses the displayError helper
        displayError(fetchError.message);
    }
}

// ======================================================================
// Initialize Search Functionality (Unchanged)
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
        const listItems = resultsList.getElementsByClassName('directory-entry');
        const categoryHeadings = resultsList.getElementsByClassName('category-heading');

        let visibleCategories = new Set();

        Array.from(listItems).forEach(item => {
            const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
            let currentElement = item;
            let categoryText = '';
            // Find the preceding category heading for the current item
            while (currentElement = currentElement.previousElementSibling) {
                if (currentElement.classList.contains('category-heading')) {
                    categoryText = currentElement.textContent.toLowerCase();
                    break;
                }
            }

            const matchesSearch = name.includes(searchTerm) || categoryText.includes(searchTerm);

            if (matchesSearch) {
                item.style.display = '';
                // If it matches, ensure its category heading is potentially visible
                if (categoryText) {
                    visibleCategories.add(categoryText);
                }
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide category headings based on search term or if they have visible items
        Array.from(categoryHeadings).forEach(heading => {
            const categoryText = heading.textContent.toLowerCase();
             // Show heading if it matches the search OR if any of its items are visible
             if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) {
                 heading.style.display = '';
             } else {
                 heading.style.display = 'none';
             }
        });
    });
}


// ======================================================================
// Initialize Print Functionality (Unchanged)
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
// Initialize Popup Interactivity (Unchanged logic, added console logs)
// ======================================================================
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber'); // This is the <p> element

    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay) {
        console.error("Popup elements missing. Cannot initialize popup interaction.");
        return;
    }

    // Use event delegation on the results list
    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn'); // Find the button even if icon is clicked

        if (revealButton) {
            event.preventDefault(); // Prevent any default button action
            const numberToDisplay = revealButton.dataset.phone;

            if (numberToDisplay) {
                // Update the HTML inside the popup paragraph to include a clickable tel link
                phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`;

                phonePopup.classList.remove('hidden');
                console.log(`Showing popup for number: ${numberToDisplay}`);

                // Optional: Push AdSense event if needed when popup opens
                // try {
                //     (adsbygoogle = window.adsbygoogle || []).push({});
                //     console.log("AdSense push attempted on popup open.");
                // } catch (e) {
                //     console.error("AdSense push error:", e);
                // }

            } else {
                console.warn("Clicked reveal button is missing phone data (data-phone attribute).");
            }
        }
    });

    // Close button listener
    closePopupButton.addEventListener('click', function() {
        phonePopup.classList.add('hidden');
        console.log("Popup closed via X button.");
    });

    // Close popup if clicking outside the content area
     phonePopup.addEventListener('click', function(event) {
         // Check if the click target is the popup background itself, not its content
         if (event.target === phonePopup) {
              phonePopup.classList.add('hidden');
              console.log("Popup closed by clicking outside.");
         }
     });
}
// ======================================================================
// End Popup Interactivity Function
// ======================================================================


// ======================================================================
// Main Execution (Unchanged)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");

    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
         displayError("Supabase library failed to load. Check script tags in HTML.");
         return;
    }

    console.log("[DEBUG] Supabase library found. Initializing client...");

    const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    if (!supabaseClient) {
        displayError("Failed to initialize Supabase client.");
        return;
    }

    console.log("[DEBUG] Supabase client initialized.");

    // Initialize all functionalities
    fetchAndDisplayListings(); // Fetches data and populates breadcrumbs
    initializeSearch();
    initializePrint();
    initializePopupInteraction(); // Sets up click listeners for phone reveal

});

// --- END OF UPDATED directory.js ---