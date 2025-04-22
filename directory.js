// --- START OF directory.js (Generic "Sponsored" Label - CAREFUL EDIT) ---

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

    // Get DOM elements, etc. (unchanged)
    const resultsList = document.getElementById('results'); /* ... */
    const urlParams = new URLSearchParams(window.location.search); /* ... */
    if (!provinceName || !communityName) { /* ... */ return; }
    /* ... set titles, logo, breadcrumbs ... */
    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo
        /* ... unchanged ... */
        // Update Suggest Change Link
        /* ... unchanged ... */

        // Fetch Listings
        const { data: listings, error: listingsError } = await supabaseClient.from(tableName).select('*').eq('community_id', communityId).order('category', { ascending: true, nullsFirst: false }).order('name', { ascending: true });
        if (listingsError) { throw listingsError; }

        resultsList.innerHTML = ''; // Clear loading
        // Update subtitle
        /* ... unchanged ... */
        if (listingCount === 0) { /* ... */ return; }

        // Group and Sort Listings by Category and Tier
        const groupedListings = listings.reduce(/* ... */);
        const sortedCategories = Object.keys(groupedListings).sort(/* ... */);
        const now = new Date();

        // --- Render Listings ---
        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li'); /* ... */ resultsList.appendChild(categoryHeadingItem);
             const listingsInCategory = groupedListings[category];
             const goldListings = [], silverListings = [], bronzeListings = [], regularListings = [];
             // Categorize listings by tier (unchanged)
             listingsInCategory.forEach(listing => { /* ... */ });
             const categorySortedListings = goldListings.concat(silverListings).concat(bronzeListings).concat(regularListings);

             // Render sorted listings for the category
             categorySortedListings.forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // Apply Tier Styling & *** Generic Label ***
                 const isActivePromotion = /* ... check promotion ... */ ;
                 const duration = listing.promotion_duration_months;
                 let tierClass = '';
                 let sponsoredLabelHtml = ''; // Initialize as empty
                 let labelTierClass = ''; // Class for the label span styling

                 if (isActivePromotion) {
                     // Determine tier class for the LI background/border
                     if (duration === 12) { tierClass = 'promoted-gold'; labelTierClass = 'gold'; }
                     else if (duration === 6) { tierClass = 'promoted-silver'; labelTierClass = 'silver'; }
                     else { tierClass = 'promoted-bronze'; labelTierClass = 'bronze'; } // Default to bronze class
                     listItem.classList.add(tierClass);

                     // *** CHANGE HERE: Use generic text "Sponsored" but keep tier class for color ***
                     sponsoredLabelHtml = `<span class="sponsored-label ${labelTierClass}">Sponsored</span>`;
                 }
                 // --- End Tier Styling/Label ---

                 const listingId = listing.id;
                 // Phone Button HTML
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" ...>...</button>`; } // Condensed

                 // Promote Button HTML
                 let promoteButtonHtml = '';
                 if (listingId && !isActivePromotion) { /* ... create promote button */ }

                 // Construct final HTML (Ensure no stray comments)
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'} ${sponsoredLabelHtml}</span>
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