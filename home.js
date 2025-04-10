// ======================================================================
// Initialize Supabase (Make sure these are correct)
// ======================================================================
const supabaseUrl = 'https://czcpgjcstkfngyzbpaer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3BnamNzdGtmbmd5emJwYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzAwMDksImV4cCI6MjA1OTEwNjAwOX0.oJJL0i_Hetf3Yn8p8xBdNXLNS4oeY9_MJO-LBj4Bk8Q';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ======================================================================
// Helper to display error messages on the home page
// ======================================================================
function displayHomeError(message) {
    console.error("Home Page Error:", message);
    const provinceListElement = document.getElementById("province-list");
    if (provinceListElement) {
        provinceListElement.innerHTML = `<p style="color: red;">Error loading data: ${message}</p>`;
    }
}

// ======================================================================
// Fetch Provinces and Communities and Populate the List
// ======================================================================
async function populateHomePage() {
    const provinceListElement = document.getElementById("province-list");
    if (!provinceListElement) {
        console.error("Fatal Error: Could not find #province-list element.");
        return; // Stop if the main container isn't found
    }
    // Initial loading message is already in the HTML

    try {
        // 1. Fetch all provinces
        console.log("Fetching provinces...");
        const { data: provincesData, error: provincesError } = await supabaseClient
            .from('provinces')
            .select('id, province_name') // Select ID and name
            .order('province_name', { ascending: true }); // Sort alphabetically

        if (provincesError) {
            throw new Error(`Failed to fetch provinces: ${provincesError.message}`);
        }
        if (!provincesData || provincesData.length === 0) {
            throw new Error('No provinces found in the database.');
        }
        console.log(`Fetched ${provincesData.length} provinces.`);

        // 2. Fetch all communities
        console.log("Fetching communities...");
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, province_id') // Select name and the foreign key
            .order('community_name', { ascending: true }); // Sort alphabetically

        if (communitiesError) {
            throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        }
        if (!communitiesData) {
            console.warn("No communities data returned (null).");
        } else {
             console.log(`Fetched ${communitiesData.length} communities.`);
        }


        // 3. Organize data: Group communities by province
        const provincesMap = new Map(provincesData.map(p => [p.id, p.province_name]));
        const communitiesByProvince = {};

        // Initialize all fetched provinces in the structure
        provincesData.forEach(province => {
             communitiesByProvince[province.province_name] = [];
        });

        // Populate with communities if any were found
        if (communitiesData && communitiesData.length > 0) {
             communitiesData.forEach(community => {
                const provinceName = provincesMap.get(community.province_id);
                if (provinceName && communitiesByProvince.hasOwnProperty(provinceName)) {
                    communitiesByProvince[provinceName].push(community.community_name);
                } else {
                    console.warn(`Community "${community.community_name}" has an invalid or missing province_id (${community.province_id}) or province name not found.`);
                }
            });
        }


        // 4. Render the HTML
        provinceListElement.innerHTML = ''; // Clear "Loading..." message

        // Sort province names alphabetically for display
        const sortedProvinceNames = Object.keys(communitiesByProvince).sort();

        if (sortedProvinceNames.length === 0) {
             provinceListElement.innerHTML = '<p>No provinces found to display.</p>';
             return;
        }

        sortedProvinceNames.forEach(provinceName => {
            const communities = communitiesByProvince[provinceName]; // Already sorted alphabetically by fetch query

            const provinceSection = document.createElement("section");
            const provinceHeader = document.createElement("h2");

            provinceHeader.textContent = provinceName;
            provinceSection.appendChild(provinceHeader);

            if (communities.length > 0) {
                const communityList = document.createElement("ul");

                communities.forEach(communityName => {
                    const communityItem = document.createElement("li");
                    const communityLink = document.createElement("a");

                    // Link uses province name and community name as query parameters
                    communityLink.href = `community.html?province=${encodeURIComponent(provinceName)}&community=${encodeURIComponent(communityName)}`;
                    communityLink.textContent = communityName;

                    communityItem.appendChild(communityLink);
                    communityList.appendChild(communityItem);
                });
                provinceSection.appendChild(communityList);
            } else {
                 // Display a message if a province has no communities listed yet
                 const noCommunitiesMsg = document.createElement("p");
                 noCommunitiesMsg.textContent = "No communities listed yet.";
                 noCommunitiesMsg.style.paddingLeft = "20px"; // Match ul padding
                 noCommunitiesMsg.style.fontStyle = "italic";
                 noCommunitiesMsg.style.color = "#666";
                 provinceSection.appendChild(noCommunitiesMsg);
            }

            provinceListElement.appendChild(provinceSection);
        });

        if (provinceListElement.childElementCount === 0) {
             provinceListElement.innerHTML = '<p>No communities available to display.</p>';
        }


    } catch (error) {
        displayHomeError(error.message);
    }
}

// ======================================================================
// Main Execution
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayHomeError("Supabase library not loaded. Please check the script tag in index.html.");
        return;
    }
    populateHomePage(); // Fetch data and build the list
});