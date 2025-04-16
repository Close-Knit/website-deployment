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
const breadcrumbContainer = document.getElementById('breadcrumb-container');

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayProvincePageError(message, error = null) { // Added optional error object
    console.error("Province Page Error:", message);
    if (error) {
        console.error("Full error details:", error); // Log the full error object
    }
    if (communityListContainer) {
        communityListContainer.innerHTML = `<li style="color: red;">Error: ${message}</li>`;
    }
    if (provinceNameHeading) {
        provinceNameHeading.textContent = "Error Loading Page";
    }
     if (pageTitle) {
         pageTitle.textContent = "Error";
     }
     if(breadcrumbContainer) breadcrumbContainer.innerHTML = '';
}

// ======================================================================
// Fetch and Display Communities for the Province
// ======================================================================
async function loadProvinceCommunities() {
    if (!communityListContainer || !provinceNameHeading || !pageTitle || !breadcrumbContainer) {
        console.error("Essential page elements (heading, list container, title, or breadcrumb) not found.");
        if(communityListContainer) communityListContainer.innerHTML = '<li>Page structure error. Cannot load content.</li>';
        return;
    }

    communityListContainer.innerHTML = '<li>Loading...</li>';
    breadcrumbContainer.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const provinceName = urlParams.get("province");

    if (!provinceName) {
        displayProvincePageError("Province name missing from URL.");
        return;
    }

    const decodedProvinceName = decodeURIComponent(provinceName);

    provinceNameHeading.textContent = `Loading Communities for ${decodedProvinceName}...`;
    pageTitle.textContent = `Communities in ${decodedProvinceName}`;

    breadcrumbContainer.innerHTML = `
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">${decodedProvinceName}</li>
        </ol>
    `;

    try {
        console.log(`Fetching ID for province: ${decodedProvinceName}`); // Line 81
        const { data: provinceData, error: provinceError } = await supabaseClient
            .from('provinces')
            .select('id')
            .eq('province_name', decodedProvinceName)
            .single();

        if (provinceError || !provinceData) {
             // Pass the actual error object to the helper
            throw new Error(`Could not find province "${decodedProvinceName}": ${provinceError?.message || 'Not found'}`, { cause: provinceError });
        }
        const provinceId = provinceData.id;
        console.log(`Found Province ID: ${provinceId}`); // Line 95

        // --- Fetch Communities ---
        console.log(`Fetching communities for province ID: ${provinceId}`); // Line 98
        let communitiesData, communitiesError;
        try {
            const response = await supabaseClient
                .from('communities')
                .select('community_name, status') // Select name and status
                .eq('province_id', provinceId)
                .order('community_name', { ascending: true });

            communitiesData = response.data;
            communitiesError = response.error;

             // --- Check for error RIGHT HERE ---
             if (communitiesError) {
                console.error("!!! Error fetching communities from Supabase:", communitiesError); // Log specific error first
                throw new Error(`Failed to fetch communities: ${communitiesError.message}`, { cause: communitiesError });
             }

        } catch (fetchCommError) {
             // Catch errors specifically from the fetch operation
             console.error("!!! Exception during community fetch:", fetchCommError);
             // Re-throw to be caught by the outer catch block, passing the original error
             throw fetchCommError;
        }

        // --- Log fetched data (only reached if fetch was successful) ---
        console.log("Fetched communitiesData:", communitiesData); // <<< KEEP THIS LOG >>>

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
             if (community.community_name && community.community_name.length > 0) {
                const firstLetter = community.community_name[0].toUpperCase();
                const key = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({ name: community.community_name, status: community.status });
             } else {
                 console.warn("Found community with empty name.");
                 if (!acc['#']) acc['#'] = [];
                 acc['#'].push({ name: "(Empty Name)", status: null });
             }
            return acc;
        }, {});

        const sortedLetters = Object.keys(groupedCommunities).sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        });

        // Render grouped list
        sortedLetters.forEach(letter => {
            const letterHeadingItem = document.createElement('li');
            letterHeadingItem.className = 'letter-heading';
            letterHeadingItem.textContent = letter;
            communityListContainer.appendChild(letterHeadingItem);

            groupedCommunities[letter].forEach(community => {
                const listItem = document.createElement('li');
                listItem.className = 'community-list-item';

                const itemContainer = document.createElement('div');
                itemContainer.className = 'province-community-item-container';

                const link = document.createElement('a');
                link.className = 'community-link';
                link.href = `community.html?province=${encodeURIComponent(decodedProvinceName)}&community=${encodeURIComponent(community.name)}`;
                link.textContent = community.name;
                itemContainer.appendChild(link);

                // console.log("Processing community:", community); // Keep if needed

                let statusSpan = null;
                if (community.status === 'NEW') {
                    // console.log("Status is NEW, creating span..."); // Keep if needed
                    statusSpan = document.createElement('span');
                    statusSpan.className = 'status-label status-new';
                    statusSpan.textContent = ' New!';
                } else if (community.status === 'COMING_SOON') {
                    // console.log("Status is COMING_SOON, creating span..."); // Keep if needed
                    statusSpan = document.createElement('span');
                    statusSpan.className = 'status-label status-coming-soon';
                    statusSpan.textContent = ' Coming Soon';
                }

                if (statusSpan) {
                    // console.log("Appending status span:", statusSpan); // Keep if needed
                    itemContainer.appendChild(statusSpan);
                }

                listItem.appendChild(itemContainer);
                communityListContainer.appendChild(listItem);
            });
        });

    } catch (error) {
        // Pass the full error object to the helper function
        displayProvincePageError(error.message || "An unknown error occurred", error);
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