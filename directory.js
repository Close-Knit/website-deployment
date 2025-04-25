// Assumes supabaseClient is globally available from common.js

// ======================================================================
// Helper to display error messages (unchanged)
// ======================================================================
function displayError(message) {
    console.error("Directory Error:", message);
    const resultsList = document.getElementById('results');
    if (resultsList) { resultsList.innerHTML = `<li style="color: red; font-style: italic;">Error: ${message}</li>`; }
    else { console.error("Could not find #results element to display error."); }
    const communityNameElement = document.getElementById('community-name');
     if (communityNameElement) { communityNameElement.innerHTML = "Error Loading Directory"; }
     const logoElement = document.getElementById('logo');
     if(logoElement) logoElement.style.display = 'none';
     const breadcrumbContainer = document.getElementById('breadcrumb-container');
     if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
}

// === Helper Function: UTF-8 to Base64 Encoding/Decoding (Unchanged) ===
function utf8ToBase64(str) { /* ... */
    try {
        const strInput = String(str || '');
        const utf8Bytes = new TextEncoder().encode(strInput);
        const binaryString = utf8Bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        return btoa(binaryString);
    } catch (e) {
        console.error("Error encoding to Base64 (UTF-8 step):", e, str);
        return "";
    }
}

function base64ToUtf8(base64) { /* ... */
    try {
        const base64Input = String(base64 || '');
        const binaryString = atob(base64Input);
        const utf8Bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
        return new TextDecoder().decode(utf8Bytes);
    } catch (e) {
         console.error("Error decoding from Base64 (UTF-8 step):", e, base64);
         return "";
    }
}
// ======================================================================


// ======================================================================
// Fetch and Display Listings for a Specific Community (Unchanged)
// ======================================================================
async function fetchAndDisplayListings() { /* ... */ } // Keep entire function as is


// Initialize Search Functionality (Unchanged)
function initializeSearch() { /* ... */ } // Keep entire function as is


// Initialize Popup Interactivity (Updated to enforce single popup explicitly)
function initializePopupInteraction() {
    const resultsList = document.getElementById('results');
    // Phone Popup Elements
    const phonePopup = document.getElementById('phonePopup');
    const closePopupButton = document.getElementById('closePopup');
    const phoneNumberDisplay = document.getElementById('phoneNumber');
    const copyPhoneButton = document.getElementById('copyPhoneBtn');
    const copyTextElement = copyPhoneButton?.querySelector('.copy-text');
    const copyIconElement = copyPhoneButton?.querySelector('i');
    const originalCopyText = copyTextElement ? copyTextElement.textContent : 'Copy';
    const originalCopyIconClass = copyIconElement ? copyIconElement.className : 'fa-regular fa-copy';
    let copyTimeout = null;
    const resetCopyButton = () => {
        if (copyTextElement) copyTextElement.textContent = originalCopyText;
        if (copyIconElement) copyIconElement.className = originalCopyIconClass;
        if (copyPhoneButton) copyPhoneButton.disabled = false;
        if (copyTimeout) { clearTimeout(copyTimeout); copyTimeout = null; }
    };

    // *** Virtual Card Popup Elements ***
    const virtualCardPopup = document.getElementById('virtualCardPopup');
    const closeVCardPopupButton = document.getElementById('closeVCardPopup');
    let currentVCardObjectUrl = null;

    // Check core elements for both popups
    if (!resultsList || !phonePopup || !closePopupButton || !phoneNumberDisplay || !virtualCardPopup || !closeVCardPopupButton) {
        console.error("Core popup elements missing (Phone or vCard). Popups might not work.");
        return;
    }
    if (!copyPhoneButton || !copyTextElement || !copyIconElement) {
        console.warn("Copy button elements missing.");
    }

    // --- Common close function for VCard popup ---
    const closeVCard = () => {
        virtualCardPopup.classList.add('hidden');
        if (currentVCardObjectUrl) {
            URL.revokeObjectURL(currentVCardObjectUrl);
            currentVCardObjectUrl = null;
            console.log("Revoked vCard Object URL on close");
        }
        const qrContainer = document.getElementById('vcard-qrcode-container');
        if (qrContainer) qrContainer.style.display = 'none'; // Hide QR container
    };

    // --- Common close function for Phone popup ---
    const closePhonePopup = () => {
         phonePopup.classList.add('hidden');
         resetCopyButton();
    };

    // --- Phone Popup Listeners ---
    if (copyPhoneButton) {
        const handleCopyClick = async () => { /* ... copy logic ... */
             const linkElement = phoneNumberDisplay.querySelector('a');
             const numberToCopy = linkElement ? linkElement.textContent : null;
             if (numberToCopy && navigator.clipboard) {
                 try {
                     await navigator.clipboard.writeText(numberToCopy);
                     if (copyTextElement) copyTextElement.textContent = 'Copied!';
                     if (copyIconElement) copyIconElement.className = 'fa-solid fa-check';
                     copyPhoneButton.disabled = true;
                     if (copyTimeout) clearTimeout(copyTimeout);
                     copyTimeout = setTimeout(resetCopyButton, 2000);
                 } catch (err) {
                     console.error('Failed to copy phone number:', err);
                     alert("Could not copy number.");
                     resetCopyButton();
                 }
             } else {
                 if (!navigator.clipboard) alert("Copying not supported by browser.");
                 resetCopyButton();
             }
         };
        copyPhoneButton.addEventListener('click', handleCopyClick);
    }

    resultsList.addEventListener('click', function(event) {
        const revealButton = event.target.closest('.revealPhoneBtn');

        if (revealButton) {
            event.preventDefault();

            // *** Explicitly close the VCard Popup ***
            closeVCard();
            // *************************************

            const numberToDisplay = revealButton.dataset.phone;
            if (numberToDisplay) {
                phoneNumberDisplay.innerHTML = `<a href="tel:${numberToDisplay}">${numberToDisplay}</a>`;
                resetCopyButton();
                phonePopup.classList.remove('hidden');
            } else {
                console.warn("Reveal button missing phone data.");
            }
        }
    });

    // --- Close Listeners ---
    closePopupButton.addEventListener('click', closePhonePopup);
    phonePopup.addEventListener('click', function(event) {
        if (event.target === phonePopup) {
            closePhonePopup();
        }
    });
    // --- End Phone Popup Listeners ---


    // === START: Virtual Card Popup Listeners ===
    if (virtualCardPopup && closeVCardPopupButton) {

        // --- Listener for View Card Buttons ---
        resultsList.addEventListener('click', function(event) {
            const viewCardButton = event.target.closest('.view-vcard-btn');

            if (viewCardButton && !viewCardButton.disabled) {
                event.preventDefault();
                console.log("View Card button clicked");

                // *** Explicitly close the Phone Popup ***
                closePhonePopup();
                // ***********************************

                // 1. Cleanup previous state
                const qrContainer = document.getElementById('vcard-qrcode-container');
                if (qrContainer) { qrContainer.innerHTML = '<p><small>Scan QR to save contact:</small></p>'; qrContainer.style.display = 'none'; }
                if (currentVCardObjectUrl) { URL.revokeObjectURL(currentVCardObjectUrl); currentVCardObjectUrl = null; console.log("Revoked previous vCard Object URL"); }

                // 2. Get Data from button attribute (Decode Base64 then Parse)
                let vCardData;
                try {
                    const base64EncodedData = viewCardButton.dataset.vcard;
                    const decodedJsonString = base64ToUtf8(base64EncodedData); // Use the new helper
                    vCardData = JSON.parse(decodedJsonString); // Parse the decoded JSON
                    console.log("Parsed vCard Data:", vCardData);
                } catch (e) {
                    console.error("Failed to decode/parse vCard data from button:", e);
                    console.error("Raw data-vcard (Base64):", viewCardButton.getAttribute('data-vcard'));
                    alert("Error: Could not load card data.");
                    return; // IMPORTANT: Stop if parsing fails
                }
                if (!vCardData || typeof vCardData !== 'object') {
                    alert("Error: Invalid card data format.");
                    return;
                }

                // 3. Populate Modal Elements (No changes needed here)
                document.getElementById('vcard-logo').src = vCardData.logoUrl || 'images/Bizly_Logo_150px.webp';
                document.getElementById('vcard-logo').alt = `${vCardData.name || 'Business'} Logo`;
                document.getElementById('vcard-name').textContent = vCardData.name || 'N/A';

                // Helper to set detail item visibility and content
                const setVCardDetailItem = (elementId, value, linkPrefix = '', isLink = true) => {
                    const pElement = document.getElementById(elementId);
                    if (!pElement) { console.warn(`Element ${elementId} not found`); return; }
                    const spanElement = pElement.querySelector('span');
                    const linkElement = pElement.querySelector('a');

                    if (value && value.trim() !== '') {
                        const trimmedValue = value.trim();
                        if (spanElement) spanElement.textContent = trimmedValue;
                        if (isLink && linkElement) {
                            let hrefValue = trimmedValue;
                            if (linkPrefix && !hrefValue.startsWith(linkPrefix)) {
                                hrefValue = linkPrefix + hrefValue;
                            }
                            else if (elementId === 'vcard-website' && !hrefValue.startsWith('http://') && !hrefValue.startsWith('https://')) {
                                hrefValue = 'https://' + hrefValue;
                            }
                            linkElement.href = hrefValue;
                            linkElement.style.display = 'inline';
                        } else if (!isLink && linkElement) {
                             linkElement.style.display = 'none';
                        }
                        pElement.style.display = 'flex';
                    } else {
                        pElement.style.display = 'none';
                    }
                };

                setVCardDetailItem('vcard-contact-person', vCardData.contactPerson, '', false);
                setVCardDetailItem('vcard-phone', vCardData.phone, 'tel:');
                setVCardDetailItem('vcard-email', vCardData.email, 'mailto:');
                setVCardDetailItem('vcard-website', vCardData.website, '', true); // Corrected data source
                setVCardDetailItem('vcard-address', vCardData.address, '', false);
                setVCardDetailItem('vcard-notes', vCardData.notes, '', false); // Display notes


                // 4. Generate vCard & Set Download Link (No changes needed here)
                const vcfString = generateVCF(vCardData);
                const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
                currentVCardObjectUrl = URL.createObjectURL(blob); // Store for cleanup
                const downloadLink = document.getElementById('vcard-download-link');
                if (downloadLink) {
                    downloadLink.href = currentVCardObjectUrl;
                    const filename = (vCardData.name || 'contact').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    downloadLink.download = `${filename}.vcf`;
                    console.log("Generated vCard Object URL:", currentVCardObjectUrl);
                }

                // 5. Setup QR Code Button Listener (Remove previous listener first)
                const showQrButton = document.getElementById('vcard-show-qr-button');
                if (showQrButton) {
                    const newShowQrButton = showQrButton.cloneNode(true); // Clone to remove listeners
                    showQrButton.parentNode.replaceChild(newShowQrButton, showQrButton);
                    newShowQrButton.addEventListener('click', () => {
                         generateAndShowQRCode(vCardData, 'vcard-qrcode-container');
                    });
                }

                // 6. Setup SMS Link (No changes needed here)
                const smsLink = document.getElementById('vcard-sms-link');
                if (smsLink) {
                    let smsBody = `Check out ${vCardData.name || 'this business'} on Bizly:`;
                    if (vCardData.phone) smsBody += `\nPhone: ${vCardData.phone}`;
                    if (vCardData.website) smsBody += `\nWebsite: ${vCardData.website}`; // Corrected data source
                    if (vCardData.address) smsBody += `\nAddress: ${vCardData.address.replace(/\n/g, ', ')}`;
                    smsLink.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                }

                // 7. Setup Web Share Button Listener (Remove previous listener first)
                const shareButton = document.getElementById('vcard-share-button');
                if (shareButton) {
                    const newShareButton = shareButton.cloneNode(true);
                    shareButton.parentNode.replaceChild(newShareButton, shareButton);
                    newShareButton.addEventListener('click', async () => {
                        const shareData = {
                            title: `${vCardData.name || 'Business Contact'} via Bizly`,
                            text: `Contact Info for ${vCardData.name || 'Business'}:\nPhone: ${vCardData.phone || 'N/A'}\nEmail: ${vCardData.email || 'N/A'}\nWebsite: ${vCardData.website || 'N/A'}\nAddress: ${vCardData.address || 'N/A'}`, // Corrected data source
                        };
                        try {
                            if (navigator.share) {
                                await navigator.share(shareData);
                                console.log('Shared successfully');
                            } else {
                                alert('Web Share not supported on this browser/device.');
                            }
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.error('Share failed:', err);
                                alert('Sharing failed.');
                            }
                        }
                    });
                }


                // 8. Show Modal
                virtualCardPopup.classList.remove('hidden');
                console.log("Virtual Card Popup should be visible");

            } // End if (viewCardButton)
        }); // End resultsList click listener for vCard

        // --- Close Listeners for VCard popup ---
        closeVCardPopupButton.addEventListener('click', closeVCard);
        virtualCardPopup.addEventListener('click', function(event) { // Click outside to close
            if (event.target === virtualCardPopup) {
                closeVCard();
            }
        });

    } else {
        console.warn("Could not initialize Virtual Card popup listeners - essential elements missing.");
    }
    // === END: Virtual Card Popup Listeners ===


    // === START: Helper Functions (Updated for UTF-8 + Base64) ===
    // Helper Function: Generate vCard String (vCard 3.0) - No change needed for data format
    function generateVCF(data) { /* ... */
        let vcf = `BEGIN:VCARD\nVERSION:3.0\n`;
        vcf += `FN:${(data.name || '').trim()}\n`;
        if (data.contactPerson && data.contactPerson.trim() !== '') {
            const nameParts = data.contactPerson.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            vcf += `N:${lastName};${firstName};;;\n`;
        } else {
             vcf += `N:${(data.name || '').trim()};;;;\n`;
        }
        if (data.name) vcf += `ORG:${data.name.trim()}\n`;
        if (data.phone) vcf += `TEL;type=WORK,voice:${data.phone.trim()}\n`;
        if (data.email) vcf += `EMAIL:${data.email.trim()}\n`;
        if (data.address) {
            const adrFormatted = data.address.trim().replace(/,/g, ' ').replace(/\n/g, '\\n');
            vcf += `ADR;type=WORK:;;${adrFormatted};;;;\n`;
        }
        if (data.website) vcf += `URL:${data.website.trim()}\n`;
        if (data.logoUrl && !data.logoUrl.includes('Bizly_Logo_150px.webp')) {
            vcf += `PHOTO;VALUE=URI:${data.logoUrl}\n`;
        }
        if (data.notes) vcf += `NOTE:${data.notes.trim().replace(/\n/g, '\\n')}\n`;
        vcf += `REV:${new Date().toISOString().split('.')[0]}Z\n`;
        vcf += `END:VCARD`;
        return vcf;
    }

    // Helper Function: Generate QR Code - Uses generateVCF, no direct change needed
    function generateAndShowQRCode(data, containerId) { /* ... */
         const qrContainer = document.getElementById(containerId);
        if (!qrContainer) { console.error(`QR Container #${containerId} not found.`); return; }
        if (typeof QRCode === 'undefined') { console.error("QRCode library is not loaded."); return; }
        qrContainer.innerHTML = '<p><small>Scan QR to save contact:</small></p>';
        const vcfForQR = generateVCF(data); // This will now generate a vCard using potentially Unicode data
        try {
            new QRCode(qrContainer, {
                text: vcfForQR, // QRCode.js handles UTF-8 correctly by default
                width: 140,
                height: 140,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });
            qrContainer.style.display = 'block';
            console.log("Generated QR Code with vCard data.");
        } catch(e) {
             console.error("QRCode generation failed:", e);
             qrContainer.innerHTML += '<p style="color: red;">Error generating QR code.</p>';
             qrContainer.style.display = 'block';
        }
    }
    // === END: Helper Functions ===

} // End initializePopupInteraction


// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded fired for directory page.");
    fetchAndDisplayListings();
    initializeSearch();
    initializePopupInteraction();
});