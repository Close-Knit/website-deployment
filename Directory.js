// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q'; // Replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Fetch Data from Supabase
// ======================================================================
async function fetchTableData(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*') // Adjust columns as needed
    .order('name', { ascending: true });

  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }

  return data;
}

// ======================================================================
// Display Communities Data
// ======================================================================
async function displayCommunities() {
  const entries = await fetchTableData('Communities');
  const resultsList = document.getElementById('results');

  if (entries.length === 0) {
    resultsList.innerHTML = '<p>No communities found.</p>';
    return;
  }

  resultsList.innerHTML = entries
    .map(
      (entry) => `
      <div class="entry">
        <h3>${entry.name}</h3>
        <p>Description: ${entry.description || 'No description available'}</p>
      </div>
    `
    )
    .join('');
}

// ======================================================================
// Display Listings Data
// ======================================================================
async function displayListings() {
  const entries = await fetchTableData('Listings');
  const resultsList = document.getElementById('results');

  if (entries.length === 0) {
    resultsList.innerHTML = '<p>No listings found.</p>';
    return;
  }

  resultsList.innerHTML = entries
    .map(
      (entry) => `
      <div class="entry">
        <h3>${entry.name}</h3>
        <p>Category: ${entry.category || 'No category available'}</p>
        <p>Contact Info: ${entry.contact_info || 'No contact info available'}</p>
      </div>
    `
    )
    .join('');
}

// ======================================================================
// Search Functionality
// ======================================================================
const searchBox = document.getElementById('searchBox');
searchBox.addEventListener('input', async (event) => {
  const searchTerm = event.target.value.toLowerCase();
  const tableName = 'Listings'; // Change to 'Communities' if needed

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

  const resultsList = document.getElementById('results');

  if (error) {
    console.error(`Error searching ${tableName}:`, error);
    resultsList.innerHTML = '<p>Error searching directory.</p>';
    return;
  }

  if (data.length === 0) {
    resultsList.innerHTML = '<p>No matching entries found.</p>';
    return;
  }

  resultsList.innerHTML = data
    .map(
      (entry) => `
      <div class="entry">
        <h3>${entry.name}</h3>
        <p>Category: ${entry.category || 'No category available'}</p>
        <p>Contact Info: ${entry.contact_info || 'No contact info available'}</p>
      </div>
    `
    )
    .join('');
});

// ======================================================================
// Initial Load
// ======================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Change to displayCommunities() if you want to show Communities by default
  displayListings();
});
