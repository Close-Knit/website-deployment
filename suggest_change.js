// --- Start: suggest_change.js (Corrected Scope & Init) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
// Ensure supabase object is available globally from the CDN script
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// DOMContentLoaded - Main Execution Block
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");

    // --- Get DOM Elements (Define INSIDE DOMContentLoaded) ---
    const form = document.getElementById('suggestion-form');
    const messageDiv = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    const targetListingGroup = document.getElementById('target-listing-group');
    const contextHeader = document.getElementById('form-context');
    const communityIdInput = document.getElementById('community_id');
    const provinceNameInput = document.getElementById('province_name');
    const communityNameInput = document.getElementById('community_name');
    const targetInput = document.getElementById('target_listing_info');
    const nameInput = document.getElementById('suggested_name');
    const categorySelect = document.getElementById('suggested_category_select'); 
    const otherCategoryGroup = document.getElementById('other-category-group'); 
    const otherCategoryInput = document.getElementById('suggested_category_other'); 
    const addressInput = document.getElementById('suggested_address'); 
    const emailInput = document.getElementById('suggested_email'); 

    // --- Check if Supabase Client Initialized ---
    if (!supabaseClient) {
        showMessage(messageDiv, 'Error: Supabase client failed to initialize. Check console.', 'error');
        if(form) form.style.display = 'none';
        return;
    }

    // --- Get Context from URL Parameters (Define INSIDE DOMContentLoaded) ---
    const urlParams = new URLSearchParams(window.location.search);
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    let currentTableName = ''; 

    // --- Initial Setup ---
    if (!communityId || !provinceName || !communityName) {
        showMessage(messageDiv, 'Error: Missing community information in URL. Please go back.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    // Display context 
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityName)}, ${decodeURIComponent(provinceName)}`; }
    if (communityIdInput) communityIdInput.value = communityId;
    if (provinceNameInput) provinceNameInput.value = provinceName; 
    if (communityNameInput) communityNameInput.value = communityName; 

    currentTableName = decodeURIComponent(provinceName).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    populateCategoryDropdown(categorySelect, currentTableName, communityId); // Pass necessary elements/variables
    
    if (changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', () => handleRadioChange(targetListingGroup, targetInput, nameInput))); // Pass elements
        handleRadioChange(targetListingGroup, targetInput, nameInput); // Initial call
    } 
    
    if (categorySelect) { 
        categorySelect.addEventListener('change', () => handleCategoryChange(categorySelect, otherCategoryGroup, otherCategoryInput)); // Pass elements
    }

    // --- Form Submission Handler (Define INSIDE DOMContentLoaded) ---
    if (form) { 
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            showMessage(messageDiv, ''); // Clear message
            if (!submitButton) return; 

            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            // Get data (Reference variables defined within this scope)
            const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
            const targetInfo = targetInput?.value;
            const name = nameInput?.value;
            const phone = document.getElementById('suggested_phone')?.value;
            const address = addressInput?.value; 
            const email = emailInput?.value; 
            let category = categorySelect?.value;
            if (category === '_OTHER_') { category = otherCategoryInput?.value.trim() || null; } 
            else if (category === "") { category = null; }
            const notes = document.getElementById('suggested_notes')?.value;
            const comment = document.getElementById('submitter_comment')?.value;
            const currentCommunityId = communityIdInput?.value; // Get hidden value

            // Validation
            let validationPassed = true;
            if (!currentCommunityId) { 
                showMessage(messageDiv, 'Error: Community context lost.', 'error'); validationPassed = false;
            } else if (!changeType) { 
                showMessage(messageDiv, 'Please select a change type.', 'error'); validationPassed = false;
            } else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { 
                showMessage(messageDiv, 'Please specify listing to change/remove.', 'error'); validationPassed = false;
            } else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { 
                showMessage(messageDiv, 'Listing Name required for Add/Change.', 'error'); validationPassed = false;
            } else if (categorySelect?.value === '_OTHER_' && !category) { 
                showMessage(messageDiv, 'Please specify category name for "Other".', 'error'); validationPassed = false;
            } 

            if (!validationPassed) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Suggestion';
                return; 
            }

            // Submit to Supabase
            try {
                const { data, error, status } = await supabaseClient
                    .from('suggested_changes')
                    .insert([{ /* ... data mapping ... */ }])
                    .select(); 

                if (error) throw error; 
                if (data || status === 201) { 
                    showMessage(messageDiv, 'Thank you! ... verification.', 'success'); // Shortened message
                    form.reset(); 
                    handleRadioChange(targetListingGroup, targetInput, nameInput); // Pass elements
                    handleCategoryChange(categorySelect, otherCategoryGroup, otherCategoryInput); // Pass elements
                } else {
                     throw new Error("Submission potentially failed.");
                }
            } catch (error) { 
                console.error("Error submitting:", error);
                showMessage(messageDiv, `Error: ${error.message || 'Unknown error.'}`, 'error');
            } finally {
                if (submitButton) { 
                     submitButton.disabled = false;
                     submitButton.textContent = 'Submit Suggestion';
                }
            }
        });
    } else {
        console.error("Suggestion form element (#suggestion-form) not found.");
    }
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Now takes arguments)
// ======================================================================
async function populateCategoryDropdown(selectElement, tableName, commId) { // Accept arguments
    if (!selectElement || !tableName || !commId) {
         console.error("[DEBUG] Missing args for category population:", { selectElement, tableName, commId });
         if (selectElement && selectElement.options.length > 0 && selectElement.options[0].value === "") {
              selectElement.options[0].textContent = '-- Cannot Load Categories --';
         }
        return; 
    }

    console.log(`[DEBUG] Starting category fetch. Table: ${tableName}, Community ID: ${commId}`); 

    try {
        const { data: categoryData, error } = await supabaseClient
            .from(tableName)
            .select('category')
            .eq('community_id', commId)
            .not('category', 'is', null); 

        if (error) { throw new Error(`Failed to fetch categories: ${error.message}`); }

        console.log("[DEBUG] Raw category data fetched:", categoryData); 

        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 

        console.log("[DEBUG] Processed unique categories:", categories); 

        // Simplified Option Handling
        const otherOption = selectElement.querySelector('option[value="_OTHER_"]'); // Find other option more robustly
        selectElement.innerHTML = ''; // Clear ALL existing options 

        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; 
        placeholderOption.selected = true; 
        selectElement.appendChild(placeholderOption);

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectElement.appendChild(option);
        });

        if (otherOption) { // Re-append if found
             selectElement.appendChild(otherOption);
        } else { // Fallback
            const fallbackOther = document.createElement('option');
            fallbackOther.value = "_OTHER_";
            fallbackOther.textContent = "Other...";
            selectElement.appendChild(fallbackOther);
        }

    } catch (error) {
        console.error("Error populating categories:", error);
        selectElement.innerHTML = '<option value="">Error loading categories</option>'; // Clear and show error
    }
}

// ======================================================================
// Handle Category Dropdown Change (Now takes arguments)
// ======================================================================
function handleCategoryChange(selectElement, otherGroup, otherInput) { // Accept arguments
    if (!selectElement || !otherGroup || !otherInput) return;

    if (selectElement.value === '_OTHER_') {
        otherGroup.style.display = 'block'; 
        otherInput.required = true; 
        otherInput.focus(); 
    } else {
        otherGroup.style.display = 'none'; 
        otherInput.required = false; 
        otherInput.value = ''; 
    }
}

// ======================================================================
// Function to Show/Hide Conditional Fields (Now takes arguments)
// ======================================================================
function handleRadioChange(targetGroup, targetIn, nameIn) { // Accept arguments
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     if (!selectedType || !targetGroup || !targetIn || !nameIn) return; 
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetGroup.style.display = 'block';
         targetIn.required = true; 
     } else { 
         targetGroup.style.display = 'none';
         targetIn.required = false; 
         targetIn.value = ''; 
     }
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameIn.required = isAddOrChange;
}

// ======================================================================
// Helper Function to Display Messages (Now takes messageDiv argument)
// ======================================================================
function showMessage(messageElement, msg, type = 'info') { // Accept messageElement
     if (!messageElement) return; 
     messageElement.textContent = msg;
     messageElement.className = `form-message ${type}`; 
     messageElement.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---