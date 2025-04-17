// --- promote.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================
// const supabaseUrl = '...'; // REMOVED
// const supabaseKey = '...'; // REMOVED
// let promotePage_supabaseClient; // REMOVED
// if (typeof supabase !== 'undefined' && supabase.createClient) { ... } // REMOVED

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements
    const listingDetailsDisplay = document.getElementById('listing-details');
    const promotionPriceDisplay = document.getElementById('promotion-price');
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // *** Check if the GLOBAL supabaseClient is available ***
    // This check runs after DOMContentLoaded, ensuring common.js likely ran
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Cannot proceed.");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Service unavailable.";
        if(paymentButton) {
            paymentButton.disabled = true;
            paymentButton.textContent = 'Service Unavailable';
        }
        if(messageArea) showMessage('Error: Cannot connect to backend service.', 'error'); // Use showMessage if available
        return; // Stop execution
    }
    console.log("Promote.js using supabaseClient initialized in common.js");


    // Check if other essential elements exist
    if (!listingDetailsDisplay || !emailInput || !paymentButton || !messageArea || !goBackLink) {
        console.error("Essential page elements missing on promote.html");
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
    console.log("listingId:", listingId);
    console.log("listingName (raw):", listingName);
    console.log("--------------------------");


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

    // --- 4. Payment Button Click Handler (unchanged logic, uses global client) ---
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage('');
        const promoterEmail = emailInput.value.trim();

        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        const stripePriceId = 'price_1REiFhQSnCFma2DMiheznLJE'; // Ensure this is correct

        if (!stripePriceId) {
             console.error("Stripe Price ID is missing in promote.js!");
             showMessage('Payment configuration error. Please contact support.', 'error');
             return;
        }

        paymentButton.disabled = true;
        paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        showMessage('Contacting payment processor...', 'info');

        try {
            const functionPayload = {
                listingId: listingId,
                tableName: tableName,
                communityId: communityId,
                provinceName: decodeURIComponent(provinceName),
                communityName: decodeURIComponent(communityName),
                listingName: decodeURIComponent(listingName),
                promoterEmail: promoterEmail,
                priceId: stripePriceId
            };

            console.log('Invoking create-checkout-session with payload:', functionPayload);

            // *** USES GLOBAL supabaseClient ***
            const { data, error } = await supabaseClient.functions.invoke(
                'create-checkout-session',
                { body: functionPayload }
            );

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