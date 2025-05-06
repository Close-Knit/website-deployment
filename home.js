// --- START OF home.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================

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

                    const communityLink = createCommunityLink(community.name, regionName);
                    communityItemContainer.appendChild(communityLink);

                    if (community.status === 'NEW') {
                        const statusLabel = document.createElement("span");
                        statusLabel.className = 'status-label status-new';
                        statusLabel.textContent = 'New!';
                        communityItemContainer.appendChild(statusLabel);
                    } else if (community.status === 'COMING_SOON') {
                        const statusLabel = document.createElement("span");
                        statusLabel.className = 'status-label status-coming-soon';
                        statusLabel.textContent = 'Coming Soon';
                        communityItemContainer.appendChild(statusLabel);
                    }

                    communityListContainer.appendChild(communityItemContainer);
                });
            } else {
                const noCommunitiesMsg = document.createElement("p");
                noCommunitiesMsg.textContent = "No communities available yet.";
                communityListContainer.appendChild(noCommunitiesMsg);
            }

            regionSection.appendChild(communityListContainer);

            if (communities.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'view-all-button-container';
                const viewAllLink = document.createElement("a");
                viewAllLink.className = 'button-style view-all-button';
                
                // Create the URL using the slug format
                const provinceSlug = createSlug(regionName);
                viewAllLink.href = `/${provinceSlug}/`;
                
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
    // Call populate function directly
    populateHomePage();
    
    // Setup search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// ======================================================================
// Search Functionality
// ======================================================================
function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    if (searchTerm.length < 2) {
        alert('Please enter at least 2 characters to search');
        return;
    }
    
    // Redirect to search results page
    window.location.href = `/search.html?q=${encodeURIComponent(searchTerm)}`;
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

// When creating community links on the homepage
function createCommunityLink(communityName, provinceName) {
    const communityLink = document.createElement("a");
    communityLink.className = 'community-link';
    
    // Create the URL using the slug format
    const provinceSlug = createSlug(provinceName);
    const communitySlug = createSlug(communityName);
    
    // Use the new static URL format
    communityLink.href = `/${provinceSlug}/${communitySlug}/`;
    communityLink.textContent = communityName;
    
    return communityLink;
}

// --- END OF home.js ---
