// --- START OF common.js (Refactored for Central Supabase Init) ---

// ======================================================================
//  SHARED CONFIGURATION & INITIALIZATION
// ======================================================================

// Define Supabase credentials ONCE here
const SUPABASE_URL = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';

// Declare supabaseClient globally within this script's scope
// Other scripts will access this variable IF common.js is loaded first.
let supabaseClient;

// Initialize Supabase client immediately when this script loads
// Assumes the main Supabase library (<script src="...supabase-js@2">) is loaded BEFORE this script.
if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized centrally in common.js");
    } catch (error) {
        console.error("Error initializing Supabase client in common.js:", error);
        // You could potentially display an error on the page here if critical
    }
} else {
    console.error("Supabase library (supabase-js@2) not found or failed to load before common.js!");
    // Display error or disable features that depend on Supabase
}

// ======================================================================
//  DOM CONTENT LOADED FEATURES (Run after HTML is parsed)
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Common.js DOMContentLoaded event fired.");

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
        // console.warn("Back to Top button element not found.");
    }

    // --- Share Page Button Logic ---
    const shareButton = document.getElementById("shareButton");
    if (shareButton) {
        const pageTitle = document.title;
        const pageUrl = window.location.href;
        const shareTextElement = shareButton.querySelector('.share-text');
        const shareIconElement = shareButton.querySelector('i');
        const originalShareText = shareTextElement ? shareTextElement.textContent : 'Share Page';
        const originalShareIconClass = shareIconElement ? shareIconElement.className : 'fa-solid fa-share-nodes';

        shareButton.addEventListener('click', async () => {
            const shareData = {
                title: pageTitle,
                text: `Check out this directory on Bizly: ${pageTitle}`,
                url: pageUrl,
            };

            let sharedNatively = false;

            // Try Native Web Share API
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    console.log('Page shared successfully via Web Share API');
                    sharedNatively = true;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Error using Web Share API:', err);
                    } else {
                        console.log('Web Share cancelled by user.');
                    }
                }
            }

            // Fallback to Clipboard API
            if (!sharedNatively && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(pageUrl);
                    console.log('Page URL copied to clipboard');
                    if (shareTextElement) shareTextElement.textContent = 'Link Copied!';
                    if (shareIconElement) shareIconElement.className = 'fa-solid fa-check';
                    shareButton.disabled = true;

                    setTimeout(() => {
                        if (shareTextElement) shareTextElement.textContent = originalShareText;
                        if (shareIconElement) shareIconElement.className = originalShareIconClass;
                        shareButton.disabled = false;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy page URL:', err);
                    alert("Could not copy link. Please copy it manually from the address bar.");
                    if (shareTextElement) shareTextElement.textContent = originalShareText;
                    if (shareIconElement) shareIconElement.className = originalShareIconClass;
                    shareButton.disabled = false;
                }
            } else if (!sharedNatively) {
                 console.warn("Web Share and Clipboard API not supported or available.");
                 alert("Sharing/Copying is not supported by your browser. Please copy the link manually.");
            }
        });
    } else {
         console.warn("Share button element (#shareButton) not found.");
    }

}); // End DOMContentLoaded
// --- END OF common.js ---