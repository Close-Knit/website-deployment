// --- promote.js (Handle Duration Selection) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements
    const listingDetailsDisplay = document.getElementById('listing-details');
    // const promotionPriceDisplay = document.getElementById('promotion-price'); // No longer used directly
    const durationOptionsContainer = document.querySelector('.duration-options'); // Get the container for radio buttons
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check if the global supabaseClient is available
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Cannot proceed.");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Service unavailable.";
        if(paymentButton) {
            paymentButton.disabled = true;
            paymentButton.textContent = 'Service Unavailable';
        }
        if(messageArea) showMessage('Error: Cannot connect to backend service.', 'error');
        return;
    }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // Check if other essential elements exist
    // ** Added check for durationOptionsContainer **
    if (!listingDetailsDisplay || !durationOptionsContainer || !emailInput || !paymentButton || !messageArea || !goBackLink) {
        console.error("Essential page elements missing on promote.html (incl. duration options)");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Elements missing.";
        if(paymentButton) paymentButton.disabled = true;
        return;
    }

    console.log("All essential elements and Supabase client seem available.");

    // --- 1. Read URL Parameters (unchanged) ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name');
    const tableName = urlParams.get('table');

    console.log("--- URL Parameters Read ---");
    // console.log("listingId:", listingId); // Optional logs
    console.log("listingName (raw):", listingName);
    // console.log("--------------------------");


    // --- 2. Validate and Display Listing Info (unchanged) ---
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        console.error("Validation Failed: One or more required URL parameters are missing!");
        listingDetailsDisplay.textContent = "Error: Listing information missing.";
        listingDetailsDisplay.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        const decodedListingName = decodeURIComponent(listingName);
        console.log("Decoded listingName:", decodedListingName);

        console.log("Attempting to update listingDetailsDisplay element:", listingDetailsDisplay);
        listingDetailsDisplay.textContent = `Promoting: ${decodedListingName}`;
        console.log("Successfully updated listing details display.");

        document.title = `Promote: ${decodedListingName}`;
        console.log('Promotion Context seems valid.');
    }

    // --- 3. Make "Cancel and Go Back" Link Work (unchanged) ---
    goBackLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Go back clicked');
        history.back();
    });

    // --- 4. Payment Button Click Handler (MODIFIED) ---
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage('');
        const promoterEmail = emailInput.value.trim();

        // --- START: Get Selected Duration and Price ID ---
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        let selectedDurationMonths = null;
        let selectedPriceId = null;

        if (!selectedDurationInput) {
            showMessage('Please select a promotion duration.', 'error');
            return; // Stop if no duration is selected
        }

        selectedDurationMonths = selectedDurationInput.value; // e.g., "1", "6", "12"
        selectedPriceId = selectedDurationInput.dataset.priceid; // Get from data-priceid attribute

        console.log(`Selected Duration: ${selectedDurationMonths} months`);
        console.log(`Selected Price ID: ${selectedPriceId}`);

        // Validate that we got a Price ID
        if (!selectedPriceId || selectedPriceId.startsWith('YOUR_')) { // Basic check if placeholder wasn't replaced
            console.error("Stripe Price ID is missing or invalid for the selected duration!");
            showMessage('Payment configuration error for selected duration. Please contact support.', 'error');
            return;
        }
        // --- END: Get Selected Duration and Price ID ---


        // Validate email
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // Disable button and show processing message
        paymentButton.disabled = true;
        paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        showMessage('Contacting payment processor...', 'info');

        try {
            // Prepare data for the Edge Function - now includes duration and uses selected price ID
            const functionPayload = {
                listingId: listingId,
                tableName: tableName,
                communityId: communityId,
                provinceName: decodeURIComponent(provinceName),
                communityName: decodeURIComponent(communityName),
                listingName: decodeURIComponent(listingName),
                promoterEmail: promoterEmail,
                priceId: selectedPriceId, // Use the selected Price ID
                durationMonths: selectedDurationMonths // Send the selected duration
            };

            console.log('Invoking create-checkout-session with payload:', functionPayload);

            // Invoke the Supabase Edge Function (uses global supabaseClient)
            const { data, error } = await supabaseClient.functions.invoke(
                'create-checkout-session',
                { body: functionPayload }
            );

            // Handle response (same as before)
            if (error) {
                console.error('Function invocation error:', error);
                throw new Error(`Error calling payment function: ${error.message}`);
            }
            if (data.error) {
                 console.error('Error returned from function:', data.error);
                 throw new Error(`Payment processing error: ${data.error}`);
            }
            if (data.checkoutUrl) {
                console.log('Received checkout URL:', data.checkoutUrl);
                showMessage('Redirecting to secure payment page...', 'info');
                window.location.href = data.checkoutUrl;
            } else {
                 console.error('Unexpected response from function:', data);
                 throw new Error('Received an invalid response from the payment processor.');
            }

        } catch (err) {
            console.error('Payment initiation failed:', err);
            showMessage(`Error: ${err.message}`, 'error');
            // Re-enable the button on failure
            paymentButton.disabled = false;
            paymentButton.innerHTML = '<i class="fa-brands fa-stripe-s"></i> Proceed to Payment';
        }

    }); // End paymentButton click listener

    // Helper function to show messages using CSS classes (unchanged)
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        messageArea.className = '';
        if (msg) {
            messageArea.classList.add(type === 'error' ? 'error-message' : 'info-message');
            messageArea.style.display = 'block';
        } else {
            messageArea.style.display = 'none';
        }
    }

}); // End DOMContentLoaded