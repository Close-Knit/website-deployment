// --- START OF directory.js (Generic "Sponsored Ad" Label) ---

// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Helper to display error messages (unchanged)
// ======================================================================
function displayError(message) { /* ... */ }

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    // Check for global client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    console.log("Directory.js using supabaseClient initialized in common.js");

    // Get DOM elements, check elements, get URL params, set titles, breadcrumbs etc.
    // ... (This part remains unchanged) ...
    const resultsList = document.getElementById('results'); /* ... etc ... */
    if (!resultsList) { /* ... */ return; }
    const urlParams = new URLSearchParams(window.location.search); /* ... etc ... */
    if (!provinceName || !communityName) { /* ... */ return; }
    /* ... set titles, logo, breadcrumbs ... */
    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo
        /* ... fetch community data unchanged ... */
        const { data: communityData, error: communityError } = await supabaseClient.from('communities').select('id, logo_filename')...;
        /* ... handle community data/error ... */
        const communityId = communityData.id; /* ... etc ... */

        // Update Suggest Change Link
        /* ... update suggest link unchanged ... */

        // --- Fetch Listings ---
        const { data: listings, error: listingsError } = await supabaseClient.from(tableName).select('*')...;
        if (listingsError) { throw listingsError; }

        resultsList.innerHTML = ''; // Clear loading

        // Update subtitle
        /* ... update subtitle unchanged ... */
        if (listingCount === 0) { /* ... */ return; }

        // --- Group and Sort Listings by Category and Tier ---
        const groupedListings = listings.reduce(/* ... */);
        const sortedCategories = Object.keys(groupedListings).sort(/* ... */);
        const now = new Date();

        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li'); /* ... */ resultsList.appendChild(categoryHeadingItem);
             const listingsInCategory = groupedListings[category];
             const goldListings = [], silverListings = [], bronzeListings = [], regularListings = [];

             // Categorize listings by tier (logic remains the same)
             listingsInCategory.forEach(listing => { /* ... */ });
             const categorySortedListings = goldListings.concat(silverListings).concat(bronzeListings).concat(regularListings);

             // --- Render the sorted listings for the category ---
             categorySortedListings.forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // --- Check Promotion Status ---
                 const isPromoted = listing.is_promoted === true; const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 let tierClass = '';
                 let sponsoredLabelHtml = ''; // Initialize as empty

                 // --- Apply Tier-Specific Class BUT Generic Label ---
                 if (isActivePromotion) {
                     // Apply class based on duration for styling
                     if (duration === 12) { tierClass = 'promoted-gold'; }
                     else if (duration === 6) { tierClass = 'promoted-silver'; }
                     else { tierClass = 'promoted-bronze'; }
                     listItem.classList.add(tierClass);

                     // *** CHANGE HERE: Set generic label text but keep tier class for label styling ***
                     sponsoredLabelHtml = `<span class="sponsored-label ${tierClass.replace('promoted-','')}">Sponsored Ad</span>`;
                     // Example: if tierClass is 'promoted-gold', label class becomes 'sponsored-label gold'
                 }
                 // --- End Tier Styling/Label ---

                 const listingId = listing.id;
                 // Phone Button HTML
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button ...>`; }

                 // Promote Button HTML
                 let promoteButtonHtml = '';
                 if (listingId && !isActivePromotion) { /* ... create promote button ... */ }

                 // Construct final HTML
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'} ${sponsoredLabelHtml}</span> {/* Generic Label added */}
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                          ${promoteButtonHtml}
                     </div>
                     <div class="phone-container">
                          ${phoneHtml}
                     </div>
                 `;
                 resultsList.appendChild(listItem);
             }); // End rendering loop
        }); // End category loop

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings

// Initialize Search Functionality (Unchanged)
function initializeSearch() { /* ... */ }

// Initialize Popup Interactivity (Unchanged)
function initializePopupInteraction() { /* ... */ }

// Main Execution
document.addEventListener('DOMContentLoaded', () => { /* ... */ });

// --- END OF directory.js ---