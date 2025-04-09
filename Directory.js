// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q'; // Replace with your anon key

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages (Optional - can integrate better later)
// ======================================================================
function displayError(message) {
  // You might want to display errors differently now,
  // maybe above the results list or log to console.
  console.error("Directory Error:", message);
  const resultsList = document.getElementById('results');
   if (resultsList) {
      // Use list item for error message to fit structure
      resultsList.innerHTML = `<li style="color: red; font-weight: bold;">${message}</li>`;
   }
}

// ======================================================================
// Fetch Data from Supabase (Sorted for Grouping)
// ======================================================================
async function fetchTableData(tableName, searchTerm = null) {
  // Clear previous errors (maybe just log now)
  // displayError(''); // Or handle errors differently

  let query = supabaseClient
    .from(tableName)
    .select('*');

  // Apply search filter if searchTerm is provided
  if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
  }

  // Always sort by category first, then by name for consistent grouping
  query = query.order('category', { ascending: true, nullsFirst: false }) // Group null categories last
               .order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching/searching ${tableName}:`, error);
    displayError(`Error fetching directory data. Details in console (F12).`);
    return []; // Return empty array on error
  }

  return data;
}

// ======================================================================
// Render Entries with Category Grouping
// ======================================================================
function renderGroupedEntries(entries) {
    const resultsList = document.getElementById('results');
    if (!resultsList) {
        console.error("Results container element (#results) not found.");
        return;
    }

    if (!entries || entries.length === 0) {
      resultsList.innerHTML = '<li>No matching entries found.</li>'; // Use <li> for consistency
      return;
    }

    let htmlContent = '';
    let currentCategory = null;

    entries.forEach(entry => {
        // Check if category changed (or if it's the first entry)
        // Handle null/empty categories gracefully
        const entryCategory = entry.category || 'Uncategorized'; // Treat null/empty as 'Uncategorized'

        if (entryCategory !== currentCategory) {
            currentCategory = entryCategory;
            // Add category heading list item
            htmlContent += `<li class="category-heading">${currentCategory}</li>`;
        }

        // Add directory entry list item using the correct classes
        // Make phone number clickable if it looks like one (basic check)
        let contactDisplay = entry.contact_info || ''; // Default to empty string if null
        // Simple check if it contains digits - enhance if needed
        if (/\d/.test(contactDisplay)) {
             // Remove non-digits for tel: link, keep original for display
             const telLink = contactDisplay.replace(/[^0-9+]/g, '');
             contactDisplay = `<a href="tel:${telLink}">${contactDisplay}</a>`;
        }

        htmlContent += `
            <li class="directory-entry">
                <span class="name">${entry.name || 'No Name'}</span>
                <span class="phone">${contactDisplay}</span>
            </li>
        `;
    });

    resultsList.innerHTML = htmlContent;
}

// ======================================================================
// Initial Load / Display All Listings
// ======================================================================
async function displayAllListings() {
  const entries = await fetchTableData('Listings'); // Fetch sorted data
  renderGroupedEntries(entries); // Use the grouping render function
}

// ======================================================================
// Search Functionality
// ======================================================================
const searchBox = document.getElementById('searchBox');
if (searchBox) {
  searchBox.addEventListener('input', async (event) => {
    const searchTerm = event.target.value.trim().toLowerCase();

    // Fetch filtered AND sorted data
    const filteredEntries = await fetchTableData('Listings', searchTerm);

    // Render the filtered and grouped results
    renderGroupedEntries(filteredEntries);
  });
} else {
    console.error("Search box element not found.");
}


// ======================================================================
// Initial Load Trigger
// ======================================================================
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('results')) {
    displayAllListings(); // Load initial grouped list
  } else {
    console.error("Results container element not found on initial load.");
    // displayError might not work if #results isn't there yet
  }
});