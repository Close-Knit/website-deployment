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

     // Also hide weather element on major error
     const tempElement = document.getElementById('community-temp');
     if (tempElement) { tempElement.style.display = 'none'; }
     // Hide background container on major error too
     const containerElement = document.getElementById('logo-and-weather-wrapper'); // Corrected ID
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
                // Use original data for display text later in innerHTML template literal
                const originalName = listing.name || '';
                const originalAddress = listing.address || '';
                const originalNotes = listing.notes || '';
                const originalContactPerson = listing.contact_person || '';
                const originalPhone = listing.phone_number || '';
                const originalEmail = listing.email || '';
                const originalWebsite = listing.website_url || '';


                // 1. vCard Button Data and HTML
                const vCardDataPayload = {
                    id: listingId, name: originalName, phone: originalPhone, email: originalEmail, website: originalWebsite, address: originalAddress, contactPerson: originalContactPerson, notes: originalNotes, logoUrl: logoFilename ? `images/logos/${logoFilename}` : 'images/Bizly_Logo_150px.webp'
                 };
                try {
                    const jsonString = JSON.stringify(vCardDataPayload);
                    // *** USING BASE64 ENCODING ***
                    const base64EncodedData = utf8ToBase64(jsonString); // Use the helper function

                    // Escape name for title attribute only
                    const safeTitleName = originalName.replace(/"/g, '"'); // Escape double quotes for title

                    // Embed the Base64 string directly in data-vcard. Use single quotes for attribute.
                    actionButtonsHtml += `<button class="button-style view-vcard-btn" data-vcard='${base64EncodedData}' title="View Virtual Card for ${safeTitleName}"><i class="fa-solid fa-id-card"></i> Card</button>`;
                } catch (e) {
                    console.error(`Error processing vCard data for listing ID ${listingId}:`, e, vCardDataPayload);
                     actionButtonsHtml += `<button class="button-style view-vcard-btn" disabled title="Error generating card data"><i class="fa-solid fa-id-card"></i> Card</button>`;
                }


                // 2. Promote Button (if applicable)
                if (listingId && !isActivePromotion) {
                    const promoteName = originalName.replace(/"/g, '"'); // Escape for title
                    const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(originalName || 'N/A')}&table=${encodeURIComponent(tableName)}&address=${encodeURIComponent(originalAddress || '')}&phone=${encodeURIComponent(originalPhone || '')}`;
                    actionButtonsHtml += ` <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${promoteName}"><i class="fa-solid fa-rocket"></i> Promote</a>`;
                }

                // 3. Website Link (if applicable) - Use website_url
                let websiteLinkHtml = '';
                if (originalWebsite && originalWebsite.trim() !== '') {
                    let rawUrl = originalWebsite.trim();
                    let formattedUrl = rawUrl;
                    if (!/^https?:\/\//i.test(rawUrl)) { formattedUrl = `https://${rawUrl}`; }
                    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
                         const safeRawUrl = rawUrl.replace(/"/g, '"'); // Escape for title attribute
                        websiteLinkHtml = ` <a href="${formattedUrl}" target="_blank" title="${safeRawUrl}" class="website-link" rel="noopener noreferrer nofollow"><i class="fa-solid fa-globe"></i></a>`;
                        actionButtonsHtml += ` ${websiteLinkHtml}`;
                    } else { console.warn(`Skipping invalid website URL format for listing ${listing.id}: ${rawUrl}`); }
                }
                // --- End Action Button Construction ---


                 // Construct final HTML for the list item using template literals
                 // Display original data in text content (browser handles this)
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${originalName || 'N/A'}${sponsoredLabelHtml}</span>
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
        }); // End category loop

    } catch (fetchError) {
        displayError(fetchError.message || "An unknown error occurred while fetching listings.");
    }
} // End fetchAndDisplayListings


// Initialize Search Functionality (Unchanged)
function initializeSearch() { /* ... search logic ... */
     const searchBox = document.getElementById('searchBox'); const resultsList = document.getElementById('results'); if (!searchBox || !resultsList) { console.warn("Search elements not found."); return; }
    searchBox.addEventListener('input', function() { const searchTerm = this.value.toLowerCase().trim(); const listItems = resultsList.getElementsByClassName('directory-entry'); const categoryHeadings = resultsList.getElementsByClassName('category-heading'); let visibleCategories = new Set(); Array.from(listItems).forEach(item => { const nameElement = item.querySelector('.name'); const nameText = nameElement?.textContent.toLowerCase() || ''; const addressText = item.querySelector('.address')?.textContent.toLowerCase() || ''; const notesText = item.querySelector('.notes')?.textContent.toLowerCase() || ''; const contactPersonText = item.querySelector('.contact-person')?.textContent.toLowerCase() || ''; // Corrected to use contact_person
        let categoryText = ''; let currentElement = item.previousElementSibling; while (currentElement) { if (currentElement.classList.contains('category-heading')) { categoryText = currentElement.textContent.toLowerCase(); break; } currentElement = currentElement.previousElementSibling; } const matchesSearch = nameText.includes(searchTerm) || addressText.includes(searchTerm) || notesText.includes(searchTerm) || categoryText.includes(searchTerm) || contactPersonText.includes(searchTerm); if (matchesSearch) { item.style.display = ''; if (categoryText) visibleCategories.add(categoryText); } else { item.style.display = 'none'; } }); Array.from(categoryHeadings).forEach(heading => { const categoryText = heading.textContent.toLowerCase(); if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) { heading.style.display = ''; } else { heading.style.display = 'none'; } }); });
 }


// Initialize Popup Interactivity (Includes Base64, but not single-popup or QR fix)
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
        if (qrContainer) { // Added null check
            const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
            qrContainer.innerHTML = `<p><small>${smallText}</small></p>`;
             const qrCanvas = qrContainer.querySelector('canvas');
             if(qrCanvas) qrCanvas.remove();
             const qrImg = qrContainer.querySelector('img');
             if(qrImg) qrImg.remove();
             qrContainer.style.display = 'none'; // Hide QR container initially
        }
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

            // *** Original logic - will not close vCard ***
            // if (!virtualCardPopup.classList.contains('hidden')) {
            //      closeVCard();
            // }
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

            if (viewCardButton && !viewCardButton.disabled) { // Check if button is not disabled
                event.preventDefault();
                console.log("View Card button clicked");

                // *** Original logic - will not close phone popup ***
                // if (!phonePopup.classList.contains('hidden')) {
                //     closePhonePopup();
                // }
                // ***********************************

                // 1. Cleanup previous state (QR, Blob URL)
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
                try {
                    const base64EncodedData = viewCardButton.dataset.vcard;
                    const decodedJsonString = base64ToUtf8(base64EncodedData); // Use the helper
                    vCardData = JSON.parse(decodedJsonString); // Parse the decoded JSON
                    console.log("Parsed vCard Data:", vCardData);
                } catch (e) {
                    console.error("Failed to decode/parse vCard data from button:", e);
                    console.error("Raw data-vcard (Base64):", viewCardButton.getAttribute('data-vcard'));
                    alert("Error: Could not load card data.");
                    return; // Stop if parsing fails
                }
                if (!vCardData || typeof vCardData !== 'object') {
                    alert("Error: Invalid card data format.");
                    return;
                }

                // 3. Populate Modal Elements
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


                // 4. Generate vCard & Set Download Link
                const vcfString = generateVCF(vCardData); // generateVCF is defined below
                const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
                currentVCardObjectUrl = URL.createObjectURL(blob); // Store for cleanup
                const downloadLink = document.getElementById('vcard-download-link');
                if (downloadLink) {
                    downloadLink.href = currentVCardObjectUrl;
                    const filename = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    downloadLink.download = `${filename}.vcf`;
                    console.log("Generated vCard Object URL:", currentVCardObjectUrl);
                }

                // 5. Setup QR Code Button Listener
                const showQrButton = document.getElementById('vcard-show-qr-button');
                if (showQrButton) {
                    const newShowQrButton = showQrButton.cloneNode(true); // Clone to remove listeners
                    showQrButton.parentNode.replaceChild(newShowQrButton, showQrButton);
                    newShowQrButton.addEventListener('click', () => {
                        // generateAndShowQRCode is defined below
                         generateAndShowQRCode(vCardData, 'vcard-qrcode-container');
                    });
                }

                // 6. Setup SMS Link
                const smsLink = document.getElementById('vcard-sms-link');
                if (smsLink) {
                    let smsBody = `Check out ${vCardData.name || 'this business'} on Bizly:`;
                    if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`;
                    if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`;
                    if (vCardData.address) smsBody += `\nAddress: ${vCardData.address.replace(/\n/g, ', ')}`;
                    smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                }

                // 7. Setup Web Share Button Listener
                const shareButton = document.getElementById('vcard-share-button');
                if (shareButton) {
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


    // === START: Helper Functions (vCard, QR) ===
    // Helper Function: Generate vCard String (vCard 3.0) - Includes escapes
    function generateVCF(data) {
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
        if (data.phone) vcf += `TEL;type=WORK,VOICE:${data.phone.trim()}\n`;
        if (data.email) vcf += `EMAIL;TYPE=PREF,INTERNET:${data.email.trim()}\n`;
        if (data.address) {
            const fullAddressFormatted = data.address.trim().replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');
            vcf += `ADR;type=WORK:;;${fullAddressFormatted};;;;\n`;
        }
        if (data.website) vcf += `URL:${data.website.trim()}\n`;
        if (data.logoUrl && !data.logoUrl.includes('Bizly_Logo_150px.webp')) {
            vcf += `PHOTO;VALUE=URI:${data.logoUrl}\n`;
        }
        if (data.notes) vcf += `NOTE:${data.notes.trim().replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n')}\n`;
        vcf += `REV:${new Date().toISOString().split('.')[0]}Z\n`;
        vcf += `END:VCARD`;
        return vcf;
    }

   // START OF REPLACEMENT for generateAndShowQRCode function
// Helper Function: Generate QR Code - *** USING qrious LIBRARY + MECARD FORMAT ***
function generateAndShowQRCode(data, containerId) {
    const qrContainer = document.getElementById(containerId);
   if (!qrContainer) {
       console.error(`QR Container #${containerId} not found.`);
       return;
   }
   // Check for the qrious library function
   if (typeof QRious === 'undefined') {
       console.error("QRious library is not loaded.");
       qrContainer.innerHTML = `<p><small>QR:</small></p><p style="color:red;">QR lib error.</p>`;
       qrContainer.style.display='block';
       return;
   }
   // Clear previous QR code first (qrious generates a <canvas>)
   const smallText = qrContainer.querySelector('small')?.textContent || 'Scan QR to save contact:';
   qrContainer.innerHTML = `<p><small>${smallText}</small></p>`; // Reset container content

   // Helper function to escape MECARD special characters (\ ; , :) - unchanged
   function escapeMecardValue(value) {
       if (typeof value !== 'string') return '';
       return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:');
   }

   // Build MECARD string - unchanged
   let mecardString = 'MECARD:';
   let mecardName = '';
   if (data.contactPerson) {
       const nameParts = data.contactPerson.trim().split(' ');
       const firstName = nameParts[0] || '';
       const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
       mecardName = `${lastName},${firstName}`;
   } else if (data.name) {
       mecardName = data.name;
   }
   if (mecardName) mecardString += `N:${escapeMecardValue(mecardName)};`;
   if (data.name && data.contactPerson) { // Add ORG only if contact person was used for N
        mecardString += `ORG:${escapeMecardValue(data.name)};`;
   }
   if (data.phone) mecardString += `TEL:${escapeMecardValue(data.phone)};`;
   if (data.email) mecardString += `EMAIL:${escapeMecardValue(data.email)};`;
   if (data.website) mecardString += `URL:${escapeMecardValue(data.website)};`;
   if (data.address) {
       const mecardAddress = data.address.trim().replace(/\n/g, ', ');
        mecardString += `ADR:${escapeMecardValue(mecardAddress)};`;
   }
   mecardString += ';;'; // End marker - standard MECARD uses double semicolon

   console.log("Generating QR with MECARD String:", mecardString);

   // Check if MECARD string is essentially empty
   if (mecardString === 'MECARD:;;') {
        console.error("MECARD string is empty, cannot generate QR code.");
        qrContainer.innerHTML += '<p style="color: red;">Error: No data for QR code.</p>';
        qrContainer.style.display = 'block';
        return;
   }

   try {
       // *** USE qrious library ***
       // qrious usually generates a <canvas> element
       const qr = new QRious({
         element: qrContainer.appendChild(document.createElement('canvas')), // Create and append canvas directly
         value: mecardString, // The text to encode
         size: 160,         // Desired size in pixels
         level: 'M',        // Error correction level (L, M, Q, H)
         padding: 5,        // Padding around the QR code (similar to old setup)
         background: '#ffffff', // White background
         foreground: '#000000'  // Black foreground
       });
       // qrious appends the canvas automatically if element is provided

       qrContainer.style.display = 'block';
       console.log("Generated QR Code with qrious and MECARD data.");

   } catch(e) {
        console.error("qrious QR generation failed:", e);
        // Display error within the container
        const errorP = document.createElement('p');
        errorP.textContent = 'Error generating QR code.';
        errorP.style.color = 'red';
        qrContainer.appendChild(errorP);
        qrContainer.style.display = 'block';
   }
}
// END OF REPLACEMENT for generateAndShowQRCode function
    // === END: Helper Functions ===

} // End initializePopupInteraction


// Main Execution: Fetch listings, then initialize search and popups
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});