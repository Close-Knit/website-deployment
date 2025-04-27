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

     // Also hide weather element on major error
     const tempElement = document.getElementById('community-temp');
     if (tempElement) { tempElement.style.display = 'none'; }
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

// === START: Weather Functionality ===

async function fetchAndDisplayWeather(communityName, provinceName) {
    const tempElement = document.getElementById('community-temp');
    if (!tempElement) {
        console.warn("Weather display element (#community-temp) not found.");
        return; // Exit if the HTML element isn't there
    }

    tempElement.textContent = "--°C"; // Reset or initial state
    tempElement.title = `Fetching weather for ${communityName}...`; // Initial tooltip

    // 1. Geocode: Get Lat/Lon from Community/Province Name
    let lat, lon;
    try {
        const geocodeQuery = `${encodeURIComponent(communityName)}, ${encodeURIComponent(provinceName)}`;
        // IMPORTANT: Add a unique User-Agent for Nominatim policy - Using updated email
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${geocodeQuery}`;
        console.log("Geocoding URL:", geocodeUrl);

        const geocodeResponse = await fetch(geocodeUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Bizly.ca Directory/1.0 (Contact: bizly.ca@proton.me)' // UPDATED EMAIL
            }
        });

        if (!geocodeResponse.ok) {
            throw new Error(`Geocoding HTTP error! Status: ${geocodeResponse.status}`);
        }

        const geocodeData = await geocodeResponse.json();
        console.log("Geocoding Response:", geocodeData);

        if (!geocodeData || geocodeData.length === 0 || !geocodeData[0].lat || !geocodeData[0].lon) {
            // Try geocoding just the community name as a fallback for less specific locations
            console.warn(`Geocoding failed for "${communityName}, ${provinceName}". Trying "${communityName}" alone.`);
            const fallbackQuery = `${encodeURIComponent(communityName)}`;
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${fallbackQuery}`;
            const fallbackResponse = await fetch(fallbackUrl, {
                 method: 'GET',
                 headers: { 'User-Agent': 'Bizly.ca Directory/1.0 (Contact: bizly.ca@proton.me)' } // UPDATED EMAIL
            });
             if (!fallbackResponse.ok) {
                 throw new Error(`Fallback geocoding HTTP error! Status: ${fallbackResponse.status}`);
             }
             const fallbackData = await fallbackResponse.json();
             console.log("Fallback Geocoding Response:", fallbackData);
             if (!fallbackData || fallbackData.length === 0 || !fallbackData[0].lat || !fallbackData[0].lon) {
                throw new Error("Location not found or invalid geocoding response (primary and fallback failed).");
             }
             lat = parseFloat(fallbackData[0].lat);
             lon = parseFloat(fallbackData[0].lon);
        } else {
            lat = parseFloat(geocodeData[0].lat);
            lon = parseFloat(geocodeData[0].lon);
        }

        console.log(`Geocoded Coordinates: Lat=${lat}, Lon=${lon}`);

    } catch (error) {
        console.error("Geocoding failed:", error);
        tempElement.textContent = "N/A"; // Indicate failure
        tempElement.title = `Could not find coordinates for ${communityName}. ${error.message}`;
        return; // Stop if geocoding fails
    }

    // 2. Fetch Weather from Open-Meteo
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true`;
        console.log("Attempting Weather Fetch URL:", weatherUrl); // Log the CORRECT URL

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
             const errorText = await weatherResponse.text();
             console.error("Weather API Response Error Text:", errorText);
             throw new Error(`Weather API HTTP error! Status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        console.log("Weather API Response Data:", weatherData); // Keep this log

        // ***** ADDED DEBUG LOGS *****
        console.log("Checking for current_weather object:", weatherData.current_weather);
        if (weatherData.current_weather) {
            console.log("Checking for temperature within current_weather:", weatherData.current_weather.temperature);
        }
        // ***************************

        // 3. Extract Temperature (Specific to Open-Meteo)
        let temperature = null;
        // Keep the original check for now, the logs above will tell us why it fails
        if (weatherData && weatherData.current_weather && weatherData.current_weather.temperature !== undefined) {
            temperature = weatherData.current_weather.temperature;
        } else {
             console.warn("Temperature data not found using weatherData.current_weather.temperature path."); // Modified warning
        }

        // 4. Display Temperature or N/A
        if (temperature !== null && !isNaN(parseFloat(temperature))) {
            // Display the temperature (round it)
            tempElement.textContent = `${Math.round(parseFloat(temperature))}°C`;
             tempElement.title = `Current temperature in ${communityName}`; // Update tooltip
        } else {
             tempElement.textContent = "N/A";
             tempElement.title = `Temperature data unavailable for ${communityName}`;
             // The previous console.warn covers why it failed if temp is null/NaN
        }

    } catch (error) {
        console.error("Weather fetching failed:", error);
        tempElement.textContent = "N/A";
        tempElement.title = `Could not fetch weather data for ${communityName}. ${error.message}`;
    }
}

// === END: Weather Functionality ===


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
    if (logoElement) logoElement.style.display = 'none'; // Keep hidden until src is set

    // Build Breadcrumbs
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `<ol class="breadcrumb"><li class="breadcrumb-item"><a href="index.html">Home</a></li><li class="breadcrumb-item"><a href="province_page.html?province=${encodeURIComponent(decodedProvinceName)}">${decodedProvinceName}</a></li><li class="breadcrumb-item active" aria-current="page">${decodedCommunityName}</li></ol>`;
    } else { console.warn("Breadcrumb container not found."); }
    if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">Loading Business Directory...</span>`; }


    // ***** CALL WEATHER FUNCTION *****
    // Call the weather function - it runs asynchronously in the background
    // It will update the #community-temp element when it gets data
    fetchAndDisplayWeather(decodedCommunityName, decodedProvinceName);
    // ********************************


    const tableName = decodedProvinceName.replace(/ /g, '_');
    let communityId = null;
    let logoFilename = null;

    try {
        // Fetch Community ID and Logo
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename')
            .eq('community_name', decodedCommunityName)
            // .eq('province_name', decodedProvinceName) // Add province check if community names aren't unique across provinces
            .limit(1)
            .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

        if (communityError) { throw new Error(`Error fetching community data: ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found in the communities table.`); }
        communityId = communityData.id;
        logoFilename = communityData.logo_filename;

        // Set Logo Source (after potentially getting the filename)
        if (logoElement && logoFilename) {
            logoElement.src = `images/logos/${logoFilename}`;
            logoElement.alt = `${decodedCommunityName} Logo`;
            logoElement.style.display = 'block'; // Show the logo now
        } else if (logoElement) {
            logoElement.style.display = 'none'; // Ensure it remains hidden if no logo
        }

        // Update Suggest Change Link
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink && communityId) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`;
        } else if (suggestChangeLink) {
             suggestChangeLink.style.display = 'none'; // Hide if no community ID
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

        resultsList.innerHTML = ''; // Clear loading message

        // Update subtitle with listing count
        const listingCount = listings?.length || 0;
        const subTitleText = `Business Directory (${listingCount} listings)`;
        if (communityNameElement) { communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`; }
        if (listingCount === 0) {
             console.log("DEBUG: No listings found for this community ID, exiting render.");
             resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`;
             return; // Stop if no listings
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

             listingsInCategory.forEach(listing => {
                 const isPromoted = listing.is_promoted === true;
                 const expiresAt = listing.promotion_expires_at ? new Date(listing.promotion_expires_at) : null;
                 const isActivePromotion = isPromoted && expiresAt instanceof Date && !isNaN(expiresAt) && expiresAt > now;
                 const duration = listing.promotion_duration_months;
                 if (isActivePromotion) { if (duration === 12) goldListings.push(listing); else if (duration === 6) silverListings.push(listing); else bronzeListings.push(listing); }
                 else { regularListings.push(listing); }
             });
             // Combine sorted promoted tiers with regular listings
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
                const listingId = listing.id;
                let actionButtonsHtml = '';

                // Gather ALL data needed for the card modal - Use CLEANED values for VCF/QR, ORIGINAL for display
                const originalName = listing.name || '';
                const originalAddress = listing.address || '';
                const originalNotes = listing.notes || '';
                const originalContactPerson = listing.contact_person || '';
                const originalPhone = listing.phone_number || ''; // Keep original format
                const originalEmail = listing.email || '';       // Keep original format
                const originalWebsite = listing.website_url || ''; // Keep original format

                const cleanedName = originalName.replace(/['’]/g, '');
                const cleanedAddress = originalAddress.replace(/['’]/g, '');
                const cleanedNotes = originalNotes.replace(/['’]/g, '');
                const cleanedContactPerson = originalContactPerson.replace(/['’]/g, '');

                const vCardDataPayload = {
                    id: listingId,
                    name: cleanedName,           // Use cleaned name for VCF/QR
                    phone: originalPhone,        // Use original phone
                    email: originalEmail,        // Use original email
                    website: originalWebsite,    // Use original website
                    address: cleanedAddress,       // Use cleaned address for VCF/QR
                    contactPerson: cleanedContactPerson, // Use cleaned contact person for VCF/QR
                    notes: cleanedNotes,           // Use cleaned notes for VCF/QR
                    logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp'
                 };
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    const base64EncodedData = utf8ToBase64(jsonString); // Encode payload
                    const safeTitleName = (originalName).replace(/"/g, '"'); // Title uses original name, escape quotes

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
                    const promoteName = (originalName).replace(/"/g, '"'); // Use original name, escape quotes
                    const promoteAddress = (originalAddress).replace(/"/g, '"');
                    const promotePhone = (originalPhone).replace(/"/g, '"');
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
                         const safeRawUrl = rawUrl.replace(/"/g, '"'); // Escape quotes for title
                        websiteLinkHtml = ` <a href="${formattedUrl}" target="_blank" title="${safeRawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                        actionButtonsHtml += ` ${websiteLinkHtml}`; // Append to the action buttons
                    } else { console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`); }
                }
                // --- End Action Button Construction ---


                 // Use TEMPLATE LITERALS - Use ORIGINAL values for display
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${originalName}${sponsoredLabelHtml}</span>
                          ${originalAddress ? `<span class="address">${originalAddress}</span>` : ''}
                          ${originalNotes ? `<span class="notes">${originalNotes}</span>` : ''}
                          ${originalContactPerson ? `<span class="contact-person">Contact: ${originalContactPerson}</span>` : ''}
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


// Initialize Search Functionality (Unchanged - Assuming it's correct)
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
                 // Handle other potential list items if necessary (e.g., loading/error messages)
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
                let tempMessage = document.createElement('li');
                tempMessage.id = 'no-search-results';
                tempMessage.textContent = `No listings found matching "${searchBox.value}".`;
                tempMessage.style.fontStyle = 'italic';
                tempMessage.style.marginTop = '15px';
                tempMessage.style.textAlign = 'center';
                tempMessage.style.color = '#6c757d';
                resultsList.appendChild(tempMessage);
                 noResultsMessage = tempMessage;
            }
             listItems.forEach(item => { // Hide all category headings if no entries are visible
                 if (item.classList.contains('category-heading')) { item.style.display = 'none'; }
             });
        } else if (noResultsMessage) {
            noResultsMessage.style.display = 'none'; // Hide message if there are results or search is empty
             // Ensure category headings are visible if search is cleared/matches exist
             listItems.forEach(item => {
                 if (item.classList.contains('category-heading')) {
                     let nextSibling = item.nextElementSibling; let categoryHasVisible = false;
                     while(nextSibling && !nextSibling.classList.contains('category-heading')) {
                         if (nextSibling.classList.contains('directory-entry') && nextSibling.style.display !== 'none') { categoryHasVisible = true; break; }
                         nextSibling = nextSibling.nextElementSibling;
                     }
                     item.style.display = categoryHasVisible ? 'block' : 'none'; // Show heading only if it has visible entries below it
                 }
             });
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
                if (!base64EncodedData) { throw new Error("Button is missing the data-vcard attribute."); }
                decodedJsonString = base64ToUtf8(base64EncodedData); // Use the helper
                if (!decodedJsonString) { throw new Error("Failed to decode Base64 data."); }
                console.log("Decoded JSON String (before parse):", decodedJsonString);
                vCardData = JSON.parse(decodedJsonString); // Parse the decoded JSON
                console.log("Parsed vCard Data:", vCardData);
            } catch (e) {
                console.error("Failed to decode/parse vCard data from button:", e);
                if (e instanceof SyntaxError && decodedJsonString) {
                     console.error("Potential JSON Syntax Error in decoded data. Decoded string was:", decodedJsonString);
                     alert("Error: Could not load card data due to invalid format after decoding.");
                } else { alert(`Error: Could not load card data. ${e.message}`); }
                return;
            }
            if (!vCardData || typeof vCardData !== 'object') { alert("Error: Invalid card data format."); return; }

            // 3. Populate Modal Elements (Using helper for safety)
            document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
            document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
            document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';

            const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => {
                 const pElement = document.getElementById(elementId);
                 if (!pElement) { console.warn(`Element ${elementId} not found`); return; }
                 const spanElement = pElement.querySelector('span');
                 const linkElement = pElement.querySelector('a');
                 pElement.style.display = 'none'; // Hide by default

                 if (value && value.trim() !== '') {
                     const trimmedValue = value.trim();
                     if (spanElement) { spanElement.textContent = trimmedValue; }
                     else { console.warn(`Span element missing inside ${elementId}`); }

                     if (isLink && linkElement) {
                         let hrefValue = trimmedValue;
                         if (linkPrefix && !hrefValue.startsWith(linkPrefix) && !hrefValue.startsWith('http')) { hrefValue = linkPrefix + hrefValue; }
                         else if (elementId === 'vcard-website' && !hrefValue.startsWith('http://') && !hrefValue.startsWith('https://')) { hrefValue = 'https://' + hrefValue; }
                         linkElement.href = hrefValue;

                         if (spanElement && !linkElement.contains(spanElement)) { linkElement.innerHTML = ''; linkElement.appendChild(spanElement); }
                         else if (!spanElement) { linkElement.textContent = trimmedValue; }
                         linkElement.style.display = 'inline';
                     } else if (linkElement) { linkElement.style.display = 'none'; }
                     pElement.style.display = 'flex'; // Show the item
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
            if (downloadLink) {
                 downloadLink.href = currentVCardObjectUrl;
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
                 if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`;
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
                         files: [new File([blob], `${(vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vcf`, { type: 'text/vcard' })]
                     };
                     if (navigator.canShare && navigator.canShare({ files: shareData.files })) {
                          try { await navigator.share(shareData); console.log('vCard shared successfully!'); }
                          catch (err) { if (err.name !== 'AbortError') console.error('Error sharing vCard:', err); }
                      } else if (navigator.share) {
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
            const phoneText = phoneNumberDisplay.textContent;
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


    // --- Close Listeners for Popups ---
    [closeVCardPopupButton, closePopupButton].forEach(button => {
        if (button) { button.addEventListener('click', button === closeVCardPopupButton ? closeVCard : closePhonePopup); }
        else { console.error(`Close button for ${button === closeVCardPopupButton ? 'vCard' : 'Phone'} popup not found.`); }
    });
    [virtualCardPopup, phonePopup].forEach(popup => {
         if (popup) { popup.addEventListener('click', function(event) { if (event.target === popup) { popup === virtualCardPopup ? closeVCard() : closePhonePopup(); } }); }
         else { console.error(`${popup === virtualCardPopup ? 'vCard' : 'Phone'} popup element not found for click-outside listener.`); }
    });
     document.addEventListener('keydown', (event) => { // ESC key closes popups
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
    let vcf = `BEGIN:VCARD\nVERSION:3.0\n`;
    const name = data.name || '';
    vcf += `FN:${name}\n`; // Formatted Name
    vcf += `ORG:${name}\n`; // Organization (assuming business name)
    if (data.phone) { vcf += `TEL;TYPE=WORK,VOICE:${data.phone}\n`; }
    if (data.email) { vcf += `EMAIL;TYPE=PREF,INTERNET:${data.email}\n`; }
    if (data.website) { vcf += `URL:${data.website}\n`; }
    if (data.address) {
        const escapedAddress = data.address.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
        vcf += `ADR;TYPE=WORK:;;${escapedAddress};;;;\n`; // Address in Street field
    }
    let noteContent = '';
    if (data.contactPerson) {
        noteContent += `Contact Person: ${data.contactPerson.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')}`;
    }
    if (data.notes) {
        if (noteContent) noteContent += '\\n'; // Add newline if contact was present
        noteContent += `Listing Notes: ${data.notes.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')}`;
    }
    if (noteContent) { vcf += `NOTE:${noteContent}\n`; }
    vcf += `REV:${new Date().toISOString()}\n`; // Revision timestamp
    vcf += `END:VCARD`;
    return vcf;
}

// Helper Function: Generate QR Code - Uses MECARD format
function generateAndShowQRCode(data, containerId) {
     const qrContainer = document.getElementById(containerId);
     console.log(`DEBUG: generateAndShowQRCode called. Container ID: ${containerId}, Found container:`, qrContainer);
    if (!qrContainer) { console.error(`QR Container #${containerId} not found.`); return; }

    if (typeof QRCode === 'undefined' || typeof QRCode !== 'function') {
        console.error("QRCode library is not loaded or QRCode is not a constructor function.");
        qrContainer.innerHTML = `<p><small>Scan QR to save contact:</small></p><p style="color: red;">Error: QR Code library failed to load.</p>`;
        qrContainer.style.display = 'block';
        return;
    }

    const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
    qrContainer.innerHTML = `<p><small>${smallText}</small></p>`; // Clear old QR

    let qrCodeString = `MECARD:`;
    if (data.name) qrCodeString += `N:${data.name};`; // Cleaned name for QR
    if (data.phone) qrCodeString += `TEL:${data.phone};`;
    if (data.email) qrCodeString += `EMAIL:${data.email};`;
    if (data.website) qrCodeString += `URL:${data.website};`;
    // Optional: Add address to NICKNAME or ORG if needed, MECARD is limited
    // if (data.address) qrCodeString += `ADR:${data.address};`; // ADR is technically supported but less common in simple readers
    qrCodeString += `;`; // Terminator

    console.log("DEBUG: MECARD string for QR:", qrCodeString);
    try {
        console.log("DEBUG: Attempting to create new QRCode instance...");
        new QRCode(qrContainer, {
            text: qrCodeString, width: 140, height: 140, colorDark : "#000000",
            colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.M
        });
        qrContainer.style.display = 'block';
        console.log("DEBUG: Successfully created QRCode instance and displayed container.");
    } catch(e) {
         console.error("QRCode generation failed INSIDE TRY/CATCH:", e);
         qrContainer.innerHTML = `<p><small>${smallText}</small></p><p style="color: red;">Error generating QR code.</p>`;
         qrContainer.style.display = 'block';
    }
}
// === END: Helper Functions ===


// Main Execution: Fetch listings, then initialize search and popups
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings(); // This now also triggers fetchAndDisplayWeather internally
    initializeSearch();
    initializePopupInteraction();
});