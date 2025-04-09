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
      // Consider adding phone_number to search if needed
      query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
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
// Render Entries with Category Grouping ( *** phone_number SECTION MODIFIED *** )
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

        // --- Build the Name/Person/Notes Span (No changes here) ---
        let nameDisplayContent = '';
        if (entry.name) {
            const nameSpan = document.createElement('span');
            nameSpan.textContent = entry.name;
            nameDisplayContent += nameSpan.outerHTML;
        } else {
            nameDisplayContent += 'No Name Provided';
        }
        if (entry.contact_person) {
            const personSpan = document.createElement('span');
            personSpan.textContent = ` (${entry.contact_person})`;
            nameDisplayContent += personSpan.outerHTML;
        }
        if (entry.notes) {
            const notesSpan = document.createElement('i');
            notesSpan.textContent = ` - ${entry.notes}`;
            nameDisplayContent += notesSpan.outerHTML;
        }
        // --- End Building the Name/Person/Notes Span ---


        // --- Build the Phone/Contact Info Span ( *** USING phone_number *** ) ---
        let contactDisplay = '';
        // *** Use entry.phone_number ***
        if (entry.phone_number) {
            const phoneLink = document.createElement('a');
            // *** Use entry.phone_number ***
            phoneLink.textContent = entry.phone_number;
            // *** Use entry.phone_number ***
             if (/\d/.test(entry.phone_number)) {
                 // *** Use entry.phone_number ***
                const telLink = entry.phone_number.replace(/[^0-9+]/g, '');
                phoneLink.href = `tel:${telLink}`;
             }
             contactDisplay = phoneLink.outerHTML;
        } else {
            // Placeholder if desired
            // contactDisplay = 'No phone number';
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
// Search Functionality (No changes here)
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