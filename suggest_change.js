// --- Start: suggest_change.js (Corrected nameInput ReferenceError) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally)
// ======================================================================
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
const nameInput = document.getElementById('suggested_name'); // Correct global variable
const categorySelect = document.getElementById('suggested_category_select'); 
const otherCategoryGroup = document.getElementById('other-category-group'); 
const otherCategoryInput = document.getElementById('suggested_category_other'); 
const addressInput = document.getElementById('suggested_address'); 
const emailInput = document.getElementById('suggested_email'); 

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

    if (!supabaseClient) { showMessage(messageDiv, 'Error: Supabase client failed to initialize.', 'error'); if(form) form.style.display = 'none'; return; }
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { showMessage(messageDiv, 'Error: Missing community info in URL.', 'error'); if (form) form.style.display = 'none'; if (contextHeader) contextHeader.textContent = "Error loading form context."; return; }

    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    populateCategoryDropdown(); // Uses globals
    
    if (changeTypeRadios.length > 0) { changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); handleRadioChange(); } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }

    // Form Submission Handler
    if (form) { 
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            showMessage(messageDiv, ''); 
            if (!submitButton) return; 
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            const submitCommunityId = communityIdFromUrl; // Use ID captured on load
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
            if (!submitCommunityId) { showMessage(messageDiv, 'Error: Community context missing.', 'error'); validationPassed = false; } 
            else if (!changeType) { showMessage(messageDiv, 'Please select change type.', 'error'); validationPassed = false; } 
            else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { showMessage(messageDiv, 'Please specify listing.', 'error'); validationPassed = false; } 
            else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { showMessage(messageDiv, 'Name required.', 'error'); validationPassed = false; }
            else if (categorySelect?.value === '_OTHER_' && !category) { showMessage(messageDiv, 'Specify category name.', 'error'); validationPassed = false; } 

            if (!validationPassed) { submitButton.disabled = false; submitButton.textContent = 'Submit Suggestion'; return; }

            // Submit to Supabase
            try {
                const insertData = { 
                    community_id: parseInt(submitCommunityId, 10), 
                    change_type: changeType,
                    status: 'PENDING', 
                    target_listing_info: (changeType === 'CHANGE' || changeType === 'DELETE') ? targetInfo : null,
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
                if (data || status === 201) { showMessage(messageDiv, 'Thank you! ... verification.', 'success'); form.reset(); handleRadioChange(); handleCategoryChange(); } 
                else { throw new Error("Submission failed."); }
            } catch (error) { console.error("Error submitting:", error); showMessage(messageDiv, `Error: ${error.message || 'Unknown error.'}`, 'error'); } 
            finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Submit Suggestion'; } }
        });
    } else { console.error("Form not found."); }
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown
// ======================================================================
async function populateCategoryDropdown() { 
    if (!categorySelect || !currentTableName || !communityIdFromUrl) { /* ... error handling ... */ return; }
    console.log(`[DEBUG] Category fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 
    try {
        const { data: categoryData, error } = await supabaseClient.from(currentTableName).select('category').eq('community_id', communityIdFromUrl).not('category', 'is', null); 
        if (error) { throw new Error(`Fetch categories error: ${error.message}`); }
        console.log("[DEBUG] Raw category data:", categoryData); 
        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 
        console.log("[DEBUG] Processed categories:", categories); 
        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); 
        categorySelect.innerHTML = ''; 
        const placeholderOption = document.createElement('option'); placeholderOption.value = ""; placeholderOption.textContent = "-- Select Category --"; placeholderOption.disabled = true; placeholderOption.selected = true; 
        categorySelect.appendChild(placeholderOption);
        categories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; categorySelect.appendChild(option); });
        if (otherOption) { categorySelect.appendChild(otherOption); } else { const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther); }
    } catch (error) { console.error("Error populating categories:", error); categorySelect.innerHTML = '<option value="">Error loading</option>'; }
}

// ======================================================================
// Handle Category Dropdown Change
// ======================================================================
function handleCategoryChange() { 
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { otherCategoryGroup.style.display = 'block'; otherCategoryInput.required = true; otherCategoryInput.focus(); } 
    else { otherCategoryGroup.style.display = 'none'; otherCategoryInput.required = false; otherCategoryInput.value = ''; }
}

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required
// ======================================================================
function handleRadioChange() { 
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     // Use globals targetListingGroup, targetInput, nameInput
     if (!selectedType || !targetListingGroup || !targetInput || !nameInput) { console.warn("Missing elements for handleRadioChange"); return; } 
     
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block';
         targetInput.required = true; 
     } else { 
         targetListingGroup.style.display = 'none';
         targetInput.required = false; 
         targetInput.value = ''; 
     }
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     // ***** THE ONLY CHANGE IS HERE: nameIn changed to nameInput *****
     nameInput.required = isAddOrChange; 
     // ***************************************************************
}

// ======================================================================
// Helper Function to Display Messages
// ======================================================================
function showMessage(msg, type = 'info') { 
     if (!messageDiv) return; 
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`; 
     messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---