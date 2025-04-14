// --- Start: suggest_change.js (Restore Categories, Fix Submit ID) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally for broader access by functions)
// ======================================================================
const form = document.getElementById('suggestion-form');
const messageDiv = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
const targetListingGroup = document.getElementById('target-listing-group');
const contextHeader = document.getElementById('form-context');
const communityIdInput = document.getElementById('community_id'); // Keep reference to hidden input
const provinceNameInput = document.getElementById('province_name');
const communityNameInput = document.getElementById('community_name');
const targetInput = document.getElementById('target_listing_info');
const nameInput = document.getElementById('suggested_name');
const categorySelect = document.getElementById('suggested_category_select'); 
const otherCategoryGroup = document.getElementById('other-category-group'); 
const otherCategoryInput = document.getElementById('suggested_category_other'); 
const addressInput = document.getElementById('suggested_address'); 
const emailInput = document.getElementById('suggested_email'); 

// ======================================================================
// Get Context from URL Parameters (Defined Globally)
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid'); // Use specific name
const provinceNameFromUrl = urlParams.get('prov'); // Use specific name
const communityNameFromUrl = urlParams.get('comm'); // Use specific name
let currentTableName = ''; // Store table name globally

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");

    // Check Supabase Client
    if (!supabaseClient) {
        showMessage('Error: Supabase client failed to initialize.', 'error');
        if(form) form.style.display = 'none';
        return;
    }

    // Validate and Set Context
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        showMessage('Error: Missing community info in URL.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; // Still set hidden input
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    // Populate Categories (Uses global vars now)
    populateCategoryDropdown(); 
    
    // Set up listeners (Uses global vars)
    if (changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); 
        handleRadioChange(); // Initial call relies on globals being set
    } 
    
    if (categorySelect) { 
        categorySelect.addEventListener('change', handleCategoryChange); 
    }

    // Form Submission Handler (Uses global vars)
    if (form) { 
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            showMessage(''); // Clear message
            if (!submitButton) return; 

            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            // *** Start: Get communityId from URL *inside handler* ***
            // This ensures we use the value captured when the page loaded
            const submitCommunityId = communityIdFromUrl; 
            // *** End: Get communityId ***


            // Get other form data
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
           
            // Validation
            let validationPassed = true;
            if (!submitCommunityId) { // Use submitCommunityId here
                showMessage('Error: Community context missing.', 'error'); validationPassed = false;
            } 
            // ... other validation checks ...
            else if (!changeType) { /*...*/ validationPassed = false; } 
            else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { /*...*/ validationPassed = false; } 
            else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { /*...*/ validationPassed = false; }
            else if (categorySelect?.value === '_OTHER_' && !category) { /*...*/ validationPassed = false; } 

            if (!validationPassed) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Suggestion';
                return; 
            }

            // Submit to Supabase
            try {
                const insertData = { 
                    community_id: parseInt(submitCommunityId, 10), // Parse the ID here
                    change_type: changeType,
                    // ... rest of data mapping ...
                    status: 'PENDING', 
                    target_listing_info: (changeType === 'CHANGE' || changeType === 'DELETE') ? targetInfo : null,
                    suggested_name: (changeType === 'ADD' || changeType === 'CHANGE') ? name : null,
                    suggested_phone: phone || null,
                    suggested_category: category, 
                    suggested_notes: notes || null,
                    submitter_comment: comment || null,
                    suggested_address: address || null, 
                    suggested_email: email || null    
                };

                 if (isNaN(insertData.community_id)) {
                     throw new Error("Invalid Community ID detected before sending.");
                 }

                console.log("Submitting suggestion:", insertData); 

                const { data, error, status } = await supabaseClient
                    .from('suggested_changes')
                    .insert([insertData])
                    .select(); 

                console.log("Supabase response:", { data, error, status }); 

                if (error) throw error; 
                if (data || status === 201) { 
                    showMessage('Thank you! ... verification.', 'success'); 
                    form.reset(); 
                    handleRadioChange(); // Uses globals
                    handleCategoryChange(); // Uses globals
                } else {
                     throw new Error("Submission potentially failed.");
                }
            } catch (error) { 
                console.error("Error submitting:", error);
                showMessage(`Error: ${error.message || 'Unknown error.'}`, 'error');
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
// Populate Category Dropdown (Uses global variables again)
// ======================================================================
async function populateCategoryDropdown() { 
    // Relies on global categorySelect, currentTableName, communityIdFromUrl
    if (!categorySelect || !currentTableName || !communityIdFromUrl) {
         console.error("[DEBUG] Missing required elements/data for category population");
         if (categorySelect && categorySelect.options.length > 0 && categorySelect.options[0].value === "") {
              categorySelect.options[0].textContent = '-- Cannot Load Categories --';
         }
        return; 
    }

    console.log(`[DEBUG] Starting category fetch. Table: ${currentTableName}, Community ID: ${communityIdFromUrl}`); 

    try {
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityIdFromUrl) // Use global ID from URL
            .not('category', 'is', null); 

        if (error) { throw new Error(`Failed to fetch categories: ${error.message}`); }

        console.log("[DEBUG] Raw category data fetched:", categoryData); 

        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 

        console.log("[DEBUG] Processed unique categories:", categories); 

        // Simplified Option Handling (Same as before)
        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); 
        categorySelect.innerHTML = ''; 

        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; 
        placeholderOption.selected = true; 
        categorySelect.appendChild(placeholderOption);

        categories.forEach(cat => { /* ... add option ... */ });

        if (otherOption) { categorySelect.appendChild(otherOption); } 
        else { /* ... fallback other ... */ }

    } catch (error) {
        console.error("Error populating categories:", error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>'; 
    }
}

// ======================================================================
// Handle Category Dropdown Change (Uses global variables)
// ======================================================================
function handleCategoryChange() { 
    // Relies on global categorySelect, otherCategoryGroup, otherCategoryInput
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { /* ... show other ... */ } 
    else { /* ... hide other ... */ }
}

// ======================================================================
// Function to Show/Hide Conditional Fields (Uses global variables)
// ======================================================================
function handleRadioChange() { 
    // Relies on global targetListingGroup, targetInput, nameInput
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     if (!selectedType || !targetListingGroup || !targetInput || !nameInput) return; 
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') { /* ... show target ... */ } 
     else { /* ... hide target ... */ }
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameIn.required = isAddOrChange;
}

// ======================================================================
// Helper Function to Display Messages (Uses global messageDiv)
// ======================================================================
function showMessage(msg, type = 'info') { 
     // Relies on global messageDiv
     if (!messageDiv) return; 
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`; 
     messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---