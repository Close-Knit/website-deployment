// --- province_page.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================
// const supabaseUrl = '...'; // REMOVED
// const supabaseKey = '...'; // REMOVED
// const { createClient } = supabase; // REMOVED
// const supabaseClient = createClient(supabaseUrl, supabaseKey); // REMOVED

// ======================================================================
// DOM Elements (unchanged)
// ======================================================================
const provinceNameHeading = document.getElementById('province-name-heading');
const communityListContainer = document.getElementById('community-list-province');
const pageTitle = document.querySelector('title');
const breadcrumbContainer = document.getElementById('breadcrumb-container');

// ======================================================================
// Helper to display error messages (unchanged)
// ======================================================================
function displayProvincePageError(message, error = null) {
    console.error("Province Page Error:", message);
    if (error) {
        console.error("Full error details:", error);
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
    // *** Check if the GLOBAL supabaseClient is available FIRST ***
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        displayProvincePageError("Supabase client not initialized (from common.js). Cannot fetch data.");
        // Ensure essential elements are checked even if client fails early
        if (!communityListContainer || !provinceNameHeading || !pageTitle || !breadcrumbContainer) {
             console.error("Essential page elements missing on province page.");
        }
        return;
    }
    console.log("Province_page.js using supabaseClient initialized in common.js");

    // Check essential elements (moved check after client check)
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
        console.log(`Fetching ID for province: ${decodedProvinceName}`);
        // *** USES GLOBAL supabaseClient ***
        const { data: provinceData, error: provinceError } = await supabaseClient
            .from('provinces')
            .select('id')
            .eq('province_name', decodedProvinceName)
            .single();

        if (provinceError || !provinceData) {
            throw new Error(`Could not find province "${decodedProvinceName}": ${provinceError?.message || 'Not found'}`, { cause: provinceError });
        }
        const provinceId = provinceData.id;
        console.log(`Found Province ID: ${provinceId}`);

        // --- Fetch Communities ---
        console.log(`Fetching communities for province ID: ${provinceId}`);
        // *** USES GLOBAL supabaseClient ***
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, status')
            .eq('province_id', provinceId)
            .order('community_name', { ascending: true });

        // Check for error RIGHT HERE
         if (communitiesError) {
            console.error("!!! Error fetching communities from Supabase:", communitiesError);
            throw new Error(`Failed to fetch communities: ${communitiesError.message}`, { cause: communitiesError });
         }

        console.log("Fetched communitiesData:", communitiesData);

        // --- Process and Display Communities (unchanged logic) ---
        communityListContainer.innerHTML = '';

        if (!communitiesData || communitiesData.length === 0) {
            provinceNameHeading.textContent = `Communities in ${decodedProvinceName}`;
            communityListContainer.innerHTML = '<li>No communities found for this province yet.</li>';
            return;
        }

        provinceNameHeading.textContent = `Communities in ${decodedProvinceName} (${communitiesData.length})`;

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

                let statusSpan = null;
                if (community.status === 'NEW') {
                    statusSpan = document.createElement('span');
                    statusSpan.className = 'status-label status-new';
                    statusSpan.textContent = ' New!';
                } else if (community.status === 'COMING_SOON') {
                    statusSpan = document.createElement('span');
                    statusSpan.className = 'status-label status-coming-soon';
                    statusSpan.textContent = ' Coming Soon';
                }

                if (statusSpan) {
                    itemContainer.appendChild(statusSpan);
                }

                listItem.appendChild(itemContainer);
                communityListContainer.appendChild(listItem);
            });
        });

    } catch (error) {
        displayProvincePageError(error.message || "An unknown error occurred", error);
    }
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // *** REMOVED Supabase library check here ***
    // if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    //     displayProvincePageError("Supabase library not loaded.");
    //     return;
    // }

    // Call load function directly
    loadProvinceCommunities();
});