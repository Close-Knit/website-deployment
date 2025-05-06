// --- province_page.js (Using Centralized Supabase Client) ---

// ======================================================================
// NO Supabase Client Initialization HERE - Assumes 'supabaseClient' is globally available from common.js
// ======================================================================

// ======================================================================
// DOM Elements
// ======================================================================
const communityListContainer = document.getElementById('community-list-province');
const provinceNameHeading = document.getElementById('province-name-heading');
const pageTitle = document.querySelector('title');
const breadcrumbContainer = document.getElementById('breadcrumb-container');

// ======================================================================
// Helper to display error messages
// ======================================================================
function displayProvincePageError(message, error = null) {
    console.error("Province Page Error:", message);
    if (error) {
        console.error("Full error details:", error);
    }
    if (communityListContainer) {
        communityListContainer.innerHTML = `<li style="color: red;">Error loading data: ${message}</li>`;
    }
    if (provinceNameHeading) {
        provinceNameHeading.textContent = "Error Loading Province";
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

    // Get province name from URL path instead of query parameter
    let provinceName = '';
    const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
        // Convert slug back to province name
        const provinceSlug = pathParts[0];
        
        // Try to get province name from meta tag if available
        const communityData = document.getElementById('community-data');
        if (communityData && communityData.dataset.province) {
            provinceName = communityData.dataset.province;
        } else {
            // Otherwise, convert slug to title case as a fallback
            provinceName = provinceSlug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    if (!provinceName) {
        displayProvincePageError("Province name could not be determined from URL path.");
        return;
    }

    provinceNameHeading.textContent = `Loading Communities for ${provinceName}...`;
    pageTitle.textContent = `Communities in ${provinceName} | Bizly.ca`;

    breadcrumbContainer.innerHTML = `
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">${provinceName}</li>
        </ol>
    `;

    try {
        // Get province ID
        console.log(`Fetching ID for province: ${provinceName}`);
        const { data: provinceData, error: provinceError } = await supabaseClient
            .from('provinces')
            .select('id')
            .eq('province_name', provinceName)
            .single();

        if (provinceError || !provinceData) {
            throw new Error(`Could not find province "${provinceName}": ${provinceError?.message || 'Not found'}`);
        }
        const provinceId = provinceData.id;
        console.log(`Found Province ID: ${provinceId}`);

        // Get communities for this province
        console.log(`Fetching communities for province ID: ${provinceId}`);
        const { data: communitiesData, error: communitiesError } = await supabaseClient
            .from('communities')
            .select('id, community_name, status')
            .eq('province_id', provinceId)
            .order('community_name', { ascending: true });

        if (communitiesError) {
            throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
        }

        console.log("Fetched communitiesData:", communitiesData);

        // --- Process and Display Communities (unchanged logic) ---
        communityListContainer.innerHTML = '';

        if (!communitiesData || communitiesData.length === 0) {
            provinceNameHeading.textContent = `Communities in ${provinceName}`;
            communityListContainer.innerHTML = '<li>No communities found for this province yet.</li>';
            return;
        }

        // Group communities by first letter
        const communitiesByLetter = {};
        communitiesData.forEach(community => {
            const firstLetter = community.community_name.charAt(0).toUpperCase();
            if (!communitiesByLetter[firstLetter]) {
                communitiesByLetter[firstLetter] = [];
            }
            communitiesByLetter[firstLetter].push(community);
        });

        // Sort letters alphabetically
        const sortedLetters = Object.keys(communitiesByLetter).sort();

        // Create HTML for each letter group
        sortedLetters.forEach(letter => {
            const communities = communitiesByLetter[letter];
            
            // Add letter heading
            const letterHeading = document.createElement('li');
            letterHeading.className = 'letter-heading';
            letterHeading.textContent = letter;
            communityListContainer.appendChild(letterHeading);
            
            // Add communities for this letter
            communities.forEach(community => {
                const communityItem = document.createElement('li');
                communityItem.className = 'community-list-item';
                
                const itemContainer = document.createElement('div');
                itemContainer.className = 'province-community-item-container';
                
                // Create community link
                const communityLink = document.createElement('a');
                communityLink.className = 'community-link';
                communityLink.href = `./${community.community_name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim()}/`;
                communityLink.textContent = community.community_name;
                itemContainer.appendChild(communityLink);
                
                // Add status label if applicable
                if (community.status === 'NEW' || community.status === 'COMING_SOON') {
                    const statusLabel = document.createElement('span');
                    statusLabel.className = `status-label status-${community.status.toLowerCase().replace('_', '-')}`;
                    statusLabel.textContent = community.status === 'NEW' ? 'New' : 'Coming Soon';
                    itemContainer.appendChild(statusLabel);
                }
                
                communityItem.appendChild(itemContainer);
                communityListContainer.appendChild(communityItem);
            });
        });

        // Update page title and heading
        provinceNameHeading.textContent = `Communities in ${provinceName} (${communitiesData.length})`;

    } catch (error) {
        displayProvincePageError(error.message, error);
    }
}

// ======================================================================
// Initialize on Page Load
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProvinceCommunities();
});
