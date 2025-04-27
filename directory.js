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
     // Hide background container on major error too
     const containerElement = document.getElementById('logo-weather-container');
     if (containerElement) { containerElement.style.display = 'none'; }
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
    const containerElement = document.getElementById('weather-box'); // Target the new weather box

    // Ensure both elements exist before proceeding
    if (!tempElement || !containerElement) {
        console.warn("Weather display element (#community-temp) or weather box (#weather-box) not found.");
        return;
    }

    tempElement.textContent = "--°C"; // Reset or initial state
    tempElement.title = `Fetching weather for ${communityName}...`; // Initial tooltip
    containerElement.style.backgroundImage = 'none'; // Clear background initially

    // 1. Geocode: Get Lat/Lon
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
        // Set default background on geocoding failure
        if (containerElement) { // Check again in case it failed early
             containerElement.style.backgroundImage = 'url(/images/weather-bgs/default.webp)';
        }
        return; // Stop if geocoding fails
    }

    // 2. Fetch Weather & Set Background
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

        // --- Extract Weather Code and Temperature ---
        let weatherCode = null;
        let temperature = null;
        let backgroundImage = 'url(/images/weather-bgs/default.webp)'; // Default path

        if (weatherData && weatherData.current_weather) {
            console.log("Checking for current_weather object:", weatherData.current_weather); // DEBUG LOG

            // Get temperature
            if (weatherData.current_weather.temperature !== undefined) {
                 console.log("Checking for temperature within current_weather:", weatherData.current_weather.temperature); // DEBUG LOG
                temperature = weatherData.current_weather.temperature;
            } else {
                 console.warn("Temperature value missing in current_weather object.");
            }

            // Get weather code and map to background image
            if (weatherData.current_weather.weathercode !== undefined) {
                weatherCode = weatherData.current_weather.weathercode;
                console.log("Received Weather Code:", weatherCode);

                // Map WMO Weather Code to a background image category
                switch (weatherCode) {
                    case 0: backgroundImage = 'url(/images/weather-bgs/sunny.webp)'; break;
                    case 1: case 2: backgroundImage = 'url(/images/weather-bgs/partly-cloudy.webp)'; break;
                    case 3: backgroundImage = 'url(/images/weather-bgs/cloudy.webp)'; break;
                    case 45: case 48: backgroundImage = 'url(/images/weather-bgs/fog.webp)'; break;
                    case 51: case 53: case 55: case 61: case 63: case 65: case 80: case 81: case 82:
                        backgroundImage = 'url(/images/weather-bgs/rain.webp)'; break;
                    case 56: case 57: case 66: case 67:
                        backgroundImage = 'url(/images/weather-bgs/freezing-rain.webp)'; break;
                    case 71: case 73: case 75: case 77: case 85: case 86:
                        backgroundImage = 'url(/images/weather-bgs/snow.webp)'; break;
                    case 95: case 96: case 99:
                        backgroundImage = 'url(/images/weather-bgs/storm.webp)'; break;
                    default:
                        console.log("Using default background for unknown weather code:", weatherCode);
                        backgroundImage = 'url(/images/weather-bgs/default.webp)'; // Explicitly set default here too
                        break;
                }
            } else {
                console.warn("Weather code missing in current_weather object.");
                 backgroundImage = 'url(/images/weather-bgs/default.webp)'; // Use default if code missing
            }
        } else {
             console.warn("Current_weather object not found in API response.");
             backgroundImage = 'url(/images/weather-bgs/default.webp)'; // Use default if structure wrong
        }

        // --- Apply Background Image ---
        if (containerElement) { // Check again
            containerElement.style.backgroundImage = backgroundImage;
            console.log("Applied background image to #weather-box:", backgroundImage);
        }

        // --- Display Temperature ---
        if (temperature !== null && !isNaN(parseFloat(temperature))) {
            tempElement.textContent = `${Math.round(parseFloat(temperature))}°C`;
            tempElement.title = `Current temperature in ${communityName}`;
        } else {
             tempElement.textContent = "N/A";
             tempElement.title = `Temperature data unavailable for ${communityName}`;
             console.warn("Final temperature value was null or not a number:", temperature); // Added log
        }

    } catch (error) {
        console.error("Weather fetching or processing failed:", error);
        tempElement.textContent = "N/A";
        tempElement.title = `Could not fetch weather data for ${communityName}. ${error.message}`;
        // Set default background on fetch/processing failure
        if (containerElement) { // Check again
             containerElement.style.backgroundImage = 'url(/images/weather-bgs/default.webp)';
        }
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
            .limit(1)
            .maybeSingle();

        if (communityError) { throw new Error(`Error fetching community data: ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found in the communities table.`); }
        communityId = communityData.id;
        logoFilename = communityData.logo_filename;

        // Set Logo Source
        if (logoElement && logoFilename) {
            logoElement.src = `images/logos/${logoFilename}`;
            logoElement.alt = `${decodedCommunityName} Logo`;
            logoElement.style.display = 'block';
        } else if (logoElement) {
            logoElement.style.display = 'none';
        }

        // Update Suggest Change Link
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

        if (listingsError) {
             if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
             // Add other specific error checks if needed
             throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        console.log(`DEBUG: Fetched ${listings?.length ?? 0} listings from DB.`, listings);

        resultsList.innerHTML = ''; // Clear loading message

        // Update subtitle with listing count
        const listingCount = listings?.length || 0;
        const subTitleText = `Business Directory (${listingCount} listings)`;
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

             listingsInCategory.forEach(listing => {
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
                const originalName = listing.name || '';
                const originalAddress = listing.address || '';
                const originalNotes = listing.notes || '';
                const originalContactPerson = listing.contact_person || '';
                const originalPhone = listing.phone_number || '';
                const originalEmail = listing.email || '';
                const originalWebsite = listing.website_url || '';
                const cleanedName = originalName.replace(/['’]/g, '');
                const cleanedAddress = originalAddress.replace(/['’]/g, '');
                const cleanedNotes = originalNotes.replace(/['’]/g, '');
                const cleanedContactPerson = originalContactPerson.replace(/['’]/g, '');

                const vCardDataPayload = { id: listingId, name: cleanedName, phone: originalPhone, email: originalEmail, website: originalWebsite, address: cleanedAddress, contactPerson: cleanedContactPerson, notes: cleanedNotes, logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp' };
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    const base64EncodedData = utf8ToBase64(jsonString);
                    const safeTitleName = (originalName).replace(/"/g, '"');
                    actionButtonsHtml += `<button class="button-style view-vcard-btn" data-vcard='${base64EncodedData}' title="View Virtual Card for ${safeTitleName}"><i class="fa-solid fa-id-card"></i> Card</button>`;
                } catch (e) {
                    console.error(`Error processing vCard data for listing ID ${listingId}:`, e, vCardDataPayload);
                    actionButtonsHtml += `<button class="button-style view-vcard-btn" disabled title="Error generating card data"><i class="fa-solid fa-id-card"></i> Card</button>`;
                }
                if (listingId && !isActivePromotion) {
                    const promoteName = (originalName).replace(/"/g, '"');
                    const promoteAddress = (originalAddress).replace(/"/g, '"');
                    const promotePhone = (originalPhone).replace(/"/g, '"');
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(promoteName)}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(promoteAddress)}&phone=${encodeURIComponent(promotePhone)}`;
                    actionButtonsHtml += ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${promoteName}"><i class="fa-solid fa-rocket"></i> Promote</a>`;
                }
                if (listing.website_url && listing.website_url.trim() !== '') {
                    let rawUrl = listing.website_url.trim(); let formattedUrl = rawUrl; if (!/^https?:\/\//i.test(rawUrl)) { formattedUrl = `https://${rawUrl}`; }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) { const safeRawUrl = rawUrl.replace(/"/g, '"'); actionButtonsHtml += ` <a href="${formattedUrl}" target="_blank" title="${safeRawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`; }
                    else { console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`); }
                }

                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${originalName}${sponsoredLabelHtml}</span>
                          ${originalAddress ? `<span class="address">${originalAddress}</span>` : ''}
                          ${originalNotes ? `<span class="notes">${originalNotes}</span>` : ''}
                          ${originalContactPerson ? `<span class="contact-person">Contact: ${originalContactPerson}</span>` : ''}
                          <div class="promote-button-container">${actionButtonsHtml}</div>
                     </div>
                     <div class="phone-container">${phoneHtml}</div>
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


// Initialize Search Functionality
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');
    if (!searchBox || !resultsList) { console.warn("Search box or results list not found, search functionality disabled."); return; }

    searchBox.addEventListener('input', function() {
        const searchTerm = searchBox.value.toLowerCase().trim();
        const listItems = resultsList.querySelectorAll('li'); // Includes category headings and entries
        let anyVisibleInCategory = false;
        let currentCategoryHeading = null;
        let noResultsMessage = document.getElementById('no-search-results');

        // Remove existing no-results message before filtering
        if (noResultsMessage) { noResultsMessage.remove(); noResultsMessage = null;}

        listItems.forEach(item => {
            if (item.classList.contains('category-heading')) {
                if (currentCategoryHeading && !anyVisibleInCategory) { currentCategoryHeading.style.display = 'none'; }
                currentCategoryHeading = item;
                anyVisibleInCategory = false;
                currentCategoryHeading.style.display = 'block'; // Show heading initially
            } else if (item.classList.contains('directory-entry')) {
                const nameElement = item.querySelector('.name');
                const addressElement = item.querySelector('.address');
                const notesElement = item.querySelector('.notes');
                const contactElement = item.querySelector('.contact-person');
                const nameText = nameElement ? nameElement.textContent.toLowerCase() : '';
                const addressText = addressElement ? addressElement.textContent.toLowerCase() : '';
                const notesText = notesElement ? notesElement.textContent.toLowerCase() : '';
                const contactText = contactElement ? contactElement.textContent.toLowerCase() : '';
                const categoryText = currentCategoryHeading ? currentCategoryHeading.textContent.toLowerCase() : '';
                const isMatch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || contactText.includes(searchTerm) || categoryText.includes(searchTerm);

                if (isMatch || !searchTerm) { // Show if match OR search term is empty
                    item.style.display = 'flex';
                    anyVisibleInCategory = true;
                } else {
                    item.style.display = 'none';
                }
            }
        });

        // Final check for the last category heading
        if (currentCategoryHeading && !anyVisibleInCategory) {
            currentCategoryHeading.style.display = 'none';
        }

        // Show "no results" message ONLY if searching and nothing is visible
        const allEntries = resultsList.querySelectorAll('.directory-entry');
        const anyVisibleEntry = Array.from(allEntries).some(entry => entry.style.display !== 'none');
        if (!anyVisibleEntry && searchTerm) {
            if (!noResultsMessage) { // Check if it still exists after potential removal
                let tempMessage = document.createElement('li');
                tempMessage.id = 'no-search-results';
                tempMessage.textContent = `No listings found matching "${searchBox.value}".`;
                tempMessage.style.fontStyle = 'italic'; tempMessage.style.marginTop = '15px'; tempMessage.style.textAlign = 'center'; tempMessage.style.color = '#6c757d';
                resultsList.appendChild(tempMessage);
            }
            // Hide all category headings again if absolutely no entries match the search
            listItems.forEach(item => { if (item.classList.contains('category-heading')) { item.style.display = 'none'; }});
        }
    });
 } // End Initialize Search Functionality


// Initialize Popup Interactivity
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber');
    const copyPhoneButton = document.getElementById('copyPhoneBtn');
    const virtualCardPopup = document.getElementById('virtualCardPopup');
    const closeVCardPopupButton = document.getElementById('closeVCardPopup');
    if (!resultsList) { console.error("Cannot initialize popups: Results list container (#results) not found."); return; }
    let currentVCardObjectUrl = null; let copyTimeout = null;
    const copyTextElement = copyPhoneButton?.querySelector('.copy-text'); const copyIconElement = copyPhoneButton?.querySelector('i');
    const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy'; const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy';
    const resetCopyButton = () => { if (copyTextElement) copyTextElement.textContent = originalCopyText; if (copyIconElement) copyIconElement.className = originalCopyIconClass; if (copyPhoneButton) copyPhoneButton.disabled = false; if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; } };
    const closeVCard = () => { if (virtualCardPopup && !virtualCardPopup.classList.contains('hidden')) { virtualCardPopup.classList.add('hidden'); if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; } const qrContainer = document.getElementById('vcard-qrcode-container'); if (qrContainer) { const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR:'; qrContainer.innerHTML = `<p><small>${smallText}</small></p>`; qrContainer.style.display = 'none'; } } };
    const closePhonePopup = () => { if (phonePopup && !phonePopup.classList.contains('hidden')) { phonePopup.classList.add('hidden'); resetCopyButton(); } };

    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');
        const viewCardButton = event.target.closest('.view-vcard-btn');
        if (revealButton) { // Phone button logic
            event.preventDefault(); if (!phonePopup || !phoneNumberDisplay) return; closeVCard();
            const numberToDisplay = revealButton.dataset.phone;
            if (numberToDisplay) { phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`; resetCopyButton(); phonePopup.classList.remove('hidden'); const adContainer = phonePopup.querySelector('#adContainer .adsbygoogle'); if (adContainer && window.adsbygoogle) { try { (adsbygoogle = window.adsbygoogle || []).push({}); adContainer.setAttribute('data-adsbygoogle-status', 'requested'); } catch (e) { console.error("Error pushing popup ad:", e); } } }
        } else if (viewCardButton && !viewCardButton.disabled) { // vCard button logic
            event.preventDefault(); if (!virtualCardPopup) return; closePhonePopup();
            const qrContainer = document.getElementById('vcard-qrcode-container'); if (qrContainer) { const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR:'; qrContainer.innerHTML = `<p><small>${smallText}</small></p>`; qrContainer.style.display = 'none'; } if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; }
            let vCardData; let decodedJsonString = ""; try { const base64EncodedData = viewCardButton.dataset.vcard; if (!base64EncodedData) throw new Error("Missing data-vcard."); decodedJsonString = base64ToUtf8(base64EncodedData); if (!decodedJsonString) throw new Error("Failed decode."); vCardData = JSON.parse(decodedJsonString); } catch (e) { console.error("vCard data error:", e); return; } if (!vCardData || typeof vCardData !== 'object') return;
            document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp'; document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`; document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';
            const setVCardDetailItem = (id, val, prefix = '', isLink = true) => { const p = document.getElementById(id); if (!p) return; const span = p.querySelector('span'); const a = p.querySelector('a'); p.style.display = 'none'; if (val && val.trim() !== '') { const trimVal = val.trim(); if (span) span.textContent = trimVal; if (isLink && a) { let href = trimVal; if (prefix && !href.startsWith(prefix) && !href.startsWith('http')) href = prefix + href; else if (id === 'vcard-website' && !href.startsWith('http')) href = 'https://' + href; a.href = href; if (span && !a.contains(span)) { a.innerHTML = ''; a.appendChild(span); } else if (!span) { a.textContent = trimVal; } a.style.display = 'inline'; } else if (a) a.style.display = 'none'; p.style.display = 'flex'; } };
            setVCardDetailItem('vcard-contact-person', vCardData.contactPerson, '', false); setVCardDetailItem('vcard-phone', vCardData.phone, 'tel:'); setVCardDetailItem('vcard-email', vCardData.email, 'mailto:'); setVCardDetailItem('vcard-website', vCardData.website, '', true); setVCardDetailItem('vcard-address', vCardData.address, '', false); setVCardDetailItem('vcard-notes', vCardData.notes, '', false);
            const vcfString = generateVCF(vCardData); const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' }); currentVCardObjectUrl = URL.createObjectURL(blob); const downloadLink = document.getElementById('vcard-download-link'); if (downloadLink) { downloadLink.href = currentVCardObjectUrl; const safeName = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase(); downloadLink.download = `${safeName}.vcf`; }
            const showQrButton = document.getElementById('vcard-show-qr-button'); if (showQrButton) { const newBtn = showQrButton.cloneNode(true); showQrButton.parentNode.replaceChild(newBtn, showQrButton); newBtn.addEventListener('click', () => generateAndShowQRCode(vCardData, 'vcard-qrcode-container')); }
            const smsLink = document.getElementById('vcard-sms-link'); if (smsLink) { let smsBody = `Info for ${vCardData.name || 'listing'}:`; if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`; if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`; smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`; }
            const shareButton = document.getElementById('vcard-share-button'); if (shareButton) { const newBtn = shareButton.cloneNode(true); shareButton.parentNode.replaceChild(newBtn, shareButton); newBtn.addEventListener('click', async () => { const shareData = { title: `Contact: ${vCardData.name}`, text: `Info...\nPhone: ${vCardData.phone || 'N/A'}`, files: [new File([blob], `${(vCardData.name || 'c').replace(/[^a-z0-9]/gi, '_')}.vcf`, { type: 'text/vcard' })] }; if (navigator.canShare && navigator.canShare({ files: shareData.files })) { try { await navigator.share(shareData); } catch (err) { if (err.name !== 'AbortError') console.error('Share fail:', err); } } else if (navigator.share) { try { await navigator.share({ title: shareData.title, text: shareData.text, url: vCardData.website || window.location.href }); } catch (err) { if (err.name !== 'AbortError') console.error('Share text fail:', err); } } }); }
            virtualCardPopup.classList.remove('hidden');
        }
    });
    if (copyPhoneButton && phoneNumberDisplay) { copyPhoneButton.addEventListener('click', async () => { const txt = phoneNumberDisplay.textContent; if (txt && txt !== '...' && navigator.clipboard) { try { await navigator.clipboard.writeText(txt); if (copyTextElement) copyTextElement.textContent = 'Copied!'; if (copyIconElement) copyIconElement.className = 'fa-solid fa-check'; copyPhoneButton.disabled = true; copyTimeout = setTimeout(resetCopyButton, 2000); } catch (err) { resetCopyButton(); } } }); }
    [closeVCardPopupButton, closePopupButton].forEach(btn => { if (btn) { btn.addEventListener('click', btn === closeVCardPopupButton ? closeVCard : closePhonePopup); } });
    [virtualCardPopup, phonePopup].forEach(popup => { if (popup) { popup.addEventListener('click', (e) => { if (e.target === popup) { popup === virtualCardPopup ? closeVCard() : closePhonePopup(); } }); } });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape") { if (virtualCardPopup && !virtualCardPopup.classList.contains('hidden')) closeVCard(); else if (phonePopup && !phonePopup.classList.contains('hidden')) closePhonePopup(); } });
} // End initializePopupInteraction


// === START: Helper Functions (vCard, QR) ===
function generateVCF(data) { let v = `BEGIN:VCARD\nVERSION:3.0\n`; const n = data.name||''; v+=`FN:${n}\nORG:${n}\n`; if(data.phone)v+=`TEL;TYPE=WORK,VOICE:${data.phone}\n`; if(data.email)v+=`EMAIL;TYPE=PREF,INTERNET:${data.email}\n`; if(data.website)v+=`URL:${data.website}\n`; if(data.address){const e=data.address.replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');v+=`ADR;TYPE=WORK:;;${e};;;;\n`;} let nc=''; if(data.contactPerson){nc+=`Contact Person: ${data.contactPerson.replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n')}`;} if(data.notes){if(nc)nc+='\\n';nc+=`Listing Notes: ${data.notes.replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n')}`;} if(nc)v+=`NOTE:${nc}\n`; v+=`REV:${new Date().toISOString()}\nEND:VCARD`; return v; }
function generateAndShowQRCode(data, containerId) { const c=document.getElementById(containerId); if(!c)return; if(typeof QRCode==='undefined'){c.innerHTML=`<p><small>QR:</small></p><p style="color:red;">QR lib error.</p>`; c.style.display='block'; return;} const s=c.querySelector('small')?.textContent||'Scan QR:'; c.innerHTML=`<p><small>${s}</small></p>`; let q=`MECARD:`; if(data.name)q+=`N:${data.name};`; if(data.phone)q+=`TEL:${data.phone};`; if(data.email)q+=`EMAIL:${data.email};`; if(data.website)q+=`URL:${data.website};`; q+=`;`; try { new QRCode(c,{text:q,width:140,height:140,colorDark:"#000",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.M}); c.style.display='block';}catch(e){console.error("QR fail:",e); c.innerHTML=`<p><small>${s}</small></p><p style="color:red;">QR gen error.</p>`; c.style.display='block';}}
// === END: Helper Functions ===


// Main Execution: Fetch listings, then initialize search and popups
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings(); // This now also triggers fetchAndDisplayWeather internally
    initializeSearch();
    initializePopupInteraction();
});