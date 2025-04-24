// Uses global supabaseClient from common.js

let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader,
    communityIdInput, provinceNameInput, communityNameInput,
    targetListingSelect, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput,
    addressInput, emailInput, websiteInput, phoneInput; // Keep phoneInput variable declaration for submit handler

// Function to initialize DOM elements and perform checks
function initializeAndCheckDOMElements() {
    console.log("[DEBUG] Entering initializeAndCheckDOMElements");
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message');
    submitButton = document.getElementById('submit-button');
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]'); // Selector verified in HTML
    targetListingGroup = document.getElementById('target-listing-group');
    contextHeader = document.getElementById('form-context'); // ID verified in HTML
    communityIdInput = document.getElementById('community_id');
    provinceNameInput = document.getElementById('province_name');
    communityNameInput = document.getElementById('community_name');
    targetListingSelect = document.getElementById('target_listing_select');
    nameInput = document.getElementById('suggested_name');
    categorySelect = document.getElementById('suggested_category_select'); // ID verified in HTML
    otherCategoryGroup = document.getElementById('other-category-group');
    otherCategoryInput = document.getElementById('suggested_category_other');
    addressInput = document.getElementById('suggested_address');
    emailInput = document.getElementById('suggested_email');
    websiteInput = document.getElementById('suggested_website');
    phoneInput = document.getElementById('suggested_phone'); // Still get phone input for submit and formatting

    // Check critical elements needed before dropdown population
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) {
        console.error("Essential form elements missing!", { formFound: !!form, messageDivFound: !!messageDiv, submitButtonFound: !!submitButton, categorySelectFound: !!categorySelect, targetListingSelectFound: !!targetListingSelect });
        showMessage('Page Error: Critical form elements could not be loaded.', 'error');
        return false; // Indicate failure
    }
    if (!contextHeader) { console.warn("Context header element (form-context) not found during init."); }
    if (!changeTypeRadios || changeTypeRadios.length === 0) { console.warn("Change type radios not found during initialization."); }
    if (!communityIdInput || !provinceNameInput || !communityNameInput) {
        console.error("Essential context hidden input elements missing!");
    }
    if (!websiteInput) { console.warn("Suggested website input element not found during init."); }
    if (!phoneInput) { console.warn("Suggested phone input element not found during init."); }

    console.log("[DEBUG] All essential form elements successfully found and assigned.");
    return true; // Indicate success
}

const urlParams = new URLSearchParams(window.location.search);
const communityIdFromUrl = urlParams.get('cid');
const provinceNameFromUrl = urlParams.get('prov');
const communityNameFromUrl = urlParams.get('comm');
let currentTableName = '';

function showMessage(msg, type = 'info') {
    if (!messageDiv) { messageDiv = document.getElementById('form-message'); if (!messageDiv) { console.error("Cannot show message, messageDiv element not found.", {msg, type}); return; } }
     messageDiv.textContent = msg; messageDiv.className = `form-message ${type}`; messageDiv.style.display = msg ? 'block' : 'none';
}

// --- START: Phone Number Formatting Function ---
function formatPhoneNumber(event) {
    const input = event.target;
    // 1. Get current value and remove all non-digit characters
    let digits = input.value.replace(/\D/g, '');

    // 2. Limit to 10 digits
    digits = digits.substring(0, 10);

    // 3. Apply formatting based on the number of digits
    let formattedValue = '';
    if (digits.length > 0) {
        // Add opening parenthesis
        formattedValue = '(' + digits.substring(0, 3);
    }
    if (digits.length >= 4) {
        // Add closing parenthesis, space, and next 3 digits
        formattedValue += ') ' + digits.substring(3, 6);
    }
    if (digits.length >= 7) {
        // Add hyphen and last 4 digits
        formattedValue += '-' + digits.substring(6, 10);
    }

    // 4. Update the input field value only if it has changed
    // This prevents potential issues with cursor position or infinite loops
    if (input.value !== formattedValue) {
        input.value = formattedValue;
    }
}
// --- END: Phone Number Formatting Function ---


// Initial Page Setup (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => { // Keep async
    console.log("[DEBUG] Suggest Change DOMContentLoaded fired.");

    // 1. Initialize and Check DOM Elements FIRST
    if (!initializeAndCheckDOMElements()) {
        console.error("[CRITICAL] Failed to initialize/find essential DOM elements. Stopping setup.");
        return; // Stop if elements are missing
    }

    // 2. Check Supabase Client
     if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Suggest Change page cannot function.");
        showMessage('Error: Cannot connect to data service.', 'error');
        if(form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading form (client).";
        return;
    }
    console.log("[DEBUG] Supabase client confirmed available.");


    // 3. Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        console.error("Missing URL parameters.");
        showMessage('Missing community info in URL.', 'error');
        if (form) form.style.display = 'none';
        if (contextHeader) contextHeader.textContent = "Error loading context (URL params).";
        return;
    }
    console.log("[DEBUG] URL parameters found:", { communityIdFromUrl, provinceNameFromUrl, communityNameFromUrl });


    // 4. Setup UI - Context Header and hidden inputs
    try {
        const decodedComm = decodeURIComponent(communityNameFromUrl);
        const decodedProv = decodeURIComponent(provinceNameFromUrl);
        if (contextHeader) {
             console.log("[DEBUG] contextHeader element FOUND. Attempting to set text...");
             contextHeader.textContent = `Suggest Change For: ${decodedComm}, ${decodedProv}`;
             console.log(`[DEBUG] Context header set to: ${contextHeader.textContent}`);
        } else {
             console.error("[DEBUG] contextHeader element was NULL/not found earlier. Cannot set text.");
        }
        if (communityIdInput) communityIdInput.value = communityIdFromUrl;
        if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl;
        if (communityNameInput) communityNameInput.value = communityNameFromUrl;

        currentTableName = decodedProv.replace(/ /g, '_');
        console.log("[DEBUG] Target Table Name (for listings):", currentTableName);
        console.log("[DEBUG] UI context setup complete.");
    } catch (e) {
        console.error("Error setting up UI from URL params:", e);
        showMessage('Error processing page context.', 'error');
        return;
    }

    // 5. Populate Dropdowns
    console.log("[DEBUG] Calling populateCategoryDropdown...");
    await populateCategoryDropdown(); // Wait for categories
    console.log("[DEBUG] Calling populateListingsDropdown...");
    await populateListingsDropdown(); // Wait for listings
    console.log("[DEBUG] Dropdown population finished.");


    // 6. Setup Listeners
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    if (changeTypeRadios && changeTypeRadios.length > 0) {
        console.log(`[DEBUG] Found ${changeTypeRadios.length} change type radios.`);
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange(); // Initial call
    } else {
        console.warn("Change type radios not found after dropdowns.");
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    } else { console.warn("Category select dropdown not for listener setup."); }
    console.log("[DEBUG] Event listeners set up attempt complete.");

    // Add Phone Formatting Listener
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
        console.log("[DEBUG] Phone number formatting listener attached.");
    } else {
        console.warn("[DEBUG] Phone input not found, cannot attach formatting listener.");
    }

    // 7. Form Submission Handler
     if(form) {
         form.addEventListener('submit', async (event) => {
             event.preventDefault();
             showMessage('');
             submitButton.disabled = true;
             submitButton.textContent = 'Submitting...';
             console.log("[DEBUG] Form submission started.");

             try {
                 // Collect form data
                 const selectedType = document.querySelector('input[name="change_type"]:checked')?.value;
                 let finalCategory = categorySelect.value;
                 if (finalCategory === '_OTHER_') {
                     finalCategory = otherCategoryInput.value.trim();
                     if (!finalCategory) { throw new Error("Please specify the 'Other' category."); }
                 }

                // Prepare data object for Supabase
                if (!communityIdInput || !communityIdInput.value) {
                     throw new Error("Community context is missing. Cannot submit.");
                }
                if (!websiteInput) {
                    console.warn("Website input element reference missing during submission prep.");
                }

                 const suggestionData = {
                     community_id: communityIdInput.value,
                     change_type: selectedType,
                     target_listing_info: targetListingSelect.required ? targetListingSelect.value || null : null,
                     suggested_name: nameInput.value.trim() || null,
                     suggested_phone: phoneInput ? phoneInput.value.trim() || null : null,
                     suggested_address: addressInput.value.trim() || null,
                     suggested_email: emailInput.value.trim() || null,
                     suggested_website: websiteInput ? websiteInput.value.trim() || null : null,
                     suggested_category: finalCategory || null,
                     suggested_notes: document.getElementById('suggested_notes').value.trim() || null,
                     submitter_comment: document.getElementById('submitter_comment').value.trim() || null,
                     status: 'PENDING'
                 };

                 console.log("[DEBUG] Data prepared for Supabase:", suggestionData);


                 // Validate required fields based on change type
                 if (selectedType === 'ADD' || selectedType === 'CHANGE') {
                     if (!suggestionData.suggested_name) throw new Error("Listing Name is required for Add/Change.");
                 }
                 if ((selectedType === 'CHANGE' || selectedType === 'DELETE') && !suggestionData.target_listing_info) {
                    throw new Error("Please select the listing to change or remove.");
                 }
                 if (suggestionData.suggested_website && !suggestionData.suggested_website.toLowerCase().startsWith('http')) {
                    console.warn("Website URL doesn't start with http/https, proceeding anyway:", suggestionData.suggested_website);
                 }


                 // Submit to Supabase
                 console.log("[DEBUG] Sending data to 'suggested_changes' table...");
                 const { error } = await supabaseClient
                     .from('suggested_changes')
                     .insert([suggestionData], { returning: 'minimal' });


                 if (error) {
                     console.error("Supabase insert error details:", error);
                     throw new Error(`Database error: ${error.message} (Code: ${error.code}). Please check RLS policies or table schema.`);
                 }

                 console.log("[DEBUG] Suggestion submitted successfully (minimal return).");
                 showMessage('Suggestion submitted successfully! Thank you.', 'success');
                 form.reset();
                 handleRadioChange();
                 handleCategoryChange();

             } catch (error) {
                 console.error("Error submitting suggestion:", error);
                 showMessage(`Error submitting suggestion: ${error.message}`, 'error');
             } finally {
                 submitButton.disabled = false;
                 submitButton.textContent = 'Submit Suggestion';
             }
         });
         console.log("[DEBUG] Form submit listener attached.");
    } else { console.error("Cannot attach submit listener, form not found earlier!");}


}); // End DOMContentLoaded


// Populate Category Dropdown (Querying categories table - Original working fetch logic)
async function populateCategoryDropdown() {
    console.log("[DEBUG] Inside populateCategoryDropdown function.");
    if (!categorySelect || !supabaseClient) {
        console.warn("Cannot populate categories: Missing element or client.");
        if(categorySelect) categorySelect.innerHTML = '<option value="">Error</option>';
        return;
    }
    const otherOption = categorySelect.querySelector('option[value="_OTHER_"]');
    categorySelect.innerHTML = '<option value="" disabled selected>Loading categories...</option>'; // Set loading
    if (otherOption) { categorySelect.appendChild(otherOption); } // Keep other option

    console.log("[DEBUG] Querying 'categories' table...");
    try {
        const { data: categoryData, error } = await supabaseClient
            .from('categories').select('category_name').order('category_name', { ascending: true });

        if (error) { throw error; } // Let catch block handle
        console.log(`[DEBUG] Fetched ${categoryData?.length || 0} categories.`);

        // Preserve placeholder and "Other..." option
        const placeholder = categorySelect.options[0]; // Get the loading/placeholder
        categorySelect.innerHTML = ''; // Clear only loading/previous data
        if (placeholder && placeholder.value === "") { // Make sure it's the placeholder
             placeholder.textContent = '-- Select Category --'; // Set correct placeholder text
             placeholder.disabled = true; // Keep it disabled
             categorySelect.appendChild(placeholder); // Add placeholder back first
        } else {
            // Fallback if placeholder wasn't found correctly
            const fallbackPlaceholder = document.createElement('option');
            fallbackPlaceholder.value = ""; fallbackPlaceholder.textContent = "-- Select Category --";
            fallbackPlaceholder.disabled = true; fallbackPlaceholder.selected = true;
            categorySelect.appendChild(fallbackPlaceholder);
        }


        if (categoryData) {
            categoryData.forEach(cat => {
                if (cat.category_name) {
                    const option = document.createElement('option');
                    option.value = cat.category_name;
                    option.textContent = cat.category_name;
                    // Insert before the "Other..." option if it exists
                    if (otherOption && categorySelect.contains(otherOption)) { // Check if otherOption is still attached
                        categorySelect.insertBefore(option, otherOption);
                    } else {
                        categorySelect.appendChild(option); // Append if Other isn't there
                    }
                }
            });
        }
        // Ensure "Other..." is last if it was preserved or add fallback
        if (otherOption && !categorySelect.contains(otherOption)) {
             categorySelect.appendChild(otherOption); // Add if it wasn't re-added
        } else if (!otherOption) {
            // Add fallback if it never existed
            const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther);
        }
        console.log("[DEBUG] Category dropdown populated by appending.");

    } catch (error) {
        console.error("Error during populateCategoryDropdown execution:", error);
        categorySelect.innerHTML = '<option value="">Error loading</option>';
        // Try to add Other even on error
        const finalOtherOption = categorySelect.querySelector('option[value="_OTHER_"]') || otherOption || (() => {const fb = document.createElement('option'); fb.value="_OTHER_"; fb.textContent="Other..."; return fb;})() ;
        if(finalOtherOption) categorySelect.appendChild(finalOtherOption);
    }
}


// Populate Listings Dropdown (Keep working version)
async function populateListingsDropdown() {
    console.log("[DEBUG] Inside populateListingsDropdown function.");
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl || !supabaseClient) {
         console.warn("Cannot populate listings dropdown: Missing element, table name, community ID, or client.");
         if(targetListingSelect) targetListingSelect.innerHTML = '<option value="">Error</option>';
         return;
    }
    targetListingSelect.innerHTML = '<option value="" disabled selected>Loading listings...</option>';
    console.log(`[DEBUG] Querying '${currentTableName}' table for listings...`);
    try {
        // Ensure communityIdFromUrl is treated as a number if your DB column is numeric
        const communityIdNum = parseInt(communityIdFromUrl, 10);
        if (isNaN(communityIdNum)) {
            throw new Error(`Invalid community ID from URL: ${communityIdFromUrl}`);
        }

        const { data: listingData, error } = await supabaseClient
             .from(currentTableName)
             .select('name') // Only select name for dropdown
             .eq('community_id', communityIdNum) // Use numeric ID
             .order('name', { ascending: true });

        if (error) { throw error; }
        console.log(`[DEBUG] Fetched ${listingData?.length || 0} listings for dropdown.`);

        // Use append method
        targetListingSelect.innerHTML = ''; // Clear loading
        const placeholder = document.createElement('option');
        placeholder.value = ""; placeholder.textContent = '-- Select Listing --';
        placeholder.disabled = true; // Keep disabled
        placeholder.selected = true; // Ensure it's selected initially
        targetListingSelect.appendChild(placeholder); // Add placeholder first

        if (listingData && listingData.length > 0) {
            listingData.forEach(listing => {
                 if (listing.name) {
                     const option = document.createElement('option');
                     option.value = listing.name; // Use name as value
                     option.textContent = listing.name;
                     targetListingSelect.appendChild(option);
                 }
             });
             console.log("[DEBUG] Listings dropdown populated by appending.");
        } else {
            placeholder.textContent = '-- No Listings Found --';
            placeholder.disabled = true; // Ensure still disabled
        }
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
}


// Handle Category Dropdown Change (Unchanged)
function handleCategoryChange() {
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { otherCategoryGroup.style.display = 'block'; otherCategoryInput.required = true; otherCategoryInput.focus(); }
    else { otherCategoryGroup.style.display = 'none'; otherCategoryInput.required = false; otherCategoryInput.value = ''; }
}

// Function to Show/Hide Conditional Fields & Set Required
function handleRadioChange() {
    const selectedType = document.querySelector('input[name="change_type"]:checked')?.value;
    if (!targetListingGroup || !targetListingSelect || !nameInput) { console.warn("Missing elements for handleRadioChange."); return; }

    // Show/hide Target Listing dropdown
    if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
        targetListingGroup.style.display = 'block';
        targetListingSelect.required = true;
    } else {
        targetListingGroup.style.display = 'none';
        targetListingSelect.required = false;
        targetListingSelect.value = '';
    }

    // Set required status for Name and Category for ADD/CHANGE
    const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
    nameInput.required = isAddOrChange;
    if (categorySelect) { categorySelect.required = isAddOrChange; }

    // --- Phone Number is NO LONGER required dynamically ---            // <<< MODIFICATION POINT
    // const phoneInput = document.getElementById('suggested_phone');    // <<< REMOVED
    // if (phoneInput) { phoneInput.required = (selectedType === 'ADD'); }// <<< REMOVED

    // Address field is never dynamically required by this script
}