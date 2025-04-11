// --- START OF UPDATED home.js (Province Columns + Max 5 + View More) ---

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

    try {
        // Fetch regions and communities (Same logic as before)
        // ... (fetch regionsData) ...
         console.log("Fetching provinces/territories...");
        const { data: regionsData, error: regionsError } = await supabaseClient
            .from('provinces') 
            .select('id, province_name') 
            .order('province_name', { ascending: true }); 

        if (regionsError) throw new Error(`Failed to fetch regions: ${regionsError.message}`);
        if (!regionsData || regionsData.length === 0) throw new Error('No provinces or territories found.');
        
        // ... (fetch communitiesData) ...
        console.log("Fetching communities...");
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, province_id') 
            .order('community_name', { ascending: true }); 

        if (communitiesError) throw new Error(`Failed to fetch communities: ${communitiesError.message}`);

        // Organize data (Same logic as before)
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
                    communitiesByRegion[regionName].push(community.community_name);
                } else { /* ... warning ... */ }
            });
        }

        // Render the HTML
        regionContainer.innerHTML = ''; 
        regionContainer.className = 'region-container'; 

        // Helper function to render a region section (column)
        const renderRegionSection = (regionName) => {
            const communities = communitiesByRegion[regionName]; // Full list for this region

            const regionSection = document.createElement("section");
            regionSection.className = 'region-column'; 

            const regionHeader = document.createElement("h2");
            regionHeader.className = 'category-heading'; 
            regionHeader.textContent = regionName;
            regionSection.appendChild(regionHeader);

            const communityListContainer = document.createElement("div");
            communityListContainer.className = 'community-list'; 

            if (communities.length > 0) {
                // *** START: Logic for Max 5 + View More ***
                const communitiesToDisplay = communities.slice(0, MAX_COMMUNITIES_VISIBLE);
                const showViewMore = communities.length > MAX_COMMUNITIES_VISIBLE;

                // Display the limited list (or full list if <= MAX)
                communitiesToDisplay.forEach(communityName => {
                    const communityLink = document.createElement("a");
                    communityLink.className = 'community-link'; 
                    communityLink.href = `community.html?province=${encodeURIComponent(regionName)}&community=${encodeURIComponent(communityName)}`;
                    communityLink.textContent = communityName;
                    communityListContainer.appendChild(communityLink); 
                });

                // Add "View More" link if needed
                if (showViewMore) {
                    const viewMoreLink = document.createElement("a");
                    viewMoreLink.className = 'view-more-link';
                    // Placeholder link - ** IMPORTANT: This page needs to be created later **
                    viewMoreLink.href = `province_page.html?province=${encodeURIComponent(regionName)}`; 
                    viewMoreLink.textContent = "View More...";
                    communityListContainer.appendChild(viewMoreLink);
                }
                // *** END: Logic for Max 5 + View More ***

            } else {
                 // Handle case with no communities (same as before)
                 const noCommunitiesMsg = document.createElement("span"); 
                 noCommunitiesMsg.textContent = "No communities listed yet.";
                 noCommunitiesMsg.className = 'no-communities-message'; 
                 communityListContainer.appendChild(noCommunitiesMsg);
            }
            regionSection.appendChild(communityListContainer); 
            regionContainer.appendChild(regionSection); 
        };

        // Render Provinces and Territories (Same logic as before)
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
// Main Execution (Same as before)
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayHomeError("Supabase library not loaded.");
        return;
    }
    populateHomePage(); 
});

// --- END OF UPDATED home.js ---