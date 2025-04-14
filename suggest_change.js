// --- Start: suggest_change.js (Restore Category Population Call) ---

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// ======================================================================
// Get DOM Elements (Defined Globally) 
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
    // targetInput = document.getElementById('target_listing_info'); // Old input ref removed
    targetListingSelect = document.getElementById('target_listing_select'); // New select ref
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

    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) { 
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

    // *** Ensure BOTH dropdown population functions are called ***
    populateCategoryDropdown(); // Call category population
    populateListingsDropdown(); // Call listing population

    // Set up listeners
    if (changeTypeRadios && changeTypeRadios.length > 0) { changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); handleRadioChange(); } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }

    // Form Submission Handler
    form.addEventListener('submit', async (event) => { /* ... (Submit handler remains unchanged from previous version) ... */ });
    
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Function definition unchanged)
// ======================================================================
async function populateCategoryDropdown() { 
    if (!categorySelect || !currentTableName || !communityIdFromUrl) { /* ... */ return; }
    console.log(`[DEBUG] Starting category fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 
    try {
        const { data: categoryData, error } = await supabaseClient.from(currentTableName).select('category').eq('community_id', communityIdFromUrl).not('category', 'is', null); 
        if (error) { throw new Error(`Failed to fetch categories: ${error.message}`); }
        console.log("[DEBUG] Raw category data fetched:", categoryData); 
        const categories = [...new Set(categoryData.map(item => item.category?.trim()).filter(cat => cat))].sort(); 
        console.log("[DEBUG] Processed unique categories:", categories); 
        const otherOption = categorySelect.querySelector('option[value="_OTHER_"]'); 
        categorySelect.innerHTML = ''; 
        const placeholderOption = document.createElement('option'); placeholderOption.value = ""; placeholderOption.textContent = "-- Select Category --"; placeholderOption.disabled = true; placeholderOption.selected = true; 
        categorySelect.appendChild(placeholderOption);
        categories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; categorySelect.appendChild(option); });
        if (otherOption) { categorySelect.appendChild(otherOption); } else { const fallbackOther = document.createElement('option'); fallbackOther.value = "_OTHER_"; fallbackOther.textContent = "Other..."; categorySelect.appendChild(fallbackOther); }
    } catch (error) { console.error("Error populating categories:", error); categorySelect.innerHTML = '<option value="">Error loading categories</option>'; }
}

// ======================================================================
// Populate Listings Dropdown (Function definition unchanged)
// ======================================================================
async function populateListingsDropdown() {
    if (!targetListingSelect || !currentTableName || !communityIdFromUrl) { /* ... */ return; }
    console.log(`[DEBUG] Starting listing name fetch. T: ${currentTableName}, ID: ${communityIdFromUrl}`); 
    try {
        const { data: listingData, error } = await supabaseClient.from(currentTableName).select('name').eq('community_id', communityIdFromUrl).order('name', { ascending: true });
        if (error) { throw new Error(`Failed to fetch listing names: ${error.message}`); }
        console.log("[DEBUG] Listing names fetched:", listingData); 
        while (targetListingSelect.options.length > 1) { targetListingSelect.remove(1); }
        if (targetListingSelect.options.length > 0 && targetListingSelect.options[0].value === "") { targetListingSelect.options[0].textContent = '-- Select Listing --'; } else { targetListingSelect.innerHTML = '<option value="">-- Select Listing --</option>';}
        if (listingData && listingData.length > 0) { listingData.forEach(listing => { if (listing.name) { const option = document.createElement('option'); option.value = listing.name; option.textContent = listing.name; targetListingSelect.appendChild(option); } }); } 
        else { console.log("[DEBUG] No existing listings found."); targetListingSelect.options[0].textContent = '-- No Listings Found --';}
    } catch (error) { console.error("Error populating listings dropdown:", error); targetListingSelect.innerHTML = '<option value="">Error loading listings</option>'; }
}

// ======================================================================
// Handle Category Dropdown Change (Function definition unchanged)
// ======================================================================
function handleCategoryChange() { /* ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Function definition unchanged)
// ======================================================================
function handleRadioChange() { /* ... */ }

// ======================================================================
// Helper Function to Display Messages (Function definition unchanged)
// ======================================================================
function showMessage(msg, type = 'info') { /* ... */ }

// --- End: suggest_change.js ---