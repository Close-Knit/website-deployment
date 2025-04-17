// --- promote.js ---
// Handles the promote.html page interaction (with Supabase client fix + CSS classes for messages)

// Initialize Supabase Client
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
let promotePage_supabaseClient;
// Check if the Supabase library is loaded (it should be now)
if (typeof supabase !== 'undefined' && supabase.createClient) {
    promotePage_supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized for promote page.");
} else {
    console.error("Supabase client library STILL not found or failed to initialize!");
    // Attempt to inform the user on the page itself if possible
    const loadingDisplay = document.getElementById('listing-details');
    if (loadingDisplay) loadingDisplay.textContent = "Critical Error: Cannot load payment services.";
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
        console.error("Essential page elements missing on promote.html");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Elements missing.";
        if(paymentButton) paymentButton.disabled = true;
        return;
    }
     if (!promotePage_supabaseClient) { // Check again now that DOM is ready
        console.error("Supabase client is not available.");
        showMessage('Error: Cannot connect to backend service.', 'error'); // Use showMessage
        paymentButton.disabled = true;
        paymentButton.textContent = "Service Unavailable";
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

    console.log("--- URL Parameters Read ---");
    console.log("listingId:", listingId);
    console.log("listingName (raw):", listingName); // Check this!
    // Add logs for others if needed
    console.log("--------------------------");


    // --- 2. Validate and Display Listing Info ---
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

    // --- 3. Make "Cancel and Go Back" Link Work ---
    goBackLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Go back clicked');
        history.back();
    });

    // --- 4. Payment Button Click Handler ---
    paymentButton.addEventListener('click', async () => {
        console.log('Payment button clicked');
        showMessage(''); // Clear previous messages
        const promoterEmail = emailInput.value.trim();

        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        const stripePriceId = 'price_1REiFhQSnCFma2DMiheznLJB'; // Use the correct ID

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

    // Helper function to show messages using CSS classes
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        // Reset classes first
        messageArea.className = ''; // Remove existing type classes
        if (msg) {
            // Add class based on type for styling defined in CSS
            messageArea.classList.add(type === 'error' ? 'error-message' : 'info-message');
            messageArea.style.display = 'block';
        } else {
            messageArea.style.display = 'none';
        }
    }

}); // End DOMContentLoaded