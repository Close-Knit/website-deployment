// --- Start: suggest_change.js (Restore Listing Dropdown ONLY) ---

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
    targetListingSelect, // New select ref
    nameInput, categorySelect, otherCategoryGroup, otherCategoryInput, 
    addressInput, emailInput; 

function initializeDOMElements() {
    form = document.getElementById('suggestion-form');
    messageDiv = document.getElementById('form-message');
    submitButton = document.getElementById('submit-button');
    changeTypeRadios = document.querySelectorAll('input[name="change_type"]');
    targetListingGroup = document.getElementById('target-listing-group'); // Div containing the select
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
    initializeDOMElements(); 

    if (!form || !messageDiv || !submitButton || !categorySelect || !targetListingSelect) { /* ... */ return; }
    if (!supabaseClient) { /* ... */ return; }
    if (!communityIdFromUrl || !provinceNameFromUrl || !communityNameFromUrl) { /* ... */ return; }

    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityNameFromUrl)}, ${decodeURIComponent(provinceNameFromUrl)}`; }
    if (communityIdInput) communityIdInput.value = communityIdFromUrl; 
    if (provinceNameInput) provinceNameInput.value = provinceNameFromUrl; 
    if (communityNameInput) communityNameInput.value = communityNameFromUrl; 

    currentTableName = decodeURIComponent(provinceNameFromUrl).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); 

    // Populate BOTH dropdowns
    populateCategoryDropdown(); 
    populateListingsDropdown(); // <-- Ensure this is called

    // Set up listeners
    if (changeTypeRadios && changeTypeRadios.length > 0) { 
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange)); 
        handleRadioChange(); // <-- Ensure initial call uses correct globals
    } 
    
    if (categorySelect) { 
        categorySelect.addEventListener('change', handleCategoryChange); 
    }

    // Form Submission Handler
    form.addEventListener('submit', async (event) => { /* ... (Submit handler unchanged) ... */ });
    
}); // End DOMContentLoaded


// ======================================================================
// Populate Category Dropdown (Function definition unchanged)
// ======================================================================
async function populateCategoryDropdown() { /* ... (Keep working version) ... */ }

// ======================================================================
// Populate Listings Dropdown (Function definition unchanged)
// ======================================================================
async function populateListingsDropdown() { /* ... (Keep working version) ... */ }

// ======================================================================
// Handle Category Dropdown Change (Function definition unchanged)
// ======================================================================
function handleCategoryChange() { /* ... (Keep working version) ... */ }

// ======================================================================
// Function to Show/Hide Conditional Fields & Set Required (Corrected Version)
// ======================================================================
function handleRadioChange() { 
     const selectedType = document.querySelector('input[name="change_type"]:checked')?.value; 
     
     // *** Use globally defined element variables ***
     if (!selectedType || !targetListingGroup || !targetListingSelect || !nameInput) { 
         console.warn("Missing elements for handleRadioChange"); 
         return; 
     } 
     
     // *** Logic to show/hide the SELECT dropdown group ***
     if (selectedType === 'CHANGE' || selectedType === 'DELETE') {
         targetListingGroup.style.display = 'block'; // Show the div containing the select
         targetListingSelect.required = true;      // Make the select required
     } else { // ADD type selected
         targetListingGroup.style.display = 'none';  // Hide the div containing the select
         targetListingSelect.required = false;     // Make select not required
         targetListingSelect.value = '';           // Reset selection
     }
     
     // *** Logic to set required on Name input (using global nameInput) ***
     const isAddOrChange = selectedType === 'ADD' || selectedType === 'CHANGE';
     nameInput.required = isAddOrChange; 
}

// ======================================================================
// Helper Function to Display Messages (Function definition unchanged)
// ======================================================================
function showMessage(msg, type = 'info') { /* ... (Keep working version) ... */ }

// --- End: suggest_change.js ---