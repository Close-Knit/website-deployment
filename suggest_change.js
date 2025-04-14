// --- Start: suggest_change.js (Fix Category Dropdown ONLY) ---

// ======================================================================
// Initialize Supabase (Unchanged)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Unchanged)
// ======================================================================
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader, 
    communityIdInput, provinceNameInput, communityNameInput, 
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput, 
    addressInput, emailInput; 

function initializeDOMElements() { /* ... (Unchanged) ... */ }

// ======================================================================
// Get Context from URL Parameters (Unchanged)
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid'); 
const provinceNameFromUrl = urlParams.get('prov'); 
const communityNameFromUrl = urlParams.get('comm'); 
let currentTableName = ''; 

// ======================================================================
// Initial Page Setup (on DOMContentLoaded) (Unchanged)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => { /* ... (Unchanged) ... */ }); 

// ======================================================================
// Populate Category Dropdown (REVISED LOGIC)
// ======================================================================
async function populateCategoryDropdown() { 
    // Uses global categorySelect, currentTableName, communityIdFromUrl
    const loadingOption = categorySelect ? categorySelect.querySelector('option[value=""]') : null; // Find initial loading option

    if (!categorySelect || !currentTableName || !communityIdFromUrl) {
         console.error("[DEBUG] Missing required elements/data for category population");
         if (loadingOption) loadingOption.textContent = '-- Cannot Load Categories --';
        return; 
    }

    console.log(`[DEBUG] Starting category fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 

    try {
        // Fetch categories (Same query)
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityIdFromUrl) 
            .not('category', 'is', null); 

        if (error) { throw new Error(`Failed to fetch categories: ${error.message}`); } // Error will be caught below

        console.log("[DEBUG] Raw category data fetched:", categoryData); 

        // Process categories (Same logic)
        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 

        console.log("[DEBUG] Processed unique categories:", categories); 

        // --- Start: Reverted Option Handling Logic ---
        // Find the "Other..." option BEFORE clearing
        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
        
        // Clear existing options dynamically added previously, keep placeholder and Other
        while (categorySelect.options.length > 0) {
             // Keep placeholder if it's the first one, keep Other if it's the last one
             if (categorySelect.options[0].value === "" || (otherOption && categorySelect.options[0] === otherOption)) {
                 if (categorySelect.options.length <= (otherOption ? 2 : 1) ) break; // Stop if only placeholder and/or Other remain
                 // Remove the option *after* the placeholder if Other isn't present or *after* Other if it is
                 const removeIndex = (otherOption && categorySelect.options[1] === otherOption) ? 2 : 1;
                 if (categorySelect.options[removeIndex]) {
                     categorySelect.remove(removeIndex);
                 } else {
                      break; // Should not happen, safety break
                 }
             } else {
                 categorySelect.remove(0); // Remove the first option if it's not placeholder/Other
             }
        }

        // Set placeholder text correctly
         if (loadingOption) {
            loadingOption.textContent = "-- Select Category --";
            loadingOption.disabled = true;
            loadingOption.selected = true;
        } else { // Add placeholder if missing (shouldn't happen often)
             const placeholder = document.createElement('option');
             placeholder.value = ""; placeholder.textContent = "-- Select Category --";
             placeholder.disabled = true; placeholder.selected = true;
             categorySelect.insertBefore(placeholder, categorySelect.firstChild);
        }


        // Add fetched categories as options before the "Other" option
        const insertBeforeElement = otherOption || null; // Insert before Other, or null to append if Other missing
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.insertBefore(option, insertBeforeElement); // Insert before 'Other...' or at end
        });
        // --- End: Reverted Option Handling Logic ---

        console.log("[DEBUG] Category dropdown populated.");

    } catch (error) {
        // *** Enhanced Error Logging ***
        console.error("[CRITICAL] Error populating categories dropdown:", error); 
        // Update placeholder text on error
         if (loadingOption) {
            loadingOption.textContent = 'Error loading categories';
            loadingOption.disabled = false; // Allow selection maybe? Or keep disabled
        } else { // Add placeholder if list was cleared or didn't exist
             categorySelect.innerHTML = '<option value="">Error loading categories</option>';
        }
        // Display error to user as well
        showMessage(`Failed to load categories: ${error.message}`, 'error'); // Use showMessage helper
    }
}

// ======================================================================
// Populate Listings Dropdown (Unchanged from previous working version)
// ======================================================================
async function populateListingsDropdown() { /* ... (Keep definition from version where listing dropdown worked) ... */ }

// ======================================================================
// Handle Category Dropdown Change (Unchanged)
// ======================================================================
function handleCategoryChange() { /* ... (Keep definition from version where category dropdown worked) ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Unchanged)
// ======================================================================
function handleRadioChange() { /* ... (Keep definition from version where radio buttons worked) ... */ }

// ======================================================================
// Helper Function to Display Messages (Unchanged)
// ======================================================================
function showMessage(msg, type = 'info') { /* ... (Keep definition from version where messages worked) ... */ }

// ======================================================================
// Form Submission Handler (Unchanged - Keep submitCommunityId logic)
// ======================================================================
// The form submission logic using submitCommunityId from URL should remain as is.
// ... (Keep submit handler from version where submission worked) ...


// --- End: suggest_change.js ---