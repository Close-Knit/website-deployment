// --- suggest_change.js (Refined Category Dropdown Update) ---

// Uses global supabaseClient from common.js

let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput;

// Function to initialize DOM elements and perform checks
function initializeAndCheckDOMElements() { /* ... unchanged ... */ }

const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

function showMessage(msg, type = 'info') { /* ... unchanged ... */ }

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
    if(form) { form.addEventListener('submit', async (event) => { /* ... */ }); } else { console.error("Form not found!");}
});

// ======================================================================
// Populate Category Dropdown (Refined Update Method)
// ======================================================================
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }

    // Preserve the "Other..." option if it exists in the HTML initially
    const otherOptionRef = categorySelect.querySelector('option[value="_OTHER_"]');
    const otherOptionHTML = otherOptionRef ? otherOptionRef.outerHTML : '<option value="_OTHER_">Other...</option>'; // Fallback

    // Set loading state - Only Placeholder + Other
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>' + otherOptionHTML;

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // *** Build options string FIRST ***
        let optionsHTML = '<option value="" disabled selected>-- Select Category --</option>'; // Start with placeholder

        if (categoryData) {
            categoryData.forEach(cat => {
                if (cat.category_name) {
                    const name = cat.category_name;
                    const escapedValue = name.replace(/"/g, '"');
                    const escapedText = name.replace(/</g, '<').replace(/>/g, '>');
                    optionsHTML += `<option value="${escapedValue}">${escapedText}</option>`;
                }
            });
        }

        // *** Replace innerHTML completely ***
        categorySelect.innerHTML = optionsHTML + otherOptionHTML; // Add placeholder, categories, and Other...
        console.log("[DEBUG] Category dropdown populated.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        // Ensure it doesn't get stuck on "Loading..." on error
        categorySelect.innerHTML = '<option value="">Error loading</option>' + otherOptionHTML;
    }
} // End populateCategoryDropdown


// Populate Listings Dropdown (Unchanged - keep refined version)
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
        if (listingData && listingData.length > 0) { listingData.forEach(listing => { /* ... build optionsHTML ... */ }); targetListingSelect.innerHTML = '<option value="" selected>-- Select Listing --</option>' + optionsHTML; console.log("[DEBUG] Listings dropdown populated."); }
        else { targetListingSelect.innerHTML = '<option value="" selected>-- No Listings Found --</option>'; }
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
} // End populateListingsDropdown


// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() { /* ... */ }

// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
function handleRadioChange() { /* ... */ }

// --- End: suggest_change.js ---