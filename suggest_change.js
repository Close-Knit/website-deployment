// --- suggest_change.js (Add Logging for Context Header Update) ---

// ... (Global variables, initializeAndCheckDOMElements, showMessage, etc. - UNCHANGED) ...

// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    if (!initializeAndCheckDOMElements()) { return; } // Check elements first
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; } // Check client
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; } // Check URL params

    // 4. Setup UI - Context Header and hidden inputs
    try {
        const decodedComm = decodeURIComponent(communityNameFromUrl);
        const decodedProv = decodeURIComponent(provinceNameFromUrl);

        // *** ADDED Check and Log ***
        if (contextHeader) {
             console.log("[DEBUG] contextHeader element FOUND. Attempting to set text..."); // Log that we found it
             contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`;
             console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`); // Log success
        } else {
             console.error("[DEBUG] contextHeader element was NULL. Cannot set text."); // Explicitly log if not found
        }
        // *** END Check and Log ***

        if (communityIdInput) communityIdInput.value = communityIdFromUrl;
        if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
        if (communityNameInput) communityNameInput.value = communityNameFromUrl;
        currentTableName = decodedProv.replace(/ /g, '_');
        console.log("[DEBUG] Target Table Name (for listings):", currentTableName);
        console.log("[DEBUG] UI context setup complete.");
    } catch (e) { /* ... error handling ... */ return; }

    // 5. Populate Dropdowns
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown();
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown();
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    /* ... unchanged ... */

    // 7. Form Submission Handler
    /* ... unchanged ... */

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