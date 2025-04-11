// --- Start: suggest_change.js ---

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

// ======================================================================
// Get Context from URL Parameters
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('cid');
const provinceName = urlParams.get('prov');
const communityName = urlParams.get('comm');

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Validate context from URL
    if (!communityId || !provinceName || !communityName) {
        showMessage('Error: Missing community information in URL. Please go back.', 'error');
        if (form) form.style.display = 'none'; // Hide form
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    // Display context information in the H2 tag
    if (contextHeader) {
        contextHeader.textContent = `For: ${decodeURIComponent(communityName)}, ${decodeURIComponent(provinceName)}`;
    }
    
    // Populate hidden form fields with context
    if (communityIdInput) communityIdInput.value = communityId;
    if (provinceNameInput) provinceNameInput.value = provinceName; 
    if (communityNameInput) communityNameInput.value = communityName; 

    // Add event listener to radio buttons to toggle conditional fields
    if (changeTypeRadios.length > 0) {
        changeTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleRadioChange);
        });
        // Trigger initial check to set field visibility based on default selection
        handleRadioChange(); 
    } else {
        console.warn("Change type radio buttons not found.");
    }
});

// ======================================================================
// Function to Show/Hide Conditional Fields
// ======================================================================
function handleRadioChange() {
     // Get the value of the currently checked radio button
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value;

     if (!selectedType || !targetListingGroup || !targetInput || !nameInput) {
        // Exit if elements aren't found or nothing is selected
        return; 
     }

     // Show/hide the 'Target Listing' field based on selection
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block'; // Show the group
         targetInput.required = true;              // Make the input required
     } else { // ADD
         targetListingGroup.style.display = 'none'; // Hide the group
         targetInput.required = false;             // Make not required
         targetInput.value = '';                   // Clear any previous value
     }

     // Set the 'Name' field as required only for ADD or CHANGE types
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameInput.required = isAddOrChange;
}

// ======================================================================
// Form Submission Handler
// ======================================================================
if (form) { // Ensure form exists before adding listener
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default browser form submission
        
        showMessage(''); // Clear any previous success/error messages
        if (!submitButton) return; 
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Get data directly from form fields at submission time
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        const targetInfo = targetInput?.value;
        const name = nameInput?.value;
        const phone = document.getElementById('suggested_phone')?.value;
        const category = document.getElementById('suggested_category')?.value;
        const notes = document.getElementById('suggested_notes')?.value;
        const comment = document.getElementById('submitter_comment')?.value;
        const currentCommunityId = communityIdInput?.value; // Get from hidden field

        // --- Client-Side Validation ---
        if (!currentCommunityId) {
             showMessage('Error: Community context lost. Cannot submit.', 'error');
        } else if (!changeType) {
             showMessage('Please select a change type.', 'error');
        } else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) {
             showMessage('Please specify the listing to change or remove.', 'error');
        } else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) {
             showMessage('Listing Name is required for Add/Change.', 'error');
        } else {
            // --- If Validation Passes: Submit to Supabase ---
            try {
                console.log("Submitting suggestion:", { 
                    community_id: parseInt(currentCommunityId, 10), change_type: changeType, 
                    target: targetInfo, name: name, phone: phone, category: category 
                }); // Log data being sent

                const { data, error, status } = await supabaseClient
                    .from('suggested_changes')
                    .insert([
                        { 
                            community_id: parseInt(currentCommunityId, 10), // Ensure it's a number
                            change_type: changeType,
                            status: 'PENDING', 
                            target_listing_info: (changeType === 'CHANGE' || changeType === 'DELETE') ? targetInfo : null,
                            suggested_name: (changeType === 'ADD' || changeType === 'CHANGE') ? name : null,
                            suggested_phone: phone || null,
                            suggested_category: category || null,
                            suggested_notes: notes || null,
                            submitter_comment: comment || null
                        }
                    ])
                    .select(); // Add .select() for better error/success checking

                console.log("Supabase response:", { data, error, status }); // Log response

                if (error) {
                    // Throw the Supabase error to be caught by the catch block
                    throw error; 
                }
                // Check if data was returned (implies successful insert)
                if (data || status === 201) { 
                    showMessage('Suggestion submitted successfully! It will be reviewed shortly.', 'success');
                    form.reset();        // Clear the form fields
                    handleRadioChange(); // Reset conditional field visibility
                } else {
                    // Handle cases where insert might not error but doesn't succeed as expected
                     throw new Error("Submission failed. No data returned.");
                }
                
            } catch (error) {
                // Catch errors from the Supabase request or other issues
                console.error("Error submitting suggestion:", error);
                showMessage(`Error submitting suggestion: ${error.message || 'Unknown error. Please check console.'}`, 'error');
            } finally {
                 // Re-enable the button regardless of success or failure
                 submitButton.disabled = false;
                 submitButton.textContent = 'Submit Suggestion';
            }
            return; // Exit function after handling submission
        }
        
        // If validation failed before the try block, re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Suggestion';
    });
} else {
    console.error("Suggestion form element (#suggestion-form) not found.");
}


// ======================================================================
// Helper Function to Display Messages
// ======================================================================
function showMessage(msg, type = 'info') {
     if (!messageDiv) return; // Don't do anything if message div doesn't exist
     messageDiv.textContent = msg;
     // Set class for styling (success, error, info)
     messageDiv.className = `form-message ${type}`; 
     // Show or hide the message div based on whether there's a message
     messageDiv.style.display = msg ? 'block' : 'none'; 
}

// --- End: suggest_change.js ---