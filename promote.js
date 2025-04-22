// --- promote.js (Fix tableName ReferenceError) ---

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
    const emailConfirmInput = document.getElementById('promoter-email-confirm');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check Supabase client
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { /* ... error handling ... */ return; }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // Check elements
    if (!listingNamePreview || !listingAddressPreview || !listingPhonePreview || !listingPreviewItem || !sponsoredLabelPreview || !durationOptionsContainer || !durationRadios || durationRadios.length === 0 || !emailInput || !emailConfirmInput || !paymentButton || !messageArea || !goBackLink) { /* ... error handling ... */ return; }
    console.log("All essential elements and Supabase client seem available.");

    // --- 1. Read URL Parameters (Ensure all are read) ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name');
    const tableName = urlParams.get('table'); // <<< ENSURE THIS LINE IS PRESENT
    const address = urlParams.get('address');
    const phone = urlParams.get('phone');

    console.log("--- URL Parameters Read ---");
    console.log("listingId:", listingId);
    console.log("communityId:", communityId);
    console.log("provinceName:", provinceName);
    console.log("communityName:", communityName);
    console.log("listingName (raw):", listingName);
    console.log("tableName (raw):", tableName); // Log tableName
    console.log("address (raw):", address);
    console.log("phone (raw):", phone);
    console.log("--------------------------");


    // --- 2. Validate Core Params & Populate Preview Text ---
    // Ensure tableName is included in the check
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        console.error("Validation Failed: Core URL parameters are missing!", {listingId, communityId, provinceName, communityName, listingName, tableName}); // Log which might be missing
        listingNamePreview.textContent = "Error: Missing Info";
        listingNamePreview.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        const decodedListingName = decodeURIComponent(listingName);
        const decodedAddress = decodeURIComponent(address || '');
        const decodedPhone = decodeURIComponent(phone || '');

        // Populate text placeholders
        listingNamePreview.textContent = decodedListingName;
        if (decodedAddress) {
            listingAddressPreview.textContent = decodedAddress;
            listingAddressPreview.style.display = 'block';
        }
        if (decodedPhone) {
             listingPhonePreview.textContent = `Phone: ${decodedPhone}`;
             listingPhonePreview.style.display = 'block';
        }
        document.title = `Promote: ${decodedListingName}`;
        console.log('Promotion Context seems valid. Preview text populated.');
    }

    // --- 3. Make "Cancel and Go Back" Link Work (unchanged) ---
    goBackLink.addEventListener('click', (event) => { event.preventDefault(); history.back(); });

    // --- 4. Dynamic Preview Update Logic ---
    /* ... unchanged ... */
    const tierClasses = ['promoted-bronze', 'promoted-silver', 'promoted-gold']; const labelClasses = ['bronze', 'silver', 'gold'];
    function updatePreview() { const selectedInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked'); if (!selectedInput) return; const tier = selectedInput.dataset.tier; listingPreviewItem.classList.remove(...tierClasses); if (tier) { listingPreviewItem.classList.add(`promoted-${tier}`); } sponsoredLabelPreview.classList.remove(...labelClasses); if (tier) { sponsoredLabelPreview.classList.add(tier); sponsoredLabelPreview.textContent = "Sponsored"; sponsoredLabelPreview.style.visibility = 'visible'; } else { sponsoredLabelPreview.style.visibility = 'hidden'; } }
    durationRadios.forEach(radio => { radio.addEventListener('change', updatePreview); });
    updatePreview();


    // --- 5. Payment Button Click Handler ---
    paymentButton.addEventListener('click', async () => {
        // ... (Email check, duration/price ID check unchanged) ...
        const promoterEmail = emailInput.value.trim(); const promoterEmailConfirm = emailConfirmInput.value.trim();
        if (promoterEmail !== promoterEmailConfirm) { showMessage('Email addresses do not match.', 'error'); emailConfirmInput.focus(); return; }
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedDurationInput) { showMessage('Please select duration.', 'error'); return; }
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) { showMessage('Please enter valid email.', 'error'); emailInput.focus(); return; }
        let selectedDurationMonths = selectedDurationInput.value; let selectedPriceId = selectedDurationInput.dataset.priceid;
        if (!selectedPriceId || selectedPriceId.startsWith('YOUR_') || selectedPriceId.length < 10) { showMessage('Payment config error.', 'error'); return; }

        paymentButton.disabled = true; paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; showMessage('Contacting payment processor...', 'info');
        try {
            // Ensure tableName is included in the payload
            const functionPayload = { listingId, tableName, communityId, provinceName: decodeURIComponent(provinceName), communityName: decodeURIComponent(communityName), listingName: decodeURIComponent(listingName), promoterEmail, priceId: selectedPriceId, durationMonths: selectedDurationMonths };
            console.log('Invoking create-checkout-session with payload:', functionPayload);
            const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', { body: functionPayload });
            // ... (response handling unchanged) ...
            if (error) { throw new Error(/*...*/); } if (data.error) { throw new Error(/*...*/); } if (data.checkoutUrl) { window.location.href = data.checkoutUrl; } else { throw new Error(/*...*/); }
        } catch (err) { /* ... error handling unchanged ... */ }
    });

    // Helper function showMessage (unchanged)
    function showMessage(msg, type = 'info') { /* ... */ }

}); // End DOMContentLoaded