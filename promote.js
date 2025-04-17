// --- promote.js ---
// Handles the promote.html page interaction (with added logging)

// Initialize Supabase Client
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
let promotePage_supabaseClient;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    promotePage_supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized for promote page.");
} else {
    console.error("Supabase client library not found on promote page!");
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements
    const listingDetailsDisplay = document.getElementById('listing-details');
    const promotionPriceDisplay = document.getElementById('promotion-price');
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check if essential elements exist
    if (!listingDetailsDisplay || !emailInput || !paymentButton || !messageArea || !goBackLink) {
        console.error("Essential elements missing on promote.html");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Elements missing.";
        // Disable payment button if page structure is broken
        if(paymentButton) paymentButton.disabled = true;
        return; // Stop execution if elements are missing
    }
     if (!promotePage_supabaseClient) {
        console.error("Supabase client failed to initialize.");
        showMessage('Error: Cannot connect to backend service.', 'error');
        paymentButton.disabled = true;
        paymentButton.textContent = "Service Unavailable";
        return; // Stop execution if client is missing
    }

    console.log("All essential elements found.");


    // --- 1. Read URL Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name'); // Parameter we need for display
    const tableName = urlParams.get('table');

    // *** ADDED DEBUG LOGGING ***
    console.log("--- URL Parameters Read ---");
    console.log("listingId:", listingId);
    console.log("communityId:", communityId);
    console.log("provinceName:", provinceName);
    console.log("communityName:", communityName);
    console.log("listingName (raw):", listingName); // Log the raw value
    console.log("tableName:", tableName);
    console.log("--------------------------");
    // *** END DEBUG LOGGING ***

    // --- 2. Validate and Display Listing Info ---
    // Ensure listingName is included in the check!
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        console.error("Validation Failed: One or more required URL parameters are missing!");
        listingDetailsDisplay.textContent = "Error: Listing information missing.";
        listingDetailsDisplay.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        // Decode the listing name for display
        const decodedListingName = decodeURIComponent(listingName);
        console.log("Decoded listingName:", decodedListingName); // Log decoded value

        // Update the display element
        console.log("Attempting to update listingDetailsDisplay element:", listingDetailsDisplay);
        listingDetailsDisplay.textContent = `Promoting: ${decodedListingName}`;
        console.log("Successfully updated listing details display.");

        // Update page title
        document.title = `Promote: ${decodedListingName}`;

        console.log('Promotion Context seems valid.');
    }

    // --- 3. Make "Cancel and Go Back" Link Work ---
    goBackLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Go back clicked');
        history.back();
    });

    // --- 4. Payment Button Click Handler ---
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage('');
        const promoterEmail = emailInput.value.trim();

        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        const stripePriceId = 'price_1REiFhQSnCFma2DMiheznLJE'; // Use the correct ID

        if (!stripePriceId) { // Simplified check as it's hardcoded now
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

            const { data, error } = await promotePage_supabaseClient.functions.invoke(
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

    // Helper function to show messages
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        messageArea.className = ''; // Clear previous classes
        messageArea.style.padding = '10px';
        messageArea.style.marginTop = '15px';
        messageArea.style.border = '1px solid #ccc'; // Default border

        if (type === 'error') {
            messageArea.classList.add('error-message');
             messageArea.style.color = '#721c24'; // Dark red text
             messageArea.style.backgroundColor = '#f8d7da'; // Light red background
             messageArea.style.borderColor = '#f5c6cb'; // Reddish border
        } else { // Assume info
             messageArea.classList.add('info-message');
             messageArea.style.color = '#383d41'; // Dark grey text
             messageArea.style.backgroundColor = '#e2e3e5'; // Light grey background
             messageArea.style.borderColor = '#d6d8db'; // Grey border
        }
         messageArea.style.display = msg ? 'block' : 'none';
    }

}); // End DOMContentLoaded