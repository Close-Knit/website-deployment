// --- province_page.js ---
// Handles fetching and displaying all communities for a specific province

// ======================================================================
// Initialize Supabase
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// DOM Elements
// ======================================================================
const provinceNameHeading = document.getElementById('province-name-heading');
const communityListContainer = document.getElementById('community-list-province');
const pageTitle = document.querySelector('title');
const breadcrumbContainer = document.getElementById('breadcrumb-container'); // Get breadcrumb container

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayProvincePageError(message) {
    console.error("Province Page Error:", message);
    if (communityListContainer) {
        communityListContainer.innerHTML = `<li style="color: red;">Error: ${message}</li>`;
    }
    if (provinceNameHeading) {
        provinceNameHeading.textContent = "Error Loading Page";
    }
     if (pageTitle) {
         pageTitle.textContent = "Error";
     }
     // Clear breadcrumbs on error
     if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
}

// ======================================================================
// Fetch and Display Communities for the Province
// ======================================================================
async function loadProvinceCommunities() {
    // Add breadcrumbContainer to the check
    if (!communityListContainer || !provinceNameHeading || !pageTitle || !breadcrumbContainer) {
        console.error("Essential page elements (heading, list container, title, or breadcrumb) not found.");
        // Optionally provide a user-facing error if critical elements are missing
        if(communityListContainer) communityListContainer.innerHTML = '<li>Page structure error. Cannot load content.</li>';
        return;
    }

    // Clear previous results/breadcrumbs
    communityListContainer.innerHTML = '<li>Loading...</li>';
    breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    // 1. Get Province Name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");

    if (!provinceName) {
        displayProvincePageError("Province name missing from URL.");
        return;
    }

    const decodedProvinceName = decodeURIComponent(provinceName);

    // Set initial UI states
    provinceNameHeading.textContent = `Loading Communities for ${decodedProvinceName}...`;
    pageTitle.textContent = `Communities in ${decodedProvinceName}`;


    // --- START: Breadcrumb Generation ---
    breadcrumbContainer.innerHTML = `
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">${decodedProvinceName}</li>
        </ol>
    `;
    // --- END: Breadcrumb Generation ---

    try {
        // 2. Get Province ID from Name
        console.log(`Fetching ID for province: ${decodedProvinceName}`);
        const { data: provinceData, error: provinceError } = await supabaseClient
            .from('provinces')
            .select('id')
            .eq('province_name', decodedProvinceName)
            .single(); // Expect only one province with this name

        if (provinceError) {
            throw new Error(`Could not find province "${decodedProvinceName}": ${provinceError.message}`);
        }
        if (!provinceData) {
            throw new Error(`Province "${decodedProvinceName}" not found in database.`);
        }
        const provinceId = provinceData.id;
        console.log(`Found Province ID: ${provinceId}`);

        // 3. Get All Communities for that Province ID
        console.log(`Fetching communities for province ID: ${provinceId}`);
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name') // Only need the name
            .eq('province_id', provinceId)
            .order('community_name', { ascending: true }); // Fetch sorted alphabetically

        if (communitiesError) {
            throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        }

        // 4. Process and Display Communities
        communityListContainer.innerHTML = ''; // Clear loading message

        if (!communitiesData || communitiesData.length === 0) {
            provinceNameHeading.textContent = `Communities in ${decodedProvinceName}`; // Update heading
            communityListContainer.innerHTML = '<li>No communities found for this province yet.</li>';
            return;
        }

        provinceNameHeading.textContent = `Communities in ${decodedProvinceName} (${communitiesData.length})`; // Update heading with count

        // Group communities by first letter
        const groupedCommunities = communitiesData.reduce((acc, community) => {
            // Ensure community_name exists and is not empty before accessing index 0
            if (community.community_name && community.community_name.length > 0) {
                const firstLetter = community.community_name[0].toUpperCase();
                if (/^[A-Z]$/.test(firstLetter)) { // Check if it's an uppercase letter
                    if (!acc[firstLetter]) {
                        acc[firstLetter] = [];
                    }
                    acc[firstLetter].push(community.community_name);
                } else {
                    // Group non-letters under '#'
                    if (!acc['#']) acc['#'] = [];
                    acc['#'].push(community.community_name);
                }
            } else {
                 // Handle potential empty community names if necessary
                 console.warn("Found community with empty name.");
                 if (!acc['#']) acc['#'] = [];
                 acc['#'].push("(Empty Name)"); // Or handle differently
            }
            return acc;
        }, {});


        // Get sorted letters (and potentially '#')
        const sortedLetters = Object.keys(groupedCommunities).sort((a, b) => {
            if (a === '#') return 1; // Push '#' to the end
            if (b === '#') return -1;
            return a.localeCompare(b);
        });

        // Render grouped list
        sortedLetters.forEach(letter => {
            // Add letter heading
            const letterHeadingItem = document.createElement('li');
            letterHeadingItem.className = 'letter-heading'; // Apply styling class
            letterHeadingItem.textContent = letter;
            communityListContainer.appendChild(letterHeadingItem);

            // Add communities under this letter (already sorted)
            groupedCommunities[letter].forEach(communityName => {
                const listItem = document.createElement('li');
                listItem.className = 'community-list-item'; // Add class for potential styling

                const link = document.createElement('a');
                // Ensure the community name is properly encoded for the URL
                link.href = `community.html?province=${encodeURIComponent(decodedProvinceName)}&community=${encodeURIComponent(communityName)}`;
                link.textContent = communityName;

                listItem.appendChild(link);
                communityListContainer.appendChild(listItem);
            });
        });

    } catch (error) {
        displayProvincePageError(error.message);
    }
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayProvincePageError("Supabase library not loaded.");
        return;
    }
    loadProvinceCommunities();
});