// Example structure for provinces and communities
const provinces = {
  "Ontario": ["Toronto", "Ottawa", "Hamilton"],
  "Quebec": ["Montreal", "Quebec City", "Laval"],
  "British Columbia": ["Vancouver", "Victoria", "Surrey"]
};

// Populate provinces and communities on the home page
const provinceList = document.getElementById("province-list");

Object.keys(provinces).forEach(province => {
  const provinceSection = document.createElement("section");
  const provinceHeader = document.createElement("h2");
  
  provinceHeader.textContent = province;
  provinceSection.appendChild(provinceHeader);

  const communityList = document.createElement("ul");
  
  provinces[province].forEach(community => {
    const communityItem = document.createElement("li");
    const communityLink = document.createElement("a");

    // Link to the community template with query parameters
    communityLink.href = `community.html?province=${encodeURIComponent(province)}&community=${encodeURIComponent(community)}`;
    communityLink.textContent = community;

    communityItem.appendChild(communityLink);
    communityList.appendChild(communityItem);
  });

  provinceSection.appendChild(communityList);
  provinceList.appendChild(provinceSection);
});
