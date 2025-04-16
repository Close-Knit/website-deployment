// --- START OF UPDATED home.js (With "&" for Newfoundland Display) ---

// ======================================================================
// Initialize Supabase (Same as before)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages (Same as before)
// ======================================================================
function displayHomeError(message) {
    console.error("Home Page Error:", message);
    const regionContainer = document.getElementById("province-list");
    if (regionContainer) {
        regionContainer.innerHTML = `<p style="color: red;">Error loading data: ${message}</p>`;
    }
}

// ======================================================================
// Define Territories (Same as before)
// ======================================================================
const territoryNames = ["Yukon", "Northwest Territories", "Nunavut"];

// ======================================================================
// Max Communities to Display Initially (Same as before)
// ======================================================================
const MAX_COMMUNITIES_VISIBLE = 5;

// ======================================================================
// Fetch Provinces/Territories and Communities and Populate the List
// ======================================================================
async function populateHomePage() {
    const regionContainer = document.getElementById("province-list");
    if (!regionContainer) { console.error("Fatal Error: Could not find #province-list container element."); return; }
    regionContainer.innerHTML = '<p>Loading available communities...</p>';

    try {
        // 1. Fetch all provinces/territories (Same as before)
        console.log("Fetching provinces/territories...");
        const { data: regionsData, error: regionsError } = await supabaseClient.from('provinces').select('id, province_name').order('province_name', { ascending: true });
        if (regionsError) throw new Error(`Failed to fetch regions: ${regionsError.message}`);
        if (!regionsData || regionsData.length === 0) throw new Error('No provinces or territories found.');

        // 2. Fetch all communities - INCLUDE 'status' COLUMN
        console.log("Fetching communities...");
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, province_id, status') // Select status column
            .order('community_name', { ascending: true });

        if (communitiesError) throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        console.log(`Fetched ${communitiesData?.length || 0} communities.`);

        // 3. Organize data - Store status along with name (Same as before)
        const regionMap = new Map(regionsData.map(r => [r.id, r.province_name]));
        const communitiesByRegion = {};
        const provinces = [];
        const territories = [];
        regionsData.forEach(region => { communitiesByRegion[region.province_name] = []; if (territoryNames.includes(region.province_name)) { territories.push(region.province_name); } else { provinces.push(region.province_name); } });
        if (communitiesData && communitiesData.length > 0) { communitiesData.forEach(community => { const regionName = regionMap.get(community.province_id); if (regionName && communitiesByRegion.hasOwnProperty(regionName)) { communitiesByRegion[regionName].push({ name: community.community_name, status: community.status }); } else { console.warn(`Community "${community.community_name}" has an invalid province_id or region name mapping.`); } }); }

        // 4. Render the HTML
        regionContainer.innerHTML = '';
        regionContainer.className = 'region-container';

        const renderRegionSection = (regionName) => {
            const communities = communitiesByRegion[regionName] || []; // Ensure communities is always an array
            const regionSection = document.createElement("section");
            regionSection.className = 'region-column'; // This column will become a flex container via CSS

            const regionHeader = document.createElement("h2");

            // --- START: MODIFICATION for Newfoundland Heading ---
            // Check if this is the specific province and adjust display text
            let displayRegionName = regionName;
            if (regionName === "Newfoundland and Labrador") {
                displayRegionName = "Newfoundland & Labrador";
            }
            regionHeader.textContent = displayRegionName; // Use the potentially modified name for display
            // --- END: MODIFICATION for Newfoundland Heading ---

            regionSection.appendChild(regionHeader);

            // Create container for the list items (will grow to fill space)
            const communityListContainer = document.createElement("div");
            communityListContainer.className = 'community-list'; // This list will grow via CSS

            if (communities.length > 0) {
                // Display up to MAX_COMMUNITIES_VISIBLE
                const communitiesToDisplay = communities.slice(0, MAX_COMMUNITIES_VISIBLE);

                communitiesToDisplay.forEach(community => {
                    const communityItemContainer = document.createElement('div');
                    communityItemContainer.className = 'community-item-container';

                    const communityLink = document.createElement("a");
                    communityLink.className = 'community-link';
                    // Use original regionName for the link URL to ensure data consistency
                    communityLink.href = `community.html?province=${encodeURIComponent(regionName)}&community=${encodeURIComponent(community.name)}`;
                    communityLink.textContent = community.name;
                    communityItemContainer.appendChild(communityLink);

                    // Add Status Span Conditionally
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
                 // Display message if no communities
                 const noCommunitiesMsg = document.createElement('p');
                 noCommunitiesMsg.className = 'no-communities-message';
                 noCommunitiesMsg.textContent = 'No communities listed yet.';
                 communityListContainer.appendChild(noCommunitiesMsg);
            }
            // Add the list container to the section
            regionSection.appendChild(communityListContainer);

            // Add Button Container if communities exist
            if (communities.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'view-all-button-container';

                const viewAllLink = document.createElement("a");
                viewAllLink.className = 'button-style view-all-button';
                // Use original regionName for the link URL
                viewAllLink.href = `province_page.html?province=${encodeURIComponent(regionName)}`;
                viewAllLink.textContent = "View All";
                // Use original regionName for the title attribute for accuracy
                viewAllLink.title = `View all communities in ${regionName}`;

                buttonContainer.appendChild(viewAllLink);
                regionSection.appendChild(buttonContainer);
            }

            // Add the fully constructed section to the main container
            regionContainer.appendChild(regionSection);
        };

        // Render Provinces and Territories (Same logic as before)
        provinces.sort().forEach(renderRegionSection);
        if (territories.length > 0) { territories.sort().forEach(renderRegionSection); }
        if (regionContainer.childElementCount === 0) { regionContainer.innerHTML = '<p>No regions found.</p>'; }

    } catch (error) {
        displayHomeError(error.message);
    }
}

// ======================================================================
// Main Execution (Same as before)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') { displayHomeError("Supabase library not loaded."); return; }
    populateHomePage();
});

// --- END OF UPDATED home.js ---