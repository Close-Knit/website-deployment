// --- START OF directory.js (Send Address/Phone to Promote Page) ---

// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Helper to display error messages (unchanged)
// ======================================================================
function displayError(message) { /* ... unchanged ... */
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) { resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`; }
    else { console.error("Could not find #results element to display error."); }
    const communityNameElement = document.getElementById('community-name');
    if (communityNameElement) { communityNameElement.innerHTML = "Error Loading Directory"; }
    const logoElement = document.getElementById('logo');
    if(logoElement) logoElement.style.display = 'none';
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
 }

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    // Check for global client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        displayError("Supabase client not initialized (from common.js). Cannot fetch data.");
        return;
    }
    console.log("Directory.js using supabaseClient initialized in common.js");

    // Get DOM elements
    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');
    const breadcrumbContainer = document.getElementById('breadcrumb-container');

    // Initial setup
    if (resultsList) resultsList.innerHTML = '<li>Loading...</li>';
    if (breadcrumbContainer) breadcrumbContainer.innerHTML = '';
    if (communityNameElement) communityNameElement.innerHTML = 'Loading...';
    if (!resultsList) { console.error("Fatal Error: Results list element (#results) not found."); return; }

    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");
    if (!provinceName || !communityName) { displayError("Missing province or community information in URL."); return; }
    const decodedProvinceName = decodeURIComponent(provinceName);
    const decodedCommunityName = decodeURIComponent(communityName);

    // Set titles/headers
    const baseTitle = `${decodedCommunityName}, ${decodedProvinceName}`;
    if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
    if (logoElement) logoElement.style.display = 'none';

    // Build Breadcrumbs
    if (breadcrumbContainer) { /* ... breadcrumb generation unchanged ... */
        breadcrumbContainer.innerHTML = `<ol class="breadcrumb"><li class="breadcrumb-item"><a href="index.html">Home</a></li><li class="breadcrumb-item"><a href="province_page.html?province=${encodeURIComponent(decodedProvinceName)}">${decodedProvinceName}</a></li><li class="breadcrumb-item active" aria-current="page">${decodedCommunityName}</li></ol>`;
    } else { console.warn("Breadcrumb container not found."); }
    if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">Loading Telephone Directory...</span>`; }

    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo
        console.log(`Fetching community data for: ${decodedCommunityName}`);
        const { data: communityData, error: communityError } = await supabaseClient.from('communities').select('id, logo_filename').eq('community_name', decodedCommunityName).limit(1).single();
        if (communityError) { throw new Error(`Could not verify community "${decodedCommunityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found.`); }
        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename;
        console.log(`Community ID: ${communityId}`);
        if (logoElement && logoFilename) { logoElement.src = `images/logos/${logoFilename}`; logoElement.alt = `${decodedCommunityName} Logo`; logoElement.style.display = 'block'; }
        else if (logoElement) { logoElement.style.display = 'none'; }

        // Update Suggest Change Link
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) { suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`; }
        else { console.warn("Suggest change link element not found.") }

        // --- Fetch Listings ---
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient.from(tableName).select('*').eq('community_id', communityId).order('category', { ascending: true, nullsFirst: false }).order('name', { ascending: true });
        if (listingsError) { throw listingsError; }

        resultsList.innerHTML = ''; // Clear loading

        // Update subtitle
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`; }
        if (listingCount === 0) { resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`; return; }

        // --- Group and Sort Listings by Category and Tier ---
        const groupedListings = listings.reduce(/* ... grouping logic unchanged ... */ (acc, listing) => { const cat = listing.category || 'Uncategorized'; if (!acc[cat]) acc[cat] = []; acc[cat].push(listing); return acc; }, {});
        const sortedCategories = Object.keys(groupedListings).sort(/* ... sorting logic unchanged ... */ (a, b) => { if (a === 'Uncategorized') return 1; if (b === 'Uncategorized') return -1; return a.localeCompare(b); });
        const now = new Date();

        // --- Render Listings ---
        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li');
             categoryHeadingItem.className = 'category-heading';
             categoryHeadingItem.textContent = category;
             resultsList.appendChild(categoryHeadingItem);

             const listingsInCategory = groupedListings[category];
             const goldListings = [], silverListings = [], bronzeListings = [], regularListings = [];

             // Categorize listings by tier
             listingsInCategory.forEach(listing => { /* ... tier categorization logic unchanged ... */
                 const isPromoted = listing.is_promoted === true; const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 if (isActivePromotion) { if (duration === 12) goldListings.push(listing); else if (duration === 6) silverListings.push(listing); else bronzeListings.push(listing); }
                 else { regularListings.push(listing); }
             });
             const categorySortedListings = goldListings.concat(silverListings).concat(bronzeListings).concat(regularListings);

             // Render sorted listings
             categorySortedListings.forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // --- Apply Tier Styling ---
                 const isPromoted = listing.is_promoted === true; const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 let tierClass = ''; let sponsoredLabelHtml = '';
                 if (isActivePromotion) { /* ... apply tier class and label unchanged ... */
                     if (duration === 12) { tierClass = 'promoted-gold'; sponsoredLabelHtml = `<span class="sponsored-label gold">Gold</span>`; }
                     else if (duration === 6) { tierClass = 'promoted-silver'; sponsoredLabelHtml = `<span class="sponsored-label silver">Silver</span>`; }
                     else { tierClass = 'promoted-bronze'; sponsoredLabelHtml = `<span class="sponsored-label bronze">Bronze</span>`; }
                     listItem.classList.add(tierClass); console.log(`Applying ${tierClass} style to: ${listing.name}`);
                 }

                 const listingId = listing.id;
                 if (!listingId) { console.warn("Listing missing 'id'. Cannot create promote button:", listing); }

                 // --- Phone Button HTML (unchanged) ---
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; }

                 // --- Promote Button HTML (hide if active promotion) ---
                 let promoteButtonHtml = '';
                 if (listingId && !isActivePromotion) {
                    // *** ADD address and phone to the URL ***
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}`
                                     + `&cid=${encodeURIComponent(communityId)}`
                                     + `&prov=${encodeURIComponent(decodedProvinceName)}`
                                     + `&comm=${encodeURIComponent(decodedCommunityName)}`
                                     + `&name=${encodeURIComponent(listing.name || 'N/A')}`
                                     + `&table=${encodeURIComponent(tableName)}`
                                     + `&address=${encodeURIComponent(listing.address || '')}` // Add address
                                     + `&phone=${encodeURIComponent(listing.phone_number || '')}`; // Add phone

                    promoteButtonHtml = `<div class="promote-button-container" style="margin-top: 8px;"><a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${listing.name || ''}"><i class="fa-solid fa-rocket"></i> Promote</a></div>`;
                 }

                 // Construct final HTML
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
function initializeSearch() { /* ... unchanged ... */
    const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
 }

// Initialize Popup Interactivity (Unchanged)
function initializePopupInteraction() { /* ... unchanged ... */
    const resultsList = document.getElementById('results'); const phonePopup = document.getElementById('phonePopup'); const closePopupButton = document.getElementById('closePopup'); const phoneNumberDisplay = document.getElementById('phoneNumber'); const copyPhoneButton = document.getElementById('copyPhoneBtn'); const copyTextElement = copyPhoneButton?.querySelector('.copy-text'); const copyIconElement = copyPhoneButton?.querySelector('i'); const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy'; const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy'; let copyTimeout = null; const resetCopyButton = () => { if (copyTextElement) copyTextElement.textContent = originalCopyText; if (copyIconElement) copyIconElement.className = originalCopyIconClass; if (copyPhoneButton) copyPhoneButton.disabled = false; if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; } }; if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay) { console.error("Core popup elements missing."); return; } if (!copyPhoneButton || !copyTextElement || !copyIconElement) { console.warn("Copy button elements missing."); } if (copyPhoneButton) { const handleCopyClick = async () => { const linkElement = phoneNumberDisplay.querySelector('a'); const numberToCopy = linkElement ? linkElement.textContent : null; if (numberToCopy && navigator.clipboard) { try { await navigator.clipboard.writeText(numberToCopy); if (copyTextElement) copyTextElement.textContent = 'Copied!'; if (copyIconElement) copyIconElement.className = 'fa-solid fa-check'; copyPhoneButton.disabled = true; if (copyTimeout) clearTimeout(copyTimeout); copyTimeout = setTimeout(resetCopyButton, 2000); } catch (err) { console.error('Failed to copy phone number:', err); alert("Could not copy number."); resetCopyButton(); } } else { if (!navigator.clipboard) alert("Copying not supported by browser."); resetCopyButton(); } }; copyPhoneButton.addEventListener('click', handleCopyClick); } resultsList.addEventListener('click', function(event) { const revealButton = event.target.closest('.revealPhoneBtn'); const promoteButton = event.target.closest('.promote-button'); if (revealButton) { event.preventDefault(); const numberToDisplay = revealButton.dataset.phone; if (numberToDisplay) { phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`; resetCopyButton(); phonePopup.classList.remove('hidden'); } else { console.warn("Reveal button missing phone data."); } } else if (promoteButton) { console.log('Promote button clicked'); } }); closePopupButton.addEventListener('click', function() { phonePopup.classList.add('hidden'); resetCopyButton(); }); phonePopup.addEventListener('click', function(event) { if (event.target === phonePopup) { phonePopup.classList.add('hidden'); resetCopyButton(); } });
}

// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});

// --- END OF directory.js ---