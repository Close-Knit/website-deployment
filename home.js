// --- START OF REVISED home.js (No category-heading class on H2) ---

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
    if (!regionContainer) {
        console.error("Fatal Error: Could not find #province-list container element.");
        return;
    }
    regionContainer.innerHTML = '<p>Loading available communities...</p>';

    try {
        // Fetch regions and communities (Same logic as before)
        console.log("Fetching provinces/territories...");
        const { data: regionsData, error: regionsError } = await supabaseClient.from('provinces').select('id, province_name').order('province_name', { ascending: true });
        if (regionsError) throw new Error(`Failed to fetch regions: ${regionsError.message}`);
        if (!regionsData || regionsData.length === 0) throw new Error('No provinces or territories found.');

        console.log("Fetching communities...");
        const { data: communitiesData, error: communitiesError } = await supabaseClient.from('communities').select('community_name, province_id').order('community_name', { ascending: true });
        if (communitiesError) throw new Error(`Failed to fetch communities: ${communitiesError.message}`);

        // Organize data (Same logic as before)
        const regionMap = new Map(regionsData.map(r => [r.id, r.province_name]));
        const communitiesByRegion = {};
        const provinces = [];
        const territories = [];
        regionsData.forEach(region => { communitiesByRegion[region.province_name] = []; if (territoryNames.includes(region.province_name)) { territories.push(region.province_name); } else { provinces.push(region.province_name); } });
        if (communitiesData && communitiesData.length > 0) { communitiesData.forEach(community => { const regionName = regionMap.get(community.province_id); if (regionName && communitiesByRegion.hasOwnProperty(regionName)) { communitiesByRegion[regionName].push(community.community_name); } else { console.warn(`Community "${community.community_name}" invalid province_id.`); } }); }

        // Render the HTML
        regionContainer.innerHTML = '';
        regionContainer.className = 'region-container';

        const renderRegionSection = (regionName) => {
            const communities = communitiesByRegion[regionName];
            const regionSection = document.createElement("section");
            regionSection.className = 'region-column';

            const regionHeader = document.createElement("h2");
            // *** REVERTED CHANGE: Do NOT apply category-heading class here ***
            // regionHeader.className = 'category-heading'; 
            regionHeader.textContent = regionName;
            regionSection.appendChild(regionHeader);

            const communityListContainer = document.createElement("div");
            communityListContainer.className = 'community-list';

            if (communities.length > 0) {
                const communitiesToDisplay = communities.slice(0, MAX_COMMUNITIES_VISIBLE);
                const showViewMore = communities.length > MAX_COMMUNITIES_VISIBLE;
                communitiesToDisplay.forEach(communityName => { const communityLink = document.createElement("a"); communityLink.className = 'community-link'; communityLink.href = `community.html?province=${encodeURIComponent(regionName)}&community=${encodeURIComponent(communityName)}`; communityLink.textContent = communityName; communityListContainer.appendChild(communityLink); });
                if (showViewMore) { const viewMoreLink = document.createElement("a"); viewMoreLink.className = 'view-more-link'; viewMoreLink.href = `province_page.html?province=${encodeURIComponent(regionName)}`; viewMoreLink.textContent = "View More..."; communityListContainer.appendChild(viewMoreLink); }
            } else { const noCommunitiesMsg = document.createElement("span"); noCommunitiesMsg.textContent = "No communities listed yet."; noCommunitiesMsg.className = 'no-communities-message'; communityListContainer.appendChild(noCommunitiesMsg); }
            regionSection.appendChild(communityListContainer);
            regionContainer.appendChild(regionSection);
        };

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

// --- END OF REVISED home.js ---