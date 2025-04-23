// --- suggest_change.js (Fix Category Dropdown using innerHTML method) ---

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

function showMessage(msg, type = 'info') { /* ... */ }

// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");
    if (!initializeAndCheckDOMElements()) { return; }
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }
    console.log("[DEBUG] URL parameters found.");
    try { /* ... Set UI context ... */ } catch (e) { /* ... */ return; }
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown();
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown();
    console.log("[DEBUG] Dropdown population finished.");
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    if (changeTypeRadios && changeTypeRadios.length > 0) { /* ... setup listeners ... */ } else { console.warn("Change type radios not found."); }
    if (categorySelect) { /* ... setup listener ... */ } else { console.warn("Category select not found."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");
    if(form) { form.addEventListener('submit', async (event) => { /* ... form submission logic ... */ }); } else { console.error("Form not found!");}
});


// ======================================================================
// Populate Category Dropdown (Reverted to innerHTML update method)
// ======================================================================
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function (innerHTML method).");
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }

    // Define the HTML for the "Other..." option consistently
    const otherOptionHTML = '<option value="_OTHER_">Other...</option>';
    // Set initial loading state
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>' + otherOptionHTML;

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; } // Let catch block handle
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // *** Build the COMPLETE options string ***
        let optionsHTML = '<option value="" disabled selected>-- Select Category --</option>'; // Start with placeholder

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

        // *** Replace innerHTML completely ONCE ***
        categorySelect.innerHTML = optionsHTML + otherOptionHTML; // Placeholder + Categories + Other
        // No need to manually set selectedIndex if placeholder has 'selected' attribute initially
        console.log("[DEBUG] Category dropdown populated using innerHTML.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        // Set error state but still include Other... option
        categorySelect.innerHTML = '<option value="">Error loading</option>' + otherOptionHTML;
    }
} // End populateCategoryDropdown


// Populate Listings Dropdown (Keep working version)
async function populateListingsDropdown() { /* ... unchanged ... */ }

// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---