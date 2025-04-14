// --- Start: suggest_change.js (Improved UI Feedback on Success) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Get DOM Elements
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
const nameInput = document.getElementById('suggested_name');
const categorySelect = document.getElementById('suggested_category_select'); 
const otherCategoryGroup = document.getElementById('other-category-group'); 
const otherCategoryInput = document.getElementById('suggested_category_other'); 
const addressInput = document.getElementById('suggested_address'); 
const emailInput = document.getElementById('suggested_email'); 

// ======================================================================
// Get Context from URL Parameters
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('cid');
const provinceName = urlParams.get('prov');
const communityName = urlParams.get('comm');
let currentTableName = ''; 

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!communityId || !provinceName || !communityName) { /* ... error handling ... */ return; }
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityName)}, ${decodeURIComponent(provinceName)}`; }
    if (communityIdInput) communityIdInput.value = communityId;
    if (provinceNameInput) provinceNameInput.value = provinceName; 
    if (communityNameInput) communityNameInput.value = communityName; 
    currentTableName = decodeURIComponent(provinceName).replace(/ /g, '_');
    populateCategoryDropdown(); 
    if (changeTypeRadios.length > 0) { changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); handleRadioChange(); } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }
});

// ======================================================================
// Populate Category Dropdown
// ======================================================================
async function populateCategoryDropdown() { /* ... (Same as before) ... */ }

// ======================================================================
// Handle Category Dropdown Change (Show/Hide Other Input)
// ======================================================================
function handleCategoryChange() { /* ... (Same as before) ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields (Target Listing)
// ======================================================================
function handleRadioChange() { /* ... (Same as before) ... */ }

// ======================================================================
// Form Submission Handler
// ======================================================================
if (form) { 
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        showMessage(''); // Clear previous messages immediately
        if (!submitButton) return; 

        // Disable button and show submitting state *before* async operations
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Get data (same as before)
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
        const currentCommunityId = communityIdInput?.value; 

        // --- Client-Side Validation ---
        let validationPassed = true; // Flag to track validation
        if (!currentCommunityId) { 
            showMessage('Error: Community context lost. Cannot submit.', 'error');
            validationPassed = false;
        } else if (!changeType) { 
            showMessage('Please select a change type.', 'error');
            validationPassed = false;
        } else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { 
            showMessage('Please specify the listing to change or remove.', 'error');
            validationPassed = false;
        } else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { 
            showMessage('Listing Name is required for Add/Change.', 'error');
            validationPassed = false;
        } else if (categorySelect?.value === '_OTHER_' && !category) { 
              showMessage('Please specify the category name when selecting "Other".', 'error');
              validationPassed = false;
         } 

        // --- If Validation Fails, Reset Button and Exit ---
        if (!validationPassed) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Suggestion';
            return; 
        }

        // --- If Validation Passes: Submit to Supabase ---
        try {
            console.log("Submitting suggestion:", { /*...*/ }); 

            const { data, error, status } = await supabaseClient
                .from('suggested_changes')
                .insert([{ 
                    community_id: parseInt(currentCommunityId, 10), 
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
                }])
                .select(); 

            console.log("Supabase response:", { data, error, status }); 

            if (error) throw error; // Throw error to be caught below

            // --- Start: Success Handling ---
            if (data || status === 201) { 
                // Use the specific success message
                showMessage('Thank you! Your suggestion has been submitted. It may take a few days to appear after verification.', 'success');
                form.reset();        // Clear the form fields
                handleRadioChange(); // Reset conditional field visibility
                handleCategoryChange(); // Reset other category field display
            } else {
                 // Handle unexpected non-error but no data case
                 throw new Error("Submission potentially failed. Please try again or contact support.");
            }
            // --- End: Success Handling ---
            
        } catch (error) { 
            // Catch errors from Supabase or other issues
            console.error("Error submitting suggestion:", error);
            showMessage(`Error submitting suggestion: ${error.message || 'Unknown error.'}`, 'error');
            // Button state is reset in finally
        } finally {
            // --- Start: Ensure Button is Always Reset ---
            console.log("[DEBUG] Entering finally block to reset button."); // Debug log
            // Re-enable the button and restore text regardless of success/error
            if (submitButton) { // Check if submitButton exists
                 submitButton.disabled = false;
                 submitButton.textContent = 'Submit Suggestion';
                 console.log("[DEBUG] Button reset."); // Debug log
            } else {
                 console.error("[DEBUG] Submit button not found in finally block!");
            }
            // --- End: Ensure Button is Always Reset ---
        }
    });
} 

// ======================================================================
// Helper Function to Display Messages
// ======================================================================
function showMessage(msg, type = 'info') { 
    if (!messageDiv) return; 
    messageDiv.textContent = msg;
    messageDiv.className = `form-message ${type}`; 
    // Ensure it's visible when there's a message
    messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---