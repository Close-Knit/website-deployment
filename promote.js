// --- promote.js (Display Address/Phone) ---

// Assumes supabaseClient is initialized and available globally via common.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Promote page DOMContentLoaded.');

    // Get elements (Add new elements for address/phone)
    const listingDetailsDisplay = document.getElementById('listing-details');
    const listingAddressDisplay = document.getElementById('listing-address'); // New
    const listingPhoneDisplay = document.getElementById('listing-phone');   // New
    const durationOptionsContainer = document.querySelector('.duration-options');
    const emailInput = document.getElementById('promoter-email');
    const paymentButton = document.getElementById('payment-button');
    const messageArea = document.getElementById('message-area');
    const goBackLink = document.getElementById('go-back-link');

    // Check if the global supabaseClient is available
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error("Supabase client not initialized (from common.js). Cannot proceed.");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Service unavailable.";
        if(paymentButton) { paymentButton.disabled = true; paymentButton.textContent = 'Service Unavailable'; }
        if(messageArea) showMessage('Error: Cannot connect to backend service.', 'error');
        return;
    }
    console.log("Promote.js using supabaseClient initialized in common.js");

    // Check if other essential elements exist (including new ones)
    if (!listingDetailsDisplay || !listingAddressDisplay || !listingPhoneDisplay || !durationOptionsContainer || !emailInput || !paymentButton || !messageArea || !goBackLink) {
        console.error("Essential page elements missing on promote.html");
        if(listingDetailsDisplay) listingDetailsDisplay.textContent = "Page Error: Elements missing.";
        if(paymentButton) paymentButton.disabled = true;
        return;
    }

    console.log("All essential elements and Supabase client seem available.");

    // --- 1. Read URL Parameters (Add address and phone) ---
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('lid');
    const communityId = urlParams.get('cid');
    const provinceName = urlParams.get('prov');
    const communityName = urlParams.get('comm');
    const listingName = urlParams.get('name');
    const tableName = urlParams.get('table');
    const address = urlParams.get('address'); // New
    const phone = urlParams.get('phone');     // New

    console.log("--- URL Parameters Read ---");
    console.log("listingName (raw):", listingName);
    console.log("address (raw):", address);
    console.log("phone (raw):", phone);
    console.log("--------------------------");


    // --- 2. Validate and Display Listing Info ---
    if (!listingId || !communityId || !provinceName || !communityName || !listingName || !tableName) {
        // Only basic validation needed here, address/phone are optional for display
        console.error("Validation Failed: Core URL parameters are missing!");
        listingDetailsDisplay.textContent = "Error: Listing information missing.";
        listingDetailsDisplay.style.color = 'red';
        paymentButton.disabled = true;
        paymentButton.textContent = "Cannot Proceed";
    } else {
        // Display Name
        const decodedListingName = decodeURIComponent(listingName);
        listingDetailsDisplay.textContent = `Promoting: ${decodedListingName}`;
        document.title = `Promote: ${decodedListingName}`;
        console.log('Promotion Context seems valid.');

        // Display Address (if provided)
        if (address) {
            const decodedAddress = decodeURIComponent(address);
            if (decodedAddress.trim() !== '') { // Check if not empty after decoding
                 listingAddressDisplay.textContent = `${decodedAddress}`;
                 listingAddressDisplay.style.display = 'block'; // Show the element
                 console.log("Displaying Address:", decodedAddress);
            }
        }

        // Display Phone (if provided)
        if (phone) {
            const decodedPhone = decodeURIComponent(phone);
             if (decodedPhone.trim() !== '') { // Check if not empty after decoding
                 listingPhoneDisplay.textContent = `Phone: ${decodedPhone}`;
                 listingPhoneDisplay.style.display = 'block'; // Show the element
                 console.log("Displaying Phone:", decodedPhone);
            }
        }
    }

    // --- 3. Make "Cancel and Go Back" Link Work (unchanged) ---
    goBackLink.addEventListener('click', (event) => { /* ... unchanged ... */
         event.preventDefault(); console.log('Go back clicked'); history.back();
    });

    // --- 4. Payment Button Click Handler (unchanged from last version) ---
    paymentButton.addEventListener('click', async () => { /* ... unchanged ... */
        console.log('Payment button clicked'); showMessage(''); const promoterEmail = emailInput.value.trim();
        const selectedDurationInput = durationOptionsContainer.querySelector('input[name="promotion_duration"]:checked');
        let selectedDurationMonths = null; let selectedPriceId = null;
        if (!selectedDurationInput) { showMessage('Please select a promotion duration.', 'error'); return; }
        selectedDurationMonths = selectedDurationInput.value; selectedPriceId = selectedDurationInput.dataset.priceid;
        console.log(`Selected Duration: ${selectedDurationMonths} months`); console.log(`Selected Price ID: ${selectedPriceId}`);
        if (!selectedPriceId || selectedPriceId.startsWith('YOUR_') || selectedPriceId.length < 10) { console.error("Stripe Price ID missing/invalid!"); showMessage('Payment config error.', 'error'); return; }
        if (!promoterEmail || !/\S+@\S+\.\S+/.test(promoterEmail)) { showMessage('Please enter a valid email address.', 'error'); emailInput.focus(); return; }
        paymentButton.disabled = true; paymentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; showMessage('Contacting payment processor...', 'info');
        try {
            const functionPayload = { listingId, tableName, communityId, provinceName: decodeURIComponent(provinceName), communityName: decodeURIComponent(communityName), listingName: decodeURIComponent(listingName), promoterEmail, priceId: selectedPriceId, durationMonths: selectedDurationMonths };
            console.log('Invoking create-checkout-session with payload:', functionPayload);
            const { data, error } = await supabaseClient.functions.invoke('create-checkout-session', { body: functionPayload });
            if (error) { throw new Error(`Function invocation error: ${error.message}`); }
            if (data.error) { throw new Error(`Payment processing error: ${data.error}`); }
            if (data.checkoutUrl) { console.log('Received checkout URL:', data.checkoutUrl); showMessage('Redirecting...', 'info'); window.location.href = data.checkoutUrl; }
            else { throw new Error('Invalid response from payment processor.'); }
        } catch (err) { console.error('Payment initiation failed:', err); showMessage(`Error: ${err.message}`, 'error'); paymentButton.disabled = false; paymentButton.innerHTML = '<i class="fa-brands fa-stripe-s"></i> Proceed to Payment'; }
    });

    // Helper function to show messages using CSS classes (unchanged)
    function showMessage(msg, type = 'info') { /* ... unchanged ... */
        messageArea.textContent = msg; messageArea.className = '';
        if (msg) { messageArea.classList.add(type === 'error' ? 'error-message' : 'info-message'); messageArea.style.display = 'block'; }
        else { messageArea.style.display = 'none'; }
    }

}); // End DOMContentLoaded