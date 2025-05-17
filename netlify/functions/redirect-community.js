exports.handler = async function(event, context) {
  // Get query parameters
  const params = new URLSearchParams(event.queryStringParameters);
  const province = params.get('province');
  const community = params.get('community');
  
  if (!province || !community) {
    return {
      statusCode: 404,
      body: "Province and community parameters are required"
    };
  }
  
  // Create slugs
  const provinceSlug = createSlug(province);
  const communitySlug = createSlug(community);
  
  // Redirect to the new URL
  return {
    statusCode: 301,
    headers: {
      Location: `/${provinceSlug}/${communitySlug}/`
    },
    body: ""
  };
};

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
    .trim();                  // Trim leading/trailing spaces
}