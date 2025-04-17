// --- promote.js ---
// Handles the promote.html page interaction

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page loaded.');

    // Get elements
    const listingDetailsDisplay = document.getElementById('listing-details');
    const promotionPriceDisplay = document.getElementById('promotion-price'); // Added for potential future use
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check if essential elements exist
    if (!listingDetailsDisplay || !emailInput || !paymentButton || !messageArea || !goBackLink) {
        console.error("Essential elements missing on promote.html");
        if (listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error.";
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
        paymentButton.disabled = true; // Disable payment if info is missing
        paymentButton.textContent = "Cannot Proceed";
    } else {
        // Decode for display
        const decodedListingName = decodeURIComponent(listingName);
        const decodedCommunityName = decodeURIComponent(communityName);
        const decodedProvinceName = decodeURIComponent(provinceName);

        // Update the display
        listingDetailsDisplay.textContent = `Promoting: ${decodedListingName}`;
        // Update page title
        document.title = `Promote: ${decodedListingName}`;

        console.log('Promotion Context:', { listingId, communityId, provinceName, communityName, listingName, tableName });
    }

    // --- 3. Make "Cancel and Go Back" Link Work ---
    goBackLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default link behavior (#)
        console.log('Go back clicked');
        history.back(); // Use browser history to go back one step
    });

    // --- 4. Placeholder for Payment Button Click ---
    paymentButton.addEventListener('click', () => {
        console.log('Payment button clicked');
        const promoterEmail = emailInput.value.trim();

        // Basic email validation
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // ** PAYMENT LOGIC WILL GO HERE IN FUTURE STEPS **
        // For now, just show a message and disable the button
        showMessage('Processing payment... (Simulation - Not yet functional)', 'info');
        paymentButton.disabled = true;
        paymentButton.textContent = 'Processing...';

        // TODO:
        // 1. Validate email format
        // 2. Get price/product ID (maybe defined here or fetched)
        // 3. Make API call to a Supabase Function (e.g., /create-checkout-session)
        //    - Pass: listingId, tableName, communityId, provinceName, promoterEmail, priceId
        // 4. Function interacts with Stripe, creates session
        // 5. Function returns Stripe Checkout URL
        // 6. Redirect user: window.location.href = checkoutUrl;
        // 7. Handle potential errors from the API call

        // Simulate process ending after a bit (REMOVE THIS LATER)
        setTimeout(() => {
            showMessage('Payment simulation complete. Redirect would happen here.', 'info');
             // In real flow, we'd redirect, not re-enable here.
             // paymentButton.disabled = false;
             // paymentButton.textContent = 'Proceed to Payment';
        }, 3000);


    });

    // Helper function to show messages
    function showMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        messageArea.className = type; // Add 'error' or 'info' class
        messageArea.style.display = msg ? 'block' : 'none';
    }

}); // End DOMContentLoaded