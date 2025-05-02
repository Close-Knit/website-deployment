// --- promote.js (Add Email Confirmation Check) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements (Add confirm email input)
    const listingNamePreview = document.getElementById('listing-name-preview');
    const listingAddressPreview = document.getElementById('listing-address-preview');
    const listingPhonePreview = document.getElementById('listing-phone-preview');
    const listingPreviewItem = document.getElementById('listing-preview-item');
    const sponsoredLabelPreview = document.getElementById('sponsored-label-preview');
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
    const listingId = urlParams.get('lid'); const communityId = urlParams.get('cid'); const provinceName = urlParams.get('prov'); const communityName = urlParams.get('comm'); const listingName = urlParams.get('name'); const tableName = urlParams.get('table'); const address = urlParams.get('address'); const phone = urlParams.get('phone');
    if (!listingId || /* ... */ !listingName || !tableName) { /* ... error handling ... */ }
    else { /* ... populate preview ... */
        const decodedListingName = decodeURIComponent(listingName); const decodedAddress = decodeURIComponent(address || ''); const decodedPhone = decodeURIComponent(phone || '');
        listingNamePreview.textContent = decodedListingName; if (decodedAddress) { listingAddressPreview.textContent = decodedAddress; listingAddressPreview.style.display = 'block'; } if (decodedPhone) { listingPhonePreview.textContent = `Phone: ${decodedPhone}`; listingPhonePreview.style.display = 'block'; } document.title = `Promote: ${decodedListingName}`;
    }


    // Make "Cancel and Go Back" Link Work
    /* ... unchanged ... */
    goBackLink.addEventListener('click', (event) => { event.preventDefault(); history.back(); });


    // Dynamic Preview Update Logic with Modern Radio Button Styling
    const tierClasses = ['promoted-bronze', 'promoted-silver', 'promoted-gold'];
    const labelClasses = ['bronze', 'silver', 'gold'];

    function updatePreview() {
        const selectedInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedInput) return;

        const tier = selectedInput.dataset.tier;

        // Update preview styling
        listingPreviewItem.classList.remove(...tierClasses);
        if (tier) {
            listingPreviewItem.classList.add(`promoted-${tier}`);
        }

        sponsoredLabelPreview.classList.remove(...labelClasses);
        if (tier) {
            sponsoredLabelPreview.classList.add(tier);
            sponsoredLabelPreview.textContent = "SPONSORED";
            sponsoredLabelPreview.style.visibility = 'visible';
        } else {
            sponsoredLabelPreview.style.visibility = 'hidden';
        }

        // Update radio button styling - remove 'selected' class from all labels
        const allLabels = durationOptionsContainer.querySelectorAll('label');
        allLabels.forEach(label => {
            label.classList.remove('selected');
        });

        // Add 'selected' class to the parent label of the checked radio
        const selectedLabel = selectedInput.closest('label');
        if (selectedLabel) {
            selectedLabel.classList.add('selected');
        }
    }

    durationRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    // Initialize preview and styling
    updatePreview();


    // Payment Button Click Handler (MODIFIED FOR EMAIL CONFIRMATION)
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage(''); // Clear previous messages
        // --- Reset input styles on new attempt ---
        emailInput.classList.remove('is-valid', 'is-invalid');
        emailConfirmInput.classList.remove('is-valid', 'is-invalid');
        // ---

        const promoterEmail = emailInput.value.trim();
        const promoterEmailConfirm = emailConfirmInput.value.trim(); // <<< Get confirm value

        let isValid = true; // Flag to track overall validity

        // --- Email Format Check ---
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.classList.add('is-invalid'); // Add invalid class
            emailInput.focus();
            isValid = false; // Mark as invalid
        } else {
             emailInput.classList.add('is-valid'); // Mark as valid if format is ok
        }

         // --- Confirm Email Format Check (Optional but good) ---
         if (!promoterEmailConfirm || !/\S+@\S+\.\S+/.test(promoterEmailConfirm)) {
            // Don't necessarily show a message here if the first failed, but mark invalid
            emailConfirmInput.classList.add('is-invalid');
            if (isValid) { // Only focus here if the first email was ok
                 showMessage('Please enter a valid confirmation email address.', 'error');
                 emailConfirmInput.focus();
            }
             isValid = false;
         } else if (isValid) { // Only mark valid if format is ok AND first email was ok
             emailConfirmInput.classList.add('is-valid');
         }


        // --- START: Email Match Check ---
        if (isValid && promoterEmail !== promoterEmailConfirm) { // Only check match if formats were okay
            showMessage('Email addresses do not match. Please re-enter.', 'error');
            // Mark both as invalid if they don't match
            emailInput.classList.remove('is-valid'); // Remove valid if previously set
            emailInput.classList.add('is-invalid');
            emailConfirmInput.classList.remove('is-valid'); // Remove valid if previously set
            emailConfirmInput.classList.add('is-invalid');
            emailConfirmInput.focus(); // Focus on the confirmation field
            isValid = false; // Mark as invalid
        } else if (isValid) {
            // If they match AND both had valid formats, ensure both have valid class
             emailInput.classList.add('is-valid');
             emailConfirmInput.classList.add('is-valid');
        }
        // --- END: Email Match Check ---


        // --- Duration Check ---
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedDurationInput) {
            showMessage('Please select a promotion duration.', 'error');
            isValid = false;
        }

        // --- Stop if any validation failed ---
        if (!isValid) {
            return;
        }

        // --- Passed all checks - Proceed ---
        let selectedDurationMonths = selectedDurationInput.value;
        let selectedPriceId = selectedDurationInput.dataset.priceid;
        // Final check on Price ID just in case HTML was edited incorrectly
        if (!selectedPriceId || selectedPriceId.length < 10) { // Removed YOUR_ check as it relies on placeholder
             console.error("Stripe Price ID missing or invalid!");
             showMessage('Payment configuration error.', 'error');
             return;
        }

        paymentButton.disabled = true; paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; showMessage('Contacting payment processor...', 'info');
        try {
            const functionPayload = { listingId, tableName, communityId, provinceName: decodeURIComponent(provinceName), communityName: decodeURIComponent(communityName), listingName: decodeURIComponent(listingName), promoterEmail, priceId: selectedPriceId, durationMonths: selectedDurationMonths };
            const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', { body: functionPayload });
            if (error) { throw new Error(`Function invocation error: ${error.message}`); }
            if (data.error) { throw new Error(`Payment processing error: ${data.error}`); }
            if (data.checkoutUrl) { window.location.href = data.checkoutUrl; }
            else { throw new Error('Invalid response from payment processor.'); }
        } catch (err) {
            console.error('Payment initiation failed:', err);
            showMessage(`Error: ${err.message}`, 'error');
            paymentButton.disabled = false;
            paymentButton.innerHTML = '<i class="fa-brands fa-stripe-s"></i> Proceed to Payment';
        }
    });

    // Helper function showMessage
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        messageArea.className = ''; // Clear previous classes first
        if (msg) {
            messageArea.classList.add(type === 'error' ? 'error-message' : 'info-message');
            messageArea.style.display = 'block';
        } else {
            messageArea.style.display = 'none';
        }
    }

}); // End DOMContentLoaded