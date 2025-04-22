// --- suggest_change.js (Reverted to Debug Logging Version) ---

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
    contextHeader = document.getElementById('form-context'); // <<< Check this ID
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
         // Don't necessarily fail, but log it
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
document.addEventListener('DOMContentLoaded', async () => { // <<< Made async previously
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    if (!initializeAndCheckDOMElements()) {
        console.error("[CRITICAL] Failed to initialize/find essential DOM elements. Stopping setup.");
        return; // Stop if elements are missing
    }

    // 2. Check Supabase Client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Suggest Change page cannot function.");
        showMessage('Error: Cannot connect to data service.', 'error');
        if(form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading form (client).";
        return;
    }
    console.log("[DEBUG] Supabase client confirmed available.");

    // 3. Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        console.error("Missing URL parameters.");
        showMessage('Missing community info in URL.', 'error');
        if (form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading context (URL params).";
        return;
    }
    console.log("[DEBUG] URL parameters found.");

    // 4. Setup UI - Context Header and hidden inputs
    try {
        const decodedComm = decodeURIComponent(communityNameFromUrl);
        const decodedProv = decodeURIComponent(provinceNameFromUrl);
        if (contextHeader) { // Check if contextHeader was actually found
             console.log("[DEBUG] contextHeader element FOUND. Attempting to set text..."); // Log that we found it
             contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`;
             console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`); // Log success
        } else {
             console.error("[DEBUG] contextHeader element was NULL/not found earlier. Cannot set text."); // Explicitly log if not found
        }
        if (communityIdInput) communityIdInput.value = communityIdFromUrl;
        if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
        if (communityNameInput) communityNameInput.value = communityNameFromUrl;
        currentTableName = decodedProv.replace(/ /g, '_');
        console.log("[DEBUG] Target Table Name (for listings):", currentTableName);
        console.log("[DEBUG] UI context setup complete.");
    } catch (e) {
        console.error("Error setting up UI from URL params:", e);
        showMessage('Error processing page context.', 'error');
        return;
    }

    // 5. Populate Dropdowns
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown(); // Keep await
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown(); // Keep await
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Re-select here
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        console.log(`[DEBUG] Found ${changeTypeRadios.length} change type radios.`); // Log count
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange();
    } else {
        console.warn("Change type radios not found after dropdowns."); // Changed to warn
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    } else { console.warn("Category select dropdown not found for listener setup."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");

    // 7. Form Submission Handler
    if(form) {
         form.addEventListener('submit', async (event) => { /* ... form submission logic unchanged ... */ });
         console.log("[DEBUG] Form submit listener attached.");
    } else { console.error("Cannot attach submit listener, form not found earlier!");}


}); // End DOMContentLoaded


// Populate Category Dropdown (Querying categories table)
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) { /* ... */ return; }
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>';
    if (otherOption) { categorySelect.appendChild(otherOption); }

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });
        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        categorySelect.innerHTML = ''; // Clear completely BEFORE adding options
        const placeholderOption = document.createElement('option');
        placeholderOption.value = ""; placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; placeholderOption.selected = true;
        categorySelect.appendChild(placeholderOption);

        if (categoryData) { categoryData.forEach(cat => { if (cat.category_name) { /* ... add option ... */ } }); }

        if (otherOption) { categorySelect.appendChild(otherOption); } else { /* ... add fallback ... */ }
        console.log("[DEBUG] Category dropdown populated.");
    } catch (error) { console.error("Error populating categories dropdown:", error); /* ... */ }
}

// Populate Listings Dropdown (Using currentTableName)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) { /* ... */ return; }
    targetListingSelect.innerHTML = '<option value="" disabled selected>Loading listings...</option>';
    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);
        targetListingSelect.innerHTML = '';
        const placeholder = document.createElement('option'); placeholder.value = ""; placeholder.textContent = '-- Select Listing --'; targetListingSelect.appendChild(placeholder);
        if (listingData && listingData.length > 0) { listingData.forEach(listing => { if (listing.name) { /* ... add option ... */ } }); console.log("[DEBUG] Listings dropdown populated."); }
        else { placeholder.textContent = '-- No Listings Found --'; }
    } catch (error) { console.error("Error populating listings dropdown:", error); /* ... */ }
}

// Handle Category Dropdown Change (unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---