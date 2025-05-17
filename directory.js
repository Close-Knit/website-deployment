// directory.js - Main script for community directory pages

// Get community data from meta tag
function getCommunityData() {
    const communityDataElement = document.getElementById('community-data');
    if (!communityDataElement) {
        console.error('Community data element not found');
        return null;
    }
    
    // Ensure lat/lon are parsed as numbers, default to 0 if missing/invalid
    const lat = parseFloat(communityDataElement.getAttribute('data-latitude'));
    const lon = parseFloat(communityDataElement.getAttribute('data-longitude'));
    
    return {
        province: communityDataElement.getAttribute('data-province'),
        community: communityDataElement.getAttribute('data-community'),
        provinceSlug: communityDataElement.getAttribute('data-province-slug'),
        communitySlug: communityDataElement.getAttribute('data-community-slug'),
        latitude: !isNaN(lat) ? lat : 0,    // Parse and provide default
        longitude: !isNaN(lon) ? lon : 0    // Parse and provide default
    };
}

// Function to show error messages
function showError(message) {
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `<li class="error-message">Error: ${message}</li>`;
    }
    
    // Also update the page title to show error
    document.title = 'Error Loading Directory | Bizly.ca';
    
    // Update the community name heading
    const communityNameElement = document.getElementById('community-name');
    if (communityNameElement) {
        communityNameElement.textContent = 'Error Loading Directory';
    }
    
    console.error(message);
}

/* 
// REMOVED: Dynamic data loading functions are no longer needed as content is generated statically
// Load community data and business listings
async function loadCommunityData(province, community) {
    // Function removed - content now generated statically
}

// Load categories for filter dropdown
async function loadCategories() {
    // Function removed - content now generated statically
}

// Load community logo
async function loadCommunityLogo() {
    // Function removed - content now generated statically
}

// Load weather data
async function loadWeatherData() {
    // Function removed - content now generated statically
}

// Set weather background
function setWeatherBackground(weatherCode) {
    // Function removed - content now generated statically
}

// Set weather background by temperature
function setWeatherBackgroundByTemp(temp) {
    // Function removed - content now generated statically
}
*/

// Show phone number popup
function showPhonePopup(phoneNumber) {
    const phonePopup = document.getElementById('phonePopup');
    const phoneNumberElement = document.getElementById('phoneNumber');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (phonePopup && phoneNumberElement) {
        phoneNumberElement.textContent = phoneNumber;
        phonePopup.classList.remove('hidden');
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }
}

// --- Global variable to store the current VCF blob URL ---
let currentVCardObjectUrl = null;

// Show vCard popup
function showVCardPopup(businessData) {
    const vCardPopup = document.getElementById('virtualCardPopup');
    const modalOverlay = document.getElementById('modalOverlay');
    if (!vCardPopup) { console.error("vCard popup element (#virtualCardPopup) not found."); return; }

    // --- Revoke previous Blob URL if exists ---
    if (currentVCardObjectUrl) {
        URL.revokeObjectURL(currentVCardObjectUrl);
        currentVCardObjectUrl = null;
    }

    // --- Get Element References ---
    const nameElement = document.getElementById('vcard-name');
    const logoElement = document.getElementById('vcard-logo');
    const qrCanvas = document.getElementById('vcard-qr');
    const qrContainer = document.getElementById('vcard-qrcode-container');

    // --- Populate Basic Info ---
    if (nameElement) nameElement.textContent = businessData.name || 'N/A';
    // TODO: Add logic to set vcard-logo src based on businessData if available, otherwise hide it
    if (logoElement) logoElement.style.display = 'none'; // Hide by default for now

    // --- Helper to Set Detail Items ---
    const setVCardDetailItem = (id, value, prefix = '', link = true) => {
        const pElement = document.getElementById(id);
        if (!pElement) return;
        const span = pElement.querySelector('span');
        const anchor = pElement.querySelector('a');

        if (value && span) {
            span.textContent = value; // Set text content
            if (link && anchor) {
                let href = value;
                if (prefix && !value.startsWith('http') && !value.startsWith(prefix)) {
                    href = prefix + value; // Add tel: or mailto:
                } else if (id === 'vcard-website' && !value.startsWith('http')) {
                    href = 'https://' + value; // Assume https for websites
                }
                anchor.href = href;
                
                // Ensure website links open in new tab
                if (id === 'vcard-website') {
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';
                }
                
                pElement.style.display = 'flex'; // Show element
            } else {
                pElement.style.display = 'flex'; // Show non-link element
            }
        } else {
            pElement.style.display = 'none'; // Hide if no value
        }
    };

    // --- Populate Detail Fields ---
    setVCardDetailItem('vcard-contact-person', businessData.contactPerson, '', false); // Assuming contactPerson is in data
    setVCardDetailItem('vcard-phone', businessData.phone, 'tel:');
    setVCardDetailItem('vcard-email', businessData.email, 'mailto:');
    setVCardDetailItem('vcard-website', businessData.website);
    // REMOVED: setVCardDetailItem('vcard-address', businessData.address, '', false);
    setVCardDetailItem('vcard-notes', businessData.notes, '', false); // Assuming notes is in data

    // --- Handle Address Link Separately ---
    const addressElementP = document.getElementById('vcard-address');
    const addressSpan = addressElementP?.querySelector('span'); // Get the span inside
    const addressValue = businessData.address; // Get the raw address
    const businessNameValue = businessData.name; // Get the business name

    if (addressElementP && addressSpan && addressValue) {
        addressSpan.textContent = addressValue; // Set the visible text

        // Check if an anchor already wraps the span
        let anchor = addressSpan.closest('a'); // See if span is already inside an anchor
        if (!anchor) {
            // If no anchor exists, create one
            anchor = document.createElement('a');
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            // Move the span inside the new anchor
            anchor.appendChild(addressSpan);
            // Find the icon and insert the anchor right after it
            const icon = addressElementP.querySelector('i.fa-fw');
            if (icon && icon.nextSibling) {
                 addressElementP.insertBefore(anchor, icon.nextSibling);
            } else if (icon) {
                 addressElementP.appendChild(anchor); // Append if icon is last
            } else {
                 addressElementP.appendChild(anchor); // Append if no icon (fallback)
            }
        }

        // Construct the search query including the business name
        const searchQuery = `${businessNameValue || ''}, ${addressValue}`; // Combine name and address
        const encodedQuery = encodeURIComponent(searchQuery); // Encode the combined string

        // Update the href attribute with the combined query
        anchor.href = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        anchor.title = `View ${businessNameValue || 'address'} on Google Maps`; // Update tooltip slightly

        addressElementP.style.display = 'flex'; // Ensure the paragraph is visible
    } else if (addressElementP) {
        addressElementP.style.display = 'none'; // Hide if no address value
    }

    // --- Generate VCF Data ---
    const vcfString = generateVCF(businessData); // Use helper function
    const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
    currentVCardObjectUrl = URL.createObjectURL(blob); // Store the URL

    // --- Configure Action Buttons ---
    const downloadLink = document.getElementById('vcard-download-link');
    if (downloadLink && currentVCardObjectUrl) {
        downloadLink.href = currentVCardObjectUrl;
        const safeName = (businessData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        downloadLink.download = `${safeName}.vcf`;
    }

    const showQrButton = document.getElementById('vcard-show-qr-button');
    const qrButtonIcon = showQrButton?.querySelector('i');
    const qrButtonText = showQrButton?.childNodes[2]; // Assuming icon is first, text is third

    // Reset QR state
    if (qrContainer) qrContainer.style.display = 'none'; // Hide QR initially
    if (qrButtonIcon) qrButtonIcon.className = 'fa-solid fa-qrcode';
    if (qrButtonText) qrButtonText.textContent = ' Show QR';


    // --- QR Code Generation (moved inside button handler potentially, or generated on open) ---
    let qrGenerated = false; // Flag to generate only once
    const generateQRIfNeeded = () => {
         if (!qrGenerated && typeof QRious === 'function' && qrCanvas && qrContainer) {
             const vCardText = generateVCF(businessData); // Regenerate just in case
             try {
                new QRious({ element: qrCanvas, value: vCardText, size: 180, padding: 10 });
                qrGenerated = true; // Mark as generated
                console.log("QR Code generated for:", businessData.name);
             } catch (e) { console.error("QRious error:", e); qrCanvas.innerHTML = 'Error'; }
         } else if (!qrGenerated) {
             console.warn("Cannot generate QR: QRious missing, canvas missing, or already generated.");
         }
    }

     // --- QR Button Toggle Logic ---
     if (showQrButton && qrContainer) {
         // Remove previous listeners to avoid duplicates
         const newQrButton = showQrButton.cloneNode(true); // Clone to remove listeners
         showQrButton.parentNode.replaceChild(newQrButton, showQrButton);

         newQrButton.addEventListener('click', () => {
             if (qrContainer.style.display === 'none') {
                 generateQRIfNeeded(); // Generate if not already done
                 qrContainer.style.display = 'block';
                 newQrButton.querySelector('i').className = 'fa-solid fa-eye-slash'; // Update icon
                 newQrButton.childNodes[2].textContent = ' Hide QR'; // Update text
             } else {
                 qrContainer.style.display = 'none';
                 newQrButton.querySelector('i').className = 'fa-solid fa-qrcode'; // Reset icon
                 newQrButton.childNodes[2].textContent = ' Show QR'; // Reset text
             }
         });
     }


    // --- SMS Link ---
    const smsLink = document.getElementById('vcard-sms-link');
    if (smsLink) {
        let smsBody = `Contact Info for ${businessData.name || 'listing'}:`;
        if (businessData.phone) smsBody += `\nPhone: ${businessData.phone}`;
        if (businessData.website) smsBody += `\nWebsite: ${businessData.website}`;
        // Add more details if desired
        smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
    }

    // --- Web Share Button ---
    const shareButton = document.getElementById('vcard-share-button');
    if (shareButton) {
         // Remove previous listeners
         const newShareButton = shareButton.cloneNode(true);
         shareButton.parentNode.replaceChild(newShareButton, shareButton);

         newShareButton.addEventListener('click', async () => {
             const shareData = {
                 title: `Contact: ${businessData.name || 'Business'}`,
                 text: `Contact details for ${businessData.name || 'this business'}:\nPhone: ${businessData.phone || 'N/A'}\nWebsite: ${businessData.website || 'N/A'}`,
                 // url: businessData.website || window.location.href, // URL often overrides text/title
             };
             // Try sharing VCF file if supported
             const vcfFile = new File([blob], downloadLink.download, { type: 'text/vcard' });
             if (navigator.canShare && navigator.canShare({ files: [vcfFile] })) {
                 try {
                     await navigator.share({ ...shareData, files: [vcfFile] });
                     console.log('Shared with VCF file');
                 } catch (err) { if (err.name !== 'AbortError') console.error('Share fail:', err); }
             } else if (navigator.share) { // Fallback to sharing text/URL
                 try {
                     await navigator.share(shareData);
                     console.log('Shared text/URL');
                 } catch (err) { if (err.name !== 'AbortError') console.error('Share text fail:', err); }
             } else {
                 alert('Web Share API not supported in this browser.');
             }
         });
    }

    // --- Show Popup ---
    vCardPopup.classList.remove('hidden');
    if (modalOverlay) modalOverlay.classList.remove('hidden');
}

// --- Helper Function to Generate VCF String ---
function generateVCF(data) {
    let v = 'BEGIN:VCARD\nVERSION:3.0\n';
    const n = data.name || '';
    v += `FN:${n}\n`; // Full Name
    v += `ORG:${n}\n`; // Organization (often same as name for businesses)
    if (data.phone) v += `TEL;TYPE=WORK,VOICE:${data.phone}\n`;
    if (data.email) v += `EMAIL;TYPE=PREF,INTERNET:${data.email}\n`;
    if (data.website) v += `URL:${data.website}\n`;
    if (data.address) {
        // Basic escaping for VCF address field (commas, semicolons, newlines)
        const escapedAddress = data.address.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
        v += `ADR;TYPE=WORK:;;${escapedAddress};;;;\n`; // Street address part
    }
    let noteContent = '';
    if (data.contactPerson) noteContent += `Contact Person: ${data.contactPerson}\\n`; // Add escaped newline
    if (data.notes) noteContent += `Notes: ${data.notes}`;
    if (noteContent) {
         // Escape notes for VCF
         const escapedNotes = noteContent.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
         v += `NOTE:${escapedNotes}\n`;
    }
    v += `REV:${new Date().toISOString()}\n`; // Revision timestamp
    v += 'END:VCARD';
    return v;
}

// Function to initialize the page
function initPage() {
    console.log('Initializing directory page...');
    
    // Get community data from meta tag
    const communityData = getCommunityData();
    if (!communityData) {
        console.error('Failed to get community data from meta tag');
        return;
    }
    
    // Fetch and display weather data CLIENT-SIDE
    fetchAndDisplayWeather();
    
    // Set up search functionality
    setupSearch();
    
    // Set up category filter
    setupCategoryFilter();
    
    // Set up share button
    setupShareButton();
    
    // Set up back to top button
    setupBackToTopButton();
    
    // Set up phone reveal functionality
    setupPhoneReveal();
    
    // Set up virtual card functionality
    setupVirtualCard();
    
    // Set up promote functionality
    setupPromoteButton();
    
    // Setup popup close buttons
    setupPopupCloseButtons();
}

// Helper function to get province code
function getProvinceCode(province) {
    const provinceCodeMap = {
        'Alberta': 'ab',
        'British Columbia': 'bc',
        'Manitoba': 'mb',
        'New Brunswick': 'nb',
        'Newfoundland and Labrador': 'nl',
        'Northwest Territories': 'nt',
        'Nova Scotia': 'ns',
        'Nunavut': 'nu',
        'Ontario': 'on',
        'Prince Edward Island': 'pe',
        'Quebec': 'qc',
        'Saskatchewan': 'sk',
        'Yukon': 'yt'
    };
    
    return provinceCodeMap[province] || '';
}

// Function to log element dimensions for debugging
function logElementDimensions() {
    console.log("--- Logging Element Dimensions ---");
    const logo = document.getElementById('logo');
    const weatherBox = document.getElementById('weather-box');

    if (logo) {
        const logoRect = logo.getBoundingClientRect();
        const logoComputedStyle = window.getComputedStyle(logo);
        console.log("Logo (#logo - IMG):", {
            offsetWidth: logo.offsetWidth,
            offsetHeight: logo.offsetHeight,
            clientWidth: logo.clientWidth, // width + padding - scrollbar
            clientHeight: logo.clientHeight, // height + padding - scrollbar
            computedWidth: logoComputedStyle.width,
            computedHeight: logoComputedStyle.height,
            padding: logoComputedStyle.padding,
            border: logoComputedStyle.borderWidth,
            boxSizing: logoComputedStyle.boxSizing,
            rectWidth: logoRect.width, // Geometric width
            rectHeight: logoRect.height // Geometric height
        });
    } else {
        console.log("Logo (#logo - IMG) not found for dimension logging.");
    }

    if (weatherBox) {
        const weatherRect = weatherBox.getBoundingClientRect();
        const weatherComputedStyle = window.getComputedStyle(weatherBox);
        console.log("Weather Box (#weather-box - DIV):", {
            offsetWidth: weatherBox.offsetWidth, // width + padding + border
            offsetHeight: weatherBox.offsetHeight, // height + padding + border
            clientWidth: weatherBox.clientWidth,
            clientHeight: weatherBox.clientHeight,
            computedWidth: weatherComputedStyle.width,
            computedHeight: weatherComputedStyle.height,
            padding: weatherComputedStyle.padding,
            border: weatherComputedStyle.borderWidth,
            boxSizing: weatherComputedStyle.boxSizing,
            rectWidth: weatherRect.width,
            rectHeight: weatherRect.height
        });
    } else {
        console.log("Weather Box (#weather-box - DIV) not found for dimension logging.");
    }
    console.log("--- End Logging Element Dimensions ---");
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    // Optional: Log elements before initialization
    const logoElements = document.querySelectorAll('#logo, #logo-and-weather-wrapper, #weather-box, .weather-container');
    logoElements.forEach(element => {
        if (element && element.parentNode) {
            console.log("Found element:", element.id || element.className);
            // element.parentNode.removeChild(element); // Temporarily disable removal for debug
        }
    });

    // Initialize the page AFTER DOM is ready
    initPage();
    
    // Log dimensions shortly after init
    setTimeout(logElementDimensions, 100); // Delay slightly (100ms)
});

// Add a new function for popup close listeners
function setupPopupCloseButtons() {
    const closePopupBtn = document.getElementById('closePopup');
    const phonePopup = document.getElementById('phonePopup');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeVCardBtn = document.getElementById('closeVCardPopup');
    const vCardPopup = document.getElementById('virtualCardPopup');

    if (closePopupBtn && phonePopup) {
        closePopupBtn.addEventListener('click', function() {
            phonePopup.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
        });
    }
    
    if (closeVCardBtn && vCardPopup) {
        closeVCardBtn.addEventListener('click', function() {
            vCardPopup.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
        });
    }
    
    console.log("Popup close listeners attached.");
}

// Perform search on static content (REVISED LOGIC)
function performSearch() {
    const searchBox = document.getElementById('search-input'); // Match template ID
    const categoryFilter = document.getElementById('category-filter'); // Match template ID
    const resultsContainer = document.getElementById('results');

    if (!searchBox || !categoryFilter || !resultsContainer) {
        console.error("Search elements not found (search-input, category-filter, or results)");
        return;
    }

    const searchTerm = searchBox.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value; // Can be "" for all

    let visibleListingCount = 0;
    const visibleCategories = new Set();

    // Iterate through each category header
    const categoryHeaders = resultsContainer.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        const categoryName = header.textContent;
        let categoryHasVisibleListing = false;

        // Find all listing elements directly following this header until the next header or end
        let currentElement = header.nextElementSibling;
        while (currentElement && currentElement.classList.contains('business-listing')) {
            const listingElement = currentElement;
            let isMatch = true; // Assume visible initially

            // Check category filter
            if (selectedCategory && categoryName !== selectedCategory) {
                isMatch = false;
            }

            // Check search term if category matches (or if no category selected)
            if (isMatch && searchTerm) {
                const nameElement = listingElement.querySelector('.business-name');
                const descriptionElement = listingElement.querySelector('.business-description'); // Assuming this class exists
                const addressElement = listingElement.querySelector('.address'); // Check address too
                const contactElement = listingElement.querySelector('.contact-person'); // Check contact

                const nameText = nameElement ? nameElement.textContent.toLowerCase() : '';
                const descriptionText = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
                const addressText = addressElement ? addressElement.textContent.toLowerCase() : '';
                const contactText = contactElement ? contactElement.textContent.toLowerCase() : '';

                // Match if term is in name, description, address, or contact
                isMatch = nameText.includes(searchTerm) ||
                          descriptionText.includes(searchTerm) ||
                          addressText.includes(searchTerm) ||
                          contactText.includes(searchTerm);
            }

            // Show or hide the listing
            if (isMatch) {
                listingElement.style.display = 'block'; // Or 'flex' depending on your CSS default
                categoryHasVisibleListing = true;
                visibleListingCount++;
            } else {
                listingElement.style.display = 'none';
            }

            currentElement = currentElement.nextElementSibling; // Move to the next sibling
        }

        // Show or hide the category header
        if (categoryHasVisibleListing) {
            header.style.display = 'block'; // Or match your CSS default display
            visibleCategories.add(categoryName); // Track visible categories
        } else {
            header.style.display = 'none';
        }
    });

    // Handle "no results" message
    let noResultsLi = resultsContainer.querySelector('.no-results');
    if (visibleListingCount === 0 && (searchTerm || selectedCategory)) {
        if (!noResultsLi) {
            noResultsLi = document.createElement('li');
            noResultsLi.className = 'no-results';
            resultsContainer.appendChild(noResultsLi);
        }
        noResultsLi.textContent = 'No matching listings found.';
        noResultsLi.style.display = 'block';
    } else if (noResultsLi) {
        noResultsLi.style.display = 'none'; // Hide if there are results
    }

    // Update listing count display
    const listingCountElement = document.getElementById('listing-count');
    if (listingCountElement) {
        listingCountElement.textContent = visibleListingCount;
    }
}

// Set up category filter from static content
function setupCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) {
        console.error("Category filter element not found (#category-filter)");
        return;
    }
    
    // Get all unique categories from the DOM
    const categories = new Set();
    document.querySelectorAll('.category-header').forEach(header => {
        categories.add(header.textContent.trim());
    });
    
    // Clear existing options except the first "All Categories" option
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add options to dropdown
    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Add change event listener
    categoryFilter.addEventListener('change', performSearch);
}

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Set up search functionality
function setupSearch() {
    const searchBox = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const searchForm = document.getElementById('search-form');

    // Remove form submission listener if it interferes
    if (searchForm) {
         searchForm.addEventListener('submit', function(e) {
             e.preventDefault(); // Still prevent default just in case
             performSearch(); // Trigger immediate search on explicit Enter press
         });
     }

    // Debounced search on text input
    if (searchBox) {
        // Trigger search 500ms after user stops typing
        searchBox.addEventListener('input', debounce(performSearch, 500));
    }

    // Immediate search on category change
    if (categoryFilter) {
        categoryFilter.addEventListener('change', performSearch);
    }
}

// Set up share button
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    if (!shareButton) return;
    
    shareButton.addEventListener('click', function() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback for browsers that don't support Web Share API
            prompt('Copy this link to share:', window.location.href);
        }
    });
}

// Set up back to top button
function setupBackToTopButton() {
    const backToTopButton = document.getElementById('backToTopBtn');
    if (!backToTopButton) return;
    
    // Show button when user scrolls down
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // Scroll to top when button is clicked
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Set up phone reveal functionality
function setupPhoneReveal() {
    // Add event listeners to phone buttons
    document.querySelectorAll('.show-phone-btn').forEach(button => {
        button.addEventListener('click', function() {
            const phone = this.getAttribute('data-phone');
            showPhonePopup(phone);
        });
    });
    
    // Close phone popup
    const closePopupBtn = document.getElementById('closePopup');
    const phonePopup = document.getElementById('phonePopup');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (closePopupBtn && phonePopup) {
        closePopupBtn.addEventListener('click', function() {
            phonePopup.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
        });
    }
}

// Set up virtual card functionality
function setupVirtualCard() {
    // Add event listeners to vCard buttons
    document.querySelectorAll('.vcard-btn').forEach(button => {
        button.addEventListener('click', function() {
            const data = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name'),
                category: this.getAttribute('data-category'),
                phone: this.getAttribute('data-phone'),
                email: this.getAttribute('data-email'),
                website: this.getAttribute('data-website'),
                address: this.getAttribute('data-address')
            };
            showVCardPopup(data);
        });
    });
    
    // Close vCard popup
    const closeVCardBtn = document.getElementById('closeVCardPopup');
    const vCardPopup = document.getElementById('virtualCardPopup');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (closeVCardBtn && vCardPopup) {
        closeVCardBtn.addEventListener('click', function() {
            vCardPopup.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
        });
    }
}

// Set up promote button
function setupPromoteButton() {
    document.querySelectorAll('.promote-btn.button-style').forEach(button => { // Target the <a> tag specifically
        button.addEventListener('click', function(event) {
            event.preventDefault(); // PREVENT default link navigation first

            console.log("Promote button clicked (JS Handler)"); // Add log

            // Get the URL directly from the button's href attribute
            const promoteUrl = this.getAttribute('href');

            if (promoteUrl) {
                console.log("Opening promote URL in new tab:", promoteUrl);
                window.open(promoteUrl, '_blank'); // Explicitly open in new tab
            } else {
                console.error("Promote button clicked but href attribute is missing!");
            }

            // REMOVE the old redirect line:
            // window.location.href = `../../promote.html?${params.toString()}`;
        });
    });
}

// Function to fetch and display weather data
async function fetchAndDisplayWeather() {
    console.log("Fetching weather data client-side...");
    const communityData = getCommunityData();
    if (!communityData || !communityData.community || !communityData.province) { // Check for names
        console.error('Cannot fetch weather: community/province names not available from meta tag');
        // Optionally hide or show error state in weather box here
        const weatherBox = document.getElementById('weather-box');
        if (weatherBox) {
            weatherBox.innerHTML = '<span style="color: white; padding: 5px; font-size: 0.8em; text-align: center; display: block;">Weather N/A</span>';
            weatherBox.style.backgroundColor = '#888'; // Grey fallback
        }
        return;
    }

    const weatherBox = document.getElementById('weather-box');
    const tempElement = document.getElementById('community-temp');
    const highElement = document.getElementById('temp-high');
    const lowElement = document.getElementById('temp-low');

    if (!weatherBox || !tempElement || !highElement || !lowElement) {
        console.error('Weather display elements not found in DOM');
        return;
    }

    // --- Clear previous weather display / show loading ---
    tempElement.innerHTML = '--<sup>°C</sup>';
    highElement.textContent = 'H: --';
    lowElement.textContent = 'L: --';
    weatherBox.style.backgroundImage = 'none';
    weatherBox.style.backgroundColor = '#a7c5e2'; // Default blue background during load
    // ---

    try {
        // === STEP 1: Geocode community name to get Lat/Lon ===
        const geocodeQuery = `${communityData.community}, ${communityData.province}`;
        const geocodeApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(geocodeQuery)}&count=1&language=en&format=json`;

        console.log("Fetching coordinates from Geocoding API:", geocodeApiUrl);
        const geocodeResponse = await fetch(geocodeApiUrl);
        if (!geocodeResponse.ok) {
            throw new Error(`Geocoding API response not OK: ${geocodeResponse.statusText}`);
        }
        const geocodeData = await geocodeResponse.json();

        // Check if geocoding returned results
        if (!geocodeData.results || geocodeData.results.length === 0) {
             throw new Error(`Could not find coordinates for "${geocodeQuery}"`);
        }

        const location = geocodeData.results[0];
        const latitude = location.latitude;
        const longitude = location.longitude;
        console.log(`Geocoding successful: Lat=${latitude}, Lon=${longitude} for ${location.name}`);

        // === STEP 2: Fetch Forecast using obtained Lat/Lon ===
        const forecastApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${location.timezone || 'auto'}`; // Use timezone from geocoding if available

        console.log("Fetching forecast from API:", forecastApiUrl);
        const forecastResponse = await fetch(forecastApiUrl);
        if (!forecastResponse.ok) {
            throw new Error(`Forecast API response not OK: ${forecastResponse.statusText}`);
        }
        const forecastData = await forecastResponse.json();
        console.log("Forecast API response:", forecastData);

        // Extract and display weather data (same as before)
        const currentTemp = Math.round(forecastData.current.temperature_2m);
        const weatherCode = forecastData.current.weather_code;
        const highTemp = Math.round(forecastData.daily.temperature_2m_max[0]);
        const lowTemp = Math.round(forecastData.daily.temperature_2m_min[0]);

        console.log("Parsed forecast data:", { currentTemp, weatherCode, highTemp, lowTemp });

        tempElement.innerHTML = `${currentTemp}<sup>°C</sup>`;
        tempElement.title = `Current temperature in ${communityData.community}`;
        highElement.textContent = `H: ${highTemp}°`;
        lowElement.textContent = `L: ${lowTemp}°`;

        setWeatherBackground(weatherBox, weatherCode, currentTemp); // Background setting uses the same logic

    } catch (error) {
        console.error('Error fetching or processing weather data:', error);
        // Set fallback display on error (e.g., geocoding failed)
        tempElement.innerHTML = '--'; // Simpler error display
        tempElement.title = 'Weather data unavailable';
        highElement.textContent = '';
        lowElement.textContent = '';
        weatherBox.style.backgroundImage = 'none';
        weatherBox.style.backgroundColor = '#888'; // Grey fallback on error
        // Add specific text for error state
        weatherBox.innerHTML = '<span style="color: white; padding: 5px; font-size: 0.8em; text-align: center; display: block; line-height: 1.2;">Weather<br>Error</span>';
    }
}

// Function to set weather background based on weather code
function setWeatherBackground(weatherBox, weatherCode, temp) {
    let backgroundImage = ''; // Initialize
    const basePath = '/images/weather-bgs/'; // Use absolute path from site root

    // Map WMO Weather Code to a background image category
    switch (true) {
        // Clear
        case (weatherCode === 0 || weatherCode === 1):
            backgroundImage = `${basePath}sunny.webp`; 
            break;
        // Partly cloudy
        case (weatherCode >= 2 && weatherCode <= 3):
            backgroundImage = `${basePath}partly-cloudy.webp`; 
            break;
        // Fog
        case (weatherCode >= 45 && weatherCode <= 49):
            backgroundImage = `${basePath}fog.webp`; 
            break;
        // Drizzle or light rain
        case ((weatherCode >= 51 && weatherCode <= 57) || 
              (weatherCode >= 61 && weatherCode <= 63) || 
              (weatherCode >= 80 && weatherCode <= 81)):
            backgroundImage = `${basePath}light-rain.webp`; 
            break;
        // Rain
        case (weatherCode >= 64 && weatherCode <= 67) || (weatherCode === 82):
            backgroundImage = `${basePath}rain.webp`; 
            break;
        // Snow
        case (weatherCode >= 71 && weatherCode <= 77) || 
             (weatherCode >= 85 && weatherCode <= 86):
            backgroundImage = `${basePath}snow.webp`; 
            break;
        // Thunderstorm
        case (weatherCode >= 95 && weatherCode <= 99):
            backgroundImage = `${basePath}storm.webp`; 
            break;
        default:
            // Use temperature fallback if code unknown or no specific image
            console.log(`No specific image for code ${weatherCode}, using temp fallback.`);
            setWeatherBackgroundByTemp(weatherBox, temp);
            return; // Exit function early
    }

    // Apply the background image
    weatherBox.style.backgroundImage = `url('${backgroundImage}')`;
    weatherBox.style.backgroundColor = 'transparent'; // Remove default blue when image loads
    console.log("Set weather background image:", weatherBox.style.backgroundImage);
}

// Set weather background by temperature as fallback
function setWeatherBackgroundByTemp(weatherBox, temp) {
    const basePath = '/images/weather-bgs/'; // Use absolute path from site root
    let tempImage = '';
    
    // Add a check for null temp
    if (temp === null || isNaN(temp)) {
        console.warn("Cannot set temp-based background: Temperature is invalid.");
        // Optionally set a truly generic default image or color
        weatherBox.style.backgroundImage = `url('${basePath}mild.webp')`; // Default to mild if temp unknown
        weatherBox.style.backgroundColor = 'transparent';
        return;
    }
    
    if (temp >= 30) {
        tempImage = `${basePath}hot.webp`;
    } else if (temp >= 20) {
        tempImage = `${basePath}warm.webp`;
    } else if (temp <= 0) {
        tempImage = `${basePath}cold.webp`;
    } else { // Mild temperatures
        tempImage = `${basePath}mild.webp`;
    }
    
    weatherBox.style.backgroundImage = `url('${tempImage}')`;
    weatherBox.style.backgroundColor = 'transparent';
    console.log("Set temp-based weather background image:", weatherBox.style.backgroundImage);
}

// Function to set background on page load based on embedded weather data
function setInitialWeatherBackground() {
    const weatherBox = document.getElementById('weather-box');
    if (!weatherBox) {
        console.warn("Weather box not found for initial background setting.");
        return;
    }

    const weatherCodeStr = weatherBox.getAttribute('data-weather-code');
    console.log("Read data-weather-code:", weatherCodeStr); // Debug log

    if (weatherCodeStr !== null && weatherCodeStr !== "") {
        const weatherCode = parseInt(weatherCodeStr, 10);
        if (!isNaN(weatherCode)) {
            // We need the temperature for the fallback function setWeatherBackgroundByTemp
            // Let's try to read it from the #community-temp element generated server-side
            const tempElement = document.getElementById('community-temp');
            let currentTemp = null;
            if (tempElement) {
                const tempMatch = tempElement.textContent.match(/^(-?\d+)/); // Extract digits
                if (tempMatch) {
                    currentTemp = parseInt(tempMatch[1], 10);
                }
            }
            console.log("Read currentTemp from HTML:", currentTemp); // Debug log

            // Call the existing background function
            setWeatherBackground(weatherBox, weatherCode, currentTemp); // Pass temp too
        } else {
            console.warn("Invalid weather code found in data-attribute:", weatherCodeStr);
            weatherBox.style.backgroundColor = '#a7c5e2'; // Default blue if code invalid
        }
    } else {
        console.log("No weather code found in data-attribute. Leaving default background.");
        weatherBox.style.backgroundColor = '#a7c5e2'; // Default blue if no code attribute
    }
}
