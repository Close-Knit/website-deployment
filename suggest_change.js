// --- Start: suggest_change.js (Corrected showMessage Calls) ---

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
const messageDiv = document.getElementById('form-message'); // <--- Global messageDiv reference
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

    if (!supabaseClient) { showMessage('Error: Supabase client failed to initialize.', 'error'); if(form) form.style.display = 'none'; return; } // <-- Uses showMessage correctly
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { showMessage('Error: Missing community info in URL.', 'error'); if (form) form.style.display = 'none'; if (contextHeader) contextHeader.textContent = "Error loading form context."; return; } // <-- Uses showMessage correctly

    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    populateCategoryDropdown(); 
    
    if (changeTypeRadios.length > 0) { changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); handleRadioChange(); } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }

    // --- Form Submission Handler ---
    if (form) { 
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            showMessage(''); // <-- CORRECTED CALL: Clear message
            if (!submitButton) return; 

            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const submitCommunityId = communityIdFromUrl; 
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
            if (!submitCommunityId) { 
                showMessage('Error: Community context missing.', 'error'); validationPassed = false; // <-- CORRECTED CALL
            } else if (!changeType) { 
                showMessage('Please select change type.', 'error'); validationPassed = false; // <-- CORRECTED CALL
            } else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { 
                showMessage('Please specify listing.', 'error'); validationPassed = false; // <-- CORRECTED CALL
            } else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { 
                showMessage('Name required.', 'error'); validationPassed = false; // <-- CORRECTED CALL
            } else if (categorySelect?.value === '_OTHER_' && !category) { 
                showMessage('Specify category name.', 'error'); validationPassed = false; // <-- CORRECTED CALL
             } 

            if (!validationPassed) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Suggestion';
                return; 
            }

            // Submit to Supabase
            try {
                const insertData = { /* ... data mapping ... */ };
                 if (isNaN(insertData.community_id)) { throw new Error("Invalid Community ID."); }
                console.log("Submitting:", insertData); 
                const { data, error, status } = await supabaseClient.from('suggested_changes').insert([insertData]).select(); 
                console.log("Response:", { data, error, status }); 
                if (error) throw error; 
                if (data || status === 201) { 
                    showMessage('Thank you! Your suggestion has been submitted. It may take a few days to appear after verification.', 'success'); // <-- CORRECTED CALL
                    form.reset(); 
                    handleRadioChange(); 
                    handleCategoryChange(); 
                } else {
                     throw new Error("Submission potentially failed.");
                }
            } catch (error) { 
                console.error("Error submitting:", error);
                showMessage(`Error: ${error.message || 'Unknown error.'}`, 'error'); // <-- CORRECTED CALL
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
// Populate Category Dropdown
// ======================================================================
async function populateCategoryDropdown() { /* ... (Function definition remains the same) ... */ }

// ======================================================================
// Handle Category Dropdown Change
// ======================================================================
function handleCategoryChange() { /* ... (Function definition remains the same) ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required
// ======================================================================
function handleRadioChange() { /* ... (Function definition remains the same) ... */ }

// ======================================================================
// Helper Function to Display Messages
// ======================================================================
// Function definition expects only (msg, type) and uses global messageDiv
function showMessage(msg, type = 'info') { 
     if (!messageDiv) return; 
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`; 
     messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---