import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  get_website_overview, 
  get_geo_distribution, 
  get_similar_sites, 
  get_global_rank, 
  get_traffic_sources 
} from './similarweb';

describe('SimilarWeb Tools Integration', () => {
  const mockDomain = 'example.com';
  
  beforeEach(() => {
    process.env.SIMILARWEB_API_KEY = 'test_api_key';
    global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch website overview correctly', async () => {
    const mockResponse = { visits: 1000 };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const result = await get_website_overview(mockDomain);
    
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.similarweb.com/v1/website/${mockDomain}/total-traffic-and-engagement/visits?api_key=test_api_key`
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    } as unknown as Response);

    await expect(get_website_overview(mockDomain)).rejects.toThrow('SimilarWeb API error: 403 Forbidden');
  });

  it('should fetch geo distribution correctly', async () => {
    const mockResponse = { records: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const result = await get_geo_distribution(mockDomain);
    
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.similarweb.com/v1/website/${mockDomain}/geo/traffic-by-country?api_key=test_api_key`
    );
    expect(result).toEqual(mockResponse);
  });
  
  it('should fetch similar sites correctly', async () => {
    const mockResponse = { similar_sites: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const result = await get_similar_sites(mockDomain);
    expect(result).toEqual(mockResponse);
  });

  it('should fetch global rank correctly', async () => {
    const mockResponse = { global_rank: 1 };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const result = await get_global_rank(mockDomain);
    expect(result).toEqual(mockResponse);
  });

  it('should fetch traffic sources correctly', async () => {
    const mockResponse = { sources: {} };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const result = await get_traffic_sources(mockDomain);
    expect(result).toEqual(mockResponse);
  });
});
