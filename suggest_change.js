// --- suggest_change.js (Targeted Fix for Category Dropdown Display) ---

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

    // Check critical elements
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", { /* ... */ });
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false;
    }
    if (!contextHeader) { console.warn("Context header element (form-context) not found during init."); }
    if (!changeTypeRadios || changeTypeRadios.length === 0) { console.warn("Change type radios not found during initialization."); }

    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true;
}

const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

function showMessage(msg, type = 'info') {
    if (!messageDiv) { messageDiv = document.getElementById('form-message'); if (!messageDiv) { console.error("Cannot show message, messageDiv element not found.", {msg, type}); return; } }
     messageDiv.textContent = msg; messageDiv.className = `form-message ${type}`; messageDiv.style.display = msg ? 'block' : 'none';
}

// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");
    if (!initializeAndCheckDOMElements()) { return; }
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }
    console.log("[DEBUG] URL parameters found.");
    try { /* ... Set UI context ... */
        const decodedComm = decodeURIComponent(communityNameFromUrl); const decodedProv = decodeURIComponent(provinceNameFromUrl);
        if (contextHeader) { contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`; console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`); }
        else { console.error("[DEBUG] contextHeader element was NULL/not found earlier."); }
        /* ... set hidden inputs ... */ currentTableName = decodedProv.replace(/ /g, '_'); console.log("[DEBUG] UI context setup complete.");
    } catch (e) { /* ... */ return; }

    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown(); // Wait for categories
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown(); // Wait for listings
    console.log("[DEBUG] Dropdown population finished.");

    // Setup Listeners
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Re-select
    if (changeTypeRadios && changeTypeRadios.length > 0) { console.log(`[DEBUG] Found ${changeTypeRadios.length} change type radios.`); /* Add listeners */ }
    else { console.warn("Change type radios not found after dropdowns."); }
    if (categorySelect) { /* Add listener */ } else { console.warn("Category select dropdown not found for listener setup."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");

    // Form Submission Handler
    if(form) { form.addEventListener('submit', async (event) => { /* ... form submission logic ... */ }); console.log("[DEBUG] Form submit listener attached.");}
    else { console.error("Cannot attach submit listener, form not found!");}

}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (MODIFIED - Using innerHTML update again)
// ======================================================================
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function (v2 - innerHTML method).");
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }

    const otherOptionRef = categorySelect.querySelector('option[value="_OTHER_"]');
    const otherOptionHTML = otherOptionRef ? otherOptionRef.outerHTML : '<option value="_OTHER_">Other...</option>';
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>' + otherOptionHTML;

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // *** Build options string FIRST ***
        let optionsHTML = '<option value="" disabled>-- Select Category --</option>'; // Start with placeholder (not selected)

        if (categoryData) {
            categoryData.forEach(cat => {
                if (cat.category_name) {
                    const name = cat.category_name;
                    // Escape necessary characters for HTML attribute and text content
                    const escapedValue = name.replace(/"/g, '"').replace(/'/g, ''');
                    const escapedText = name.replace(/</g, '<').replace(/>/g, '>');
                    optionsHTML += `<option value="${escapedValue}">${escapedText}</option>`;
                }
            });
        }

        // *** Replace innerHTML completely ***
        categorySelect.innerHTML = optionsHTML + otherOptionHTML;
        // *** Manually set selectedIndex to 0 to show placeholder ***
        categorySelect.selectedIndex = 0;
        console.log("[DEBUG] Category dropdown populated using innerHTML.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        categorySelect.innerHTML = '<option value="">Error loading</option>' + otherOptionHTML;
    }
} // End populateCategoryDropdown

// Populate Listings Dropdown (Keep refined version)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) { /* ... */ return; }
    targetListingSelect.innerHTML = '<option value="" disabled selected>Loading listings...</option>';
    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);
        let optionsHTML = '';
        if (listingData && listingData.length > 0) {
             listingData.forEach(listing => {
                 if (listing.name) {
                    const escapedValue = listing.name.replace(/"/g, '"').replace(/'/g, ''');
                    const escapedText = listing.name.replace(/</g, '<').replace(/>/g, '>');
                     optionsHTML += `<option value="${escapedValue}">${escapedText}</option>`;
                 }
             });
             targetListingSelect.innerHTML = '<option value="" selected>-- Select Listing --</option>' + optionsHTML;
             console.log("[DEBUG] Listings dropdown populated.");
        } else {
            targetListingSelect.innerHTML = '<option value="" selected>-- No Listings Found --</option>';
        }
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
} // End populateListingsDropdown


// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---