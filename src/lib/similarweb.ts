const BASE_URL = 'https://api.similarweb.com/v1';

export async function fetchSimilarWeb(endpoint: string, domain: string) {
  const apiKey = process.env.SIMILARWEB_API_KEY;
  if (!apiKey) {
    throw new Error('SIMILARWEB_API_KEY is missing');
  }
  
  const url = `${BASE_URL}/website/${domain}${endpoint}?api_key=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`SimilarWeb API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function get_website_overview(domain: string) {
  return fetchSimilarWeb('/total-traffic-and-engagement/visits', domain);
}

export async function get_geo_distribution(domain: string) {
  return fetchSimilarWeb('/geo/traffic-by-country', domain);
}

export async function get_similar_sites(domain: string) {
  return fetchSimilarWeb('/similar-sites', domain);
}

export async function get_global_rank(domain: string) {
  return fetchSimilarWeb('/global-rank', domain);
}

export async function get_traffic_sources(domain: string) {
  return fetchSimilarWeb('/traffic-sources/overview', domain);
}
