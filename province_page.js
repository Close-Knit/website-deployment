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
}

// ======================================================================
// Fetch and Display Communities for the Province
// ======================================================================
async function loadProvinceCommunities() {
    if (!communityListContainer || !provinceNameHeading || !pageTitle) {
        console.error("Essential page elements not found.");
        return;
    }

    // 1. Get Province Name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");

    if (!provinceName) {
        displayProvincePageError("Province name missing from URL.");
        return;
    }

    const decodedProvinceName = decodeURIComponent(provinceName);
    provinceNameHeading.textContent = `Loading Communities for ${decodedProvinceName}...`;
    pageTitle.textContent = `Communities in ${decodedProvinceName}`;
    communityListContainer.innerHTML = '<li>Loading...</li>';

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
            const firstLetter = community.community_name[0]?.toUpperCase();
            if (firstLetter && /^[A-Z]$/.test(firstLetter)) { // Ensure it's a letter A-Z
                 if (!acc[firstLetter]) {
                     acc[firstLetter] = [];
                 }
                 acc[firstLetter].push(community.community_name);
             } else {
                 // Optional: Group numbers or symbols under '#' or similar
                 if (!acc['#']) acc['#'] = [];
                 acc['#'].push(community.community_name);
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

            // Add communities under this letter
            groupedCommunities[letter].forEach(communityName => {
                const listItem = document.createElement('li');
                listItem.className = 'community-list-item'; // Add class for potential styling

                const link = document.createElement('a');
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