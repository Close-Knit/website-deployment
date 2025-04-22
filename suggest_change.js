// --- suggest_change.js (Fix Function Call Typo) ---

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
    if (!messageDiv) { messageDiv = document.getElementById('form-message'); if (!messageDiv) { console.error("Cannot show message, messageDiv element not found.", {msg, type}); return; } }
     messageDiv.textContent = msg; messageDiv.className = `form-message ${type}`; messageDiv.style.display = msg ? 'block' : 'none';
}

// *** Function to initialize DOM elements and perform checks ***
// Renamed and includes checks
function initializeAndCheckDOMElements() {
    console.log("[DEBUG] Entering initializeAndCheckDOMElements");
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message');
    submitButton = document.getElementById('submit-button');
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

    // Perform the check INSIDE this function
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", { /* ... */ });
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false; // Indicate failure
    }
    // Check for context header separately as it's needed before dropdowns
    if (!contextHeader) {
         console.warn("Context header element (form-context) not found during init.");
         // Don't necessarily fail, but log it
    }

    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true; // Indicate success
}


// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    // *** CORRECTED FUNCTION NAME HERE ***
    if (!initializeAndCheckDOMElements()) {
        console.error("[CRITICAL] Failed to initialize/find essential DOM elements. Stopping setup.");
        return; // Stop if elements are missing
    }

    // 2. Check Supabase Client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    console.log("[DEBUG] Supabase client confirmed available.");

    // 3. Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }
    console.log("[DEBUG] URL parameters found.");

    // 4. Setup UI - Context Header and hidden inputs
    try {
        const decodedComm = decodeURIComponent(communityNameFromUrl);
        const decodedProv = decodeURIComponent(provinceNameFromUrl);
        if (contextHeader) { // Check if contextHeader was actually found
             console.log("[DEBUG] contextHeader element FOUND. Attempting to set text...");
             contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`;
             console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`);
        } else {
             console.error("[DEBUG] contextHeader element was NULL/not found earlier. Cannot set text.");
        }
        if (communityIdInput) communityIdInput.value = communityIdFromUrl;
        if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
        if (communityNameInput) communityNameInput.value = communityNameFromUrl;
        currentTableName = decodedProv.replace(/ /g, '_');
        console.log("[DEBUG] UI context setup complete.");
    } catch (e) { /* ... error handling ... */ return; }

    // 5. Populate Dropdowns
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown();
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown();
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    if (changeTypeRadios && changeTypeRadios.length > 0) { /* ... */ } else { console.warn("Change type radios not found after dropdowns."); } // Changed to warn
    if (categorySelect) { /* ... */ } else { console.warn("Category select dropdown not found for listener setup."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");

    // 7. Form Submission Handler
    if(form) { form.addEventListener('submit', async (event) => { /* ... form submission logic unchanged ... */ }); }
    else { console.error("Cannot attach submit listener, form not found earlier!");}


}); // End DOMContentLoaded


// Populate Category Dropdown (unchanged)
async function populateCategoryDropdown() { /* ... */ }

// Populate Listings Dropdown (unchanged)
async function populateListingsDropdown() { /* ... */ }

// Handle Category Dropdown Change (unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---