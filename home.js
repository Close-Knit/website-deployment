// --- START OF home.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================
// const supabaseUrl = '...'; // REMOVED
// const supabaseKey = '...'; // REMOVED
// const { createClient } = supabase; // REMOVED
// const supabaseClient = createClient(supabaseUrl, supabaseKey); // REMOVED

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayHomeError(message) {
    console.error("Home Page Error:", message);
    const regionContainer = document.getElementById("province-list");
    if (regionContainer) {
        regionContainer.innerHTML = `<p style="color: red;">Error loading data: ${message}</p>`;
    }
}

// ======================================================================
// Define Territories
// ======================================================================
const territoryNames = ["Yukon", "Northwest Territories", "Nunavut"];

// ======================================================================
// Max Communities to Display Initially
// ======================================================================
const MAX_COMMUNITIES_VISIBLE = 5;

// ======================================================================
// Fetch Provinces/Territories and Communities and Populate the List
// ======================================================================
async function populateHomePage() {
    const regionContainer = document.getElementById("province-list");
    if (!regionContainer) {
        console.error("Fatal Error: Could not find #province-list container element.");
        return;
    }
    regionContainer.innerHTML = '<p>Loading available communities...</p>';

    // *** Check if the GLOBAL supabaseClient is available ***
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        displayHomeError("Supabase client not initialized (from common.js). Cannot fetch data.");
        return;
    }
    console.log("Home.js using supabaseClient initialized in common.js");

    try {
        // 1. Fetch all provinces/territories
        // *** USES GLOBAL supabaseClient ***
        console.log("Fetching provinces/territories...");
        const { data: regionsData, error: regionsError } = await supabaseClient
            .from('provinces')
            .select('id, province_name')
            .order('province_name', { ascending: true });

        if (regionsError) throw new Error(`Failed to fetch regions: ${regionsError.message}`);
        if (!regionsData || regionsData.length === 0) throw new Error('No provinces or territories found.');

        // 2. Fetch all communities
        // *** USES GLOBAL supabaseClient ***
        console.log("Fetching communities...");
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, province_id, status')
            .order('community_name', { ascending: true });

        if (communitiesError) throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        console.log(`Fetched ${communitiesData?.length || 0} communities.`);

        // 3. Organize data (unchanged logic)
        const regionMap = new Map(regionsData.map(r => [r.id, r.province_name]));
        const communitiesByRegion = {};
        const provinces = [];
        const territories = [];
        regionsData.forEach(region => {
            communitiesByRegion[region.province_name] = [];
            if (territoryNames.includes(region.province_name)) {
                territories.push(region.province_name);
            } else {
                provinces.push(region.province_name);
            }
        });
        if (communitiesData && communitiesData.length > 0) {
            communitiesData.forEach(community => {
                const regionName = regionMap.get(community.province_id);
                if (regionName && communitiesByRegion.hasOwnProperty(regionName)) {
                    communitiesByRegion[regionName].push({ name: community.community_name, status: community.status });
                } else {
                    console.warn(`Community "${community.community_name}" has an invalid province_id or region name mapping.`);
                }
            });
        }

        // 4. Render the HTML (unchanged logic, just formatting)
        regionContainer.innerHTML = '';
        regionContainer.className = 'region-container';

        const renderRegionSection = (regionName) => {
            const communities = communitiesByRegion[regionName] || [];
            const regionSection = document.createElement("section");
            regionSection.className = 'region-column';

            const regionHeader = document.createElement("h2");
            let displayRegionName = regionName;
            if (regionName === "Newfoundland and Labrador") {
                displayRegionName = "Newfoundland & Labrador";
            }
            regionHeader.textContent = displayRegionName;
            regionSection.appendChild(regionHeader);

            const communityListContainer = document.createElement("div");
            communityListContainer.className = 'community-list';

            if (communities.length > 0) {
                const communitiesToDisplay = communities.slice(0, MAX_COMMUNITIES_VISIBLE);
                communitiesToDisplay.forEach(community => {
                    const communityItemContainer = document.createElement('div');
                    communityItemContainer.className = 'community-item-container';

                    const communityLink = document.createElement("a");
                    communityLink.className = 'community-link';
                    communityLink.href = `community.html?province=${encodeURIComponent(regionName)}&community=${encodeURIComponent(community.name)}`;
                    communityLink.textContent = community.name;
                    communityItemContainer.appendChild(communityLink);

                    if (community.status === 'NEW') {
                        const statusSpan = document.createElement('span');
                        statusSpan.className = 'status-label status-new';
                        statusSpan.textContent = ' New!';
                        communityItemContainer.appendChild(statusSpan);
                    } else if (community.status === 'COMING_SOON') {
                        const statusSpan = document.createElement('span');
                        statusSpan.className = 'status-label status-coming-soon';
                        statusSpan.textContent = ' Coming Soon';
                        communityItemContainer.appendChild(statusSpan);
                    }
                    communityListContainer.appendChild(communityItemContainer);
                });
            } else {
                 const noCommunitiesMsg = document.createElement('p');
                 noCommunitiesMsg.className = 'no-communities-message';
                 noCommunitiesMsg.textContent = 'No communities listed yet.';
                 communityListContainer.appendChild(noCommunitiesMsg);
            }
            regionSection.appendChild(communityListContainer);

            if (communities.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'view-all-button-container';
                const viewAllLink = document.createElement("a");
                viewAllLink.className = 'button-style view-all-button';
                viewAllLink.href = `province_page.html?province=${encodeURIComponent(regionName)}`;
                viewAllLink.textContent = "View All";
                viewAllLink.title = `View all communities in ${regionName}`;
                buttonContainer.appendChild(viewAllLink);
                regionSection.appendChild(buttonContainer);
            }
            regionContainer.appendChild(regionSection);
        };

        provinces.sort().forEach(renderRegionSection);
        if (territories.length > 0) {
            territories.sort().forEach(renderRegionSection);
        }
        if (regionContainer.childElementCount === 0) {
            regionContainer.innerHTML = '<p>No regions found.</p>';
        }

    } catch (error) {
        displayHomeError(error.message);
    }
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // *** REMOVED Supabase library check here - assume common.js handled it ***
    // if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    //     displayHomeError("Supabase library not loaded.");
    //     return;
    // }

    // Call populate function directly
    populateHomePage();
});

// --- END OF home.js ---