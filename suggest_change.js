// --- Start: suggest_change.js (Listing Dropdown for Change/Delete) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally) - Added targetListingSelect
// ======================================================================
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader, 
    communityIdInput, provinceNameInput, communityNameInput, 
    targetInput, // Keep old ref temporarily, will be replaced functionally
    targetListingSelect, // <-- NEW: Reference to the select dropdown
    nameInput, categorySelect, otherCategoryGroup, otherCategoryInput, 
    addressInput, emailInput; 

function initializeDOMElements() {
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message');
    submitButton = document.getElementById('submit-button');
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    targetListingGroup = document.getElementById('target-listing-group');
    contextHeader = document.getElementById('form-context');
    communityIdInput = document.getElementById('community_id'); 
    provinceNameInput = document.getElementById('province_name');
    communityNameInput = document.getElementById('community_name');
    targetInput = document.getElementById('target_listing_info'); // Old input (now removed from HTML)
    targetListingSelect = document.getElementById('target_listing_select'); // <-- NEW
    nameInput = document.getElementById('suggested_name'); 
    categorySelect = document.getElementById('suggested_category_select'); 
    otherCategoryGroup = document.getElementById('other-category-group'); 
    otherCategoryInput = document.getElementById('suggested_category_other'); 
    addressInput = document.getElementById('suggested_address'); 
    emailInput = document.getElementById('suggested_email'); 
}

// ======================================================================
// Get Context from URL Parameters (Defined Globally)
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid'); 
const provinceNameFromUrl = urlParams.get('prov'); 
const communityNameFromUrl = urlParams.get('comm'); 
let currentTableName = ''; 

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");
    initializeDOMElements(); 

    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) { // Added targetListingSelect check
        console.error("Essential form elements not found! Aborting setup.");
        if (messageDiv) showMessage('Error: Page structure incorrect.', 'error');
        return;
    }
    if (!supabaseClient) { showMessage('Error: Supabase client failed.', 'error'); if(form) form.style.display = 'none'; return; }
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { showMessage('Error: Missing community info.', 'error'); if (form) form.style.display = 'none'; if (contextHeader) contextHeader.textContent = "Error context."; return; }

    // Set context display and hidden fields
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    // Populate BOTH dropdowns
    populateCategoryDropdown(); 
    populateListingsDropdown(); // <-- NEW function call

    // Set up listeners
    if (changeTypeRadios.length > 0) { changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); handleRadioChange(); } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }

    // --- Form Submission Handler ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        showMessage(''); 
        if (!submitButton) return; 
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const submitCommunityId = communityIdFromUrl; 
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        // *** START: Get target info from SELECT dropdown ***
        const targetInfo = (changeType === 'CHANGE' || changeType === 'DELETE') ? targetListingSelect?.value : null;
        // *** END: Get target info from SELECT dropdown ***
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
        if (!submitCommunityId) { showMessage('Error: Community context missing.', 'error'); validationPassed = false; } 
        else if (!changeType) { showMessage('Please select change type.', 'error'); validationPassed = false; } 
        // *** START: Validate target dropdown selection ***
        else if ((changeType === 'CHANGE' || changeType === 'DELETE') && (!targetInfo || targetInfo === "")) { // Check if empty or placeholder selected
             showMessage('Please select the listing to change or remove.', 'error'); 
             validationPassed = false; 
        } 
        // *** END: Validate target dropdown selection ***
        else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { showMessage('Name required.', 'error'); validationPassed = false; }
        else if (categorySelect?.value === '_OTHER_' && !category) { showMessage('Specify category name.', 'error'); validationPassed = false; } 

        if (!validationPassed) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Suggestion';
            return; 
        }

        // Submit to Supabase
        try {
            const insertData = { 
                community_id: parseInt(submitCommunityId, 10), 
                change_type: changeType,
                status: 'PENDING', 
                 // *** Use targetInfo from select dropdown ***
                target_listing_info: targetInfo, 
                suggested_name: (changeType === 'ADD' || changeType === 'CHANGE') ? name : null,
                suggested_phone: phone || null, suggested_category: category, 
                suggested_notes: notes || null, submitter_comment: comment || null,
                suggested_address: address || null, suggested_email: email || null    
            };
             if (isNaN(insertData.community_id)) { throw new Error("Invalid Community ID."); }
            console.log("Submitting:", insertData); 
            const { data, error, status } = await supabaseClient.from('suggested_changes').insert([insertData]).select(); 
            console.log("Response:", { data, error, status }); 
            if (error) throw error; 
            if (data || status === 201) { showMessage('Thank you! ... verification.', 'success'); form.reset(); handleRadioChange(); handleCategoryChange(); } 
            else { throw new Error("Submission potentially failed."); }
        } catch (error) { console.error("Error submitting:", error); showMessage(`Error: ${error.message || 'Unknown error.'}`, 'error'); } 
        finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Submit Suggestion'; } }
    });
    
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Unchanged)
// ======================================================================
async function populateCategoryDropdown() { /* ... (Function definition remains the same) ... */ }

// ======================================================================
// *** START: New Function to Populate Listings Dropdown ***
// ======================================================================
async function populateListingsDropdown() {
    // Uses global targetListingSelect, currentTableName, communityIdFromUrl
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl) {
        console.error("[DEBUG] Missing required elements/data for listing population");
         if (targetListingSelect && targetListingSelect.options.length > 0 && targetListingSelect.options[0].value === "") {
              targetListingSelect.options[0].textContent = '-- Cannot Load Listings --';
         }
        return; 
    }

    console.log(`[DEBUG] Starting listing name fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 

    try {
        // Fetch only the names for the current community, ordered alphabetically
        const { data: listingData, error } = await supabaseClient
            .from(currentTableName)
            .select('name') // Select only the name
            .eq('community_id', communityIdFromUrl) 
            .order('name', { ascending: true });

        if (error) { throw new Error(`Failed to fetch listing names: ${error.message}`); }

        console.log("[DEBUG] Listing names fetched:", listingData); 

        // Clear existing options (keeping the placeholder "-- Select Listing --")
        while (targetListingSelect.options.length > 1) {
            targetListingSelect.remove(1);
        }
        // Ensure placeholder is correct
        if (targetListingSelect.options.length > 0 && targetListingSelect.options[0].value === "") {
             targetListingSelect.options[0].textContent = '-- Select Listing --';
        } else { // Add placeholder if missing
             targetListingSelect.innerHTML = '<option value="">-- Select Listing --</option>';
        }
        
        // Add fetched listing names as options
        if (listingData && listingData.length > 0) {
            listingData.forEach(listing => {
                if (listing.name) { // Only add if name is not null/empty
                     const option = document.createElement('option');
                     option.value = listing.name; // Use name as value for simplicity for now
                     option.textContent = listing.name;
                     targetListingSelect.appendChild(option);
                 }
            });
        } else {
            console.log("[DEBUG] No existing listings found for this community to populate dropdown.");
            // Optionally disable the dropdown or keep the placeholder
             targetListingSelect.options[0].textContent = '-- No Listings Found --';
        }

    } catch (error) {
        console.error("Error populating listings dropdown:", error);
        targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; 
    }
}
// ======================================================================
// *** END: New Function ***
// ======================================================================


// ======================================================================
// Handle Category Dropdown Change (Unchanged)
// ======================================================================
function handleCategoryChange() { /* ... (Function definition remains the same) ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Updated for Select)
// ======================================================================
function handleRadioChange() { 
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     // *** Uses global targetListingGroup, targetListingSelect, nameInput ***
     if (!selectedType || !targetListingGroup || !targetListingSelect || !nameInput) { 
         console.warn("Missing elements for handleRadioChange"); 
         return; 
     } 
     
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block';
         targetListingSelect.required = true; // *** Set required on SELECT ***
     } else { 
         targetListingGroup.style.display = 'none';
         targetListingSelect.required = false; // *** Set required on SELECT ***
         targetListingSelect.value = ''; // Reset selection
     }
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameInput.required = isAddOrChange; 
}

// ======================================================================
// Helper Function to Display Messages (Unchanged)
// ======================================================================
function showMessage(msg, type = 'info') { /* ... (Function definition remains the same) ... */ }

// --- End: suggest_change.js ---