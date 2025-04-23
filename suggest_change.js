// --- suggest_change.js (Reverted to Debug Logging Version - Known Good Structure) ---

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
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Selector verified in HTML
    targetListingGroup = document.getElementById('target-listing-group');
    contextHeader = document.getElementById('form-context'); // ID verified in HTML
    communityIdInput = document.getElementById('community_id');
    provinceNameInput = document.getElementById('province_name');
    communityNameInput = document.getElementById('community_name');
    targetListingSelect = document.getElementById('target_listing_select');
    nameInput = document.getElementById('suggested_name');
    categorySelect = document.getElementById('suggested_category_select'); // ID verified in HTML
    otherCategoryGroup = document.getElementById('other-category-group');
    otherCategoryInput = document.getElementById('suggested_category_other');
    addressInput = document.getElementById('suggested_address');
    emailInput = document.getElementById('suggested_email');

    // Check critical elements needed before dropdown population
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", { formFound: !!form, messageDivFound: !!messageDiv, submitButtonFound: !!submitButton, categorySelectFound: !!categorySelect, targetListingSelectFound: !!targetListingSelect });
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false; // Indicate failure
    }
    if (!contextHeader) { console.warn("Context header element (form-context) not found during init."); }
    if (!changeTypeRadios || changeTypeRadios.length === 0) { console.warn("Change type radios not found during initialization. Check HTML name='change_type'."); }

    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true; // Indicate success
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
document.addEventListener('DOMContentLoaded', async () => { // Keep async
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    if (!initializeAndCheckDOMElements()) {
        console.error("[CRITICAL] Failed to initialize/find essential DOM elements. Stopping setup.");
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
        currentTableName = decodedProv.replace(/ /g, '_'); // Still needed for listings dropdown
        console.log("[DEBUG] Target Table Name (for listings):", currentTableName);
        console.log("[DEBUG] UI context setup complete.");
    } catch (e) {
        console.error("Error setting up UI from URL params:", e);
        showMessage('Error processing page context.', 'error');
        return;
    }

    // 5. Populate Dropdowns (Using original functions from this state)
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown(); // Wait for categories
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown(); // Wait for listings
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Re-select
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        console.log(`[DEBUG] Found ${changeTypeRadios.length} change type radios.`);
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange(); // Initial call
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


// Populate Category Dropdown (Querying categories table - Original working fetch logic)
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>'; // Set loading
    if (otherOption) { categorySelect.appendChild(otherOption); } // Keep other option

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // Preserve placeholder and "Other..." option
        const placeholder = categorySelect.options[0];
        categorySelect.innerHTML = ''; // Clear only loading/previous data
        if (placeholder) categorySelect.appendChild(placeholder); // Add placeholder back
        placeholder.textContent = '-- Select Category --'; // Set correct placeholder text
        placeholder.disabled = false; // Allow selection of placeholder initially if desired, or keep true

        if (categoryData) {
            categoryData.forEach(cat => {
                if (cat.category_name) {
                    const option = document.createElement('option');
                    option.value = cat.category_name;
                    option.textContent = cat.category_name;
                    // Insert before the "Other..." option if it exists
                    if (otherOption) {
                        categorySelect.insertBefore(option, otherOption);
                    } else {
                        categorySelect.appendChild(option);
                    }
                }
            });
        }
        // Ensure "Other..." is last
        if (otherOption && !categorySelect.contains(otherOption)) {
             categorySelect.appendChild(otherOption); // Add if it wasn't re-added
        } else if (!otherOption) {
            // Add fallback if it never existed
            const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther);
        }
        console.log("[DEBUG] Category dropdown populated by appending.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        categorySelect.innerHTML = '<option value="">Error loading</option>';
        // Try to add Other even on error
        if (otherOption) categorySelect.appendChild(otherOption);
        else { const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther); }
    }
}


// Populate Listings Dropdown (Keep previously working version)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) { /* ... */ return; }
    targetListingSelect.innerHTML = '<option value="" disabled selected>Loading listings...</option>';
    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);

        // Use append method for consistency, seems more reliable
        targetListingSelect.innerHTML = ''; // Clear loading
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = '-- Select Listing --';
        targetListingSelect.appendChild(placeholder);

        if (listingData && listingData.length > 0) {
            listingData.forEach(listing => {
                 if (listing.name) {
                     const option = document.createElement('option');
                     option.value = listing.name; // Use name as value
                     option.textContent = listing.name;
                     targetListingSelect.appendChild(option);
                 }
             });
             console.log("[DEBUG] Listings dropdown populated by appending.");
        } else {
            placeholder.textContent = '-- No Listings Found --';
        }
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
}


// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() {
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { otherCategoryGroup.style.display = 'block'; otherCategoryInput.required = true; otherCategoryInput.focus(); }
    else { otherCategoryGroup.style.display = 'none'; otherCategoryInput.required = false; otherCategoryInput.value = ''; }
}

// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
function handleRadioChange() {
    const selectedType = document.querySelector('input[name="change_type"]:checked')?.value;
    if (!targetListingGroup || !targetListingSelect || !nameInput) { console.warn("Missing elements for handleRadioChange."); return; }
    if (selectedType === 'CHANGE' || selectedType === 'DELETE') { targetListingGroup.style.display = 'block'; targetListingSelect.required = true; }
    else { targetListingGroup.style.display = 'none'; targetListingSelect.required = false; targetListingSelect.value = ''; }
    const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
    nameInput.required = isAddOrChange;
}

// --- End: suggest_change.js ---