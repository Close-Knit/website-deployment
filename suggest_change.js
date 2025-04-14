// --- Start: suggest_change.js (Debug Category Dropdown) ---

// ... (Supabase Init, Get DOM Elements, Get URL Params - SAME AS BEFORE) ...
let currentTableName = ''; // Ensure this is still global or accessible

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!communityId || !provinceName || !communityName) { /* ... error handling ... */ return; }
    if (contextHeader) { contextHeader.textContent = `For: ${decodeURIComponent(communityName)}, ${decodeURIComponent(provinceName)}`; }
    if (communityIdInput) communityIdInput.value = communityId;
    if (provinceNameInput) provinceNameInput.value = provinceName; 
    if (communityNameInput) communityNameInput.value = communityName; 
    
    // *** Log provinceName before creating tableName ***
    console.log("[DEBUG] Province Name from URL:", decodeURIComponent(provinceName)); 
    currentTableName = decodeURIComponent(provinceName).replace(/ /g, '_');
    console.log("[DEBUG] Determined Table Name:", currentTableName); // Log the table name
    
    populateCategoryDropdown(); // Call population
    if (changeTypeRadios.length > 0) { /* ... radio listeners ... */ } 
    if (categorySelect) { categorySelect.addEventListener('change', handleCategoryChange); }
});

// ======================================================================
// Populate Category Dropdown
// ======================================================================
async function populateCategoryDropdown() {
    if (!categorySelect || !currentTableName || !communityId) {
        console.error("[DEBUG] Missing required elements/data for category population:", { categorySelect, currentTableName, communityId });
        // Update placeholder if select exists but data missing
        if (categorySelect && categorySelect.options.length > 0 && categorySelect.options[0].value === "") {
             categorySelect.options[0].textContent = '-- Cannot Load Categories --';
        }
        return; 
    }

    console.log(`[DEBUG] Starting category fetch. Table: ${currentTableName}, Community ID: ${communityId}`); // Log before fetch

    try {
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityId)
            .not('category', 'is', null); 

        if (error) {
             console.error("[DEBUG] Supabase error fetching categories:", error);
            throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log("[DEBUG] Raw category data fetched:", categoryData); // Log raw data

        const categories = [...new Set(categoryData 
                            .map(item => item.category?.trim()) 
                            .filter(cat => cat) 
                           )].sort(); 

        console.log("[DEBUG] Processed unique categories:", categories); // Log processed list

        // --- Start: Simplified Option Handling ---
        // Store the "Other..." option temporarily
        const otherOption = categorySelect.options[categorySelect.options.length - 1]; 
        // Clear ALL existing options (including the initial "Loading...")
        categorySelect.innerHTML = ''; 
        
        // Add a new default/placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Category --";
        placeholderOption.disabled = true; // Optional: make it unselectable
        placeholderOption.selected = true; // Make it selected by default
        categorySelect.appendChild(placeholderOption);

        // Add fetched categories
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        // Re-append the "Other..." option at the end
        if (otherOption && otherOption.value === '_OTHER_') {
             categorySelect.appendChild(otherOption);
        } else {
            // Fallback if "Other..." wasn't found correctly (shouldn't happen ideally)
            const fallbackOther = document.createElement('option');
            fallbackOther.value = "_OTHER_";
            fallbackOther.textContent = "Other...";
            categorySelect.appendChild(fallbackOther);
        }
        // --- End: Simplified Option Handling ---


    } catch (error) {
        console.error("Error populating categories:", error);
        // Update placeholder text on error
         if (categorySelect.options.length > 0 && categorySelect.options[0].value === "") {
            categorySelect.options[0].textContent = 'Error loading categories';
        } else { // Add placeholder if list was cleared
             categorySelect.innerHTML = '<option value="">Error loading categories</option>';
        }
    }
}

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
if (form) { form.addEventListener('submit', async (event) => { /* ... (Same as before) ... */ }); } 

// ======================================================================
// Helper Function to Display Messages
// ======================================================================
function showMessage(msg, type = 'info') { /* ... (Same as before) ... */ }

// --- End: suggest_change.js ---