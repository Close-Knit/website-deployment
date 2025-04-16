// --- common.js ---
// Contains shared JavaScript functionality like the Back to Top button

document.addEventListener('DOMContentLoaded', () => {

    // --- Back to Top Button Logic ---
    const backToTopButton = document.getElementById("backToTopBtn");
    const scrollThreshold = 200; // Pixels scrolled down before button appears

    if (backToTopButton) {
        // Function to toggle button visibility
        const toggleVisibility = () => {
            if (window.scrollY > scrollThreshold) {
                backToTopButton.classList.add("show");
            } else {
                backToTopButton.classList.remove("show");
            }
        };

        // Function to scroll to top smoothly
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };

        // Add scroll listener
        window.addEventListener('scroll', toggleVisibility);

        // Add click listener
        backToTopButton.addEventListener('click', scrollToTop);

        // Initial check in case page loads already scrolled down
        toggleVisibility();

    } else {
        // console.warn("Back to Top button element not found."); // Optional warning
    }

    // --- Add other common JS functions here in the future if needed ---

});