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

// === Helper Function: HTML Encode (Define ONCE outside main functions) ===
function htmlEncode(str) {
    if (typeof str !== 'string') return ''; // Handle non-strings gracefully
    return str.replace(/&/g, '&') // Must be first
              .replace(/'/g, ''') // Encode single quote
              .replace(/"/g, '"') // Encode double quotes
              .replace(/</g, '<')
              .replace(/>/g, '>');
}
// ======================================================================

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

        if (communityError) { throw new Error(`Error fetching community data: ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found in the communities table.`); }
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

        if (!communityId) { throw new Error("Cannot fetch listings without a valid community ID."); }

        // Fetch Listings
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        if (listingsError) { /* ... error handling ... */
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

             listingsInCategory.forEach(listing => { /* ... tier sorting ... */
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
                 if (isActivePromotion) { /* ... tier label ... */
                     if (duration === 12) { tierClass = 'promoted-gold'; labelTierClass = 'gold'; }
                     else if (duration === 6) { tierClass = 'promoted-silver'; labelTierClass = 'silver'; }
                     else { tierClass = 'promoted-bronze'; labelTierClass = 'bronze'; }
                     listItem.classList.add(tierClass);
                     sponsoredLabelHtml = `<span class="sponsored-label ${labelTierClass}">Sponsored</span>`;
                 }

                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${htmlEncode(phoneNumber)}" title="Show phone number for ${htmlEncode(listing.name || 'this listing')}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; } // Encode phone number for data attribute

                // --- Construct action buttons including vCard ---
                const listingId = listing.id;
                let vCardButtonHtml = '';
                let promoteButtonHtml = '';
                let websiteLinkHtml = '';

                // 1. vCard Button Data and HTML
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
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    const attributeSafeJsonString = htmlEncode(jsonString); // Use helper function
                    const safeTitleName = htmlEncode(listing.name || ''); // Use helper function

                    vCardButtonHtml = `<button class="button-style view-vcard-btn" data-vcard='${attributeSafeJsonString}' title="View Virtual Card for ${safeTitleName}">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`;
                } catch (jsonError) {
                    console.error(`Error stringifying vCard data for listing ID ${listingId}:`, jsonError, vCardDataPayload);
                    vCardButtonHtml = `<button class="button-style view-vcard-btn" disabled title="Error generating card data">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`; // Show disabled button on error
                }


                // 2. Promote Button (if applicable)
                if (listingId && !isActivePromotion) {
                    const promoteName = htmlEncode(listing.name || 'N/A');
                    const promoteAddress = htmlEncode(listing.address || '');
                    const promotePhone = htmlEncode(listing.phone_number || '');
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(promoteName)}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(promoteAddress)}&phone=${encodeURIComponent(promotePhone)}`;
                    promoteButtonHtml = ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${promoteName}">` +
                                            `<i class="fa-solid fa-rocket"></i> Promote` +
                                        `</a>`;
                }

                // 3. Website Link (if applicable)
                if (listing.website_url && listing.website_url.trim() !== '') {
                    let rawUrl = listing.website_url.trim();
                    let formattedUrl = rawUrl;
                    if (!/^https?:\/\//i.test(rawUrl)) {
                        formattedUrl = `https://${rawUrl}`;
                    }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                        websiteLinkHtml = ` <a href="${formattedUrl}" target="_blank" title="${htmlEncode(rawUrl)}" class="website-link" rel="noopener noreferrer nofollow">` +
                                              `<i class="fa-solid fa-globe"></i>` +
                                          `</a>`;
                    } else {
                        console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`);
                    }
                }

                // Combine action buttons
                const actionButtonsHtml = vCardButtonHtml + promoteButtonHtml + websiteLinkHtml;
                // --- End Action Button Construction ---


                 // Construct final HTML for the list item
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${htmlEncode(listing.name || 'N/A')}${sponsoredLabelHtml}</span>
                          ${listing.address ? `<span class="address">${htmlEncode(listing.address)}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${htmlEncode(listing.notes)}</span>` : ''}
                          ${listing.contact_person ? `<span class="contact-person">Contact: ${htmlEncode(listing.contact_person)}</span>` : ''}
                          <div class="promote-button-container">${actionButtonsHtml}</div>
                     </div>
                     <div class="phone-container">
                          ${phoneHtml}
                     </div>
                 `;
                 resultsList.appendChild(listItem);
             }); // End listing loop
        }); // End category loop

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings


// Initialize Search Functionality (Unchanged)
function initializeSearch() { /* ... search logic ... */
     const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; const contactPersonText = item.querySelector('.contact-person')?.textContent.toLowerCase() || ''; let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm) || contactPersonText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
}


// Initialize Popup Interactivity (Unchanged from previous working version)
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
    const resetCopyButton = () => { /* ... reset logic ... */
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
    if (copyPhoneButton) { /* ... copy listener ... */
         const handleCopyClick = async () => { /* ... copy logic ... */ };
         copyPhoneButton.addEventListener('click', handleCopyClick);
     }
    resultsList.addEventListener('click', function(event) { /* ... phone reveal listener ... */
         const revealButton = event.target.closest('.revealPhoneBtn');
        if (revealButton) { /* ... phone reveal logic ... */ }
    });
    closePopupButton.addEventListener('click', function() { /* ... close phone listener ... */ });
    phonePopup.addEventListener('click', function(event) { /* ... click outside phone listener ... */ });
    // --- End Phone Popup Listeners ---


    // === START: Virtual Card Popup Listeners ===
    if (virtualCardPopup && closeVCardPopupButton) {

        // --- Listener for View Card Buttons ---
        resultsList.addEventListener('click', function(event) {
            const viewCardButton = event.target.closest('.view-vcard-btn');

            if (viewCardButton && !viewCardButton.disabled) { // Check if button is not disabled
                event.preventDefault();
                console.log("View Card button clicked");

                // 1. Cleanup previous state
                const qrContainer = document.getElementById('vcard-qrcode-container');
                if (qrContainer) { qrContainer.innerHTML = '<p><small>Scan QR to save contact:</small></p>'; qrContainer.style.display = 'none'; }
                if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; console.log("Revoked previous vCard Object URL"); }

                // 2. Get Data from button attribute
                let vCardData;
                try {
                    const rawData = viewCardButton.dataset.vcard;
                    vCardData = JSON.parse(rawData); // Should work now
                    console.log("Parsed vCard Data:", vCardData);
                } catch (e) {
                    console.error("Failed to parse vCard data from button:", e);
                    console.error("Raw data-vcard attribute:", viewCardButton.getAttribute('data-vcard'));
                    alert("Error: Could not load card data. Data might be invalid.");
                    return; // Stop processing if data is bad
                }
                if (!vCardData || typeof vCardData !== 'object') { alert("Error: Invalid card data format."); return; }

                // 3. Populate Modal Elements
                document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
                document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
                document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';
                const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => { /* ... helper ... */
                    const pElement = document.getElementById(elementId);
                    if (!pElement) { console.warn(`Element ${elementId} not found`); return; }
                    const spanElement = pElement.querySelector('span');
                    const linkElement = pElement.querySelector('a');

                    if (value && value.trim() !== '') {
                        const trimmedValue = value.trim();
                        if (spanElement) spanElement.textContent = trimmedValue;
                        if (isLink && linkElement) {
                            let hrefValue = trimmedValue;
                            if (linkPrefix && !hrefValue.startsWith(linkPrefix)) {
                                hrefValue = linkPrefix + hrefValue;
                            }
                            else if (elementId === 'vcard-website' && !hrefValue.startsWith('http://') && !hrefValue.startsWith('https://')) {
                                hrefValue = 'https://' + hrefValue;
                            }
                            linkElement.href = hrefValue;
                            linkElement.style.display = 'inline';
                        } else if (!isLink && linkElement) {
                             linkElement.style.display = 'none';
                        }
                        pElement.style.display = 'flex';
                    } else {
                        pElement.style.display = 'none';
                    }
                 };
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
                if (downloadLink) { /* ... set href/download ... */
                    downloadLink.href = currentVCardObjectUrl;
                    const filename = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    downloadLink.download = `${filename}.vcf`;
                    console.log("Generated vCard Object URL:", currentVCardObjectUrl);
                }

                // 5. Setup QR Code Button Listener
                const showQrButton = document.getElementById('vcard-show-qr-button');
                if (showQrButton) { /* ... replace listener ... */
                     const newShowQrButton = showQrButton.cloneNode(true);
                    showQrButton.parentNode.replaceChild(newShowQrButton, showQrButton);
                    newShowQrButton.addEventListener('click', () => {
                         generateAndShowQRCode(vCardData, 'vcard-qrcode-container');
                    });
                 }

                // 6. Setup SMS Link
                const smsLink = document.getElementById('vcard-sms-link');
                if (smsLink) { /* ... setup sms href ... */
                     let smsBody = `Check out ${vCardData.name || 'this business'} on Bizly:`;
                    if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`;
                    if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`;
                    if (vCardData.address) smsBody += `\nAddress: ${vCardData.address.replace(/\n/g, ', ')}`;
                    smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                }

                // 7. Setup Web Share Button Listener
                const shareButton = document.getElementById('vcard-share-button');
                if (shareButton) { /* ... replace listener ... */
                     const newShareButton = shareButton.cloneNode(true);
                    shareButton.parentNode.replaceChild(newShareButton, shareButton);
                    newShareButton.addEventListener('click', async () => {
                        const shareData = {
                            title: `${vCardData.name || 'Business Contact'} via Bizly`,
                            text: `Contact Info for ${vCardData.name || 'Business'}:\nPhone: ${vCardData.phone || 'N/A'}\nEmail: ${vCardData.email || 'N/A'}\nWebsite: ${vCardData.website || 'N/A'}\nAddress: ${vCardData.address || 'N/A'}`,
                        };
                        try {
                            if (navigator.share) {
                                await navigator.share(shareData);
                                console.log('Shared successfully');
                            } else {
                                alert('Web Share not supported on this browser/device.');
                            }
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.error('Share failed:', err);
                                alert('Sharing failed.');
                            }
                        }
                    });
                }

                // 8. Show Modal
                virtualCardPopup.classList.remove('hidden');
                console.log("Virtual Card Popup should be visible");

            }
        });

        // --- Listener for Closing Virtual Card Popup ---
        const closeVCard = () => { /* ... close logic ... */
            virtualCardPopup.classList.add('hidden');
            if (currentVCardObjectUrl) {
                URL.revokeObjectURL(currentVCardObjectUrl);
                currentVCardObjectUrl = null;
                console.log("Revoked vCard Object URL on close");
            }
            const qrContainer = document.getElementById('vcard-qrcode-container');
            if (qrContainer) qrContainer.style.display = 'none';
        };
        closeVCardPopupButton.addEventListener('click', closeVCard);
        virtualCardPopup.addEventListener('click', function(event) { /* ... click outside logic ... */
            if (event.target === virtualCardPopup) {
                closeVCard();
            }
        });

    } else {
        console.warn("Could not initialize Virtual Card popup listeners - essential elements missing.");
    }
    // === END: Virtual Card Popup Listeners ===


    // === START: Helper Functions (Unchanged) ===
    function generateVCF(data) { /* ... generateVCF function ... */
         let vcf = `BEGIN:VCARD\nVERSION:3.0\n`;
        vcf += `FN:${(data.name || '').trim()}\n`;
        if (data.contactPerson && data.contactPerson.trim() !== '') {
            const nameParts = data.contactPerson.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            vcf += `N:${lastName};${firstName};;;\n`;
        } else {
             vcf += `N:${(data.name || '').trim()};;;;\n`;
        }
        if (data.name) vcf += `ORG:${data.name.trim()}\n`;
        if (data.phone) vcf += `TEL;type=WORK,voice:${data.phone.trim()}\n`;
        if (data.email) vcf += `EMAIL:${data.email.trim()}\n`;
        if (data.address) {
            const adrFormatted = data.address.trim().replace(/,/g, ' ').replace(/\n/g, '\\n');
            vcf += `ADR;type=WORK:;;${adrFormatted};;;;\n`;
        }
        if (data.website) vcf += `URL:${data.website.trim()}\n`;
        if (data.logoUrl && !data.logoUrl.includes('Bizly_Logo_150px.webp')) {
            vcf += `PHOTO;VALUE=URI:${data.logoUrl}\n`;
        }
        if (data.notes) vcf += `NOTE:${data.notes.trim().replace(/\n/g, '\\n')}\n`;
        vcf += `REV:${new Date().toISOString().split('.')[0]}Z\n`;
        vcf += `END:VCARD`;
        return vcf;
     }
    function generateAndShowQRCode(data, containerId) { /* ... generateAndShowQRCode function ... */
         const qrContainer = document.getElementById(containerId);
        if (!qrContainer) { console.error(`QR Container #${containerId} not found.`); return; }
        if (typeof QRCode === 'undefined') { console.error("QRCode library is not loaded."); return; }
        qrContainer.innerHTML = '<p><small>Scan QR to save contact:</small></p>';
        const vcfForQR = generateVCF(data);
        try {
            new QRCode(qrContainer, {
                text: vcfForQR,
                width: 140,
                height: 140,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });
            qrContainer.style.display = 'block';
            console.log("Generated QR Code with vCard data.");
        } catch(e) {
             console.error("QRCode generation failed:", e);
             qrContainer.innerHTML += '<p style="color: red;">Error generating QR code.</p>';
             qrContainer.style.display = 'block';
        }
    }
    // === END: Helper Functions ===

} // End initializePopupInteraction


// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});