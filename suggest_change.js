// --- Start: suggest_change.js (Dynamic Category Dropdown) ---

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
const categorySelect = document.getElementById('suggested_category_select'); // <-- New
const otherCategoryGroup = document.getElementById('other-category-group'); // <-- New
const otherCategoryInput = document.getElementById('suggested_category_other'); // <-- New
const addressInput = document.getElementById('suggested_address'); // <-- New (if using field)
const emailInput = document.getElementById('suggested_email'); // <-- New (if using field)

// ======================================================================
// Get Context from URL Parameters
// ======================================================================
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('cid');
const provinceName = urlParams.get('prov');
const communityName = urlParams.get('comm');
let currentTableName = ''; // Store table name for category fetching

// ======================================================================
// Initial Page Setup (on DOMContentLoaded)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!communityId || !provinceName || !communityName) {
        showMessage('Error: Missing community information in URL. Please go back.', 'error');
        if (form) form.style.display = 'none'; 
        if (contextHeader) contextHeader.textContent = "Error loading form context.";
        return;
    }

    // Display context 
    if (contextHeader) {
        contextHeader.textContent = `For: ${decodeURIComponent(communityName)}, ${decodeURIComponent(provinceName)}`;
    }
    
    // Populate hidden fields
    if (communityIdInput) communityIdInput.value = communityId;
    if (provinceNameInput) provinceNameInput.value = provinceName; 
    if (communityNameInput) communityNameInput.value = communityName; 

    // Determine table name for category fetching
    currentTableName = decodeURIComponent(provinceName).replace(/ /g, '_');

    // Populate category dropdown
    populateCategoryDropdown(); // <-- New function call

    // Add listener for radio buttons
    if (changeTypeRadios.length > 0) {
        changeTypeRadios.forEach(radio => radio.addEventListener('change', handleRadioChange));
        handleRadioChange(); 
    } 
    
    // Add listener for category dropdown change
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    }
});

// ======================================================================
// Populate Category Dropdown
// ======================================================================
async function populateCategoryDropdown() {
    if (!categorySelect || !currentTableName || !communityId) return; // Exit if elements/data missing

    try {
        console.log(`Fetching categories for community ${communityId} from table ${currentTableName}`);
        
        // Fetch all non-null categories for this specific community
        const { data: categoryData, error } = await supabaseClient
            .from(currentTableName)
            .select('category')
            .eq('community_id', communityId)
            .not('category', 'is', null); // Exclude null categories

        if (error) {
            throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        // Process categories: Get unique, non-empty, sorted values
        const categories = [...new Set(categoryData // Create Set for unique values
                            .map(item => item.category?.trim()) // Get category, trim whitespace
                            .filter(cat => cat) // Filter out empty strings after trimming
                           )].sort(); // Convert Set back to array and sort

        console.log("Found categories:", categories);

        // Clear existing options (except the placeholder and "Other")
        // Keep first ("Loading...") and last ("Other...") option, remove others
        while (categorySelect.options.length > 1 && categorySelect.options[1].value !== '_OTHER_') {
            categorySelect.remove(1); 
        }

        // Add fetched categories as options before the "Other" option
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            // Insert before the "Other" option
            categorySelect.insertBefore(option, categorySelect.options[categorySelect.options.length - 1]);
        });

        // Update placeholder text now that loading is done
        if (categorySelect.options[0].value === "") {
             categorySelect.options[0].textContent = '-- Select Category --';
        }

    } catch (error) {
        console.error("Error populating categories:", error);
        if (categorySelect.options[0].value === "") {
            categorySelect.options[0].textContent = 'Error loading categories';
        }
        // Optionally disable the dropdown or show an error message
    }
}

// ======================================================================
// Handle Category Dropdown Change (Show/Hide Other Input)
// ======================================================================
function handleCategoryChange() {
    if (!categorySelect || !otherCategoryGroup || !otherCategoryInput) return;

    if (categorySelect.value === '_OTHER_') {
        otherCategoryGroup.style.display = 'block'; // Show the text input group
        otherCategoryInput.required = true; // Make the text input required
        otherCategoryInput.focus(); // Focus the input
    } else {
        otherCategoryGroup.style.display = 'none'; // Hide the group
        otherCategoryInput.required = false; // Make not required
        otherCategoryInput.value = ''; // Clear the value
    }
}

// ======================================================================
// Function to Show/Hide Conditional Fields (Target Listing)
// ======================================================================
function handleRadioChange() { /* ... (Same as before, ensure required fields are handled) ... */ }

// ======================================================================
// Form Submission Handler
// ======================================================================
if (form) { 
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        showMessage(''); 
        if (!submitButton) return; 
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Get data
        const changeType = document.querySelector('input[name="change_type"]:checked')?.value;
        const targetInfo = targetInput?.value;
        const name = nameInput?.value;
        const phone = document.getElementById('suggested_phone')?.value;
        const address = addressInput?.value; // Get address
        const email = emailInput?.value; // Get email
        
        // *** Start: Get Category Value Logic ***
        let category = categorySelect?.value;
        if (category === '_OTHER_') {
            category = otherCategoryInput?.value.trim() || null; // Use other input, fallback to null if empty
        } else if (category === "") {
            category = null; // Treat "-- Select --" as null
        }
        // *** End: Get Category Value Logic ***
        
        const notes = document.getElementById('suggested_notes')?.value;
        const comment = document.getElementById('submitter_comment')?.value;
        const currentCommunityId = communityIdInput?.value; 

        // Validation
        if (!currentCommunityId) { /*...*/ } 
        else if (!changeType) { /*...*/ } 
        else if ((changeType === 'CHANGE' || changeType === 'DELETE') && !targetInfo) { /*...*/ } 
        else if ((changeType === 'ADD' || changeType === 'CHANGE') && !name) { /*...*/ }
        // *** Add validation for 'Other' category input if needed ***
         else if (categorySelect?.value === '_OTHER_' && !category) { 
              showMessage('Please specify the category name when selecting "Other".', 'error');
         } 
        else {
            // Submit to Supabase
            try {
                console.log("Submitting suggestion:", { community_id: parseInt(currentCommunityId, 10), change_type: changeType, target: targetInfo, name: name, phone: phone, category: category }); 

                const { data, error, status } = await supabaseClient
                    .from('suggested_changes')
                    .insert([
                        { 
                            community_id: parseInt(currentCommunityId, 10), 
                            change_type: changeType,
                            status: 'PENDING', 
                            target_listing_info: (changeType === 'CHANGE' || changeType === 'DELETE') ? targetInfo : null,
                            suggested_name: (changeType === 'ADD' || changeType === 'CHANGE') ? name : null,
                            suggested_phone: phone || null,
                            // *** Use derived category variable ***
                            suggested_category: category, 
                            suggested_notes: notes || null,
                            submitter_comment: comment || null,
                            // *** Add address and email if columns exist ***
                             suggested_address: address || null, // Assuming columns exist
                             suggested_email: email || null    // Assuming columns exist
                        }
                    ])
                    .select(); 

                console.log("Supabase response:", { data, error, status }); 

                if (error) throw error; 
                if (data || status === 201) { 
                    showMessage('Suggestion submitted successfully!', 'success');
                    form.reset(); 
                    handleRadioChange(); 
                    handleCategoryChange(); // Reset other category field too
                } else {
                     throw new Error("Submission failed. No data returned.");
                }
                
            } catch (error) { /* ... Error handling ... */ } 
            finally { /* ... Re-enable button ... */ }
            return; 
        }
        
        // Re-enable button if validation failed earlier
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Suggestion';
    });
} 

// ======================================================================
// Helper Function to Display Messages
// ======================================================================
function showMessage(msg, type = 'info') { /* ... (Same as before) ... */ }

// --- End: suggest_change.js ---