// --- START OF directory.js (Promote Button Left, Phone Button Right) ---

// ======================================================================
// Declare Supabase Client Variable Globally
// ======================================================================
let supabaseClient = null;

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) {
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`;
    } else {
        console.error("Could not find #results element to display error.");
    }
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) {
          communityNameElement.innerHTML = "Error Loading Directory";
     }
     const logoElement = document.getElementById('logo');
     if(logoElement) logoElement.style.display = 'none';
     const breadcrumbContainer = document.getElementById('breadcrumb-container');
     if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
}

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    // Initialize Supabase client if not already done
    if (!supabaseClient) {
        const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        } else {
             displayError("Supabase library not loaded or client failed to initialize.");
             return;
        }
    }

    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');
    const breadcrumbContainer = document.getElementById('breadcrumb-container');

    // Initial setup
    if (resultsList) resultsList.innerHTML = '<li>Loading...</li>';
    if (breadcrumbContainer) breadcrumbContainer.innerHTML = '';
    if (communityNameElement) communityNameElement.innerHTML = 'Loading...';

    if (!resultsList) {
        console.error("Fatal Error: Results list element (#results) not found.");
        return;
    }

    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL.");
        return;
    }

    const decodedProvinceName = decodeURIComponent(provinceName);
    const decodedCommunityName = decodeURIComponent(communityName);

    // Set titles and headers
    const baseTitle = `${decodedCommunityName}, ${decodedProvinceName}`;
    if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
    if (logoElement) logoElement.style.display = 'none';

    // Build Breadcrumbs
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                <li class="breadcrumb-item"><a href="province_page.html?province=${encodeURIComponent(decodedProvinceName)}">${decodedProvinceName}</a></li>
                <li class="breadcrumb-item active" aria-current="page">${decodedCommunityName}</li>
            </ol>
        `;
    } else {
        console.warn("Breadcrumb container not found.");
    }

    if (communityNameElement) {
        communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">Loading Telephone Directory...</span>`;
    }

    // Determine Supabase table name
    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo
        console.log(`Fetching community data for: ${decodedCommunityName}`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename')
            .eq('community_name', decodedCommunityName)
            .limit(1)
            .single();

        if (communityError) { throw new Error(`Could not verify community "${decodedCommunityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found.`); }

        const communityId = communityData.id;
        const logoFilename = communityData.logo_filename;

        console.log(`Community ID: ${communityId}`);

        // Display logo
        if (logoElement && logoFilename) {
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${decodedCommunityName} Logo`;
             logoElement.style.display = 'block';
        } else if (logoElement) {
             logoElement.style.display = 'none';
        }

        // Update "Suggest Change" link
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`;
        } else {
            console.warn("Suggest change link element not found.")
        }

        // Fetch Listings - Make sure 'id' is selected
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') // Select all columns, including 'id'
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        if (listingsError) {
            if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
            if (listingsError.code === '42703') { throw new Error(`Column 'community_id' missing or misspelled in table "${tableName}". Check Supabase schema.`); }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        resultsList.innerHTML = '';

        // Update subtitle with count
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) {
            communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`;
        }

        if (listingCount === 0) {
            resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`;
            return;
        }

        // Group and Sort Listings
        const groupedListings = listings.reduce((acc, listing) => {
            const category = listing.category || 'Uncategorized';
            if (!acc[category]) { acc[category] = []; }
            acc[category].push(listing);
            return acc;
         }, {});

        const sortedCategories = Object.keys(groupedListings).sort((a, b) => {
             if (a === 'Uncategorized') return 1;
             if (b === 'Uncategorized') return -1;
             return a.localeCompare(b);
         });

        // --- Render Listings ---
        sortedCategories.forEach(category => {
             const categoryHeadingItem = document.createElement('li');
             categoryHeadingItem.className = 'category-heading';
             categoryHeadingItem.textContent = category;
             resultsList.appendChild(categoryHeadingItem);

             groupedListings[category].forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // Get listing ID
                 const listingId = listing.id;
                 if (!listingId) {
                     console.warn("Listing missing 'id'. Cannot create promote button:", listing);
                 }

                 // Phone Button HTML
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) {
                     phoneHtml = `
                         <button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}">
                             <i class="fa-solid fa-phone"></i> Show Phone
                         </button>
                     `;
                 }

                 // Promote Button HTML
                 let promoteButtonHtml = '';
                 if (listingId) {
                     const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(listing.name || 'N/A')}&table=${encodeURIComponent(tableName)}`;
                     // Create the link styled as a button. Add a class for potential future styling.
                     // Ensure the container aligns left (default for div) or explicitly set style="text-align: left;" if needed.
                     promoteButtonHtml = `
                         <div class="promote-button-container" style="margin-top: 8px;"> {/* Wrapper div with margin, default left alignment */}
                             <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${listing.name || ''}">
                                 <i class="fa-solid fa-rocket"></i> Promote
                             </a>
                         </div>
                     `;
                 }

                 // Construct the final HTML for the list item
                 // Place promoteButtonHtml inside entry-details, phoneHtml inside phone-container
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}</span>
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                          ${promoteButtonHtml}  ${/* Promote button stays here */}
                     </div>
                     <div class="phone-container">
                          ${phoneHtml}          ${/* Phone button stays here */}
                     </div>
                 `;
                 resultsList.appendChild(listItem);
             }); // End loop through listings
        }); // End loop through categories

    } catch (fetchError) {
        displayError(fetchError.message);
    }
} // End fetchAndDisplayListings

// ======================================================================
// Initialize Search Functionality (Unchanged)
// ======================================================================
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');

    if (!searchBox || !resultsList) {
        console.warn("Search box or results list not found, search disabled.");
        return;
    }

    searchBox.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const listItems = resultsList.getElementsByClassName('directory-entry');
        const categoryHeadings = resultsList.getElementsByClassName('category-heading');

        let visibleCategories = new Set();

        Array.from(listItems).forEach(item => {
            const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
            let currentElement = item;
            let categoryText = '';
            while (currentElement = currentElement.previousElementSibling) {
                if (currentElement.classList.contains('category-heading')) {
                    categoryText = currentElement.textContent.toLowerCase();
                    break;
                }
            }

            const matchesSearch = name.includes(searchTerm) || categoryText.includes(searchTerm);

            if (matchesSearch) {
                item.style.display = '';
                if (categoryText) {
                    visibleCategories.add(categoryText);
                }
            } else {
                item.style.display = 'none';
            }
        });

        Array.from(categoryHeadings).forEach(heading => {
            const categoryText = heading.textContent.toLowerCase();
             if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) {
                 heading.style.display = '';
             } else {
                 heading.style.display = 'none';
             }
        });
    });
}

// ======================================================================
// Initialize Popup Interactivity (Unchanged from original)
// ======================================================================
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
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
         if (copyTimeout) {
             clearTimeout(copyTimeout);
             copyTimeout = null;
         }
    };

    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay) {
        console.error("Core popup elements missing. Cannot initialize popup interaction.");
        return;
    }
    if (!copyPhoneButton || !copyTextElement || !copyIconElement) {
         console.warn("Copy button or its inner elements missing.");
    }


    if (copyPhoneButton) {
        const handleCopyClick = async () => {
            const linkElement = phoneNumberDisplay.querySelector('a');
            const numberToCopy = linkElement ? linkElement.textContent : null;

            if (numberToCopy && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(numberToCopy);
                    console.log(`Phone number copied: ${numberToCopy}`);
                    if (copyTextElement) copyTextElement.textContent = 'Copied!';
                    if (copyIconElement) copyIconElement.className = 'fa-solid fa-check';
                    copyPhoneButton.disabled = true;

                    if (copyTimeout) clearTimeout(copyTimeout);
                    copyTimeout = setTimeout(resetCopyButton, 2000);

                } catch (err) {
                    console.error('Failed to copy phone number:', err);
                    alert("Could not copy number. Please copy it manually.");
                    resetCopyButton();
                }
            } else if (!navigator.clipboard) {
                 console.warn("Clipboard API not supported.");
                 alert("Copying to clipboard is not supported by your browser.");
                 resetCopyButton();
            } else {
                console.warn("Could not find number text to copy.");
                resetCopyButton();
            }
        };
        copyPhoneButton.addEventListener('click', handleCopyClick);
    }


    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');
        const promoteButton = event.target.closest('.promote-button'); // Check for promote button click

        if (revealButton) {
            event.preventDefault();
            const numberToDisplay = revealButton.dataset.phone;

            if (numberToDisplay) {
                phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`;
                resetCopyButton();
                phonePopup.classList.remove('hidden');
                console.log(`Showing popup for number: ${numberToDisplay}`);

            } else {
                console.warn("Clicked reveal button is missing phone data (data-phone attribute).");
            }
        } else if (promoteButton) {
             // Allow default link behavior for the promote button
             console.log('Promote button clicked, allowing navigation to:', promoteButton.href);
        }
    });


    closePopupButton.addEventListener('click', function() {
        phonePopup.classList.add('hidden');
        console.log("Popup closed via X button.");
        resetCopyButton();
    });


     phonePopup.addEventListener('click', function(event) {
         if (event.target === phonePopup) {
              phonePopup.classList.add('hidden');
              console.log("Popup closed by clicking outside.");
              resetCopyButton();
         }
     });
}


// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");

    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
         displayError("Supabase library failed to load. Check script tags in HTML.");
         return;
    }

    console.log("[DEBUG] Supabase library found. Initializing client...");

    const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    if (!supabaseClient) {
        displayError("Failed to initialize Supabase client.");
        return;
    }

    console.log("[DEBUG] Supabase client initialized.");

    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();

});

// --- END OF directory.js ---