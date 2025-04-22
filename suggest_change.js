// --- suggest_change.js (Adding Debug Logs for Population Functions) ---

// Uses global supabaseClient from common.js

let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput;

function initializeDOMElements() { /* ... unchanged ... */ }

const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

function showMessage(msg, type = 'info') { /* ... unchanged ... */ }

// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => { // <<< Made async
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");
    initializeDOMElements();

    // Check Supabase client first
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("INITIAL CHECK FAILED: Supabase client not available.");
        showMessage('Error: Cannot connect to data service.', 'error');
        if(form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading form (client).";
        return;
    }
    console.log("[DEBUG] Supabase client confirmed available.");

    // Check essential elements
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!");
        if(messageDiv) showMessage('Page Error. Cannot initialize form elements.', 'error');
        return;
    }
    console.log("[DEBUG] Essential form elements found.");

    // Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        console.error("Missing URL parameters.");
        showMessage('Missing community info in URL.', 'error');
        if (form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading context (URL params).";
        return;
    }
    console.log("[DEBUG] URL parameters found:", { communityIdFromUrl, provinceNameFromUrl, communityNameFromUrl });

    // Setup UI - Context Header and hidden inputs
    try {
        const decodedComm = decodeURIComponent(communityNameFromUrl);
        const decodedProv = decodeURIComponent(provinceNameFromUrl);
        if (contextHeader) {
             contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`;
             console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`);
        } else { console.warn("Context header element not found"); }
        if (communityIdInput) communityIdInput.value = communityIdFromUrl;
        if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
        if (communityNameInput) communityNameInput.value = communityNameFromUrl;
        currentTableName = decodedProv.replace(/ /g, '_');
        console.log("[DEBUG] Target Table Name (for listings):", currentTableName);
    } catch (e) {
        console.error("Error setting up UI from URL params:", e);
        showMessage('Error processing page context.', 'error');
        return;
    }

    // --- Populate Dropdowns ---
    // Use await here since the functions are async
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown(); // Wait for categories
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown(); // Wait for listings
    console.log("[DEBUG] Dropdown population finished.");


    // Setup Listeners (unchanged)
    if (changeTypeRadios && changeTypeRadios.length > 0) { /* ... */ }
    if (categorySelect) { /* ... */ }

    // Form Submission Handler (unchanged logic)
    form.addEventListener('submit', async (event) => { /* ... */ });

}); // End DOMContentLoaded


// Populate Category Dropdown
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function."); // Log entry
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
    categorySelect.innerHTML = '<option value="">Loading categories...</option>';
    if (otherOption) { categorySelect.appendChild(otherOption); }

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) {
             console.error("[DEBUG] Error fetching categories:", error);
             throw new Error(`Fetch categories error: ${error.message}`);
        }
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // Clear loading message, keep placeholder/Other
        categorySelect.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = ""; placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; placeholderOption.selected = true;
        categorySelect.appendChild(placeholderOption);

        // Add fetched categories
        if (categoryData && categoryData.length > 0) {
            categoryData.forEach(cat => { /* ... add option ... */ });
        }

        // Re-add "Other..." option
        if (otherOption) { categorySelect.appendChild(otherOption); }
        else { /* ... add fallback ... */ }
        console.log("[DEBUG] Category dropdown populated.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>';
        if (otherOption) categorySelect.appendChild(otherOption);
    }
} // End populateCategoryDropdown

// Populate Listings Dropdown
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function."); // Log entry
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) {
         console.warn("Cannot populate listings: Missing element, context, or client.");
         if(targetListingSelect) targetListingSelect.innerHTML = '<option value="">Error</option>';
         return;
    }
     // Set loading state
     targetListingSelect.innerHTML = '<option value="">Loading listings...</option>';

    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        const { data: listingData, error } = await supabaseClient
            .from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });

        if (error) {
            console.error(`[DEBUG] Error fetching listings from ${currentTableName}:`, error);
            throw new Error(`Failed to fetch listing names: ${error.message}`);
        }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);

        // Clear loading message
        targetListingSelect.innerHTML = ''; // Clear completely before adding placeholder
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = '-- Select Listing --';
        // placeholder.disabled = true; // Keep placeholder selectable
        targetListingSelect.appendChild(placeholder);


        if (listingData && listingData.length > 0) {
            listingData.forEach(listing => { /* ... add option ... */ });
            console.log("[DEBUG] Listings dropdown populated.");
        } else {
            console.log("[DEBUG] No existing listings found for this community.");
            placeholder.textContent = '-- No Listings Found --'; // Update placeholder text
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