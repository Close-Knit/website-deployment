// --- promote.js (Dynamic Preview Logic) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // --- Get elements ---
    // Listing Info Display Elements
    const listingNamePreview = document.getElementById('listing-name-preview');
    const listingAddressPreview = document.getElementById('listing-address-preview');
    const listingPhonePreview = document.getElementById('listing-phone-preview');
    const listingPreviewItem = document.getElementById('listing-preview-item'); // The <li> element
    const sponsoredLabelPreview = document.getElementById('sponsored-label-preview'); // The <span class="sponsored-label">

    // Input/Action Elements
    const durationOptionsContainer = document.querySelector('.duration-options');
    const durationRadios = durationOptionsContainer?.querySelectorAll('input[name="promotion_duration"]'); // Get all radio buttons
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // --- Check if the global supabaseClient is available ---
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Cannot proceed.");
        if(listingNamePreview) listingNamePreview.textContent = "Service unavailable";
        if(paymentButton) { paymentButton.disabled = true; paymentButton.textContent = 'Service Unavailable'; }
        if(messageArea) showMessage('Error: Cannot connect to backend service.', 'error');
        return;
    }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // --- Check if other essential elements exist ---
    if (!listingNamePreview || !listingAddressPreview || !listingPhonePreview || !listingPreviewItem || !sponsoredLabelPreview ||
        !durationOptionsContainer || !durationRadios || durationRadios.length === 0 || // Check radios too
        !emailInput || !paymentButton || !messageArea || !goBackLink)
    {
        console.error("Essential page elements missing on promote.html for dynamic preview.");
        if(listingNamePreview) listingNamePreview.textContent = "Page Load Error";
        if(paymentButton) paymentButton.disabled = true;
        return;
    }
    console.log("All essential elements and Supabase client seem available.");

    // --- 1. Read URL Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name');
    const tableName = urlParams.get('table');
    const address = urlParams.get('address');
    const phone = urlParams.get('phone');

    console.log("--- URL Parameters Read ---");
    // ... (optional logging) ...

    // --- 2. Validate Core Params & Populate Preview Text ---
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        console.error("Validation Failed: Core URL parameters are missing!");
        listingNamePreview.textContent = "Error: Missing Info";
        listingNamePreview.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        const decodedListingName = decodeURIComponent(listingName);
        const decodedAddress = decodeURIComponent(address || ''); // Handle potential null address
        const decodedPhone = decodeURIComponent(phone || ''); // Handle potential null phone

        // Populate text placeholders
        listingNamePreview.textContent = decodedListingName;
        if (decodedAddress) {
            listingAddressPreview.textContent = decodedAddress;
            listingAddressPreview.style.display = 'block'; // Show if present
        }
        if (decodedPhone) {
             // Re-use the "notes" class for phone display in preview if desired
             listingPhonePreview.textContent = `Phone: ${decodedPhone}`;
             listingPhonePreview.style.display = 'block'; // Show if present
        }
        document.title = `Promote: ${decodedListingName}`;
        console.log('Promotion Context seems valid. Preview text populated.');
    }

    // --- 3. Make "Cancel and Go Back" Link Work (unchanged) ---
    goBackLink.addEventListener('click', (event) => { /* ... unchanged ... */
         event.preventDefault(); console.log('Go back clicked'); history.back();
    });

    // --- 4. Dynamic Preview Update Logic ---
    const tierClasses = ['promoted-bronze', 'promoted-silver', 'promoted-gold'];
    const labelClasses = ['bronze', 'silver', 'gold'];

    function updatePreview() {
        const selectedInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        if (!selectedInput) return; // Should not happen if one is checked initially

        const tier = selectedInput.dataset.tier; // Get 'bronze', 'silver', or 'gold'

        console.log(`Updating preview for tier: ${tier}`);

        // Update main preview item class
        listingPreviewItem.classList.remove(...tierClasses); // Remove all potential tier classes
        if (tier) {
            listingPreviewItem.classList.add(`promoted-${tier}`); // Add the correct one
        }

        // Update label class and text
        sponsoredLabelPreview.classList.remove(...labelClasses); // Remove specific tier color class
        if (tier) {
            sponsoredLabelPreview.classList.add(tier); // Add specific tier color class
            sponsoredLabelPreview.textContent = tier.toUpperCase(); // Set text (BRONZE, SILVER, GOLD)
            sponsoredLabelPreview.style.visibility = 'visible'; // Make label visible
        } else {
            sponsoredLabelPreview.style.visibility = 'hidden'; // Hide if no tier somehow
        }
    }

    // Add event listener to radio buttons
    durationRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    // --- 5. Initial Preview Update on Load ---
    // Run once to style the preview based on the initially checked radio (1 Month/Bronze)
    updatePreview();


    // --- 6. Payment Button Click Handler (Logic unchanged, reads selection at click time) ---
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage('');
        const promoterEmail = emailInput.value.trim();

        // Get selected duration and price ID *at the time of click*
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        let selectedDurationMonths = null;
        let selectedPriceId = null;

        if (!selectedDurationInput) { showMessage('Please select a promotion duration.', 'error'); return; }
        selectedDurationMonths = selectedDurationInput.value;
        selectedPriceId = selectedDurationInput.dataset.priceid;

        console.log(`Proceeding with Duration: ${selectedDurationMonths}, Price ID: ${selectedPriceId}`);

        if (!selectedPriceId || selectedPriceId.startsWith('YOUR_') || selectedPriceId.length < 10) { console.error("Stripe Price ID missing/invalid!"); showMessage('Payment configuration error.', 'error'); return; }
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) { showMessage('Please enter a valid email address.', 'error'); emailInput.focus(); return; }

        paymentButton.disabled = true;
        paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        showMessage('Contacting payment processor...', 'info');

        try {
            const functionPayload = { /* ... unchanged ... */ listingId, tableName, communityId, provinceName: decodeURIComponent(provinceName), communityName: decodeURIComponent(communityName), listingName: decodeURIComponent(listingName), promoterEmail, priceId: selectedPriceId, durationMonths: selectedDurationMonths };
            console.log('Invoking create-checkout-session with payload:', functionPayload);
            const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', { body: functionPayload }); // Uses global client
            if (error) { throw new Error(`Function invocation error: ${error.message}`); }
            if (data.error) { throw new Error(`Payment processing error: ${data.error}`); }
            if (data.checkoutUrl) { window.location.href = data.checkoutUrl; }
            else { throw new Error('Invalid response from payment processor.'); }
        } catch (err) { /* ... error handling unchanged ... */
            console.error('Payment initiation failed:', err); showMessage(`Error: ${err.message}`, 'error'); paymentButton.disabled = false; paymentButton.innerHTML = '<i class="fa-brands fa-stripe-s"></i> Proceed to Payment';
        }
    });

    // Helper function to show messages (unchanged)
    function showMessage(msg, type = 'info') { /* ... unchanged ... */
        messageArea.textContent = msg; messageArea.className = '';
        if (msg) { messageArea.classList.add(type === 'error' ? 'error-message' : 'info-message'); messageArea.style.display = 'block'; }
        else { messageArea.style.display = 'none'; }
    }

}); // End DOMContentLoaded