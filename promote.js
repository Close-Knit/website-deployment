// --- promote.js (Add Email Confirmation Check) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements (Add confirm email input)
    const listingNamePreview = document.getElementById('listing-name-preview'); /* ... other preview elements ... */
    const listingPreviewItem = document.getElementById('listing-preview-item');
    const sponsoredLabelPreview = document.getElementById('sponsored-label-preview');
    const listingAddressPreview = document.getElementById('listing-address-preview');
    const listingPhonePreview = document.getElementById('listing-phone-preview');

    const durationOptionsContainer = document.querySelector('.duration-options');
    const durationRadios = durationOptionsContainer?.querySelectorAll('input[name="promotion_duration"]');
    const emailInput = document.getElementById('promoter-email');
    const emailConfirmInput = document.getElementById('promoter-email-confirm'); // <<< Added
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check Supabase client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... error handling ... */ return; }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // Check if essential elements exist (including email confirm)
    if (!listingNamePreview || !listingAddressPreview || !listingPhonePreview || !listingPreviewItem || !sponsoredLabelPreview ||
        !durationOptionsContainer || !durationRadios || durationRadios.length === 0 ||
        !emailInput || !emailConfirmInput || !paymentButton || !messageArea || !goBackLink) // <<< Added emailConfirmInput check
    {
        console.error("Essential page elements missing on promote.html.");
        if(listingNamePreview) listingNamePreview.textContent = "Page Load Error";
        if(paymentButton) paymentButton.disabled = true;
        return;
    }
    console.log("All essential elements and Supabase client seem available.");

    // Read URL Parameters & Populate Preview Text
    /* ... unchanged ... */
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid'); /* etc */
    const listingName = urlParams.get('name'); const address = urlParams.get('address'); const phone = urlParams.get('phone');
    if (!listingId || /* etc */ !listingName || !tableName) { /* Error */ } else { /* Populate Preview */ }


    // Make "Cancel and Go Back" Link Work
    /* ... unchanged ... */
    goBackLink.addEventListener('click', (event) => { /* ... */ });


    // Dynamic Preview Update Logic
    /* ... unchanged ... */
    function updatePreview() { /* ... */ }
    durationRadios.forEach(radio => { radio.addEventListener('change', updatePreview); });
    updatePreview(); // Initial call


    // Payment Button Click Handler (MODIFIED FOR EMAIL CONFIRMATION)
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage(''); // Clear previous messages
        const promoterEmail = emailInput.value.trim();
        const promoterEmailConfirm = emailConfirmInput.value.trim(); // <<< Get confirm value

        // --- START: Add Email Match Check ---
        if (promoterEmail !== promoterEmailConfirm) {
            showMessage('Email addresses do not match. Please re-enter.', 'error');
            emailConfirmInput.focus(); // Focus on the confirmation field
            // Optionally clear the confirmation field: emailConfirmInput.value = '';
            return; // Stop processing
        }
        // --- END: Add Email Match Check ---

        // --- Continue with existing validations ---
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedDurationInput) { showMessage('Please select a promotion duration.', 'error'); return; }

        // Validate email format (already existed)
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // --- Continue with getting Price ID and calling function ---
        let selectedDurationMonths = selectedDurationInput.value;
        let selectedPriceId = selectedDurationInput.dataset.priceid;
        if (!selectedPriceId || selectedPriceId.startsWith('YOUR_') || selectedPriceId.length < 10) { /* ... error handling ... */ return; }

        // --- Disable button and proceed with function call (unchanged) ---
        paymentButton.disabled = true; paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; showMessage('Contacting payment processor...', 'info');
        try {
            const functionPayload = { /* ... unchanged ... */ };
            const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', { body: functionPayload });
            // ... response handling unchanged ...
            if (error) { throw new Error(/* ... */); } if (data.error) { throw new Error(/* ... */); } if (data.checkoutUrl) { window.location.href = data.checkoutUrl; } else { throw new Error(/* ... */); }
        } catch (err) { /* ... error handling unchanged ... */ }
    });

    // Helper function showMessage (unchanged)
    function showMessage(msg, type = 'info') { /* ... */ }

}); // End DOMContentLoaded