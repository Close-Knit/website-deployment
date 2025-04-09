// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q'; // Replace with your anon key

// Ensure the Supabase client library is loaded (from index.html) before this runs
// The library creates a global 'supabase' object
const { createClient } = supabase; // Destructure the function from the global object
const supabaseClient = createClient(supabaseUrl, supabaseKey); // Create the client instance

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
  }
  // Clear results if there's an error
  const resultsList = document.getElementById('results');
  if (resultsList) {
    resultsList.innerHTML = '';
  }
}

// ======================================================================
// Fetch Data from Supabase
// ======================================================================
async function fetchTableData(tableName) {
  // Clear previous errors
  displayError('');

  // Use the initialized supabaseClient
  const { data, error } = await supabaseClient
    .from(tableName)
    .select('*') // Adjust columns as needed
    .order('name', { ascending: true });

  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    displayError(`Error fetching directory data. Please check console (F12) for details.`);
    return []; // Return empty array on error
  }

  return data;
}

// ======================================================================
// Render Entries (Generic function)
// ======================================================================
function renderEntries(entries) {
    const resultsList = document.getElementById('results');
    if (!resultsList) return; // Exit if results container doesn't exist

    if (!entries || entries.length === 0) {
      resultsList.innerHTML = '<p>No matching entries found.</p>';
      return;
    }

    // Using Listings structure for rendering as an example
    resultsList.innerHTML = entries
    .map(
      (entry) => `
      <div class="entry">
        <h3>${entry.name || 'No Name'}</h3>
        <p>Category: ${entry.category || 'No category available'}</p>
        <p>Contact Info: ${entry.contact_info || 'No contact info available'}</p>
        ${entry.description ? `<p>Description: ${entry.description}</p>` : ''}  </div>
    `
    )
    .join('');
}


// ======================================================================
// Display Listings Data (or initial load)
// ======================================================================
async function displayListings() {
  const entries = await fetchTableData('Listings');
  renderEntries(entries); // Use the render function
}

// ======================================================================
// Display Communities Data (If needed later)
// ======================================================================
async function displayCommunities() {
  const entries = await fetchTableData('Communities');
  renderEntries(entries); // Use the render function (adjust mapping if needed)
}

// ======================================================================
// Search Functionality
// ======================================================================
const searchBox = document.getElementById('searchBox');
if (searchBox) {
  searchBox.addEventListener('input', async (event) => {
    const searchTerm = event.target.value.trim().toLowerCase(); // Trim whitespace
    const tableName = 'Listings'; // Or 'Communities' depending on what you search

    // Clear previous errors
    displayError('');

    // If search term is empty, display all listings again
    if (searchTerm === '') {
      displayListings();
      return;
    }

    // Use the initialized supabaseClient
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      // Ensure your columns exist for the ILIKE search
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`); // Case-insensitive search

    if (error) {
      console.error(`Error searching ${tableName}:`, error);
      displayError(`Error searching directory. Please check console (F12) for details.`);
      renderEntries([]); // Clear results on error
      return;
    }

    renderEntries(data); // Render the filtered data
  });
} else {
    console.error("Search box element not found.");
}


// ======================================================================
// Initial Load
// ======================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Ensure the results div exists before trying to load data
  if (document.getElementById('results')) {
    // Change to displayCommunities() if you want to show Communities by default
    displayListings();
  } else {
    console.error("Results container element not found on initial load.");
    displayError("Page structure error: Results container missing.");
  }
});