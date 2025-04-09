// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q'; // Replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Fetch Directory Data from Supabase
// ======================================================================
async function fetchDirectoryData() {
  const { data, error } = await supabase
    .from('directory')
    .select('id, name, category, contact_info')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    displayError('Failed to load directory. Please try again later.');
    return [];
  }

  return data;
}

// ======================================================================
// Display Directory Entries
// ======================================================================
const resultsList = document.getElementById('results');
const errorMessage = document.getElementById('error-message');

function displayError(message) {
  errorMessage.textContent = message;
}

async function displayDirectory() {
  const entries = await fetchDirectoryData();

  if (entries.length === 0) {
    resultsList.innerHTML = '<p>No entries found.</p>';
    return;
  }

  resultsList.innerHTML = entries
    .map(
      (entry) => `
      <div class="entry">
        <h3>${entry.name}</h3>
        <p>Category: ${entry.category}</p>
        <p>Contact Info: ${entry.contact_info}</p>
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

  const { data, error } = await supabase
    .from('directory')
    .select()
    .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

  if (error) {
    console.error('Error searching data:', error);
    displayError('Error searching directory.');
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
        <p>Category: ${entry.category}</p>
        <p>Contact Info: ${entry.contact_info}</p>
      </div>
    `
    )
    .join('');
});

// ======================================================================
// Initial Load
// ======================================================================
window.addEventListener('DOMContentLoaded', displayDirectory);
