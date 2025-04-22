// --- suggest_change.js (Query Central Categories Table) ---

// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Get DOM Elements - unchanged
// ======================================================================
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput;
function initializeDOMElements() { /* ... unchanged ... */ }

// ======================================================================
// Get Context from URL Parameters - unchanged
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = ''; // Still needed for populateListingsDropdown

// ======================================================================
// Helper Function to Display Messages - unchanged
// ======================================================================
function showMessage(msg, type = 'info') { /* ... unchanged ... */ }

// ======================================================================
// Initial Page Setup (on DOMContentLoaded) - unchanged
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");
    initializeDOMElements();

    // Check Supabase client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... error handling ... */ return; }
    console.log("Suggest_change.js using supabaseClient initialized in common.js");

    // Check elements
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) { /* ... */ return; }
    // Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }

    // Setup UI (sets currentTableName)
    if (contextHeader) { /* ... */ } if (communityIdInput) { /* ... */ } if (provinceNameInput) { /* ... */ } if (communityNameInput) { /* ... */ }
    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_'); // Keep for listings dropdown
    console.log("[DEBUG] Target Table Name (for listings):", currentTableName);

    // Populate Dropdowns (category dropdown logic is now updated below)
    populateCategoryDropdown();
    populateListingsDropdown(); // This still needs currentTableName

    // Setup Listeners (unchanged)
    if (changeTypeRadios) { /* ... */ }
    if (categorySelect) { /* ... */ }

    // Form Submission Handler (unchanged logic)
    form.addEventListener('submit', async (event) => { /* ... unchanged ... */ });

}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (MODIFIED TO USE categories TABLE)
// ======================================================================
async function populateCategoryDropdown() {
    // Check for required elements and client
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing category select element or Supabase client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }
    // Clear existing options except "Other..." if necessary, and set loading state
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); // Preserve Other option
    categorySelect.innerHTML = '<option value="">Loading categories...</option>'; // Set loading text
     if (otherOption) {
        categorySelect.appendChild(otherOption); // Re-add Other option immediately
    }

    console.log("[DEBUG] Starting category fetch from 'categories' table.");
    try {
        // *** CHANGE HERE: Query the central 'categories' table ***
        const { data: categoryData, error } = await supabaseClient
            .from('categories') // Query the new table
            .select('category_name') // Select the column with the names
            .order('category_name', { ascending: true }); // Order alphabetically

        if (error) { throw new Error(`Fetch categories error: ${error.message}`); }

        // Clear loading message, keep placeholder/Other
        categorySelect.innerHTML = '';

        // Add placeholder
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        categorySelect.appendChild(placeholderOption);

        // Add fetched categories
        if (categoryData && categoryData.length > 0) {
            console.log("[DEBUG] Fetched categories:", categoryData.map(c => c.category_name));
            categoryData.forEach(cat => {
                if (cat.category_name) { // Ensure name exists
                    const option = document.createElement('option');
                    option.value = cat.category_name; // Use the name as the value
                    option.textContent = cat.category_name; // Use the name as the display text
                    categorySelect.appendChild(option);
                }
            });
        } else {
            console.log("[DEBUG] No categories found in the 'categories' table.");
        }

        // Ensure "Other..." option is present at the end
        if (otherOption) {
            categorySelect.appendChild(otherOption); // Add the preserved one back
        } else {
            console.warn("Original 'Other...' option not found, creating fallback.");
            const fallbackOther = document.createElement('option');
            fallbackOther.value = "_OTHER_";
            fallbackOther.textContent = "Other...";
            categorySelect.appendChild(fallbackOther);
        }
    } catch (error) {
        console.error("Error populating categories dropdown:", error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>'; // Show error in dropdown
         if (otherOption) categorySelect.appendChild(otherOption); // Still try to add Other
    }
} // End populateCategoryDropdown

// ======================================================================
// Populate Listings Dropdown (Uses Global supabaseClient implicitly) - unchanged
// ======================================================================
async function populateListingsDropdown() { /* ... unchanged ... */ }

// ======================================================================
// Handle Category Dropdown Change (Uses Globals) - unchanged
// ======================================================================
function handleCategoryChange() { /* ... unchanged ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Uses Globals) - unchanged
// ======================================================================
function handleRadioChange() { /* ... unchanged ... */ }

// --- End: suggest_change.js ---