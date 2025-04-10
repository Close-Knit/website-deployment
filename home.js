// --- START OF NEW home.js ---

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
    const provinceList = document.getElementById("province-list");
    if (provinceList) {
        provinceList.innerHTML = `<p style="color: red;">Error loading data: ${message}</p>`;
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
    provinceListElement.innerHTML = '<p>Loading communities...</p>'; // Provide feedback

    try {
        // 1. Fetch all provinces
        const { data: provincesData, error: provincesError } = await supabaseClient
            .from('provinces')
            .select('id, province_name') // Select ID and name
            .order('province_name', { ascending: true }); // Optional: sort alphabetically

        if (provincesError) {
            throw new Error(`Failed to fetch provinces: ${provincesError.message}`);
        }
        if (!provincesData || provincesData.length === 0) {
            throw new Error('No provinces found in the database.');
        }

        // 2. Fetch all communities
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('community_name, province_id') // Select name and the foreign key
            .order('community_name', { ascending: true }); // Optional: sort alphabetically

        if (communitiesError) {
            throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        }
        if (!communitiesData || communitiesData.length === 0) {
            // Don't throw an error, maybe some provinces just don't have communities yet
            console.warn("No communities found in the database.");
        }

        // 3. Organize data: Group communities by province
        const provincesMap = new Map(provincesData.map(p => [p.id, p.province_name]));
        const communitiesByProvince = {};

        provincesData.forEach(province => {
             // Initialize each province, even if it has no communities yet
             communitiesByProvince[province.province_name] = [];
        });

        if (communitiesData) { // Only process if communities were actually fetched
             communitiesData.forEach(community => {
                const provinceName = provincesMap.get(community.province_id);
                if (provinceName && communitiesByProvince[provinceName]) {
                    // Add the community name to the list for its province
                    communitiesByProvince[provinceName].push(community.community_name);
                } else {
                    console.warn(`Community "${community.community_name}" has an invalid or missing province_id (${community.province_id}).`);
                }
            });
        }


        // 4. Render the HTML
        provinceListElement.innerHTML = ''; // Clear "Loading..." message

        Object.keys(communitiesByProvince).sort().forEach(provinceName => { // Sort province names alphabetically
            const communities = communitiesByProvince[provinceName];

            // Only display provinces that actually have communities listed
            // Or display all fetched provinces, even if empty? Let's display only those with communities for now.
            // if (communities.length > 0) { // Uncomment this line if you ONLY want to show provinces with communities

                const provinceSection = document.createElement("section");
                const provinceHeader = document.createElement("h2");

                provinceHeader.textContent = provinceName;
                provinceSection.appendChild(provinceHeader);

                if (communities.length > 0) {
                    const communityList = document.createElement("ul");

                    communities.forEach(communityName => {
                        const communityItem = document.createElement("li");
                        const communityLink = document.createElement("a");

                        // IMPORTANT: Link uses province name and community name as query parameters
                        communityLink.href = `community.html?province=${encodeURIComponent(provinceName)}&community=${encodeURIComponent(communityName)}`;
                        communityLink.textContent = communityName;

                        communityItem.appendChild(communityLink);
                        communityList.appendChild(communityItem);
                    });
                    provinceSection.appendChild(communityList);
                } else {
                     // Optional: Display a message if a province has no communities listed yet
                     const noCommunitiesMsg = document.createElement("p");
                     noCommunitiesMsg.textContent = "No communities listed yet.";
                     noCommunitiesMsg.style.paddingLeft = "20px";
                     noCommunitiesMsg.style.fontStyle = "italic";
                     provinceSection.appendChild(noCommunitiesMsg);
                }


                provinceListElement.appendChild(provinceSection);
            // } // Closes the 'if (communities.length > 0)' block
        });

        if (provinceListElement.childElementCount === 0) {
             provinceListElement.innerHTML = '<p>No provinces or communities found.</p>';
        }


    } catch (error) {
        displayHomeError(error.message);
    }
}

// ======================================================================
// Main Execution
// ======================================================================
// Use DOMContentLoaded to ensure the #province-list element exists before running the script
// This is safer than relying solely on 'defer' if the script execution order is critical.
document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase client is available (it should be if the CDN link in HTML is correct)
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        displayHomeError("Supabase library not loaded. Please check the script tag in your HTML.");
        return;
    }
    populateHomePage(); // Fetch data and build the list
});

// --- END OF NEW home.js ---