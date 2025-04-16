// --- common.js ---
// Contains shared JavaScript functionality

document.addEventListener('DOMContentLoaded', () => {

    // --- Back to Top Button Logic ---
    const backToTopButton = document.getElementById("backToTopBtn");
    const scrollThreshold = 200; // Pixels scrolled down before button appears

    if (backToTopButton) {
        const toggleVisibility = () => {
            if (window.scrollY > scrollThreshold) {
                backToTopButton.classList.add("show");
            } else {
                backToTopButton.classList.remove("show");
            }
        };
        const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
        window.addEventListener('scroll', toggleVisibility);
        backToTopButton.addEventListener('click', scrollToTop);
        toggleVisibility(); // Initial check
    } else {
        // console.warn("Back to Top button element not found."); // Optional
    }

    // --- Share Page Button Logic ---
    const shareButton = document.getElementById("shareButton"); // Changed from printButton
    if (shareButton) {
        const pageTitle = document.title; // Get page title for sharing text
        const pageUrl = window.location.href; // Get current page URL
        const shareTextElement = shareButton.querySelector('.share-text'); // Get the span for text feedback
        const shareIconElement = shareButton.querySelector('i'); // Get the icon element
        const originalShareText = shareTextElement ? shareTextElement.textContent : 'Share Page';
        const originalShareIconClass = shareIconElement ? shareIconElement.className : 'fa-solid fa-share-nodes';

        shareButton.addEventListener('click', async () => {
            const shareData = {
                title: pageTitle,
                text: `Check out this directory on Bizly: ${pageTitle}`, // Example text
                url: pageUrl,
            };

            let sharedNatively = false; // Flag to track if native share worked

            // Try Native Web Share API first
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    console.log('Page shared successfully via Web Share API');
                    sharedNatively = true; // Set flag if share successful
                    // Native UI provides feedback, so no changes needed here
                } catch (err) {
                    if (err.name !== 'AbortError') { // Don't log error if user cancelled
                        console.error('Error using Web Share API:', err);
                    } else {
                        console.log('Web Share cancelled by user.');
                    }
                    // If cancelled or failed, we still want to try the fallback below
                }
            }

            // Fallback to Clipboard API if Web Share not supported or failed/cancelled
            if (!sharedNatively && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(pageUrl);
                    console.log('Page URL copied to clipboard');
                    // Provide visual feedback for copy
                    if (shareTextElement) shareTextElement.textContent = 'Link Copied!';
                    if (shareIconElement) shareIconElement.className = 'fa-solid fa-check'; // Change icon
                    shareButton.disabled = true; // Briefly disable

                    setTimeout(() => {
                        if (shareTextElement) shareTextElement.textContent = originalShareText;
                        if (shareIconElement) shareIconElement.className = originalShareIconClass; // Change icon back
                        shareButton.disabled = false; // Re-enable
                    }, 2000); // Reset after 2 seconds
                } catch (err) {
                    console.error('Failed to copy page URL:', err);
                    alert("Could not copy link. Please copy it manually from the address bar.");
                    // Ensure button is reset even on error
                    if (shareTextElement) shareTextElement.textContent = originalShareText;
                    if (shareIconElement) shareIconElement.className = originalShareIconClass;
                    shareButton.disabled = false;
                }
            } else if (!sharedNatively) {
                 // Fallback if neither API is supported
                 console.warn("Web Share and Clipboard API not supported or available.");
                 alert("Sharing/Copying is not supported by your browser. Please copy the link manually.");
            }
        });
    } else {
         console.warn("Share button element (#shareButton) not found."); // Updated warning
    }

}); // End DOMContentLoaded