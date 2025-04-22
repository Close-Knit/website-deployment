// --- suggest_change.js (Refine Dropdown Population & Check Radio Query) ---

// Uses global supabaseClient from common.js

let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput;

// Function to initialize DOM elements and perform checks
function initializeAndCheckDOMElements() {
    console.log("[DEBUG] Entering initializeAndCheckDOMElements");
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message');
    submitButton = document.getElementById('submit-button');
    // *** Verify this selector is correct for your HTML ***
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    targetListingGroup = document.getElementById('target-listing-group');
    contextHeader = document.getElementById('form-context');
    communityIdInput = document.getElementById('community_id');
    provinceNameInput = document.getElementById('province_name');
    communityNameInput = document.getElementById('community_name');
    targetListingSelect = document.getElementById('target_listing_select');
    nameInput = document.getElementById('suggested_name');
    categorySelect = document.getElementById('suggested_category_select');
    otherCategoryGroup = document.getElementById('other-category-group');
    otherCategoryInput = document.getElementById('suggested_category_other');
    addressInput = document.getElementById('suggested_address');
    emailInput = document.getElementById('suggested_email');

    // Check critical elements needed before dropdown population
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", { /* ... */ });
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false; // Indicate failure
    }
    // Check specifically for radios needed later for listeners
    if (!changeTypeRadios || changeTypeRadios.length === 0) {
         console.warn("Change type radios not found during initialization. Check HTML name='change_type'.");
         // Don't return false yet, let dropdowns try to populate
    }


    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true; // Indicate success
}

const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

function showMessage(msg, type = 'info') { /* ... unchanged ... */ }

// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    if (!initializeAndCheckDOMElements()) { return; }

    // 2. Check Supabase Client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    console.log("[DEBUG] Supabase client confirmed available.");

    // 3. Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }
    console.log("[DEBUG] URL parameters found.");

    // 4. Setup UI
    try { /* ... Set context header, hidden inputs, currentTableName ... */ } catch (e) { /* ... */ return; }

    // 5. Populate Dropdowns
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown();
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown();
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    // Re-check for radios here, as DOM is fully loaded
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Try selecting again
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        console.log(`[DEBUG] Found ${changeTypeRadios.length} change type radios.`);
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange(); // Initial call
    } else {
        console.error("Change type radios DEFINITELY not found after DOM ready. Check HTML name attribute.");
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    } else { console.warn("Category select dropdown not found for listener setup."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");

    // 7. Form Submission Handler
    if(form) { form.addEventListener('submit', async (event) => { /* ... form submission logic unchanged ... */ }); }
    else { console.error("Cannot attach submit listener, form not found!"); }

}); // End DOMContentLoaded


// Populate Category Dropdown (Refined Placeholder/Loading Handling)
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) { /* ... */ return; }

    const otherOptionHTML = '<option value="_OTHER_">Other...</option>'; // Store HTML for Other
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>' + otherOptionHTML; // Set loading state

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // *** Build options string FIRST, then update innerHTML ONCE ***
        let optionsHTML = '<option value="" disabled selected>-- Select Category --</option>'; // Start with placeholder

        if (categoryData) {
            categoryData.forEach(cat => {
                if (cat.category_name) {
                    const name = cat.category_name;
                    // Basic escaping for HTML attribute and text content
                    const escapedValue = name.replace(/"/g, '"');
                    const escapedText = name.replace(/</g, '<').replace(/>/g, '>');
                    optionsHTML += `<option value="${escapedValue}">${escapedText}</option>`;
                }
            });
        }

        categorySelect.innerHTML = optionsHTML + otherOptionHTML; // Add placeholder, categories, and Other...
        console.log("[DEBUG] Category dropdown populated.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        categorySelect.innerHTML = '<option value="">Error loading</option>' + otherOptionHTML; // Show error but keep Other...
    }
} // End populateCategoryDropdown

// Populate Listings Dropdown (Refined Placeholder/Loading)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) { /* ... */ return; }
    targetListingSelect.innerHTML = '<option value="" disabled selected>Loading listings...</option>'; // Set loading state

    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient
            .from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);

        // *** Build options string FIRST ***
        let optionsHTML = '';
        if (listingData && listingData.length > 0) {
            listingData.forEach(listing => {
                 if (listing.name) {
                    const escapedValue = listing.name.replace(/"/g, '"');
                    const escapedText = listing.name.replace(/</g, '<').replace(/>/g, '>');
                     optionsHTML += `<option value="${escapedValue}">${escapedText}</option>`;
                 }
             });
             // Set placeholder now that we know there are listings
             targetListingSelect.innerHTML = '<option value="" selected>-- Select Listing --</option>' + optionsHTML;
             console.log("[DEBUG] Listings dropdown populated.");
        } else {
            console.log("[DEBUG] No existing listings found for this community.");
            targetListingSelect.innerHTML = '<option value="" selected>-- No Listings Found --</option>'; // Update placeholder
        }
    } catch (error) {
        console.error("Error during populateListingsDropdown execution:", error);
        targetListingSelect.innerHTML = '<option value="">Error loading listings</option>';
    }
} // End populateListingsDropdown

// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---