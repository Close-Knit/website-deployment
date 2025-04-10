// --- START OF UPDATED directory.js ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) {
        // Clear previous results and show only the error
        resultsList.innerHTML = `<li style="color: red; font-style: italic;">${message}</li>`;
    }
    // Also update heading to indicate failure
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) {
          communityNameElement.textContent = "Error Loading Directory";
     }
}

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    const resultsList = document.getElementById('results');
    const communityNameElement = document.getElementById('community-name');
    const pageTitle = document.querySelector('title');

    // Display initial loading message
    if (resultsList) resultsList.innerHTML = '<li>Loading listings...</li>';
    if (communityNameElement) communityNameElement.textContent = 'Loading Directory...';


    // Get query parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");
    const communityName = urlParams.get("community");

    // --- Validation ---
    if (!provinceName || !communityName) {
        displayError("Missing province or community information in URL. Please go back and select a community.");
        return;
    }

    // --- Update Page Title/Heading Early ---
     if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory`;
     if (pageTitle) pageTitle.textContent = `${communityName}, ${provinceName} Directory`;
     // Note: Logo population logic would go here if needed


    // --- Determine Table Name Dynamically ---
    // Assumes table names match province names (e.g., "British_Columbia", "Ontario")
    // Replace spaces with underscores if your table names follow that pattern.
    // Adjust this logic if your table naming convention is different.
    const tableName = provinceName.replace(/ /g, '_');

    console.log(`Fetching listings for community "${communityName}" from table "${tableName}"`); // Debugging

    try {
        // --- Fetch listings from the database ---
        // IMPORTANT: Assumes your provincial tables (like British_Columbia)
        // have a column named 'community_name' that matches the community names
        // used in the 'communities' table and passed in the URL.
        const { data: listings, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('community_name', communityName) // Query by community name string
            .order('name', { ascending: true }); // Sort results by name

        if (error) {
            // Provide more specific error feedback
            console.error("Supabase fetch error:", error);
            if (error.code === '42P01') { // Standard PostgreSQL code for "undefined_table"
                 throw new Error(`Database table "${tableName}" not found. Check table naming.`);
            } else {
                 throw new Error(`Failed to fetch listings: ${error.message}`);
            }
        }

        // --- Display Listings ---
        resultsList.innerHTML = ''; // Clear "Loading..." message

        if (!listings || listings.length === 0) {
            resultsList.innerHTML = `<li>No listings found for ${communityName}.</li>`;
             // Update heading if nothing found
             if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory (0 listings)`;
            return;
        }

        // Update heading with count
         if (communityNameElement) communityNameElement.textContent = `${communityName}, ${provinceName} Directory (${listings.length} listings)`;

        listings.forEach(listing => {
            const listItem = document.createElement('li');
            listItem.className = 'directory-entry'; // Use class for styling

            // Use template literal for cleaner HTML structure
            // Ensure your DB column names match: name, phone_number, category, notes
            listItem.innerHTML = `
                <span class="name">${listing.name || 'N/A'}</span>
                <span class="phone">${listing.phone_number ? `<a href="tel:${listing.phone_number}">${listing.phone_number}</a>` : 'N/A'}</span>
                <span class="category">${listing.category || 'General'}</span>
                ${listing.notes ? `<span class="notes">${listing.notes}</span>` : ''}
            `;
            // The 'notes' span is only added if notes exist

            resultsList.appendChild(listItem);
        });

    } catch (fetchError) {
        displayError(fetchError.message);
    }
}

// ======================================================================
// Initialize Search Functionality
// ======================================================================
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');

    if (!searchBox || !resultsList) {
        console.warn("Search box or results list element not found. Search disabled.");
        return;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase().trim();
        const entries = resultsList.querySelectorAll('.directory-entry'); // Target list items by class

        entries.forEach(entry => {
            // Check content of relevant spans within the entry
            const name = entry.querySelector('.name')?.textContent.toLowerCase() || '';
            const phone = entry.querySelector('.phone')?.textContent.toLowerCase() || ''; // Includes 'N/A' if no number
            const category = entry.querySelector('.category')?.textContent.toLowerCase() || '';
            const notes = entry.querySelector('.notes')?.textContent.toLowerCase() || '';

            // Show entry if query matches name, category, phone, or notes
            if (name.includes(query) || category.includes(query) || phone.includes(query) || notes.includes(query)) {
                entry.style.display = ''; // Show matching entries (resetting display)
            } else {
                entry.style.display = 'none'; // Hide non-matching entries
            }
        });
    });
}

// ======================================================================
// Initialize Print Functionality
// ======================================================================
function initializePrint() {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print(); // Trigger browser's print dialog
        });
    } else {
        console.warn("Print button element not found.");
    }
}


// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Ensure Supabase is loaded before proceeding
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayError("Supabase library not loaded. Check script tag in HTML.");
        return;
    }
    fetchAndDisplayListings(); // Load listings when the page loads
    initializeSearch();        // Set up search functionality
    initializePrint();         // Set up print button
});

// --- END OF UPDATED directory.js ---