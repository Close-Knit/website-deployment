// --- promote.js ---
// Handles the promote.html page interaction, now calling the Edge Function

// ** IMPORTANT: Make sure Supabase client is available if needed globally **
// If common.js initializes Supabase, ensure it runs first or initialize here.
// For standalone function invocation, we might not need the full client,
// but using it standardizes function calls. Let's assume we need it.

// Initialize Supabase Client (Make sure this matches your other JS files)
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
let supabaseClient promotePage_supabaseClient; // Use a distinct variable name if needed
if (typeof supabase !== 'undefined' && supabase.createClient) {
    promotePage_supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error("Supabase client library not found on promote page!");
    // Handle error appropriately - maybe disable payment button
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page loaded.');

    // Get elements
    const listingDetailsDisplay = document.getElementById('listing-details');
    const promotionPriceDisplay = document.getElementById('promotion-price');
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check if essential elements exist
    if (!listingDetailsDisplay || !emailInput || !paymentButton || !messageArea || !goBackLink || !promotePage_supabaseClient) {
        console.error("Essential elements or Supabase client missing on promote.html");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error.";
        if(paymentButton) paymentButton.disabled = true; // Disable if setup fails
        return;
    }

    // --- 1. Read URL Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name');
    const tableName = urlParams.get('table');

    // --- 2. Validate and Display Listing Info ---
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        console.error("Missing required URL parameters for promotion.");
        listingDetailsDisplay.textContent = "Error: Listing information missing.";
        listingDetailsDisplay.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        const decodedListingName = decodeURIComponent(listingName);
        listingDetailsDisplay.textContent = `Promoting: ${decodedListingName}`;
        document.title = `Promote: ${decodedListingName}`;
        console.log('Promotion Context:', { listingId, communityId, provinceName, communityName, listingName, tableName });
    }

    // --- 3. Make "Cancel and Go Back" Link Work ---
    goBackLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Go back clicked');
        history.back();
    });

    // --- 4. Payment Button Click Handler ---
    paymentButton.addEventListener('click', async () => { // Make async for await
        console.log('Payment button clicked');
        showMessage(''); // Clear previous messages
        const promoterEmail = emailInput.value.trim();

        // Basic email validation
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // --- Get the Stripe Price ID ---
        // ** ACTION REQUIRED: Replace 'YOUR_STRIPE_PRICE_ID_HERE' with the actual ID you copied **
        const stripePriceId = 'price_1REiFhQSnCFma2DMiheznLJB'; // e.g., 'price_1P6...'
        // ** END ACTION REQUIRED **

        if (stripePriceId === 'YOUR_STRIPE_PRICE_ID_HERE') {
             console.error("Stripe Price ID not set in promote.js!");
             showMessage('Payment configuration error. Please contact support.', 'error');
             return;
        }

        // Disable button and show processing message
        paymentButton.disabled = true;
        paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; // Add spinner
        showMessage('Contacting payment processor...', 'info');

        try {
            // --- Prepare data for the Edge Function ---
            const functionPayload = {
                listingId: listingId,
                tableName: tableName,
                communityId: communityId,
                provinceName: decodeURIComponent(provinceName), // Send decoded names
                communityName: decodeURIComponent(communityName),
                listingName: decodeURIComponent(listingName),
                promoterEmail: promoterEmail,
                priceId: stripePriceId
            };

            console.log('Invoking create-checkout-session with payload:', functionPayload);

            // --- Invoke the Supabase Edge Function ---
            const { data, error } = await promotePage_supabaseClient.functions.invoke(
                'create-checkout-session', // Function name
                {
                    body: functionPayload // Pass data in the body
                    // headers: { 'Content-Type': 'application/json' } // Client adds this by default
                }
            );

            if (error) {
                // Handle errors invoking the function itself (network issue, function crashed badly)
                console.error('Function invocation error:', error);
                throw new Error(`Error calling payment function: ${error.message}`);
            }

            if (data.error) {
                 // Handle errors returned *from within* the function logic (e.g., validation, Stripe API error)
                 console.error('Error returned from function:', data.error);
                 throw new Error(`Payment processing error: ${data.error}`);
            }

            if (data.checkoutUrl) {
                console.log('Received checkout URL:', data.checkoutUrl);
                // --- Redirect user to Stripe Checkout ---
                showMessage('Redirecting to secure payment page...', 'info');
                window.location.href = data.checkoutUrl;
            } else {
                 // Unexpected response format
                 console.error('Unexpected response from function:', data);
                 throw new Error('Received an invalid response from the payment processor.');
            }

        } catch (err) {
            console.error('Payment initiation failed:', err);
            showMessage(`Error: ${err.message}`, 'error');
            // Re-enable the button on failure
            paymentButton.disabled = false;
            paymentButton.innerHTML = '<i class="fa-brands fa-stripe-s"></i> Proceed to Payment'; // Restore original text/icon
        }

    }); // End paymentButton click listener

    // Helper function to show messages
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        // Simple class setting based on type
        messageArea.className = ''; // Clear previous classes
        if (type === 'error') {
            messageArea.classList.add('error-message'); // Use a specific class maybe defined in CSS
             messageArea.style.color = 'red'; // Basic styling
             messageArea.style.border = '1px solid red';
             messageArea.style.background = '#fdd';
        } else {
             messageArea.classList.add('info-message');
             messageArea.style.color = 'black';
             messageArea.style.border = '1px solid #ccc';
             messageArea.style.background = '#eee';
        }
         messageArea.style.padding = '10px'; // Add padding
         messageArea.style.marginTop = '15px';
         messageArea.style.display = msg ? 'block' : 'none';
    }

}); // End DOMContentLoaded