// --- Start: suggest_change.js (Restore Categories, Fix nameInput, Keep Submit Fixes) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
// Initialize client immediately if supabase library is available
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally for access by functions)
// ======================================================================
let form, messageDiv, submitButton, changeTypeRadios, targetListingGroup, contextHeader, communityIdInput, provinceNameInput, communityNameInput, targetInput, nameInput, categorySelect, otherCategoryGroup, otherCategoryInput, addressInput, emailInput; 

// Function to assign global DOM elements (called on DOMContentLoaded)
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
    targetInput = document.getElementById('target_listing_info');
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
let currentTableName = ''; // Will be set in DOMContentLoaded

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired.");

    // Assign DOM elements to global variables
    initializeDOMElements(); 

    // Check if essential elements were found
    if (!form || !messageDiv || !submitButton || !categorySelect) {
        console.error("Essential form elements not found! Aborting setup.");
        if (messageDiv) showMessage('Error: Page structure incorrect. Cannot initialize form.', 'error');
        return;
    }

    // Check Supabase Client
    if (!supabaseClient) {
        showMessage('Error: Supabase client failed to initialize.', 'error');
        if(form) form.style.display = 'none';
        return;
    }

    // Validate and Set Context from URL
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) {
        showMessage('Error: Missing community info in URL.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    // Display context 
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    // Populate hidden fields 
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    // Populate Categories
    populateCategoryDropdown(); // Uses globals
    
    // Set up listeners
    if (changeTypeRadios && changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); 
        handleRadioChange(); // Initial call relies on globals 
    } else {
        console.warn("Change type radio buttons not found.");
    }
    
    if (categorySelect) { 
        categorySelect.addEventListener('change', handleCategoryChange); 
    }

    // --- Form Submission Handler ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        showMessage(''); // Clear message
        if (!submitButton) return; 

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Get ID from URL param captured on load
        const submitCommunityId = communityIdFromUrl; 

        // Get other form data using global element variables
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        const targetInfo = targetInput?.value;
        const name = nameInput?.value;
        const phone = document.getElementById('suggested_phone')?.value; // Get fresh value
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
        else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { showMessage('Please specify listing.', 'error'); validationPassed = false; } 
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
            if (data || status === 201) { showMessage('Thank you! Your suggestion has been submitted. It may take a few days to appear after verification.', 'success'); form.reset(); handleRadioChange(); handleCategoryChange(); } 
            else { throw new Error("Submission potentially failed."); }
        } catch (error) { console.error("Error submitting:", error); showMessage(`Error: ${error.message || 'Unknown error.'}`, 'error'); } 
        finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Submit Suggestion'; } }
    });
    
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Uses global variables)
// ======================================================================
async function populateCategoryDropdown() { 
    // Uses global categorySelect, currentTableName, communityIdFromUrl
    if (!categorySelect || !currentTableName || !communityIdFromUrl) {
         console.error("[DEBUG] Missing required elements/data for category population");
         if (categorySelect && categorySelect.options.length > 0 && categorySelect.options[0].value === "") {
              categorySelect.options[0].textContent = '-- Cannot Load Categories --';
         }
        return; 
    }

    console.log(`[DEBUG] Starting category fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 

    try {
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityIdFromUrl) 
            .not('category', 'is', null); 

        if (error) { throw new Error(`Failed to fetch categories: ${error.message}`); }

        console.log("[DEBUG] Raw category data fetched:", categoryData); 

        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 

        console.log("[DEBUG] Processed unique categories:", categories); 

        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); 
        categorySelect.innerHTML = ''; // Clear ALL existing options 

        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; 
        placeholderOption.selected = true; 
        categorySelect.appendChild(placeholderOption);

        categories.forEach(cat => { 
            const option = document.createElement('option'); 
            option.value = cat; 
            option.textContent = cat; 
            categorySelect.appendChild(option); 
        });

        // Re-append the "Other..." option
        if (otherOption) { 
             categorySelect.appendChild(otherOption);
        } else { 
            const fallbackOther = document.createElement('option');
            fallbackOther.value = "_OTHER_";
            fallbackOther.textContent = "Other...";
            categorySelect.appendChild(fallbackOther);
        }

    } catch (error) {
        console.error("Error populating categories:", error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>'; 
    }
}

// ======================================================================
// Handle Category Dropdown Change (Uses global variables)
// ======================================================================
function handleCategoryChange() { 
    // Uses global categorySelect, otherCategoryGroup, otherCategoryInput
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { 
        otherCategoryGroup.style.display = 'block'; 
        otherCategoryInput.required = true; 
        otherCategoryInput.focus(); 
    } 
    else { 
        otherCategoryGroup.style.display = 'none'; 
        otherCategoryInput.required = false; 
        otherCategoryInput.value = ''; 
    }
}

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Uses globals)
// ======================================================================
function handleRadioChange() { 
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     // Uses global targetListingGroup, targetInput, nameInput
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
     // *** Ensures correct global variable name is used ***
     nameInput.required = isAddOrChange; 
}

// ======================================================================
// Helper Function to Display Messages (Uses global messageDiv)
// ======================================================================
function showMessage(msg, type = 'info') { 
     if (!messageDiv) return; 
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`; 
     messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---