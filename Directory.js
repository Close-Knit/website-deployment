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
        resultsList.innerHTML = `<li>${message}</li>`;
    }
}

// ======================================================================
// Fetch and Display Listings for a Specific Community
// ======================================================================
async function fetchAndDisplayListings() {
    // Get query parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const communityId = urlParams.get("community_id");

    if (!communityId) {
        displayError("No community selected. Please go back and select a community.");
        return;
    }

    // Fetch listings from the database
    const { data: listings, error } = await supabaseClient
        .from('British_Columbia') // Adjust table name as needed for other provinces
        .select('*')
        .eq('community_id', communityId);

    if (error) {
        displayError("Failed to load directory. Please try again later.");
        return;
    }

    // Display listings in the results container
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = ''; // Clear existing content

    if (listings.length === 0) {
        resultsList.innerHTML = `<li>No listings found for this community.</li>`;
        return;
    }

    listings.forEach(listing => {
        const listItem = document.createElement('li');
        listItem.className = 'directory-entry';

        listItem.innerHTML = `
            <span class="name">${listing.name}</span>
            <span class="phone"><a href="tel:${listing.phone_number}">${listing.phone_number}</a></span>
            <span class="category">${listing.category || 'General'}</span>
            <span class="notes">${listing.notes || ''}</span>
        `;

        resultsList.appendChild(listItem);
    });
}

// ======================================================================
// Initialize Search Functionality
// ======================================================================
function initializeSearch() {
    const searchBox = document.getElementById('searchBox');
    const resultsList = document.getElementById('results');

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase();
        const entries = resultsList.querySelectorAll('.directory-entry');

        entries.forEach(entry => {
            const name = entry.querySelector('.name').textContent.toLowerCase();
            const phone = entry.querySelector('.phone').textContent.toLowerCase();
            const category = entry.querySelector('.category').textContent.toLowerCase();

            if (name.includes(query) || phone.includes(query) || category.includes(query)) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    });
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayListings(); // Load listings when the page loads
    initializeSearch(); // Set up search functionality
});
