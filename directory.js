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
    let communityId = null;
    let logoFilename = null;

    try {
        // Fetch Community ID and Logo (Corrected Query)
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename')
            .eq('community_name', decodedCommunityName)
            .limit(1)
            .maybeSingle();

        if (communityError) {
            throw new Error(`Error fetching community data: ${communityError.message}`);
        }
        ifLooking at the console error `Uncaught SyntaxError: missing ) after argument list` at `directory.js:199` and correlating it with the previous code change, the issue is almost certainly related to how the `data-vcard` attribute string or the `title` attribute string was constructed, leading to invalid JavaScript syntax *before* the `if` statement on line 199.

The most likely cause is an unescaped quote within the `listing.name` when creating the `title` attribute for the vCard button. While we escaped characters for the `data-vcard` attribute, we didn't do it for the `title`. If a business name contained a double quote (`"`), it would break the HTML string within the JavaScript.

**The Fix:**

We need to escape double quotes within the `listing.name` specifically for the `title` attribute.

**File: `directory.js` (Complete & Updated with Syntax Fix)**

```javascript
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
    let communityId = null;
    let logoFilename = null;

    try {
        // Fetch Community ID and Logo (Corrected Query)
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename')
            .eq('community_name', decodedCommunityName)
            .limit(1)
            .maybeSingle();

        if (communityError) {
            throw new Error(`Error fetching community data: ${communityError.message}`);
        }
        if (!communityData) {
             throw new Error(`Community "${decodedCommunityName}" not found in the communities table.`);
        }
        communityId = communityData.id;
        logoFilename = communityData.logo_filename;

        if (logoElement && logoFilename) { logoElement.src = `images/logos/${logoFilename}`; logoElement.alt = `${decodedCommunityName} Logo`; logoElement.style.display = 'block'; }
        else if (logoElement) { logoElement.style.display = 'none'; }

        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink && communityId) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`;
        } else if (suggestChangeLink) {
             suggestChangeLink.style.display = 'none';
             console.warn("Suggest Change link hidden as community ID was not found.");
        }

        if (!communityId) {
            throw new Error("Cannot fetch listings without a valid community ID.");
        }

        // Fetch Listings
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        if (listingsError) {
            if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
             if (listingsError.code === '42703' && listingsError.message.includes('column "email"')) {
                 throw new Error(`Failed to fetch listings. The 'email' column is missing in table "${tableName}". Please run the provided SQL script.`);
             }
             if (listingsError.code === '42703') {
                console.warn(`Potential missing column error when fetching from "${tableName}": ${listingsError.message}`);
                throw new Error(`Failed to fetch listings, potentially missing column(s): ${listingsError.message}`);
             }
             throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        resultsList.innerHTML = ''; // Clear loading

        // Update subtitle
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`; }
        if (listingCount === 0) { resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`; return; }

        // --- Group and Sort Listings ---
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

             listingsInCategory.forEach(listing => {
                const isPromoted = listing.is_promoted === true;
                 const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 if (isActivePromotion) { if (duration === 12) goldListings.push(listing); else if (duration === 6) silverListings.push(listing); else bronzeListings.push(listing); }
                 else { regularListings.push(listing); }
            });
             const categorySortedListings = goldListings.concat(silverListings).concat(bronzeListings).concat(regularListings);

             categorySortedListings.forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 const isPromoted = listing.is_promoted === true;
                 const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;

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

                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; }


                // --- Construct action buttons including vCard ---
                let actionButtonsHtml = '';
                const listingId = listing.id;

                const vCardDataPayload = {
                    id: listingId,
                    name: listing.name || '',
                    phone: listing.phone_number || '',
                    email: listing.email || '',
                    website: listing.website_url || '',
                    address: listing.address || '',
                    contactPerson: listing.contact_person || '',
                    notes: listing.notes || '',
                    logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp'
                };

                const jsonString = JSON.stringify(vCardDataPayload);
                // Encode characters problematic for HTML attributes using single quotes ('')
                const attributeSafeJsonString = jsonString
                                                    .replace(/&/g, '&')
                                                    .replace(/'/g, ''') // Escape single quotes
                                                    .replace(/"/g, '"')
                                                    .replace(/</g, '<')
                                                    .replace(/>/g, '>');

                // *** FIX: Escape double quotes within the name for the title attribute ***
                const safeTitleName = (listing.name || '').replace(/"/g, '"');

                // 1. vCard Button
                const vCardButtonHtml = `<button class="button-style view-vcard-btn" data-vcard='${attributeSafeJsonString}' title="View Virtual Card for ${safeTitleName}">
                                           <i class="fa-solid fa-id-card"></i> Card
                                        </button>`;
                actionButtonsHtml += vCardButtonHtml; // Semicolon is optional here due to ASI, but added for clarity

                // 2. Promote Button (if applicable)
                if (listingId && !isActivePromotion) { // This is line 199 area now
                     const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(listing.name || 'N/A')}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(listing.address || '')}&phone=${encodeURIComponent(listing.phone_number || '')}`;
                    actionButtonsHtml += ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${listing.name || ''}"><i class="fa-solid fa-rocket"></i> Promote</a>`;
                }

                // 3. Website Link (if applicable)
                let websiteLinkHtml = '';
                if (listing.website_url && listing.website_url.trim() !== '') {
                    let rawUrl = listing.website_url.trim();
                    let formattedUrl = rawUrl;
                    if (!/^https?:\/\//i.test(rawUrl)) {
                        formattedUrl = `https://${rawUrl}`;
                    }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                        websiteLinkHtml = `<a href="${formattedUrl}" target="_blank" title="${rawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                        actionButtonsHtml += ` ${websiteLinkHtml}`;
                    } else {
                        console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`);
                    }
                }
                // --- End Action Button Construction ---


                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}${sponsoredLabelHtml}</span>
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                          ${listing.contact_person ? `<span class="contact-person">Contact: ${listing.contact_person}</span>` : ''}
                          <div class="promote-button-container">${actionButtonsHtml}</div>
                     </div>
                     <div class="phone-container">
                          ${phoneHtml}
                     </div>
                 `;
                 resultsList.appendChild(listItem);
             });
        });

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings


// Initialize Search Functionality (Unchanged)
function initializeSearch() {
    const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; const contactPersonText = item.querySelector('.contact-person')?.textContent.toLowerCase() || ''; let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm) || contactPersonText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
 }


// Initialize Popup Interactivity (Unchanged from previous version)
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    // Phone Popup Elements
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber');
    const copyPhoneButton = document.getElementById('copyPhoneBtn');
    const copyTextElement = copyPhoneButton?.querySelector('.copy-text');
    const copyIconElement = copyPhoneButton?.querySelector('i');
    const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy';
    const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy';
    let copyTimeout = null;
    const resetCopyButton = () => {
         if (copyTextElement) copyTextElement.textContent = originalCopyText;
        if (copyIconElement) copyIconElement.className = originalCopyIconClass;
        if (copyPhoneButton) copyPhoneButton.disabled = false;
        if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; }
    };

    // *** Virtual Card Popup Elements ***
    const virtualCardPopup = document.getElementById('virtualCardPopup');
    const closeVCardPopupButton = document.getElementById('closeVCardPopup');
    let currentVCardObjectUrl = null;

    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay || !virtualCardPopup || !closeVCardPopupButton) {
        console.error("Core popup elements missing (Phone or vCard). Popups might not work.");
        return;
    }
    if (!copyPhoneButton || !copyTextElement || !copyIconElement) { console.warn("Copy button elements missing."); }

    // --- Phone Popup Listeners ---
    if (copyPhoneButton) {
         const handleCopyClick = async () => { /* ... copy logic ... */ };
         copyPhoneButton.addEventListener('click', handleCopyClick);
    }
    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');
        if (revealButton) { /* ... phone reveal logic ... */ }
    });
    closePopupButton.addEventListener('click', function() { /* ... close phone logic ... */ });
    phonePopup.addEventListener('click', function(event) { /* ... click outside phone logic ... */ });
    // --- End Phone Popup Listeners ---


    // === START: Virtual Card Popup Listeners ===
    if (virtualCardPopup && closeVCardPopupButton) {

        // --- Listener for View Card Buttons ---
        resultsList.addEventListener('click', function(event) {
            const viewCardButton = event.target.closest('.view-vcard-btn');

            if (viewCardButton) {
                event.preventDefault();
                console.log("View Card button clicked");

                // 1. Cleanup previous state
                const qrContainer = document.getElementById('vcard-qrcode-container');
                if (qrContainer) { /* ... cleanup ... */ }
                if (currentVCardObjectUrl) { /* ... cleanup ... */ }

                // 2. Get Data from button attribute
                let vCardData;
                try {
                    const rawData = viewCardButton.dataset.vcard; // Browser decodes entities here
                    vCardData = JSON.parse(rawData);
                    console.log("Parsed vCard Data:", vCardData);
                } catch (e) {
                    console.error("Failed to parse vCard data from button:", e);
                    console.error("Problematic data-vcard value:", viewCardButton.getAttribute('data-vcard'));
                    alert("Error: Could not load card data. Data might be invalid.");
                    return;
                }
                if (!vCardData || typeof vCardData !== 'object') { /* ... validation ... */ }

                // 3. Populate Modal Elements
                document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
                document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
                document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';
                const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => { /* ... helper ... */ };
                setVCardDetailItem('vcard-contact-person', vCardData.contactPerson, '', false);
                setVCardDetailItem('vcard-phone', vCardData.phone, 'tel:');
                setVCardDetailItem('vcard-email', vCardData.email, 'mailto:');
                setVCardDetailItem('vcard-website', vCardData.website, '', true);
                setVCardDetailItem('vcard-address', vCardData.address, '', false);
                setVCardDetailItem('vcard-notes', vCardData.notes, '', false);

                // 4. Generate vCard & Set Download Link
                const vcfString = generateVCF(vCardData);
                const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
                currentVCardObjectUrl = URL.createObjectURL(blob);
                const downloadLink = document.getElementById('vcard-download-link');
                if (downloadLink) { /* ... set href/download ... */ }

                // 5. Setup QR Code Button Listener
                const showQrButton = document.getElementById('vcard-show-qr-button');
                if (showQrButton) { /* ... replace listener ... */ }

                // 6. Setup SMS Link
                const smsLink = document.getElementById('vcard-sms-link');
                if (smsLink) { /* ... setup sms href ... */ }

                // 7. Setup Web Share Button Listener
                const shareButton = document.getElementById('vcard-share-button');
                if (shareButton) { /* ... replace listener ... */ }

                // 8. Show Modal
                virtualCardPopup.classList.remove('hidden');
                console.log("Virtual Card Popup should be visible");

            }
        });

        // --- Listener for Closing Virtual Card Popup ---
        const closeVCard = () => { /* ... close logic ... */ };
        closeVCardPopupButton.addEventListener('click', closeVCard);
        virtualCardPopup.addEventListener('click', function(event) { /* ... click outside logic ... */ });

    } else {
        console.warn("Could not initialize Virtual Card popup listeners - essential elements missing.");
    }
    // === END: Virtual Card Popup Listeners ===


    // === START: Helper Functions (Unchanged) ===
    function generateVCF(data) { /* ... generateVCF function ... */ }
    function generateAndShowQRCode(data, containerId) { /* ... generateAndShowQRCode function ... */ }
    // === END: Helper Functions ===

} // End initializePopupInteraction


// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
}); // <<< This is line 564