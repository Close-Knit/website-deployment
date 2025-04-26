// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Helper to display error messages
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

// === Helper Function: UTF-8 to Base64 Encoding/Decoding ===
function utf8ToBase64(str) {
    try {
        const strInput = String(str || ''); // Ensure input is a string
        const utf8Bytes = new TextEncoder().encode(strInput);
        // Convert bytes to a "binary string" needed by btoa
        const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    } catch (e) {
        console.error("Error encoding to Base64 (UTF-8 step):", e, str);
        return ""; // Return empty string on failure
    }
}

function base64ToUtf8(base64) {
    try {
        const base64Input = String(base64 || ''); // Ensure input is a string
        const binaryString = atob(base64Input);
        const utf8Bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
        return new TextDecoder().decode(utf8Bytes);
    } catch (e) {
         console.error("Error decoding from Base64 (UTF-8 step):", e, base64);
         return ""; // Return empty string on failure
    }
}
// ======================================================================

// *** Global check for QR Code library ***
console.log("DEBUG: Checking QRCode library globally:", typeof QRCode);
// *****************************************


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
        // Fetch Community ID and Logo
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
            .select('*') // Ensure email, website_url, contact_person are selected
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

        console.log(`DEBUG: Fetched ${listings?.length ?? 0} listings from DB.`, listings); // Log fetched data

        resultsList.innerHTML = ''; // Clear loading

        // Update subtitle
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`; }
        if (listingCount === 0) {
             console.log("DEBUG: No listings found for this community ID, exiting render.");
             resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`;
             return;
         }

        // --- Group and Sort Listings by Category and Tier ---
        const groupedListings = listings.reduce((acc, listing) => { const category = listing.category || 'Uncategorized'; if (!acc[category]) { acc[category] = []; } acc[category].push(listing); return acc; }, {});
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => { if (a === 'Uncategorized') return 1; if (b === 'Uncategorized') return -1; return a.localeCompare(b); });
        const now = new Date();

        console.log("DEBUG: Starting to loop through categories:", sortedCategories);

        // --- Render Listings ---
        sortedCategories.forEach((category, categoryIndex) => {
             console.log(`DEBUG: Processing category ${categoryIndex + 1}: "${category}"`);

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

             console.log(`DEBUG: Found ${categorySortedListings.length} listings in category "${category}". Starting listing loop.`);

             categorySortedListings.forEach((listing, listingIndex) => {
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
                 if (phoneNumber) { phoneHtml = `<button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}"><i class="fa-solid fa-phone"></i> Show Phone</button>`; }


                // --- Construct action buttons including vCard ---
                const listingId = listing.id;
                let actionButtonsHtml = '';

                // ===== START: APOSTROPHE REMOVAL FOR VCARD PAYLOAD =====
                const originalName = listing.name || '';
                const originalAddress = listing.address || '';
                const originalNotes = listing.notes || '';
                const originalContactPerson = listing.contact_person || '';
                const originalPhone = listing.phone_number || ''; // Keep original format
                const originalEmail = listing.email || '';       // Keep original format
                const originalWebsite = listing.website_url || ''; // Keep original format

                const cleanedName = originalName.replace(/['’]/g, ''); // Catches ' and ’
                const cleanedAddress = originalAddress.replace(/['’]/g, ''); // Catches ' and ’
                const cleanedNotes = originalNotes.replace(/['’]/g, ''); // Catches ' and ’
                const cleanedContactPerson = originalContactPerson.replace(/['’]/g, ''); // Catches ' and ’
                // ===== END: APOSTROPHE REMOVAL FOR VCARD PAYLOAD =====


                // Gather ALL data needed for the card modal - USE CLEANED VALUES
                const vCardDataPayload = {
                    id: listingId,
                    name: cleanedName,           // Use cleaned name
                    phone: originalPhone,        // Use original phone
                    email: originalEmail,        // Use original email
                    website: originalWebsite,    // Use original website
                    address: cleanedAddress,       // Use cleaned address
                    contactPerson: cleanedContactPerson, // Use cleaned contact person
                    notes: cleanedNotes,           // Use cleaned notes
                    logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp'
                 };
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    // *** USE UTF-8 + BASE64 ENCODING ***
                    const base64EncodedData = utf8ToBase64(jsonString);

                    // Escape name for title attribute only (Use ORIGINAL name for title)
                    const safeTitleName = (originalName).replace(/"/g, '"'); // Title uses original name

                    actionButtonsHtml += `<button class="button-style view-vcard-btn" data-vcard='${base64EncodedData}' title="View Virtual Card for ${safeTitleName}">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`;
                } catch (e) {
                    console.error(`Error processing vCard data for listing ID ${listingId}:`, e, vCardDataPayload);
                     actionButtonsHtml += `<button class="button-style view-vcard-btn" disabled title="Error generating card data">` +
                                          `<i class="fa-solid fa-id-card"></i> Card` +
                                      `</button>`;
                }

                // 2. Promote Button (if applicable) - Use ORIGINAL name for title/URL
                if (listingId && !isActivePromotion) {
                    const promoteName = (originalName).replace(/"/g, '"'); // Use original name
                    const promoteAddress = (listing.address || '').replace(/"/g, '"'); // Address/phone don't usually have apostrophes
                    const promotePhone = (listing.phone_number || '').replace(/"/g, '"');
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(promoteName)}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(promoteAddress)}&phone=${encodeURIComponent(promotePhone)}`;
                    actionButtonsHtml += ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${promoteName}"><i class="fa-solid fa-rocket"></i> Promote</a>`;
                }

                // 3. Website Link (if applicable) - Use original website_url
                let websiteLinkHtml = '';
                if (listing.website_url && listing.website_url.trim() !== '') {
                    let rawUrl = listing.website_url.trim();
                    let formattedUrl = rawUrl;
                    if (!/^https?:\/\//i.test(rawUrl)) { formattedUrl = `https://${rawUrl}`; }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                         const safeRawUrl = rawUrl.replace(/"/g, '"');
                        websiteLinkHtml = ` <a href="${formattedUrl}" target="_blank" title="${safeRawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                        actionButtonsHtml += ` ${websiteLinkHtml}`;
                    } else { console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`); }
                }
                // --- End Action Button Construction ---


                 // Use TEMPLATE LITERALS - Use ORIGINAL values for display & REMOVE COMMENTS
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${originalName}${sponsoredLabelHtml}</span>
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

             console.log(`DEBUG: Finished processing listings for category "${category}".`);

        }); // End category loop
        console.log("DEBUG: Finished looping through all categories.");

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings


// Initialize Search Functionality (Unchanged)
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');

    if (!searchBox || !resultsList) {
        console.warn("Search box or results list not found, search functionality disabled.");
        return;
    }

    searchBox.addEventListener('input', function() {
        const searchTerm = searchBox.value.toLowerCase().trim();
        const listItems = resultsList.querySelectorAll('li'); // Includes category headings and entries

        let anyVisibleInCategory = false;
        let currentCategoryHeading = null;

        listItems.forEach(item => {
            if (item.classList.contains('category-heading')) {
                // Hide previous category heading if it had no visible items
                if (currentCategoryHeading && !anyVisibleInCategory) {
                    currentCategoryHeading.style.display = 'none';
                }
                // Reset for the new category
                currentCategoryHeading = item;
                anyVisibleInCategory = false;
                // Temporarily show heading, might be hidden later if no entries match
                currentCategoryHeading.style.display = 'block';
            } else if (item.classList.contains('directory-entry')) {
                const nameElement = item.querySelector('.name');
                const addressElement = item.querySelector('.address');
                const notesElement = item.querySelector('.notes');
                const contactElement = item.querySelector('.contact-person');

                // Get text content, default to empty string if element doesn't exist
                const nameText = nameElement ? nameElement.textContent.toLowerCase() : '';
                const addressText = addressElement ? addressElement.textContent.toLowerCase() : '';
                const notesText = notesElement ? notesElement.textContent.toLowerCase() : '';
                const contactText = contactElement ? contactElement.textContent.toLowerCase() : '';
                const categoryText = currentCategoryHeading ? currentCategoryHeading.textContent.toLowerCase() : '';

                // Check if search term matches any field OR the category heading
                const isMatch = nameText.includes(searchTerm) ||
                                addressText.includes(searchTerm) ||
                                notesText.includes(searchTerm) ||
                                contactText.includes(searchTerm) ||
                                categoryText.includes(searchTerm); // Check category heading too

                if (isMatch) {
                    item.style.display = 'flex'; // Or 'block' depending on your default display
                    anyVisibleInCategory = true; // Mark that at least one item in this category is visible
                } else {
                    item.style.display = 'none';
                }
            } else {
                 // Handle other potential list items if necessary, e.g., loading/error messages
                 // For now, assume only category-heading and directory-entry exist after load
            }
        });

        // Final check for the very last category heading
        if (currentCategoryHeading && !anyVisibleInCategory) {
            currentCategoryHeading.style.display = 'none';
        }

        // Optional: Show a message if no results found overall
        const allEntries = resultsList.querySelectorAll('.directory-entry');
        const anyVisibleEntry = Array.from(allEntries).some(entry => entry.style.display !== 'none');
        let noResultsMessage = document.getElementById('no-search-results'); // Re-fetch inside handler

        if (!anyVisibleEntry && searchTerm) {
            if (noResultsMessage) {
                noResultsMessage.textContent = `No listings found matching "${searchBox.value}".`;
                noResultsMessage.style.display = 'block';
            } else {
                // Create message if it doesn't exist
                let tempMessage = document.createElement('li');
                tempMessage.id = 'no-search-results';
                tempMessage.textContent = `No listings found matching "${searchBox.value}".`;
                tempMessage.style.fontStyle = 'italic';
                tempMessage.style.marginTop = '15px';
                tempMessage.style.textAlign = 'center';
                tempMessage.style.color = '#6c757d'; // Softer color
                resultsList.appendChild(tempMessage);
                 noResultsMessage = tempMessage; // Assign the created element
            }
             // Also hide all category headings if no entries are visible
             listItems.forEach(item => {
                 if (item.classList.contains('category-heading')) {
                     item.style.display = 'none';
                 }
             });
        } else if (noResultsMessage) {
            noResultsMessage.style.display = 'none'; // Hide message if there are results or search is empty
             // Ensure category headings are visible if search is cleared/matches exist
             if (!searchTerm) {
                 listItems.forEach(item => {
                     if (item.classList.contains('category-heading')) {
                          // Check if this category *actually* has visible entries (should be true if !searchTerm)
                          const entriesInCategory = Array.from(item.parentNode.querySelectorAll('.directory-entry'))
                                .filter(entry => entry.closest('li.category-heading') === item); // Basic check if they are "under" it
                          const hasVisibleEntries = entriesInCategory.some(entry => entry.style.display !== 'none');
                          if (hasVisibleEntries) { // Only show heading if it has content visible
                             item.style.display = 'block';
                          }
                     }
                 });
             } else {
                 // If searching and results *are* found, ensure the relevant category headings are visible
                 listItems.forEach(item => {
                     if (item.classList.contains('category-heading')) {
                         // Check subsequent sibling entries until the next heading
                         let nextSibling = item.nextElementSibling;
                         let categoryHasVisible = false;
                         while(nextSibling && !nextSibling.classList.contains('category-heading')) {
                             if (nextSibling.classList.contains('directory-entry') && nextSibling.style.display !== 'none') {
                                 categoryHasVisible = true;
                                 break;
                             }
                             nextSibling = nextSibling.nextElementSibling;
                         }
                         if (categoryHasVisible) {
                             item.style.display = 'block';
                         } else {
                              item.style.display = 'none'; // Hide if no matches in its section
                         }
                     }
                 });
             }
        }
    });
 } // End Initialize Search Functionality


// Initialize Popup Interactivity (Base64 Decode + Corrected Populate + QR MECARD Fix + QR Log)
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    // Phone Popup Elements
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber');
    const copyPhoneButton = document.getElementById('copyPhoneBtn');
    // Virtual Card Popup Elements
    const virtualCardPopup = document.getElementById('virtualCardPopup');
    const closeVCardPopupButton = document.getElementById('closeVCardPopup');

    // --- Basic check: Does the main list container exist? ---
    if (!resultsList) {
        console.error("Cannot initialize popups: Results list container (#results) not found.");
        return;
    }

    // Define these variables outside the listener scope if they need to persist
    let currentVCardObjectUrl = null;
    let copyTimeout = null;
    const copyTextElement = copyPhoneButton?.querySelector('.copy-text'); // Define here
    const copyIconElement = copyPhoneButton?.querySelector('i'); // Define here
    const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy';
    const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy';


    const resetCopyButton = () => {
        if (copyTextElement) copyTextElement.textContent = originalCopyText;
        if (copyIconElement) copyIconElement.className = originalCopyIconClass;
        if (copyPhoneButton) copyPhoneButton.disabled = false;
        if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; }
    };

    // --- Common close function for VCard popup ---
    const closeVCard = () => {
        if (virtualCardPopup && !virtualCardPopup.classList.contains('hidden')) {
            console.log("DEBUG: closeVCard function called.");
            virtualCardPopup.classList.add('hidden');
            if (currentVCardObjectUrl) {
                URL.revokeObjectURL(currentVCardObjectUrl);
                currentVCardObjectUrl = null;
                console.log("Revoked vCard Object URL on close");
            }
            const qrContainer = document.getElementById('vcard-qrcode-container');
             if (qrContainer) {
                 const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
                 qrContainer.innerHTML = `<p><small>${smallText}</small></p>`;
                  const qrCanvas = qrContainer.querySelector('canvas'); if(qrCanvas) qrCanvas.remove();
                  const qrImg = qrContainer.querySelector('img'); if(qrImg) qrImg.remove();
                 qrContainer.style.display = 'none';
             }
        } else if (!virtualCardPopup) {
            console.error("DEBUG: Cannot close vCard, virtualCardPopup element is null.");
        }
    };

    // --- Common close function for Phone popup ---
    const closePhonePopup = () => {
         if (phonePopup && !phonePopup.classList.contains('hidden')) {
             console.log("DEBUG: closePhonePopup function called.");
             phonePopup.classList.add('hidden');
             resetCopyButton();
         } else if (!phonePopup) {
              console.error("DEBUG: Cannot close phone popup, phonePopup element is null.");
         }
    };


    // --- Combined Event Listener for Buttons within the results list ---
    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');
        const viewCardButton = event.target.closest('.view-vcard-btn');

        // --- Handle Phone Button Click ---
        if (revealButton) {
            event.preventDefault();
            console.log("Reveal Phone button clicked");

            if (!phonePopup || !phoneNumberDisplay) {
                console.error("Phone popup elements missing, cannot open.");
                return;
            }

            // Close the other popup if it's open
            closeVCard();

            const numberToDisplay = revealButton.dataset.phone;
            if (numberToDisplay) {
                phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`;
                resetCopyButton(); // Reset copy button state
                phonePopup.classList.remove('hidden');
                console.log("Phone Popup should be visible");

                 // Attempt to load AdSense ad inside the popup
                 const adContainer = phonePopup.querySelector('#adContainer .adsbygoogle');
                 if (adContainer && window.adsbygoogle) {
                     // Clear previous ad content if any (important for SPA-like behavior)
                     // adContainer.innerHTML = ''; // Might not be needed if push handles replacement
                     // Re-push the ad request
                     try {
                        console.log("Pushing AdSense request for popup ad slot:", adContainer.getAttribute('data-ad-slot'));
                         (adsbygoogle = window.adsbygoogle || []).push({});
                         adContainer.setAttribute('data-adsbygoogle-status', 'requested'); // Mark as requested
                     } catch (e) {
                        console.error("Error pushing popup ad:", e);
                     }
                 } else if (!adContainer) {
                     console.warn("Ad container not found in phone popup.");
                 } else {
                     console.warn("AdSense library (adsbygoogle) not ready when phone popup opened.");
                 }

            } else {
                console.warn("Reveal button missing phone data.");
            }
        }
        // --- Handle vCard Button Click ---
        else if (viewCardButton && !viewCardButton.disabled) {
            event.preventDefault();
            console.log("View Card button clicked");

            if (!virtualCardPopup) {
                console.error("vCard popup element missing, cannot open.");
                return;
            }

            // Close the other popup if it's open
            closePhonePopup();

            // 1. Cleanup previous vCard state
            const qrContainer = document.getElementById('vcard-qrcode-container');
             if (qrContainer) {
                 const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
                 qrContainer.innerHTML = `<p><small>${smallText}</small></p>`;
                  const qrCanvas = qrContainer.querySelector('canvas'); if(qrCanvas) qrCanvas.remove();
                  const qrImg = qrContainer.querySelector('img'); if(qrImg) qrImg.remove();
                 qrContainer.style.display = 'none';
             }
             if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; console.log("Revoked previous vCard Object URL"); }


            // 2. Get Data from button attribute (Decode Base64 then Parse)
            let vCardData;
            let decodedJsonString = "";
            try {
                const base64EncodedData = viewCardButton.dataset.vcard;
                if (!base64EncodedData) {
                    throw new Error("Button is missing the data-vcard attribute.");
                }
                decodedJsonString = base64ToUtf8(base64EncodedData); // Use the helper
                if (!decodedJsonString) {
                    // base64ToUtf8 returns "" on error, throw specific error here
                    throw new Error("Failed to decode Base64 data.");
                }
                console.log("Decoded JSON String (before parse):", decodedJsonString); // DIAGNOSTIC LOG
                vCardData = JSON.parse(decodedJsonString); // Parse the decoded JSON
                console.log("Parsed vCard Data:", vCardData);
            } catch (e) {
                console.error("Failed to decode/parse vCard data from button:", e);
                // Check if the error might be due to invalid JSON *after* decoding
                if (e instanceof SyntaxError && decodedJsonString) {
                     console.error("Potential JSON Syntax Error in decoded data. Decoded string was:", decodedJsonString);
                     alert("Error: Could not load card data due to invalid format after decoding.");
                } else {
                     alert(`Error: Could not load card data. ${e.message}`);
                }
                return;
            }
            if (!vCardData || typeof vCardData !== 'object') { alert("Error: Invalid card data format."); return; }

            // 3. Populate Modal Elements (Corrected Logic)
            document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
            document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
            document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';
            const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => {
                 const pElement = document.getElementById(elementId);
                 if (!pElement) { console.warn(`Element ${elementId} not found`); return; }
                 const spanElement = pElement.querySelector('span');
                 const linkElement = pElement.querySelector('a');

                 if (value && value.trim() !== '') {
                     const trimmedValue = value.trim();
                     if (spanElement) {
                         spanElement.textContent = trimmedValue;
                     } else {
                         pElement.textContent = trimmedValue; // Fallback if span is missing structure
                         console.warn(`Span element missing inside ${elementId}, setting text on <p>`);
                     }
                     if (isLink && linkElement) {
                         let hrefValue = trimmedValue;
                         // Prepend prefix if needed (tel:, mailto:)
                         if (linkPrefix && !hrefValue.startsWith(linkPrefix) && !hrefValue.startsWith('http')) { // Avoid double prefixing http
                              hrefValue = linkPrefix + hrefValue;
                         }
                         // Ensure website URLs have https:// if missing protocol
                         else if (elementId === 'vcard-website' && !hrefValue.startsWith('http://') && !hrefValue.startsWith('https://')) {
                             hrefValue = 'https://' + hrefValue;
                         }
                         linkElement.href = hrefValue;

                         // Ensure link contains the span (or text if span missing)
                         if (spanElement && !linkElement.contains(spanElement)) {
                             linkElement.innerHTML = ''; // Clear link
                             linkElement.appendChild(spanElement); // Put span inside link
                         } else if (!spanElement) {
                              linkElement.textContent = trimmedValue; // Put text directly in link as fallback
                         }
                         linkElement.style.display = 'inline'; // Make link visible
                     } else if (linkElement) {
                         linkElement.style.display = 'none'; // Hide link element if not applicable
                     }
                     pElement.style.display = 'flex'; // Show the whole item
                 } else {
                     pElement.style.display = 'none'; // Hide the item if value is empty
                 }
             };
            setVCardDetailItem('vcard-contact-person', vCardData.contactPerson, '', false);
            setVCardDetailItem('vcard-phone', vCardData.phone, 'tel:');
            setVCardDetailItem('vcard-email', vCardData.email, 'mailto:');
            setVCardDetailItem('vcard-website', vCardData.website, '', true); // No prefix needed, handled internally
            setVCardDetailItem('vcard-address', vCardData.address, '', false);
            setVCardDetailItem('vcard-notes', vCardData.notes, '', false);

            // 4. Generate vCard & Set Download Link
            const vcfString = generateVCF(vCardData);
            const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
            currentVCardObjectUrl = URL.createObjectURL(blob);
            const downloadLink = document.getElementById('vcard-download-link');
            if (downloadLink) {
                 downloadLink.href = currentVCardObjectUrl;
                 // Generate a safe filename (e.g., replace spaces, limit length)
                 const safeName = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                 downloadLink.download = `${safeName}.vcf`;
             } else { console.warn("vCard download link element not found."); }

            // 5. Setup QR Code Button Listener (Re-attach listener)
            const showQrButton = document.getElementById('vcard-show-qr-button');
            if (showQrButton) {
                const newShowQrButton = showQrButton.cloneNode(true); // Clone to remove old listeners
                showQrButton.parentNode.replaceChild(newShowQrButton, showQrButton); // Replace in DOM
                newShowQrButton.addEventListener('click', () => {
                     console.log("Show QR button clicked - attempting to generate QR.");
                     generateAndShowQRCode(vCardData, 'vcard-qrcode-container'); // Call QR function
                });
            } else { console.warn("Show QR button element not found."); }

            // 6. Setup SMS Link
            const smsLink = document.getElementById('vcard-sms-link');
            if (smsLink) {
                 let smsBody = `Contact Info for ${vCardData.name || 'listing'}:`;
                 if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`;
                 if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`; // Maybe add website?
                 // Add address? Email? Keep it concise for SMS.
                 smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
             } else { console.warn("SMS link element not found."); }

            // 7. Setup Web Share Button Listener (Re-attach listener)
            const shareButton = document.getElementById('vcard-share-button');
            if (shareButton) {
                 const newShareButton = shareButton.cloneNode(true);
                 shareButton.parentNode.replaceChild(newShareButton, shareButton);
                 newShareButton.addEventListener('click', async () => {
                     const shareData = {
                         title: `Contact: ${vCardData.name || 'Business'}`,
                         text: `Contact info for ${vCardData.name}:\nPhone: ${vCardData.phone || 'N/A'}\nEmail: ${vCardData.email || 'N/A'}\nWebsite: ${vCardData.website || 'N/A'}`,
                         // url: vCardData.website || window.location.href, // Optional: Link to website or current page
                         files: [new File([blob], `${(vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vcf`, { type: 'text/vcard' })]
                     };
                     if (navigator.canShare && navigator.canShare({ files: shareData.files })) {
                          try { await navigator.share(shareData); console.log('vCard shared successfully!'); }
                          catch (err) { if (err.name !== 'AbortError') console.error('Error sharing vCard:', err); }
                      } else if (navigator.share) { // Fallback share without file if files not supported
                           try { await navigator.share({ title: shareData.title, text: shareData.text, url: vCardData.website || window.location.href }); }
                           catch (err) { if (err.name !== 'AbortError') console.error('Error sharing text:', err); }
                      } else { alert('Web Share API not supported on your browser/device.'); }
                 });
             } else { console.warn("vCard share button element not found."); }

            // 8. Show Modal
            virtualCardPopup.classList.remove('hidden');
            console.log("Virtual Card Popup should be visible");
        } // End if (viewCardButton)

    }); // End resultsList click listener


    // --- Copy Phone Number Logic ---
    if (copyPhoneButton && phoneNumberDisplay) {
        copyPhoneButton.addEventListener('click', async () => {
            const phoneText = phoneNumberDisplay.textContent; // Get text from display
            if (phoneText && phoneText !== '...' && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(phoneText);
                    console.log('Phone number copied:', phoneText);
                    if (copyTextElement) copyTextElement.textContent = 'Copied!';
                    if (copyIconElement) copyIconElement.className = 'fa-solid fa-check';
                    copyPhoneButton.disabled = true;

                    copyTimeout = setTimeout(resetCopyButton, 2000);
                } catch (err) {
                    console.error('Failed to copy phone number:', err);
                    alert('Failed to copy number.');
                    resetCopyButton();
                }
            }
        });
    } else {
         console.warn("Copy phone button or phone number display element not found.");
    }


    // --- Close Listeners for Popups (Need null checks) ---
    if (closeVCardPopupButton) {
        console.log("DEBUG: Attaching click listener to vCard close button");
        closeVCardPopupButton.addEventListener('click', closeVCard);
    } else {
         console.error("Could not attach listener to vCard close button - element not found.");
    }
    if (virtualCardPopup) {
         console.log("DEBUG: Attaching click listener to vCard popup background");
        virtualCardPopup.addEventListener('click', function(event) {
            // Close only if clicked directly on the background, not content inside
            if (event.target === virtualCardPopup) {
                closeVCard();
            }
        });
    } else {
         console.error("Could not attach click-outside listener to vCard popup - element not found.");
    }
    if (closePopupButton) { // Phone close button
        console.log("DEBUG: Attaching click listener to phone close button");
        closePopupButton.addEventListener('click', closePhonePopup);
    } else {
         console.error("Could not attach listener to phone close button - element not found.");
    }
    if (phonePopup) { // Phone click outside
         console.log("DEBUG: Attaching click listener to phone popup background");
        phonePopup.addEventListener('click', function(event) {
            if (event.target === phonePopup) {
                closePhonePopup();
            }
        });
     } else {
         console.error("Could not attach click-outside listener to phone popup - element not found.");
     }

     // Close popups on ESC key press
     document.addEventListener('keydown', (event) => {
         if (event.key === "Escape") {
              if (virtualCardPopup && !virtualCardPopup.classList.contains('hidden')) { closeVCard(); }
              else if (phonePopup && !phonePopup.classList.contains('hidden')) { closePhonePopup(); }
         }
     });
    // --- End Close Listeners ---

} // End initializePopupInteraction


// === START: Helper Functions (Including QR MECARD Fix & Library Check) ===

// Function to generate VCF string
function generateVCF(data) {
    // vCard version 3.0 is widely compatible
    let vcf = `BEGIN:VCARD\nVERSION:3.0\n`;

    // Name (Required) - FN (Formatted Name) and N (Structured Name)
    // Use the cleaned name from the payload
    const name = data.name || '';
    vcf += `FN:${name}\n`;
    // Basic N structure: Last;First;Middle;Prefix;Suffix
    // We only have a combined name, so put it in the 'First' slot for simplicity
    // or just use FN which is often sufficient. Let's stick with FN only for simplicity unless N is needed.
    // vcf += `N:;${name};;;\n`; // Example if structure was needed

    // Organization (Could be same as name if it's a business)
    vcf += `ORG:${name}\n`;

    // Phone Number (Add TEL type based on context if available, WORK is common default)
    if (data.phone) {
        vcf += `TEL;TYPE=WORK,VOICE:${data.phone}\n`;
    }

    // Email
    if (data.email) {
        vcf += `EMAIL;TYPE=PREF,INTERNET:${data.email}\n`;
    }

    // Website
    if (data.website) {
        vcf += `URL:${data.website}\n`;
    }

    // Address (Add ADR type, WORK is common default)
    // Use the cleaned address from the payload
    if (data.address) {
        // ADR structure: PO Box;Extended Address;Street;Locality (City);Region (State/Province);Postal Code;Country
        // We only have a combined address string. Put it in the 'Street' part.
        // Escape commas, semicolons, backslashes, and newlines within the address field.
        const escapedAddress = data.address.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
        vcf += `ADR;TYPE=WORK:;;${escapedAddress};;;;\n`;
    }

    // Contact Person (Use NOTE field as standard vCard doesn't have a simple 'Contact Person' field)
    // Use the cleaned contact person from the payload
    if (data.contactPerson) {
         const escapedContact = data.contactPerson.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
        vcf += `NOTE:Contact Person: ${escapedContact}\\n`; // Add to NOTE
    }

    // Notes (Append to NOTE field, ensuring newline separation if contact person was also added)
    // Use the cleaned notes from the payload
    if (data.notes) {
         const escapedNotes = data.notes.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
        if (data.contactPerson) { // Already started a NOTE
            vcf += `Listing Notes: ${escapedNotes}\\n`;
        } else { // Start a new NOTE
            vcf += `NOTE:Listing Notes: ${escapedNotes}\\n`;
        }
    }
    // Add timestamp of generation
    vcf += `REV:${new Date().toISOString()}\n`;

    vcf += `END:VCARD`;
    return vcf;
}

// Helper Function: Generate QR Code - Uses MECARD format
function generateAndShowQRCode(data, containerId) {
     const qrContainer = document.getElementById(containerId);
     console.log(`DEBUG: generateAndShowQRCode called. Container ID: ${containerId}, Found container:`, qrContainer);

    if (!qrContainer) { console.error(`QR Container #${containerId} not found.`); return; }

    // Check for QRCode library
    if (typeof QRCode === 'undefined' || typeof QRCode !== 'function') {
        console.error("QRCode library is not loaded or QRCode is not a constructor function.");
        qrContainer.innerHTML = `<p><small>Scan QR to save contact:</small></p><p style="color: red;">Error: QR Code library failed to load.</p>`;
        qrContainer.style.display = 'block'; // Show the error message
        return;
    }

    // Clear previous QR code first
    const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
    qrContainer.innerHTML = `<p><small>${smallText}</small></p>`; // Keep text, remove old QR

    // Generate MECARD string (Simpler format for QR, widely supported)
    // Use the cleaned name from the VCard data payload
    let qrCodeString = `MECARD:`;
    if (data.name) qrCodeString += `N:${data.name};`; // Use the cleaned name
    if (data.phone) qrCodeString += `TEL:${data.phone};`;
    if (data.email) qrCodeString += `EMAIL:${data.email};`;
    if (data.website) qrCodeString += `URL:${data.website};`;
    // Note: MECARD doesn't have standard fields for Address or detailed Notes beyond ORG.
    // If ORG is desired, add it: qrCodeString += `ORG:${data.name};`;
    qrCodeString += `;`; // Terminator is important

    console.log("DEBUG: MECARD string for QR:", qrCodeString);

    try {
        console.log("DEBUG: Attempting to create new QRCode instance...");
        new QRCode(qrContainer, { // This instance attaches the QR code to the container
            text: qrCodeString,
            width: 140,
            height: 140,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.M // Medium error correction
        });
        qrContainer.style.display = 'block';
        console.log("DEBUG: Successfully created QRCode instance and displayed container.");
    } catch(e) {
         console.error("QRCode generation failed INSIDE TRY/CATCH:", e);
         // Display error within the container
         qrContainer.innerHTML = `<p><small>${smallText}</small></p><p style="color: red;">Error generating QR code.</p>`;
         qrContainer.style.display = 'block';
    }
}
// === END: Helper Functions ===


// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});