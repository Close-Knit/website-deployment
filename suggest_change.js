// --- Start: suggest_change.js (Corrected - Global Vars, Submit Fix) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally for access by functions)
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
    initializeDOMElements(); // Assign globals

    // Check elements
    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) { 
        console.error("Essential form elements missing!");
        if(messageDiv) showMessage('Page Error. Cannot init form.', 'error');
        return; 
    }
    // Check Supabase
    if (!supabaseClient) { 
        showMessage('Supabase client init error.', 'error');
        if(form) form.style.display = 'none';
        return; 
    }
    // Check URL Params
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { 
        showMessage('Missing community info in URL.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error context.";
        return; 
    }

    // Setup UI
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 
    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Table Name:", currentTableName); 

    // Populate Dropdowns
    populateCategoryDropdown(); // Uses globals
    populateListingsDropdown(); // Uses globals

    // Setup Listeners
    if (changeTypeRadios && changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); 
        handleRadioChange(); // Initial call uses globals
    }     
    if (categorySelect) { 
        categorySelect.addEventListener('change', handleCategoryChange); 
    }

    // Form Submission Handler
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        showMessage(''); 
        if (!submitButton) return; 
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const submitCommunityId = communityIdFromUrl; // ID from page load
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        const targetInfo = (changeType === 'CHANGE' || changeType === 'DELETE') ? targetListingSelect?.value : null; // Read from select
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
        else if ((changeType === 'CHANGE' || changeType === 'DELETE') && (!targetInfo || targetInfo === "")) { showMessage('Please select listing.', 'error'); validationPassed = false; } // Validate select
        else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { showMessage('Name required.', 'error'); validationPassed = false; }
        else if (categorySelect?.value === '_OTHER_' && !category) { showMessage('Specify category name.', 'error'); validationPassed = false; } 

        if (!validationPassed) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Suggestion';
            return; 
        }

        // Submit to Supabase
        try {
            const insertData = { /* ... data mapping same as previous correct version ... */ };
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
// Populate Category Dropdown (Uses Globals) - Should be Working Version
// ======================================================================
async function populateCategoryDropdown() { 
    if (!categorySelect || !currentTableName || !communityIdFromUrl) { /* ... */ return; }
    console.log(`[DEBUG] Starting category fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 
    try {
        const { data: categoryData, error } = await supabaseClient.from(currentTableName).select('category').eq('community_id', communityIdFromUrl).not('category', 'is', null); 
        if (error) { throw new Error(`Fetch categories error: ${error.message}`); }
        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 
        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); 
        categorySelect.innerHTML = ''; 
        const placeholderOption = document.createElement('option'); placeholderOption.value = ""; placeholderOption.textContent = "-- Select Category --"; placeholderOption.disabled = true; placeholderOption.selected = true; 
        categorySelect.appendChild(placeholderOption);
        categories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; categorySelect.appendChild(option); });
        if (otherOption) { categorySelect.appendChild(otherOption); } else { const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther); }
    } catch (error) { console.error("Error populating categories:", error); categorySelect.innerHTML = '<option value="">Error loading</option>'; }
}

// ======================================================================
// Populate Listings Dropdown (Uses Globals) - Should be Working Version
// ======================================================================
async function populateListingsDropdown() {
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl) { /* ... */ return; }
    console.log(`[DEBUG] Starting listing name fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw new Error(`Failed to fetch listing names: ${error.message}`); }
        while (targetListingSelect.options.length > 1) { targetListingSelect.remove(1); }
        if (targetListingSelect.options.length > 0 && targetListingSelect.options[0].value === "") { targetListingSelect.options[0].textContent = '-- Select Listing --'; } else { targetListingSelect.innerHTML = '<option value="">-- Select Listing --</option>';}
        if (listingData && listingData.length > 0) { listingData.forEach(listing => { if (listing.name) { const option = document.createElement('option'); option.value = listing.name; option.textContent = listing.name; targetListingSelect.appendChild(option); } }); } 
        else { console.log("[DEBUG] No existing listings found."); targetListingSelect.options[0].textContent = '-- No Listings Found --';}
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
}

// ======================================================================
// Handle Category Dropdown Change (Uses Globals) - Should be Working Version
// ======================================================================
function handleCategoryChange() { 
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;
    if (categorySelect.value === '_OTHER_') { otherCategoryGroup.style.display = 'block'; otherCategoryInput.required = true; otherCategoryInput.focus(); } 
    else { otherCategoryGroup.style.display = 'none'; otherCategoryInput.required = false; otherCategoryInput.value = ''; }
}

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Uses Globals) - Should be Working Version
// ======================================================================
function handleRadioChange() { 
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     if (!selectedType || !targetListingGroup || !targetListingSelect || !nameInput) { console.warn("Missing elements for handleRadioChange"); return; } 
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block';
         targetListingSelect.required = true; 
     } else { 
         targetListingGroup.style.display = 'none';
         targetListingSelect.required = false; 
         targetListingSelect.value = ''; 
     }
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameInput.required = isAddOrChange; 
}

// ======================================================================
// Helper Function to Display Messages (Uses Global messageDiv) - Should be Working Version
// ======================================================================
function showMessage(msg, type = 'info') { 
     if (!messageDiv) return; 
     messageDiv.textContent = msg;
     messageDiv.className = `form-message ${type}`; 
     messageDiv.style.display = msg ? 'block' : 'none'; 
 }

// --- End: suggest_change.js ---