// --- START OF directory.js (Generic "Sponsored" Label - CAREFUL EDIT v2) ---

// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Helper to display error messages (unchanged)
// ======================================================================
function displayError(message) {
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
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `<ol class="breadcrumb"><li class="breadcrumb-item"><a href="index.html">Home</a></li><li class="breadcrumb-item"><a href="province_page.html?province=${encodeURIComponent(decodedProvinceName)}">${decodedProvinceName}</a></li><li class="breadcrumb-item active" aria-current="page">${decodedCommunityName}</li></ol>`;
    } else { console.warn("Breadcrumb container not found."); }
    if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">Loading Telephone Directory...</span>`; }

    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo
        const { data: communityData, error: communityError } = await supabaseClient.from('communities').select('id, logo_filename').eq('community_name', decodedCommunityName).limit(1).single();
        if (communityError || !communityData) { throw new Error(`Community "${decodedCommunityName}" not found or error fetching: ${communityError?.message}`); }
        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename;
        if (logoElement && logoFilename) { logoElement.src = `images/logos/${logoFilename}`; logoElement.alt = `${decodedCommunityName} Logo`; logoElement.style.display = 'block'; }
        else if (logoElement) { logoElement.style.display = 'none'; }

        // Update Suggest Change Link
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) { suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`; }

        // --- Fetch Listings (Assuming 'website_url' column exists) ---
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') // '*' will include the new website_url column
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        if (listingsError) {
             if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
             if (listingsError.code === '42703') { // Check for missing website_url column too? Maybe too complex.
                throw new Error(`Column 'community_id' missing or misspelled in table "${tableName}". Check Supabase schema.`);
             }
             throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        resultsList.innerHTML = ''; // Clear loading

        // Update subtitle
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`; }
        if (listingCount === 0) { resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`; return; }

        // --- Group and Sort Listings by Category and Tier ---
        const groupedListings = listings.reduce((acc, listing) => { const category = listing.category || 'Uncategorized'; if (!acc[category]) { acc[category] = []; } acc[category].push(listing); return acc; }, {});
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => { if (a === 'Uncategorized') return 1; if (b === 'Uncategorized') return -1; return a.localeCompare(b); });
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
             listingsInCategory.forEach(listing => {
                 const isPromoted = listing.is_promoted === true;
                 const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 if (isActivePromotion) { if (duration === 12) goldListings.push(listing); else if (duration === 6) silverListings.push(listing); else bronzeListings.push(listing); }
                 else { regularListings.push(listing); }
             });
             const categorySortedListings = goldListings.concat(silverListings).concat(bronzeListings).concat(regularListings);

             // Render sorted listings for the category
             categorySortedListings.forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // Check promotion status
                 const isPromoted = listing.is_promoted === true;
                 const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;

                 // Apply Tier Styling & Sponsored Label
                 let tierClass = '';
                 let sponsoredLabelHtml = '';
                 let labelTierClass = '';

                 if (isActivePromotion) {
                     if (duration === 12) { tierClass = 'promoted-gold'; labelTierClass = 'gold'; }
                     else if (duration === 6) { tierClass = 'promoted-silver'; labelTierClass = 'silver'; }
                     else { tierClass = 'promoted-bronze'; labelTierClass = 'bronze'; }
                     listItem.classList.add(tierClass);
                     sponsoredLabelHtml = `<span class="sponsored-label ${labelTierClass}">Sponsored</span>`;
                 }

                 // --- START: Website Link Logic ---
                 let websiteLinkHtml = ''; // Initialize as empty
                 if (listing.website_url && listing.website_url.trim() !== '') {
                     let rawUrl = listing.website_url.trim();
                     let formattedUrl = rawUrl;
                     // Ensure URL has a protocol (http or https)
                     if (!/^https?:\/\//i.test(rawUrl)) {
                         formattedUrl = `https://${rawUrl}`;
                     }
                     // Basic check to avoid javascript: links or other oddities
                     if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                         // Note: The space is now added within the promoteButtonHtml template below
                         websiteLinkHtml = `<a href="${formattedUrl}" target="_blank" title="${rawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                     } else {
                          console.warn(`Skipping invalid URL format for listing ${listing.id}: ${rawUrl}`);
                     }
                 }
                 // --- END: Website Link Logic ---

                 const listingId = listing.id;
                 // Phone Button HTML
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; }

                 // Promote Button HTML (Now potentially includes website link)
                 let promoteButtonHtml = '';
                 // Only show promote button OR website link if NOT actively promoted
                 if (listingId && !isActivePromotion) {
                     const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(listing.name || 'N/A')}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(listing.address || '')}&phone=${encodeURIComponent(listing.phone_number || '')}`;
                     // Add website link *before* the promote button, with a space if both exist
                     const websiteLinkSpacing = websiteLinkHtml ? ' ' : '';
                     promoteButtonHtml = `<div class="promote-button-container">
                                               ${websiteLinkHtml}${websiteLinkSpacing}<a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${listing.name || ''}"><i class="fa-solid fa-rocket"></i> Promote</a>
                                          </div>`;
                 } else if (websiteLinkHtml) {
                     // If listing IS promoted, but still has a website, show only the website link
                     promoteButtonHtml = `<div class="promote-button-container">${websiteLinkHtml}</div>`;
                 }


                 // Construct final HTML
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}${sponsoredLabelHtml}</span> <!-- Website link removed from here -->
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                          ${promoteButtonHtml} <!-- Container potentially holds website link + promote btn -->
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
function initializeSearch() {
    const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
 }

// Initialize Popup Interactivity (Unchanged)
function initializePopupInteraction() {
    const resultsList = document.getElementById('results'); const phonePopup = document.getElementById('phonePopup'); const closePopupButton = document.getElementById('closePopup'); const phoneNumberDisplay = document.getElementById('phoneNumber'); const copyPhoneButton = document.getElementById('copyPhoneBtn'); const copyTextElement = copyPhoneButton?.querySelector('.copy-text'); const copyIconElement = copyPhoneButton?.querySelector('i'); const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy'; const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy'; let copyTimeout = null; const resetCopyButton = () => { if (copyTextElement) copyTextElement.textContent = originalCopyText; if (copyIconElement) copyIconElement.className = originalCopyIconClass; if (copyPhoneButton) copyPhoneButton.disabled = false; if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; } }; if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay) { console.error("Core popup elements missing."); return; } if (!copyPhoneButton || !copyTextElement || !copyIconElement) { console.warn("Copy button elements missing."); } if (copyPhoneButton) { const handleCopyClick = async () => { const linkElement = phoneNumberDisplay.querySelector('a'); const numberToCopy = linkElement ? linkElement.textContent : null; if (numberToCopy && navigator.clipboard) { try { await navigator.clipboard.writeText(numberToCopy); if (copyTextElement) copyTextElement.textContent = 'Copied!'; if (copyIconElement) copyIconElement.className = 'fa-solid fa-check'; copyPhoneButton.disabled = true; if (copyTimeout) clearTimeout(copyTimeout); copyTimeout = setTimeout(resetCopyButton, 2000); } catch (err) { console.error('Failed to copy phone number:', err); alert("Could not copy number."); resetCopyButton(); } } else { if (!navigator.clipboard) alert("Copying not supported by browser."); resetCopyButton(); } }; copyPhoneButton.addEventListener('click', handleCopyClick); } resultsList.addEventListener('click', function(event) { const revealButton = event.target.closest('.revealPhoneBtn'); const promoteButton = event.target.closest('.promote-button'); if (revealButton) { event.preventDefault(); const numberToDisplay = revealButton.dataset.phone; if (numberToDisplay) { phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`; resetCopyButton(); phonePopup.classList.remove('hidden'); console.log("Popup should be visible now."); setTimeout(() => { if(phonePopup) { console.log("DEBUG: phonePopup display style (after timeout):", window.getComputedStyle(phonePopup).display); console.log("DEBUG: phonePopup visibility style (after timeout):", window.getComputedStyle(phonePopup).visibility); } }, 0); } else { console.warn("Reveal button missing phone data."); } } else if (promoteButton) { console.log('Promote button clicked'); } else { console.log("DEBUG: Click was not on a revealPhoneBtn or promote-button."); } }); closePopupButton.addEventListener('click', function() { phonePopup.classList.add('hidden'); resetCopyButton(); }); phonePopup.addEventListener('click', function(event) { if (event.target === phonePopup) { phonePopup.classList.add('hidden'); resetCopyButton(); } });
}

// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});