// --- Start: suggest_change.js (Refetch communityId on Submit) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// DOMContentLoaded - Main Execution Block
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");

    // --- Get DOM Elements ---
    const form = document.getElementById('suggestion-form');
    const messageDiv = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    const changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    const targetListingGroup = document.getElementById('target-listing-group');
    const contextHeader = document.getElementById('form-context');
    // We don't strictly need references to the hidden inputs globally anymore
    // const communityIdInput = document.getElementById('community_id'); 
    // const provinceNameInput = document.getElementById('province_name');
    // const communityNameInput = document.getElementById('community_name');
    const targetInput = document.getElementById('target_listing_info');
    const nameInput = document.getElementById('suggested_name');
    const categorySelect = document.getElementById('suggested_category_select'); 
    const otherCategoryGroup = document.getElementById('other-category-group'); 
    const otherCategoryInput = document.getElementById('suggested_category_other'); 
    const addressInput = document.getElementById('suggested_address'); 
    const emailInput = document.getElementById('suggested_email'); 

    // --- Check Supabase Client ---
    if (!supabaseClient) {
        showMessage(messageDiv, 'Error: Supabase client failed to initialize.', 'error');
        if(form) form.style.display = 'none';
        return;
    }

    // --- Get Context from URL Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const communityIdFromUrl = urlParams.get('cid'); // Use specific name
    const provinceNameFromUrl = urlParams.get('prov'); // Use specific name
    const communityNameFromUrl = urlParams.get('comm'); // Use specific name
    let currentTableName = ''; 

    // --- Initial Setup ---
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        showMessage(messageDiv, 'Error: Missing community info in URL.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    // Display context 
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    
    // We still set hidden inputs if they exist, primarily for debugging/reference
    const communityIdInput = document.getElementById('community_id'); 
    if (communityIdInput) communityIdInput.value = communityIdFromUrl;
    // ... set province/community name hidden inputs if needed ...

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    populateCategoryDropdown(categorySelect, currentTableName, communityIdFromUrl); 
    
    if (changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', () => handleRadioChange(targetListingGroup, targetInput, nameInput))); 
        handleRadioChange(targetListingGroup, targetInput, nameInput); 
    } 
    
    if (categorySelect) { 
        categorySelect.addEventListener('change', () => handleCategoryChange(categorySelect, otherCategoryGroup, otherCategoryInput)); 
    }

    // --- Form Submission Handler ---
    if (form) { 
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            showMessage(messageDiv, ''); 
            if (!submitButton) return; 

            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            // *** Start: Re-get communityId from URL INSIDE handler ***
            const submitTimeUrlParams = new URLSearchParams(window.location.search);
            const submitCommunityId = submitTimeUrlParams.get('cid'); 
            // *** End: Re-get communityId ***

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
             // *** Start: Use submitCommunityId for validation ***
            if (!submitCommunityId) { 
                showMessage(messageDiv, 'Error: Community context missing.', 'error'); validationPassed = false;
            } 
            // *** End: Use submitCommunityId ***
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
                    // *** Start: Use submitCommunityId and parseInt here ***
                    community_id: parseInt(submitCommunityId, 10), 
                    // *** End: Use submitCommunityId ***
                    change_type: changeType,
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

                 // *** Add check for valid community_id AFTER parseInt ***
                 if (isNaN(insertData.community_id)) {
                     throw new Error("Invalid Community ID detected before sending.");
                 }
                 // *** End check ***

                console.log("Submitting suggestion:", insertData); 

                const { data, error, status } = await supabaseClient
                    .from('suggested_changes')
                    .insert([insertData]) // Send the constructed data object
                    .select(); 

                console.log("Supabase response:", { data, error, status }); 

                if (error) throw error; 
                if (data || status === 201) { 
                    showMessage(messageDiv, 'Thank you! ... verification.', 'success'); 
                    form.reset(); 
                    handleRadioChange(targetListingGroup, targetInput, nameInput); 
                    handleCategoryChange(categorySelect, otherCategoryGroup, otherCategoryInput); 
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


// Functions (populateCategoryDropdown, handleCategoryChange, handleRadioChange, showMessage)
// Remain the same, accepting arguments passed from DOMContentLoaded listeners
// ... (Paste previous function definitions here) ...
async function populateCategoryDropdown(selectElement, tableName, commId) { /* ... */ }
function handleCategoryChange(selectElement, otherGroup, otherInput) { /* ... */ }
function handleRadioChange(targetGroup, targetIn, nameIn) { /* ... */ }
function showMessage(messageElement, msg, type = 'info') { /* ... */ }

// --- End: suggest_change.js ---