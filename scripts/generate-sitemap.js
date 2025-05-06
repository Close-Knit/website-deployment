// Add community URLs to sitemap
for (const province of provinces) {
  const provinceName = province.province_name;
  const provinceSlug = createSlug(provinceName);
  
  // Add province URL
  sitemap += `  <url>
    <loc>https://bizly.ca/${provinceSlug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  
  // Get communities for this province
  const { data: communities } = await supabase
    .from('communities')
    .select('community_name')
    .eq('province_id', province.id)
    .order('community_name');
  
  // Add community URLs
  for (const community of communities) {
    const communityName = community.community_name;
    const communitySlug = createSlug(communityName);
    
    sitemap += `  <url>
    <loc>https://bizly.ca/${provinceSlug}/${communitySlug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  }
}