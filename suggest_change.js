// --- suggest_change.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================
// const supabaseUrl = '...'; // REMOVED
// const supabaseKey = '...'; // REMOVED
// const supabaseClient = (typeof supabase !== 'undefined') ? ... : null; // REMOVED

// ======================================================================
// Get DOM Elements (Defined Globally for access by functions) - unchanged
// ======================================================================
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, // Keep new select ref
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
    targetListingSelect = document.getElementById('target_listing_select'); // The select dropdown
    nameInput = document.getElementById('suggested_name');
    categorySelect = document.getElementById('suggested_category_select');
    otherCategoryGroup = document.getElementById('other-category-group');
    otherCategoryInput = document.getElementById('suggested_category_other');
    addressInput = document.getElementById('suggested_address');
    emailInput = document.getElementById('suggested_email');
}

// ======================================================================
// Get Context from URL Parameters (Defined Globally) - unchanged
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

// ======================================================================
// Helper Function to Display Messages (Uses Global messageDiv) - unchanged
// ======================================================================
function showMessage(msg, type = 'info') {
     if (!messageDiv) return;
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`;
     messageDiv.style.display = msg ? 'block' : 'none';
}

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");
    initializeDOMElements(); // Assign globals

    // *** Check if the GLOBAL supabaseClient is available FIRST ***
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Suggest Change page cannot function.");
        showMessage('Error: Cannot connect to data service.', 'error');
        // Disable form if client is missing
        if(form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading form.";
        return; // Stop execution
    }
     console.log("Suggest_change.js using supabaseClient initialized in common.js");

    // Check other essential elements
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!");
        if(messageDiv) showMessage('Page Error. Cannot initialize form.', 'error');
        return;
    }

    // Check URL Params (redundant check with global check, but safe)
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        showMessage('Missing community info in URL.', 'error');
        if (form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading context.";
        return;
    }

    // Setup UI
    if (contextHeader) { contextHeader.textContent = `Suggest Change For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl;
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
    if (communityNameInput) communityNameInput.value = communityNameFromUrl;
    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Target Table Name:", currentTableName);

    // Populate Dropdowns (these functions will now use the global supabaseClient)
    populateCategoryDropdown();
    populateListingsDropdown();

    // Setup Listeners (unchanged)
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange(); // Initial call uses globals
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    }

    // Form Submission Handler (unchanged logic, uses global client via try block)
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        showMessage('');
        if (!submitButton) return;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // --- Get form data ---
        const submitCommunityId = communityIdFromUrl;
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        // Get NAME from the SELECT value, not the hidden ID (assuming value is the name)
        const targetListingName = (changeType === 'CHANGE' || changeType === 'DELETE') ? targetListingSelect?.value : null;
        const suggestedName = nameInput?.value.trim();
        const suggestedPhone = document.getElementById('suggested_phone')?.value.trim();
        const suggestedAddress = addressInput?.value.trim();
        const suggestedEmail = emailInput?.value.trim();
        let suggestedCategory = categorySelect?.value;
         if (suggestedCategory === '_OTHER_') {
             suggestedCategory = otherCategoryInput?.value.trim() || null;
         } else if (suggestedCategory === "") {
             suggestedCategory = null;
         }
        const suggestedNotes = document.getElementById('suggested_notes')?.value.trim();
        const submitterComment = document.getElementById('submitter_comment')?.value.trim();

        // --- Basic Validation ---
        let validationPassed = true;
        if (!submitCommunityId) { showMessage('Error: Community context missing.', 'error'); validationPassed = false; }
        else if (!changeType) { showMessage('Please select the type of change.', 'error'); validationPassed = false; }
        else if ((changeType === 'CHANGE' || changeType === 'DELETE') && (!targetListingName || targetListingName === "")) { showMessage('Please select the listing to change/remove.', 'error'); validationPassed = false; }
        else if ((changeType === 'ADD' || changeType === 'CHANGE') && !suggestedName) { showMessage('Please provide the listing name.', 'error'); validationPassed = false; }
        else if (categorySelect?.value === '_OTHER_' && !suggestedCategory) { showMessage('Please specify the category name.', 'error'); validationPassed = false; }

        if (!validationPassed) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Suggestion';
            return;
        }

        // --- Prepare data for Supabase ---
        const insertData = {
            community_id: parseInt(submitCommunityId, 10), // Ensure it's an integer
            province_name: decodeURIComponent(provinceNameFromUrl),
            community_name: decodeURIComponent(communityNameFromUrl),
            change_type: changeType,
            target_listing_name: targetListingName, // Send the name
            suggested_name: suggestedName || null, // Use null if empty
            suggested_phone: suggestedPhone || null,
            suggested_address: suggestedAddress || null,
            suggested_email: suggestedEmail || null,
            suggested_category: suggestedCategory, // Already handled empty/other cases
            suggested_notes: suggestedNotes || null,
            submitter_comment: submitterComment || null,
            status: 'PENDING' // Default status
        };

        // --- Submit to Supabase ---
        try {
             // *** USES GLOBAL supabaseClient ***
             if (!supabaseClient) throw new Error("Supabase client is not available."); // Extra check

             if (isNaN(insertData.community_id)) { throw new Error("Invalid Community ID."); }

             console.log("Submitting Suggestion:", insertData);
             const { data, error, status } = await supabaseClient
                 .from('suggested_changes')
                 .insert([insertData])
                 .select();

             console.log("Supabase Response:", { data, error, status });

             if (error) {
                 // Try to provide a more specific error message if possible
                 console.error("Supabase Insert Error Details:", error);
                 throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
             }

             // Check if insert was likely successful (Supabase might return null data on success with default policy)
             if (status === 201 || (data && data.length > 0)) {
                 showMessage('Thank you! Your suggestion has been submitted for review.', 'success');
                 form.reset(); // Clear the form
                 // Reset conditional fields to default state
                 handleRadioChange();
                 handleCategoryChange();
                 // Optionally repopulate dropdowns if needed, though likely not necessary
                 // populateListingsDropdown();
             } else {
                 // Handle cases where insert might seem to succeed (no error) but returns no data/unexpected status
                 console.warn("Submission response indicates potential issue:", { data, status });
                 throw new Error("Submission received, but confirmation failed. Please contact support if unsure.");
             }
         } catch (error) {
             console.error("Error submitting suggestion:", error);
             showMessage(`Submission Failed: ${error.message || 'Unknown error.'}`, 'error');
         } finally {
             // Always re-enable the button
             if (submitButton) {
                 submitButton.disabled = false;
                 submitButton.textContent = 'Submit Suggestion';
             }
         }
     }); // End form submit listener

}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Uses Global supabaseClient implicitly) - unchanged
// ======================================================================
async function populateCategoryDropdown() {
    if (!categorySelect || !currentTableName || !communityIdFromUrl || !supabaseClient) {
        console.warn("Cannot populate categories: Missing elements, context, or Supabase client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }
    console.log(`[DEBUG] Starting category fetch. Table: ${currentTableName}, Community ID: ${communityIdFromUrl}`);
    try {
        // *** USES GLOBAL supabaseClient ***
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityIdFromUrl)
            .not('category', 'is', null);

        if (error) { throw new Error(`Fetch categories error: ${error.message}`); }

        // Filter unique, non-empty categories and sort
        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort();
        console.log("[DEBUG] Fetched categories:", categories);

        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
        categorySelect.innerHTML = ''; // Clear existing options

        // Add placeholder
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; // Disable placeholder
        placeholderOption.selected = true; // Make it selected initially
        categorySelect.appendChild(placeholderOption);

        // Add fetched categories
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        // Re-add or add fallback "Other..." option
        if (otherOption) {
            categorySelect.appendChild(otherOption);
        } else {
            console.warn("Original 'Other...' option not found, creating fallback.");
            const fallbackOther = document.createElement('option');
            fallbackOther.value = "_OTHER_";
            fallbackOther.textContent = "Other...";
            categorySelect.appendChild(fallbackOther);
        }
    } catch (error) {
        console.error("Error populating categories dropdown:", error);
        categorySelect.innerHTML = '<option value="">Error loading</option>';
    }
}

// ======================================================================
// Populate Listings Dropdown (Uses Global supabaseClient implicitly) - unchanged
// ======================================================================
async function populateListingsDropdown() {
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) {
         console.warn("Cannot populate listings: Missing elements, context, or Supabase client.");
         if(targetListingSelect) targetListingSelect.innerHTML = '<option value="">Error</option>';
         return;
    }
    console.log(`[DEBUG] Starting listing name fetch. Table: ${currentTableName}, Community ID: ${communityIdFromUrl}`);
    try {
        // *** USES GLOBAL supabaseClient ***
        const { data: listingData, error } = await supabaseClient
            .from(currentTableName)
            .select('name') // Select only the name for the dropdown
            .eq('community_id', communityIdFromUrl)
            .order('name', { ascending: true });

        if (error) { throw new Error(`Failed to fetch listing names: ${error.message}`); }

        // Clear existing options except the placeholder
        while (targetListingSelect.options.length > 1) {
            targetListingSelect.remove(1);
        }

        // Update placeholder text based on results
        if (targetListingSelect.options.length > 0 && targetListingSelect.options[0].value === "") {
             targetListingSelect.options[0].textContent = '-- Select Listing --';
        } else { // Should not happen if initialized correctly, but fallback
            targetListingSelect.innerHTML = '<option value="">-- Select Listing --</option>';
        }


        if (listingData && listingData.length > 0) {
            console.log(`[DEBUG] Found ${listingData.length} listings.`);
            listingData.forEach(listing => {
                if (listing.name) { // Ensure name is not null/empty
                    const option = document.createElement('option');
                    option.value = listing.name; // Use name as the value
                    option.textContent = listing.name;
                    targetListingSelect.appendChild(option);
                }
            });
        } else {
            console.log("[DEBUG] No existing listings found for this community.");
            targetListingSelect.options[0].textContent = '-- No Listings Found --';
        }
    } catch (error) {
        console.error("Error populating listings dropdown:", error);
        targetListingSelect.innerHTML = '<option value="">Error loading listings</option>';
    }
}

// ======================================================================
// Handle Category Dropdown Change (Uses Globals) - unchanged
// ======================================================================
function handleCategoryChange() {
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') {
        otherCategoryGroup.style.display = 'block';
        otherCategoryInput.required = true;
        otherCategoryInput.focus();
    } else {
        otherCategoryGroup.style.display = 'none';
        otherCategoryInput.required = false;
        otherCategoryInput.value = '';
    }
}

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Uses Globals) - unchanged
// ======================================================================
function handleRadioChange() {
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value;
     // Added checks for elements
     if (!targetListingGroup || !targetListingSelect || !nameInput) {
         console.warn("Missing elements needed for handleRadioChange.");
         return;
     }

     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block';
         targetListingSelect.required = true;
     } else { // ADD or default
         targetListingGroup.style.display = 'none';
         targetListingSelect.required = false;
         targetListingSelect.value = ''; // Reset selection when hidden
     }
     // Set name required status based on type
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameInput.required = isAddOrChange;
}

// --- End: suggest_change.js ---