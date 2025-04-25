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
} // <<< Check closing brace is correct

// === Helper Function: UTF-8 to Base64 Encoding/Decoding (Added Meticulously) ===
// Encodes a standard JS string (UTF-16) to Base64 via UTF-8 bytes
function utf8ToBase64(str) {
    try {
        // Ensure input is treated as a string
        const strInput = String(str || '');
        // Use TextEncoder to get UTF-8 bytes from the string
        const utf8Bytes = new TextEncoder().encode(strInput);
        // Convert bytes to a "binary string" needed by btoa
        // Use Array.prototype.map and join for safer conversion from byte array
        const binaryString = utf8Bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        // Encode the binary string to Base64
        return btoa(binaryString);
    } catch (e) {
        console.error("Error encoding to Base64 (UTF-8 step):", e, str);
        return ""; // Return empty string on failure
    }
} // <<< Check closing brace

// Decodes a Base64 string back to a standard JS string (UTF-16) via UTF-8 bytes
function base64ToUtf8(base64) {
    try {
        // Ensure input is a string
        const base64Input = String(base64 || '');
        // Decode Base64 to a "binary string"
        const binaryString = atob(base64Input);
        // Convert binary string to UTF-8 bytes
        const utf8Bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
        // Use TextDecoder to get the final string
        return new TextDecoder().decode(utf8Bytes);
    } catch (e) {
         console.error("Error decoding from Base64 (UTF-8 step):", e, base64);
         return ""; // Return empty string on failure
    }
} // <<< Check closing brace
// ======================================================================


// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() { // <<< Check definition
    // Check for global client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        displayError("Supabase client not initialized (from common.js). Cannot fetch data.");
        return; // <<< Check return and closing brace
    } // <<< Check closing brace here (around line 35 based on typical layout)
    console.log("Directory.js using supabaseClient initialized in common.js"); // <<< LINE 38 approx. Check this line specifically.

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
         // No need for htmlEncode here, browser handles decoding for display text
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
                 // Basic escaping for phone button title/data (less critical)
                 const safePhoneName = (listing.name || '').replace(/"/g, '"');
                 const safePhoneNumber = (phoneNumber || '').replace(/"/g, '"');
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${safePhoneNumber}" title="Show phone number for ${safePhoneName}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; }


                // --- Construct action buttons including vCard ---
                const listingId = listing.id;
                let actionButtonsHtml = '';

                // Gather ALL data needed for the card modal
                const vCardDataPayload = {
                    id: listingId, name: listing.name || '', phone: listing.phone_number || '', email: listing.email || '', website: listing.website_url || '', address: listing.address || '', contactPerson: listing.contact_person || '', notes: listing.notes || '', logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp'
                 };
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    // *** USE THE UTF-8 + BASE64 ENCODING FUNCTION HERE ***
                    const base64EncodedData = utf8ToBase64(jsonString); // Use the new helper

                    // Escape name for title attribute only
                    const safeTitleName = (listing.name || '').replace(/"/g, '"'); // Still escape quotes for title

                    // Embed the Base64 string directly. Use single quotes for attribute.
                    actionButtonsHtml += `<button class="button-style view-vcard-btn" data-vcard='${base64EncodedData}' title="View Virtual Card for ${safeTitleName}">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`;
                } catch (e) {
                    console.error(`Error processing vCard data for listing ID ${listingId}:`, e, vCardDataPayload);
                     actionButtonsHtml += `<button class="button-style view-vcard-btn" disabled title="Error generating card data">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`;
                }


                // 2. Promote Button (if applicable)
                if (listingId && !isActivePromotion) {
                     const promoteName = (listing.name || 'N/A').replace(/"/g, '"'); // Escape for title
                    const promoteAddress = (listing.address || '').replace(/"/g, '"');
                    const promotePhone = (listing.phone_number || '').replace(/"/g, '"');
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(promoteName)}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(promoteAddress)}&phone=${encodeURIComponent(promotePhone)}`;
                    actionButtonsHtml += ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${promoteName}"><i class="fa-solid fa-rocket"></i> Promote</a>`;
                }

                // 3. Website Link (if applicable) - Use website_url
                let websiteLinkHtml = '';
                if (listing.website_url && listing.website_url.trim() !== '') {
                    let rawUrl = listing.website_url.trim();
                    let formattedUrl = rawUrl;
                    if (!/^https?:\/\//i.test(rawUrl)) { formattedUrl = `https://${rawUrl}`; }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                         const safeRawUrl = rawUrl.replace(/"/g, '"'); // Escape for title
                        websiteLinkHtml = ` <a href="${formattedUrl}" target="_blank" title="${safeRawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                        actionButtonsHtml += ` ${websiteLinkHtml}`;
                    } else { console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`); }
                }
                // --- End Action Button Construction ---


                 // Construct final HTML for the list item using template literals
                 // No need to encode text content here, browser handles it.
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
             }); // End listing loop
        }); // End category loop

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings


// Initialize Search Functionality (Unchanged)
function initializeSearch() { /* ... search logic ... */
     const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; const contactPersonText = item.querySelector('.contact_person')?.textContent.toLowerCase() || ''; // Corrected to use contact_person
        let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm) || contactPersonText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
 }


// Initialize Popup Interactivity (Updated for vCard Modal with Base64 Decode)
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
    let currentVCardObjectUrl = null; // To store blob URL for cleanup

    // Check core elements for both popups
    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay || !virtualCardPopup || !closeVCardPopupButton) {
        console.error("Core popup elements missing (Phone or vCard). Popups might not work.");
        return;
    }
    if (!copyPhoneButton || !copyTextElement || !copyIconElement) {
        console.warn("Copy button elements missing.");
    }

    // --- Common close function for VCard popup ---
    const closeVCard = () => {
        virtualCardPopup.classList.add('hidden');
        if (currentVCardObjectUrl) {
            URL.revokeObjectURL(currentVCardObjectUrl);
            currentVCardObjectUrl = null;
            console.log("Revoked vCard Object URL on close");
        }
        const qrContainer = document.getElementById('vcard-qrcode-container');
        if (qrContainer) qrContainer.style.display = 'none'; // Hide QR container
    };

    // --- Common close function for Phone popup ---
    const closePhonePopup = () => {
         phonePopup.classList.add('hidden');
         resetCopyButton();
    };

    // --- Phone Popup Listeners ---
    if (copyPhoneButton) {
        const handleCopyClick = async () => { /* ... copy logic ... */
             const linkElement = phoneNumberDisplay.querySelector('a');
             const numberToCopy = linkElement ? linkElement.textContent : null;
             if (numberToCopy && navigator.clipboard) {
                 try {
                     await navigator.clipboard.writeText(numberToCopy);
                     if (copyTextElement) copyTextElement.textContent = 'Copied!';
                     if (copyIconElement) copyIconElement.className = 'fa-solid fa-check';
                     copyPhoneButton.disabled = true;
                     if (copyTimeout) clearTimeout(copyTimeout);
                     copyTimeout = setTimeout(resetCopyButton, 2000);
                 } catch (err) {
                     console.error('Failed to copy phone number:', err);
                     alert("Could not copy number.");
                     resetCopyButton();
                 }
             } else {
                 if (!navigator.clipboard) alert("Copying not supported by browser.");
                 resetCopyButton();
             }
         };
        copyPhoneButton.addEventListener('click', handleCopyClick);
    }

    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');

        if (revealButton) {
            event.preventDefault();

            // *** Close VCard Popup if it's open ***
            if (!virtualCardPopup.classList.contains('hidden')) {
                 closeVCard();
            }
            // *************************************

            const numberToDisplay = revealButton.dataset.phone; // Browser decodes this automatically
            if (numberToDisplay) {
                phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`;
                resetCopyButton();
                phonePopup.classList.remove('hidden');
            } else {
                console.warn("Reveal button missing phone data.");
            }
        }
    });

    // --- Close Listeners ---
    closePopupButton.addEventListener('click', closePhonePopup);
    phonePopup.addEventListener('click', function(event) {
        if (event.target === phonePopup) {
            closePhonePopup();
        }
    });
    // --- End Phone Popup Listeners ---


    // === START: Virtual Card Popup Listeners ===
    if (virtualCardPopup && closeVCardPopupButton) {

        // --- Listener for View Card Buttons ---
        resultsList.addEventListener('click', function(event) {
            const viewCardButton = event.target.closest('.view-vcard-btn');

            if (viewCardButton && !viewCardButton.disabled) {
                event.preventDefault();
                console.log("View Card button clicked");

                // *** Close Phone Popup if it's open ***
                if (!phonePopup.classList.contains('hidden')) {
                    closePhonePopup();
                }
                // ***********************************

                // 1. Cleanup previous state
                const qrContainer = document.getElementById('vcard-qrcode-container');
                if (qrContainer) { qrContainer.innerHTML = '<p><small>Scan QR to save contact:</small></p>'; qrContainer.style.display = 'none'; }
                if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; console.log("Revoked previous vCard Object URL"); }

                // 2. Get Data from button attribute (Decode Base64 then Parse)
                let vCardData;
                try {
                    const base64EncodedData = viewCardButton.dataset.vcard;
                    const decodedJsonString = base64ToUtf8(base64EncodedData); // Use the new helper
                    vCardData = JSON.parse(decodedJsonString); // Parse the decoded JSON
                    console.log("Parsed vCard Data:", vCardData);
                } catch (e) {
                    console.error("Failed to decode/parse vCard data from button:", e);
                    console.error("Raw data-vcard (Base64):", viewCardButton.getAttribute('data-vcard'));
                    alert("Error: Could not load card data.");
                    return; // IMPORTANT: Stop if parsing fails
                }
                if (!vCardData || typeof vCardData !== 'object') {
                    alert("Error: Invalid card data format.");
                    return;
                }

                // 3. Populate Modal Elements (No changes needed here)
                document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
                document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
                document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';

                // Helper to set detail item visibility and content
                const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => {
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
                setVCardDetailItem('vcard-website', vCardData.website, '', true); // Corrected data source
                setVCardDetailItem('vcard-address', vCardData.address, '', false);
                setVCardDetailItem('vcard-notes', vCardData.notes, '', false); // Display notes


                // 4. Generate vCard & Set Download Link (No changes needed here)
                const vcfString = generateVCF(vCardData);
                const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
                currentVCardObjectUrl = URL.createObjectURL(blob); // Store for cleanup
                const downloadLink = document.getElementById('vcard-download-link');
                if (downloadLink) {
                    downloadLink.href = currentVCardObjectUrl;
                    const filename = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    downloadLink.download = `${filename}.vcf`;
                    console.log("Generated vCard Object URL:", currentVCardObjectUrl);
                }

                // 5. Setup QR Code Button Listener (Remove previous listener first)
                const showQrButton = document.getElementById('vcard-show-qr-button');
                if (showQrButton) {
                    const newShowQrButton = showQrButton.cloneNode(true); // Clone to remove listeners
                    showQrButton.parentNode.replaceChild(newShowQrButton, showQrButton);
                    newShowQrButton.addEventListener('click', () => {
                         generateAndShowQRCode(vCardData, 'vcard-qrcode-container');
                    });
                }

                // 6. Setup SMS Link (No changes needed here)
                const smsLink = document.getElementById('vcard-sms-link');
                if (smsLink) {
                    let smsBody = `Check out ${vCardData.name || 'this business'} on Bizly:`;
                    if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`;
                    if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`; // Corrected data source
                    if (vCardData.address) smsBody += `\nAddress: ${vCardData.address.replace(/\n/g, ', ')}`;
                    smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                }

                // 7. Setup Web Share Button Listener (Remove previous listener first)
                const shareButton = document.getElementById('vcard-share-button');
                if (shareButton) {
                    const newShareButton = shareButton.cloneNode(true);
                    shareButton.parentNode.replaceChild(newShareButton, shareButton);
                    newShareButton.addEventListener('click', async () => { // FIX: Use newShareButton here
                        const shareData = {
                            title: `${vCardData.name || 'Business Contact'} via Bizly`,
                            text: `Contact Info for ${vCardData.name || 'Business'}:\nPhone: ${vCardData.phone || 'N/A'}\nEmail: ${vCardData.email || 'N/A'}\nWebsite: ${vCardData.website || 'N/A'}\nAddress: ${vCardData.address || 'N/A'}`, // Corrected data source
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

            } // End if (viewCardButton)
        }); // End resultsList click listener for vCard

        // --- Close Listeners for VCard popup ---
        closeVCardPopupButton.addEventListener('click', closeVCard);
        virtualCardPopup.addEventListener('click', function(event) { // Click outside to close
            if (event.target === virtualCardPopup) {
                closeVCard();
            }
        });

    } else {
        console.warn("Could not initialize Virtual Card popup listeners - essential elements missing.");
    }
    // === END: Virtual Card Popup Listeners ===


    // === START: Helper Functions (Updated for UTF-8 + Base64) ===
    // Helper Function: Generate vCard String (vCard 3.0) - No change needed for data format
    function generateVCF(data) { /* ... */ } // Keep the generateVCF function as is

    // Helper Function: Generate QR Code - Uses generateVCF, no direct change needed
    function generateAndShowQRCode(data, containerId) { /* ... */ } // Keep the generateAndShowQRCode function as is
    // === END: Helper Functions ===

} // End initializePopupInteraction


// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});