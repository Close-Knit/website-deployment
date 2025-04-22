// --- promote.js (Generic Label for Dynamic Preview - CAREFUL EDIT) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements
    const listingNamePreview = document.getElementById('listing-name-preview');
    const listingAddressPreview = document.getElementById('listing-address-preview');
    const listingPhonePreview = document.getElementById('listing-phone-preview');
    const listingPreviewItem = document.getElementById('listing-preview-item');
    const sponsoredLabelPreview = document.getElementById('sponsored-label-preview');

    const durationOptionsContainer = document.querySelector('.duration-options');
    const durationRadios = durationOptionsContainer?.querySelectorAll('input[name="promotion_duration"]');
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check Supabase client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... */ return; }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // Check elements
    if (!listingNamePreview || !listingAddressPreview || !listingPhonePreview || !listingPreviewItem || !sponsoredLabelPreview || !durationOptionsContainer || !durationRadios || durationRadios.length === 0 || !emailInput || !paymentButton || !messageArea || !goBackLink) { /* ... */ return; }
    console.log("All essential elements and Supabase client seem available.");

    // Read URL Parameters & Populate Preview Text
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid'); /* ... other params ... */
    const listingName = urlParams.get('name'); const address = urlParams.get('address'); const phone = urlParams.get('phone'); const tableName = urlParams.get('table'); const communityId = urlParams.get('cid'); const provinceName = urlParams.get('prov'); const communityName = urlParams.get('comm');
    // Validate Core Params & Populate Preview Text
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) { /* ... */ }
    else {
        const decodedListingName = decodeURIComponent(listingName);
        const decodedAddress = decodeURIComponent(address || '');
        const decodedPhone = decodeURIComponent(phone || '');
        listingNamePreview.textContent = decodedListingName;
        if (decodedAddress) { listingAddressPreview.textContent = decodedAddress; listingAddressPreview.style.display = 'block'; }
        if (decodedPhone) { listingPhonePreview.textContent = `Phone: ${decodedPhone}`; listingPhonePreview.style.display = 'block'; }
        document.title = `Promote: ${decodedListingName}`;
    }

    // Make "Cancel and Go Back" Link Work
    goBackLink.addEventListener('click', (event) => { /* ... */ });

    // --- Dynamic Preview Update Logic ---
    const tierClasses = ['promoted-bronze', 'promoted-silver', 'promoted-gold'];
    const labelClasses = ['bronze', 'silver', 'gold'];

    function updatePreview() {
        const selectedInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedInput) return;
        const tier = selectedInput.dataset.tier;

        console.log(`Updating preview for tier: ${tier}`);
        // Update preview item class
        listingPreviewItem.classList.remove(...tierClasses);
        if (tier) { listingPreviewItem.classList.add(`promoted-${tier}`); }

        // Update label class and text
        sponsoredLabelPreview.classList.remove(...labelClasses);
        if (tier) {
            sponsoredLabelPreview.classList.add(tier); // Add specific tier class for color
            // *** CHANGE HERE: Set text to "Sponsored" ***
            sponsoredLabelPreview.textContent = "Sponsored"; // Set generic text
            sponsoredLabelPreview.style.visibility = 'visible';
        } else {
            sponsoredLabelPreview.style.visibility = 'hidden';
        }
    }

    // Add event listener
    durationRadios.forEach(radio => { radio.addEventListener('change', updatePreview); });
    // Initial Preview Update
    updatePreview();


    // Payment Button Click Handler (Unchanged)
    paymentButton.addEventListener('click', async () => { /* ... unchanged ... */ });

    // Helper function showMessage (Unchanged)
    function showMessage(msg, type = 'info') { /* ... unchanged ... */ }

}); // End DOMContentLoaded