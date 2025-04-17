// --- START OF UPDATED directory.js (Button Alignment Attempt 2) ---

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
    // Initialize Supabase client if not already done (essential check)
    if (!supabaseClient) {
        displayError("Supabase client not initialized. Cannot fetch data.");
        return;
    }

    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');
    const logoElement = document.getElementById('logo');
    const breadcrumbContainer = document.getElementById('breadcrumb-container');

    // Initial setup and error checking for elements
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

    // Set page titles and headers
    const baseTitle = `${decodedCommunityName}, ${decodedProvinceName}`;
    if (pageTitle) pageTitle.textContent = `${baseTitle} Directory`;
    if (logoElement) logoElement.style.display = 'none'; // Hide initially

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

    // Set community name heading
    if (communityNameElement) {
        communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">Loading Telephone Directory...</span>`;
    }

    // Determine the Supabase table name based on the province
    const tableName = decodedProvinceName.replace(/ /g, '_');

    try {
        // Fetch Community ID and Logo Filename
        console.log(`Fetching community data for: ${decodedCommunityName}`);
        const { data: communityData, error: communityError } = await supabaseClient
            .from('communities')
            .select('id, logo_filename') // Select ID and logo filename
            .eq('community_name', decodedCommunityName)
            .limit(1)
            .single(); // Expect only one matching community

        if (communityError) { throw new Error(`Could not verify community "${decodedCommunityName}". ${communityError.message}`); }
        if (!communityData) { throw new Error(`Community "${decodedCommunityName}" not found.`); }

        const communityId = communityData.id; // Store community ID
        const logoFilename = communityData.logo_filename;

        console.log(`Community ID: ${communityId}`);

        // Display logo if available
        if (logoElement && logoFilename) {
             logoElement.src = `images/logos/${logoFilename}`;
             logoElement.alt = `${decodedCommunityName} Logo`;
             logoElement.style.display = 'block'; // Show logo
        } else if (logoElement) {
             logoElement.style.display = 'none'; // Ensure it's hidden if no logo
        }

        // Update "Suggest Change" link with correct context
        const suggestChangeLink = document.getElementById('suggestChangeLink');
        if (suggestChangeLink) {
            suggestChangeLink.href = `suggest_change.html?cid=${communityId}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}`;
        } else {
            console.warn("Suggest change link element not found.")
        }

        // Fetch Listings - IMPORTANT: Ensure 'id' is selected. '*' includes it.
        console.log(`Fetching listings from table: ${tableName} for community ID: ${communityId}`);
        const { data: listings, error: listingsError } = await supabaseClient
            .from(tableName)
            .select('*') // Select all columns, including the new 'id', 'is_promoted', etc.
            .eq('community_id', communityId)
            .order('category', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        // Handle errors during listing fetch
        if (listingsError) {
            if (listingsError.code === '42P01') { throw new Error(`DB table "${tableName}" not found for province "${decodedProvinceName}".`); }
            if (listingsError.code === '42703') { throw new Error(`Column 'community_id' missing or misspelled in table "${tableName}". Check Supabase schema.`); }
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        // Clear loading message
        resultsList.innerHTML = '';

        // Update subtitle with listing count
        const listingCount = listings?.length || 0;
        const subTitleText = `Telephone Directory (${listingCount} listings)`;
        if (communityNameElement) {
            communityNameElement.innerHTML = `${baseTitle}<br><span class="directory-subtitle">${subTitleText}</span>`;
        }

        // Handle case with no listings
        if (listingCount === 0) {
            resultsList.innerHTML = `<li>No listings found for ${decodedCommunityName}.</li>`;
            return;
        }

        // Group listings by category
        const groupedListings = listings.reduce((acc, listing) => {
            const category = listing.category || 'Uncategorized';
            if (!acc[category]) { acc[category] = []; }
            acc[category].push(listing);
            return acc;
         }, {});

        // Sort categories alphabetically, keeping 'Uncategorized' last
        const sortedCategories = Object.keys(groupedListings).sort((a, b) => {
             if (a === 'Uncategorized') return 1;
             if (b === 'Uncategorized') return -1;
             return a.localeCompare(b);
         });

        // Render listings grouped by category
        sortedCategories.forEach(category => {
             // Add category heading
             const categoryHeadingItem = document.createElement('li');
             categoryHeadingItem.className = 'category-heading';
             categoryHeadingItem.textContent = category;
             resultsList.appendChild(categoryHeadingItem);

             // Loop through listings within this category
             groupedListings[category].forEach(listing => {
                 const listItem = document.createElement('li');
                 listItem.className = 'directory-entry';

                 // --- Get the listing's unique ID (CRITICAL) ---
                 const listingId = listing.id;
                 if (!listingId) {
                     console.warn("Listing missing 'id'. Cannot create promote button:", listing);
                 }

                 // --- Phone Button HTML generation ---
                 const phoneNumber = listing.phone_number || '';
                 let phoneHtml = '';
                 if (phoneNumber) {
                     phoneHtml = `
                         <button class="revealPhoneBtn" data-phone="${phoneNumber}" title="Show phone number for ${listing.name || 'this listing'}">
                             <i class="fa-solid fa-phone"></i> Show Phone
                         </button>
                     `;
                 }

                 // --- Promote Button HTML generation ---
                 let promoteButtonHtml = '';
                 if (listingId) {
                     const promoteUrl = `promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(decodedProvinceName)}&comm=${encodeURIComponent(decodedCommunityName)}&name=${encodeURIComponent(listing.name || 'N/A')}&table=${encodeURIComponent(tableName)}`;
                     // Generate the link, styled as a button
                     promoteButtonHtml = `
                         <a href="${promoteUrl}" class="button-style promote-button" title="Promote this listing: ${listing.name || ''}">
                             <i class="fa-solid fa-rocket"></i> Promote
                         </a>
                     `;
                 }


                 // --- Construct the final HTML for the list item ---
                 // Put BOTH buttons inside phone-container
                 listItem.innerHTML = `
                     <div class="entry-details">
                          <span class="name">${listing.name || 'N/A'}</span>
                          ${listing.address ? `<span class="address">${listing.address}</span>` : ''}
                          ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
                     </div>
                     <div class="phone-container">
                          ${promoteButtonHtml}  ${/* Promote button HTML */''}
                          ${phoneHtml}          ${/* Phone button HTML */}
                     </div>
                 `;
                 resultsList.appendChild(listItem);
             }); // End loop through listings in category
        }); // End loop through categories

    } catch (fetchError) {
        // Catch any errors from fetching community or listings
        displayError(fetchError.message);
    }
} // End fetchAndDisplayListings function

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

        // Filter list items
        Array.from(listItems).forEach(item => {
            const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
            let currentElement = item;
            let categoryText = '';
            // Find the preceding category heading for context
            while (currentElement = currentElement.previousElementSibling) {
                if (currentElement.classList.contains('category-heading')) {
                    categoryText = currentElement.textContent.toLowerCase();
                    break;
                }
            }

            const matchesSearch = name.includes(searchTerm) || categoryText.includes(searchTerm);

            if (matchesSearch) {
                item.style.display = ''; // Show item
                if (categoryText) {
                    visibleCategories.add(categoryText); // Mark category as having visible items
                }
            } else {
                item.style.display = 'none'; // Hide item
            }
        });

        // Filter category headings based on search term or visible items
        Array.from(categoryHeadings).forEach(heading => {
            const categoryText = heading.textContent.toLowerCase();
             if (categoryText.includes(searchTerm) || visibleCategories.has(categoryText)) {
                 heading.style.display = ''; // Show heading
             } else {
                 heading.style.display = 'none'; // Hide heading
             }
        });
    });
}

// ======================================================================
// Initialize Popup Interactivity (MODIFIED for Copy Button - Unchanged from previous state)
// ======================================================================
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber');
    const copyPhoneButton = document.getElementById('copyPhoneBtn'); // Get copy button
    const copyTextElement = copyPhoneButton?.querySelector('.copy-text'); // Get span inside copy button
    const copyIconElement = copyPhoneButton?.querySelector('i'); // Get icon inside copy button

    // Store original copy button state (ensure elements exist first)
    const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy';
    const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy';
    let copyTimeout = null; // To manage the reset timer

    // Function to reset copy button state
    const resetCopyButton = () => {
         if (copyTextElement) copyTextElement.textContent = originalCopyText;
         if (copyIconElement) copyIconElement.className = originalCopyIconClass;
         if (copyPhoneButton) copyPhoneButton.disabled = false; // Re-enable button
         if (copyTimeout) {
             clearTimeout(copyTimeout);
             copyTimeout = null; // Clear the timer ID
         }
    };

    // Check for essential popup elements first
    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay) {
        console.error("Core popup elements missing. Cannot initialize popup interaction.");
        return;
    }
    // Check specifically for copy button elements, but don't stop initialization if missing
    if (!copyPhoneButton || !copyTextElement || !copyIconElement) {
         console.warn("Copy button or its inner elements missing.");
    }


    // --- Copy Button Logic ---
    if (copyPhoneButton) { // Only add listener if button exists
        const handleCopyClick = async () => {
            const linkElement = phoneNumberDisplay.querySelector('a');
            const numberToCopy = linkElement ? linkElement.textContent : null;

            if (numberToCopy && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(numberToCopy);
                    console.log(`Phone number copied: ${numberToCopy}`);
                    // Visual Feedback only if elements exist
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
                 resetCopyButton(); // Reset state even if unsupported
            } else {
                console.warn("Could not find number text to copy.");
                resetCopyButton(); // Reset state if number somehow missing
            }
        };
        copyPhoneButton.addEventListener('click', handleCopyClick);
    }
    // --- End Copy Button Logic ---


    // --- Reveal Button Logic (Event Delegation) ---
    resultsList.addEventListener('click', function(event) {
        // IMPORTANT: Check for clicks on BOTH button types now within this handler if needed,
        // BUT for now, only the phone button triggers the popup.
        const revealButton = event.target.closest('.revealPhoneBtn');
        const promoteButton = event.target.closest('.promote-button'); // Check if click was on promote button

        if (revealButton) { // Logic for Phone Button click
            event.preventDefault(); // Prevent default if it was a link/button
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
            // If the promote button is clicked, we *don't* preventDefault,
            // because we WANT the browser to follow the link ('href') to promote.html.
            console.log('Promote button clicked, allowing navigation to:', promoteButton.href);
        }
    });
    // --- End Reveal Button Logic ---

    // Close button listener
    closePopupButton.addEventListener('click', function() {
        phonePopup.classList.add('hidden');
        console.log("Popup closed via X button.");
        resetCopyButton(); // Reset on close
    });

    // Close popup if clicking outside the content area
     phonePopup.addEventListener('click', function(event) {
         if (event.target === phonePopup) {
              phonePopup.classList.add('hidden');
              console.log("Popup closed by clicking outside.");
              resetCopyButton(); // Reset on close
         }
     });
}
// ======================================================================
// End Popup Interactivity Function
// ======================================================================


// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");

    // Check if Supabase library is loaded
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
         displayError("Supabase library failed to load. Check script tags in HTML.");
         return;
    }

    console.log("[DEBUG] Supabase library found. Initializing client...");

    // Define Supabase credentials
    const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

    // Initialize Supabase client
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    if (!supabaseClient) {
        displayError("Failed to initialize Supabase client.");
        return;
    }

    console.log("[DEBUG] Supabase client initialized.");

    // Initialize functionalities after DOM is loaded and Supabase is ready
    fetchAndDisplayListings(); // Fetch and display the directory listings
    initializeSearch();       // Set up the search box functionality
    initializePopupInteraction(); // Set up phone reveal popup

});

// --- END OF UPDATED directory.js ---