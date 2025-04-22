// --- suggest_change.js (Refactored Element Check) ---

// Uses global supabaseClient from common.js

// Global variables for DOM elements
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput;

// Global variables for context
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

// Helper function to display messages
function showMessage(msg, type = 'info') {
    // Ensure messageDiv is found before trying to use it
    if (!messageDiv) {
        messageDiv = document.getElementById('form-message'); // Try to find it again
        if (!messageDiv) {
             console.error("Cannot show message, messageDiv element not found.", {msg, type});
             return;
        }
    }
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`;
     messageDiv.style.display = msg ? 'block' : 'none';
}


// Function to initialize DOM elements and perform checks
function initializeAndCheckDOMElements() {
    console.log("[DEBUG] Entering initializeAndCheckDOMElements");
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message'); // Find messageDiv first
    submitButton = document.getElementById('submit-button');
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

    // *** Perform the check INSIDE this function ***
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", {
            formFound: !!form, // Check if element was found (true/false)
            messageDivFound: !!messageDiv,
            submitButtonFound: !!submitButton,
            categorySelectFound: !!categorySelect,
            targetListingSelectFound: !!targetListingSelect
        });
        // Try showing message, using the function which now also checks messageDiv
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false; // Indicate failure
    }

    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true; // Indicate success
}


// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    if (!initializeAndCheckDOMElements()) {
        // Stop if elements are missing (error already logged/shown)
        return;
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
        if (contextHeader) { contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`; }
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
    await populateCategoryDropdown();
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown();
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange();
    } else { console.warn("Change type radios not found."); }
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    } else { console.warn("Category select dropdown not found."); }
    console.log("[DEBUG] Event listeners set up.");

    // 7. Form Submission Handler
    if(form) {
         form.addEventListener('submit', async (event) => { /* ... form submission logic unchanged ... */ });
         console.log("[DEBUG] Form submit listener attached.");
    } else { console.error("Cannot attach submit listener, form not found earlier!");}


}); // End DOMContentLoaded


// Populate Category Dropdown (unchanged from previous correct version)
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) { /* ... */ return; }
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); /* ... */
    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient.from('categories').select('category_name').order('category_name', { ascending: true });
        if (error) { throw error; } /* Simplified error handling */
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);
        categorySelect.innerHTML = ''; // Clear previous
        const placeholderOption = document.createElement('option'); /* ... */ categorySelect.appendChild(placeholderOption);
        if (categoryData) { categoryData.forEach(cat => { /* ... add option ... */ }); }
        if (otherOption) { categorySelect.appendChild(otherOption); } else { /* ... add fallback ... */ }
        console.log("[DEBUG] Category dropdown populated.");
    } catch (error) { console.error("Error populating categories dropdown:", error); /* ... */ }
}

// Populate Listings Dropdown (unchanged from previous correct version)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) { /* ... */ return; }
    targetListingSelect.innerHTML = '<option value="">Loading listings...</option>';
    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);
        targetListingSelect.innerHTML = ''; // Clear previous
        const placeholder = document.createElement('option'); /* ... */ targetListingSelect.appendChild(placeholder);
        if (listingData && listingData.length > 0) { listingData.forEach(listing => { /* ... add option ... */ }); console.log("[DEBUG] Listings dropdown populated."); }
        else { placeholder.textContent = '-- No Listings Found --'; }
    } catch (error) { console.error("Error populating listings dropdown:", error); /* ... */ }
}

// Handle Category Dropdown Change (unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---