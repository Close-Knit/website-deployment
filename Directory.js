// ======================================================================
// PASTE YOUR DATA HERE
// ======================================================================
// 1. Prepare your text file with one person per line:
//    LastName,FirstName,PhoneNumber,Category
//    (Example: Smith,John,555-1234,Resident)
//    (Example: Handy,Manny,555-2222,Construction)
// 2. Use a consistent category name like "Resident" for non-trades.
// 3. Copy *ALL* lines from your prepared text file.
// 4. Paste them BETWEEN the triple backticks (```) below, replacing this instruction text.
// 5. Make sure you have consent from everyone listed!

const textData = `
Toop (Start To Finish Drywall LTD),Tyler,778-983-0128,Drywall
Baily (Lakeside Repairs)(Sub Pumps / Water Lines / Hot Water / Etc),Peter,250-617-9795,Plumbing
Kovee (Local), Rob,See Facebook Profile,General Contracting
Contracting (Brayden)(Eugene)(Local)(Renovations / Drywall / New Builds / Finishing),Genie,250-981-9376,Drywall
Birch (Innovation Plumbing Services),Gordie,250-961-6149,Plumbing
Contracting & Septic Service,5m,250-567-2717,Septic
Services,J-Nik,250-699-1847,Septic
Contracting,Load'em Up,250-562-8355,Septic
Pellet & Wood Heating,Bonfire,250-567-6750,Wood Heating
Ford (WETT Inspection),James,250-567-8634,Wood Heating
Penner (WETT Inspection - Bonfire Pellet and Wood Heating),Stuart,250-567-6750,Wood Heating
Resort (Gas / Food / FedEx),Brookside,250-441-3391,Food
Resort (Gas / Food / FedEx),Brookside,250-441-3391,General Store
Ewe (UPS / Purolator / FedEx),Everything For,250-567-4244,Parcels
Post (Vanderhoof),Canada,250-567-4321,Parcels
International,HUB,250-567-2231,Home Insurance
Financial,Western,250-567-2255,Home Insurance
Insurance,Integris,1-866-554-3456,Home Insurance
Canada Trust,TD,1-866-222-3456,Home Insurance
Bank,Royal,250-567-4776,Home Insurance
Bailey (Lakeside Repairs),Peter,250-617-9795,Small Engine Repair
Gehrmann (MSE Repairs),Kelly,250-617-1905,Small Engine Repair
Communications (9am to 6:30pm),Telus,1-888-811-2323,Internet
Communications,Starlink,Starlink.com,Internet
Cabin (Restaurant and General Store),The,250-441-0020,Food
Cabin (Restaurant and General Store),The,250-441-0020,General Store
16 Eatery (Restaurant),HWY,250-552-5441,Food
16 Eatery (Restaurant),HWY,250-552-5441,General Store
Association (Community Hall / Pickleball / Stage / Events / Music),Cluculz Lake Community,250-441-3555,Community
Fire Department,Cluculz Lake Volunteer,cluculzlakevfd.ca,Community
Police (Non-Emergency),Vanderhoof,250-567-2222,Community
Emergency,Police,911,Community
Kleen (Dave - Carpet - Rug - Upholstery - Janitorial),Sparkle,250-561-1699,Cleaning
Carpet Care & Upholstery,Sophia's Professional,250-567-4064,Cleaning
Construction (Gravel / Road Maintenance / Earth Moving),Nahanni,250-961-3596,General Contracting
Enterprises (Gravel / Road Maintenance / Earth Moving),M4,250-567-6880,General Contracting
Excavation (Local)(Travis)(Leveling / Driveways / Ditching / Waterlines / Septic / Stumps / Retaining Walls),TAKT,250-524-0229,General Contracting
Contracting (Local)(Bob)(Site prep / Drains / Septic tank & Field / Demolition / Lot Clearing / Water Lines / Underground Services),Classic,250-612-7884,General Contracting
Contracting (Brayden)(Eugene)(Local)(Renovations / Drywall / New Builds / Finishing),Genie,250-981-9376,General Contracting
Plumbing (Ray) (Plumbing / Gas-Fitter / Septic),Wakefield,778-890-0373,Plumbing
Gehrmann, Kelly,250-617-1905,Plumbing
Mechanical Services (Kelly),Downstream,250-981-3832,Plumbing
Permits (Regional District Bulkley Nechako),Building,250-692-3195,Community
Transfer Station (Dump & Recycling)(650 Dump Road in Vanderhoof),Vanderhoof,250-692-3195,Community
Hospital (3255 Hospital Road in Vanderhoof),St John,250-567-2211,Community
Electric (Beaverly), North Star,250-649-8650,Electrical
Away (General Services / Projects)(Andy)(local),Plugin,250-617-3118,Electrical
Hydro (Customer Service / Report Outages / Other),BC,1-800-224-9376,Community
Drilling (Horizontal holes for conduit / electrical / etc),Earthworm Horizontal,250-962-9682,General Contracting
Automation (General Services / Projects)(PG),Dubrule Electrical and,250-596-4100,Electrical
Electric (General Services / Projects)(Vanderhoof),Bud's,250-567-2314,Electrical
Drilling (Well Drilling)(Lorne)(PG),Bernard,250-963-9233,General Contracting
Wells (Well Drilling)(PG),Cariboo Water,250-564-2525,General Contracting
Carpentry Services (Darren)(Local)(Building / Concrete / Siding / Finishing),Lake House,250-981-4921,General Contracting
Precision Earthworks (Vanderhoof)(Excavators Small + Mid / Hauling / Dumping / Brush mowers / Lot Maintenance),K Leigh,250-567-0277,General Contracting
Enterprises (Backhoe / Cat / Heavy Equipment),Mainline,780-380-8099,General Contracting
PURAIR (Troy)(PG)(Furnace and Duct cleaning / Services Cluculz),Modern,778-763-4194,General Contracting
Plantland Home & Garden (PG),Art Knapp,250-964-6056,Home and Garden
Greenhouses (Vanderhoof),Maxine's,250-567-5556,Home and Garden
Greenhouse (Vanderhoof),Grandma's,250-944-0035,Home and Garden
Greenhouse (Local),Atkins Growers,250-640-7604,Home and Garden
Over (Local)(Kandace)(Party Supply & Rental Shop),The Hunt Is,250-301-0891,Home and Garden
Light Hauling (Local)(Dima)(Move equipment or Sheds or Vehicles / 25ft tilt deck / 17500lb winch),Hightop Towing &,250-699-5474,General Contracting
Botanical (Local)(Cheryll)(Health + Beauty / Herbal Medicine / Alternative + Holistic Health),Wild Roots,wildrootsbotanical.ca,Home and Garden
`; // <<< End of data paste area

// ======================================================================
// END OF DATA PASTE AREA - Do not edit below this line unless you know what you're doing
// ======================================================================

const DEFAULT_CATEGORY = "Resident"; // Category if left blank in text file

// Process the text data into structured objects
const directoryData = textData
    .split('\n') // Split into lines
    .map(line => line.trim()) // Trim whitespace from each line
    .filter(line => line.length > 0) // Remove empty lines
    .map(line => {
        // Split by comma, but handle potential commas within fields if quoted (basic)
        // For this simpler case, we assume commas only act as delimiters
        const parts = line.split(',');

        if (parts.length >= 3) { // Need at least 3 parts (Last, First, Phone)
            const lastName = parts[0]?.trim() || '';
            const firstName = parts[1]?.trim() || '';
            const phone = parts[2]?.trim() || '';
            // Use part 4 if it exists and isn't empty, otherwise use default
            let category = (parts.length > 3 && parts[3]?.trim()) ? parts[3].trim() : DEFAULT_CATEGORY;
            // Ensure blank explicitly becomes default too
             if (category === '') {
                category = DEFAULT_CATEGORY;
             }


            if (lastName || firstName || phone) { // Allow entry if at least one field has data
                 return { lastName, firstName, phone, category };
            }
        }
        return null; // Return null for invalid lines
    })
    .filter(entry => entry !== null); // Remove any null entries from invalid lines

// Sort data: Primary sort by Category, Secondary sort by LastName, Tertiary by FirstName
directoryData.sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) {
        return categoryCompare;
    }
    // Keep sorting by last name internally, even if displaying first name first
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    if (lastNameCompare !== 0) {
        return lastNameCompare;
    }
    return a.firstName.localeCompare(b.firstName);
});

// --- Display and Search Logic ---
const searchBox = document.getElementById('searchBox');
const resultsList = document.getElementById('results');

// Function to display directory entries with category headings
function displayDirectory(entries) {
    resultsList.innerHTML = ''; // Clear previous results
    if (entries.length === 0) {
        resultsList.innerHTML = '<li class="directory-entry">No matches found.</li>';
        return;
    }

    let currentCategory = null;
    entries.forEach(person => {
        // Check if category has changed (or it's the first entry)
        if (person.category !== currentCategory) {
            currentCategory = person.category;
            const categoryHeading = document.createElement('li');
            categoryHeading.className = 'category-heading'; // Assign class for styling
            categoryHeading.textContent = currentCategory;
            resultsList.appendChild(categoryHeading);
        }

        // Add the person's directory entry
        const listItem = document.createElement('li');
        listItem.className = 'directory-entry'; // Assign class for styling
        // Display name: prioritize FirstName, then LastName. Handle cases where one might be missing.
        let displayName = '';
        if (person.firstName && person.lastName) {
            // *** THIS IS THE CHANGED LINE ***
            displayName = `${person.firstName} ${person.lastName}`;
        } else if (person.lastName) {
            displayName = person.lastName; // Only last name exists
        } else if (person.firstName) {
            displayName = person.firstName; // Only first name exists
        } else {
            displayName = 'N/A'; // Placeholder if both names are missing
        }

        // Make phone number clickable
        let phoneHtml = '<span class="phone">N/A</span>'; // Default if phone is missing
        if (person.phone && person.phone.toLowerCase() !== 'xxx-xxxx') {
             // Basic cleaning: remove non-digits except leading + if present
             const cleanedPhone = person.phone.replace(/[^\d+]/g, '');
             if (cleanedPhone) {
                 phoneHtml = `<a class="phone" href="tel:${cleanedPhone}">${person.phone}</a>`;
             } else {
                  phoneHtml = `<span class="phone">${person.phone}</span>`; // Display original if cleaning failed or was xxx-xxxx
             }
        } else if (person.phone) {
             phoneHtml = `<span class="phone">${person.phone}</span>`; // Display non-clickable xxx-xxxx
        }


        listItem.innerHTML = `<span class="name">${displayName}</span>${phoneHtml}`; // Use phoneHtml which might be a link or span
        resultsList.appendChild(listItem);
    });
}


// Function to filter directory based on search input (checks name, phone, and category)
function filterDirectory() {
    const searchTerm = searchBox.value.toLowerCase().trim();
    if (!searchTerm) {
        displayDirectory(directoryData); // Show all if search is empty
        return;
    }

    const filteredEntries = directoryData.filter(person => {
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const phone = person.phone.toLowerCase();
        const category = person.category.toLowerCase();
        return fullName.includes(searchTerm) || category.includes(searchTerm) || phone.includes(searchTerm);
    });

    // Display the filtered results
    displayDirectory(filteredEntries);
}

// Initial display (show all entries sorted by category and name)
displayDirectory(directoryData);

// Add event listener for the search box
searchBox.addEventListener('input', filterDirectory);