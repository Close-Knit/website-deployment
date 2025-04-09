// ======================================================================
// Initialize Supabase (No changes here)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages (No changes here)
// ======================================================================
function displayError(message) {
  console.error("Directory Error:", message);
  const resultsList = document.getElementById('results');
   if (resultsList) {
      resultsList.innerHTML = `<li style="color: red; font-weight: bold;">${message}</li>`;
   }
}

// ======================================================================
// Fetch Data from Supabase (No changes here)
// ======================================================================
async function fetchTableData(tableName, searchTerm = null) {
  // displayError(''); // Or handle errors differently

  let query = supabaseClient
    .from(tableName)
    .select('*');

  if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      // Add other searchable fields if desired, e.g.,
      // query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
  }

  query = query.order('category', { ascending: true, nullsFirst: false })
               .order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching/searching ${tableName}:`, error);
    displayError(`Error fetching directory data. Details in console (F12).`);
    return [];
  }

  return data;
}

// ======================================================================
// Render Entries with Category Grouping ( *** MODIFIED SECTION *** )
// ======================================================================
function renderGroupedEntries(entries) {
    const resultsList = document.getElementById('results');
    if (!resultsList) {
        console.error("Results container element (#results) not found.");
        return;
    }

    if (!entries || entries.length === 0) {
      resultsList.innerHTML = '<li>No matching entries found.</li>';
      return;
    }

    let htmlContent = '';
    let currentCategory = null;

    entries.forEach(entry => {
        const entryCategory = entry.category || 'Uncategorized';

        if (entryCategory !== currentCategory) {
            currentCategory = entryCategory;
            htmlContent += `<li class="category-heading">${currentCategory}</li>`;
        }

        // --- Start Building the Name/Person/Notes Span ---
        let nameDisplayContent = '';
        if (entry.name) {
            // Use textContent to prevent potential HTML injection if data isn't sanitized
            const nameSpan = document.createElement('span');
            nameSpan.textContent = entry.name;
            nameDisplayContent += nameSpan.outerHTML; // Add the main name (bolded by CSS)
        } else {
            nameDisplayContent += 'No Name Provided'; // Placeholder
        }

        // Add contact_person if available (e.g., in parentheses)
        if (entry.contact_person) {
            const personSpan = document.createElement('span');
            personSpan.textContent = ` (${entry.contact_person})`; // Add space and parentheses
            nameDisplayContent += personSpan.outerHTML;
        }

        // Add notes if available (e.g., italicized with a separator)
        if (entry.notes) {
            const notesSpan = document.createElement('i'); // Use <i> for italics
            notesSpan.textContent = ` - ${entry.notes}`; // Add separator and notes
            nameDisplayContent += notesSpan.outerHTML;
        }
        // --- End Building the Name/Person/Notes Span ---


        // --- Build the Phone/Contact Info Span (as before) ---
        let contactDisplay = ''; // Default empty
        if (entry.contact_info) {
            const phoneLink = document.createElement('a');
            phoneLink.textContent = entry.contact_info;
            // Basic check for digits to create tel: link
             if (/\d/.test(entry.contact_info)) {
                const telLink = entry.contact_info.replace(/[^0-9+]/g, '');
                phoneLink.href = `tel:${telLink}`;
             }
             contactDisplay = phoneLink.outerHTML;
        } else {
            // You might want a placeholder if no contact_info, or just leave it blank
            // contactDisplay = 'No contact info';
        }
        // --- End Building the Phone/Contact Info Span ---

        // Add the complete list item
        htmlContent += `
            <li class="directory-entry">
                <span class="name">${nameDisplayContent}</span>
                <span class="phone">${contactDisplay}</span>
            </li>
        `;
    });

    resultsList.innerHTML = htmlContent;
}


// ======================================================================
// Initial Load / Display All Listings (No changes here)
// ======================================================================
async function displayAllListings() {
  const entries = await fetchTableData('Listings');
  renderGroupedEntries(entries);
}

// ======================================================================
// Search Functionality (No changes here, but consider adding notes/person to search)
// ======================================================================
const searchBox = document.getElementById('searchBox');
if (searchBox) {
  searchBox.addEventListener('input', async (event) => {
    const searchTerm = event.target.value.trim().toLowerCase();
    const filteredEntries = await fetchTableData('Listings', searchTerm);
    renderGroupedEntries(filteredEntries);
  });
} else {
    console.error("Search box element not found.");
}


// ======================================================================
// Initial Load Trigger (No changes here)
// ======================================================================
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('results')) {
    displayAllListings();
  } else {
    console.error("Results container element not found on initial load.");
  }
});