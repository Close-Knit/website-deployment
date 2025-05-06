// common.js - Centralized Supabase client initialization and shared functions

// ======================================================================
// Supabase Client Initialization - GLOBAL
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q'; // Replace with your actual public anon key

// Initialize the Supabase client immediately
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Back to Top Button Functionality
// ======================================================================
function setupBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    if (!backToTopBtn) {
        console.warn("Back to top button not found on page");
        return;
    }
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    });
    
    // Scroll to top when button clicked
    backToTopBtn.addEventListener('click', () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });
}

// ======================================================================
// Shared Utility Functions
// ======================================================================

// Format a phone number as (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumberString; // Return original if formatting fails
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get URL parameters as an object
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Function to generate breadcrumbs
function generateBreadcrumbs(currentPage, provinceName, communityName) {
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (!breadcrumbContainer) return;
    
    breadcrumbContainer.innerHTML = '';
    
    // Create Home link
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = 'Home';
    breadcrumbContainer.appendChild(homeLink);
    
    // Add separator
    const separator1 = document.createElement('span');
    separator1.className = 'breadcrumb-separator';
    separator1.innerHTML = ' &gt; ';
    breadcrumbContainer.appendChild(separator1);
    
    if (currentPage === 'province' && provinceName) {
        // On province page, add province as current
        const provinceSpan = document.createElement('span');
        provinceSpan.className = 'current-page';
        provinceSpan.textContent = provinceName;
        breadcrumbContainer.appendChild(provinceSpan);
    } else if (currentPage === 'community' && provinceName && communityName) {
        // On community page, add province link and community as current
        const provinceSlug = createSlug(provinceName);
        const provinceLink = document.createElement('a');
        provinceLink.href = `/${provinceSlug}/`;
        provinceLink.textContent = provinceName;
        breadcrumbContainer.appendChild(provinceLink);
        
        // Add separator
        const separator2 = document.createElement('span');
        separator2.className = 'breadcrumb-separator';
        separator2.innerHTML = ' &gt; ';
        breadcrumbContainer.appendChild(separator2);
        
        // Add community as current
        const communitySpan = document.createElement('span');
        communitySpan.className = 'current-page';
        communitySpan.textContent = communityName;
        breadcrumbContainer.appendChild(communitySpan);
    }
}

// Helper function to create slug from name
function createSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .trim();                  // Trim leading/trailing spaces
}
