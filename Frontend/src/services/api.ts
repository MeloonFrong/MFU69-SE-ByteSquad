import { FacebookPost, RecentPostsResponse, ScraperRunInput, ApifyDataset } from '../types/facebook';
import { INITIAL_MOCK_POSTS, MOCK_APIFY_DATASETS } from './mockData';

const BASE_URL_STORAGE_KEY = 'fb_scraper_backend_base_url';
const DEFAULT_BASE_URL = 'http://localhost:5030';

// In-memory posts cache for simulation and merging new scrapes
let localStoredPosts: FacebookPost[] = [...INITIAL_MOCK_POSTS];

export interface ConnectionStatus {
  isChecking: boolean;
  isConnected: boolean;
  lastChecked: Date | null;
  errorMessage: string | null;
  serverUrl: string;
}

export class FacebookApiClient {
  private static baseUrl: string = (() => {
    try {
      return localStorage.getItem(BASE_URL_STORAGE_KEY) || DEFAULT_BASE_URL;
    } catch {
      return DEFAULT_BASE_URL;
    }
  })();

  public static getBaseUrl(): string {
    return this.baseUrl;
  }

  public static setBaseUrl(url: string): void {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.baseUrl = cleanUrl;
    try {
      localStorage.setItem(BASE_URL_STORAGE_KEY, cleanUrl);
    } catch (e) {
      console.warn('Failed to save baseUrl to localStorage', e);
    }
  }

  public static resetBaseUrl(): void {
    this.setBaseUrl(DEFAULT_BASE_URL);
  }

  /**
   * Health check / Ping backend
   */
  public static async checkConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Check root endpoint or debug datasets
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: { Accept: 'text/plain, application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        return { ok: true, message: text || 'C# Backend is running' };
      }

      return {
        ok: false,
        message: `HTTP ${response.status} ${response.statusText}`,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { ok: false, message: 'Request timed out after 3.5s' };
      }
      return {
        ok: false,
        message: err.message || 'Cannot connect to backend (Check CORS or server status)',
      };
    }
  }

  /**
   * GET /api/posts/recent?page={page}&limit={limit}
   */
  public static async getRecentPosts(
    page: string = 'MFU2Connect',
    limit: number = 10,
    forceSimulation: boolean = false
  ): Promise<{ data: RecentPostsResponse; isSimulated: boolean; errorNotice?: string }> {
    if (!forceSimulation) {
      try {
        const url = `${this.baseUrl}/api/posts/recent?page=${encodeURIComponent(page)}&limit=${limit}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          // Normalize post structure
          const normalizedPosts = (json.posts || []).map((p: any) => this.normalizePost(p));
          return {
            data: {
              page: json.page || page,
              requestedLimit: json.requestedLimit || limit,
              totalScanned: json.totalScanned || normalizedPosts.length,
              returned: json.returned || normalizedPosts.length,
              posts: this.deduplicatePosts(normalizedPosts),
            },
            isSimulated: false,
          };
        } else {
          console.warn(`Backend returned ${response.status}. Falling back to simulation.`);
        }
      } catch (err: any) {
        console.warn(`Connection to ${this.baseUrl} failed (${err.message}). Using local simulator data.`);
      }
    }

    // Local Simulation
    const filtered = localStoredPosts.filter((p) => {
      const pageName = p.pageName || p.user?.id || p.user?.name || '';
      return pageName.toLowerCase().includes(page.toLowerCase()) || page === 'all';
    });

    const unique = this.deduplicatePosts(filtered);
    const sorted = [...unique].sort((a, b) => this.getPostTimestamp(b) - this.getPostTimestamp(a));
    const sliced = sorted.slice(0, limit);

    return {
      data: {
        page,
        requestedLimit: limit,
        totalScanned: localStoredPosts.length,
        returned: sliced.length,
        posts: sliced,
      },
      isSimulated: true,
      errorNotice: `เชื่อมต่อกับ ${this.baseUrl} ไม่ได้ (กำลังแสดงผลโหมดจำลอง C# Backend)`,
    };
  }

  /**
   * POST /api/actors/facebook-posts-scraper/run
   */
  public static async runFacebookScraper(
    input: ScraperRunInput,
    forceSimulation: boolean = false
  ): Promise<{
    success: boolean;
    data: any;
    postsAdded: number;
    isSimulated: boolean;
    rawText?: string;
  }> {
    if (!forceSimulation) {
      try {
        const url = `${this.baseUrl}/api/actors/facebook-posts-scraper/run`;
        const controller = new AbortController();
        // Scraper runs can take a bit longer (sync)
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const rawText = await response.text();
          let json: any = [];
          try {
            json = JSON.parse(rawText);
          } catch {
            json = [];
          }

          const items = Array.isArray(json) ? json : json.items || [json];
          const normalized = items.map((item: any) => ({
            ...this.normalizePost(item),
            isScrapedNew: true,
          }));

          // Merge into local cache
          localStoredPosts = this.deduplicatePosts([...normalized, ...localStoredPosts]);

          return {
            success: true,
            data: json,
            postsAdded: normalized.length,
            isSimulated: false,
            rawText,
          };
        }
      } catch (err: any) {
        console.warn(`Scraper POST failed to ${this.baseUrl}: ${err.message}. Simulating run.`);
      }
    }

    // Simulation of Apify Run
    await new Promise((res) => setTimeout(res, 1200));

    const simulatedNewPosts: FacebookPost[] = input.startUrls.map((startUrl, idx) => {
      const isMfu = startUrl.url.includes('MFU2Connect');
      const targetPage = isMfu ? 'MFU2Connect' : 'profile.php?id=61563364138740';
      const timestamp = Date.now() - idx * 3600000;

      return {
        postId: `sim_${Date.now()}_${idx}`,
        pageName: targetPage,
        user: {
          name: isMfu ? 'MFU2Connect' : 'องค์การบริหาร องค์การนักศึกษา มฟล.',
          id: targetPage,
          profilePic: isMfu
            ? 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        caption: `[Scraped Real-time ${new Date().toLocaleTimeString('th-TH')}] ข้อมูลอัปเดตล่าสุดจากเพจ ${targetPage}\n\nกิจกรรมสัมมนาวิชาการ นวัตกรรมและการพัฒนานักศึกษาสู่ศตวรรษที่ 21 จัดขึ้น ณ หอประชุมสมเด็จย่า มหาวิทยาลัยแม่ฟ้าหลวง\n\n📌 ติดตามรายละเอียดและภาพบรรยากาศเพิ่มเติมได้ทาง Facebook เพจทางการ\n\n#ScrapedLive #Apify #MFU2026`,
        facebookUrl: `${startUrl.url}/posts/sim_${Date.now()}`,
        timestamp,
        likesCount: Math.floor(Math.random() * 200) + 50,
        commentsCount: Math.floor(Math.random() * 30) + 5,
        sharesCount: Math.floor(Math.random() * 50) + 10,
        images: [
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
        ],
        isScrapedNew: true,
      };
    });

    localStoredPosts = this.deduplicatePosts([...simulatedNewPosts, ...localStoredPosts]);

    return {
      success: true,
      data: simulatedNewPosts,
      postsAdded: simulatedNewPosts.length,
      isSimulated: true,
      rawText: JSON.stringify(simulatedNewPosts, null, 2),
    };
  }

 
/**
 * GET /api/datasets
 */
public static async getDatasets(): Promise<{
  data: ApifyDataset[];
  isSimulated: boolean;
}> {
  try {
    const response = await fetch(
      `${this.baseUrl}/api/datasets?limit=100&offset=0`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const json = await response.json();

    // รองรับทั้ง Array โดยตรง และ Apify API response
    const datasets = Array.isArray(json)
      ? json
      : Array.isArray(json.items)
        ? json.items
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.items)
            ? json.data.items
            : [];

    return {
      data: datasets,
      isSimulated: false,
    };
  } 
  catch (error) {
  console.error('Failed to fetch Apify datasets:', error);
  throw error;
}
}


  /**
   * GET /api/datasets/{datasetId}/items
   */
  public static async getDatasetItems(
    datasetId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ items: any[]; isSimulated: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/datasets/${encodeURIComponent(datasetId)}/items?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );

      if (response.ok) {
        const json = await response.json();
        const items = Array.isArray(json) ? json : json.items || [];
        return { items, isSimulated: false };
      }
    } catch (e) {
      // Fallback
    }

    return { items: localStoredPosts.slice(offset, offset + limit), isSimulated: true };
  }

  /**
   * Deduplication logic - Strict implementation matching C# PostDataProcessor
   */
  public static deduplicatePosts(posts: FacebookPost[]): FacebookPost[] {
    const seenKeys = new Set<string>();
    const uniquePosts: FacebookPost[] = [];

    for (const post of posts) {
      const key = this.getPostKey(post);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniquePosts.push(post);
      }
    }

    return uniquePosts;
  }

  /**
   * Key extraction matching C#:
   * 1. postId -> "id:" + postId
   * 2. facebookUrl / url -> "url:" + url.trim().trimEnd('/')
   * 3. Fallback text snippet
   */
  public static getPostKey(post: FacebookPost): string {
    const id = post.postId || post.id;
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      return `id:${String(id).trim()}`;
    }

    const url = post.facebookUrl || post.url || post.postUrl;
    if (url && url.trim() !== '') {
      return `url:${url.trim().replace(/\/+$/, '').toLowerCase()}`;
    }

    const captionSnippet = (post.caption || post.text || post.message || '').slice(0, 80);
    return `text:${captionSnippet}_${post.timestamp || 0}`;
  }

  public static getPostTimestamp(post: FacebookPost): number {
    if (typeof post.timestamp === 'number') {
      return post.timestamp > 10000000000 ? post.timestamp : post.timestamp * 1000;
    }
    if (typeof post.timestamp === 'string') {
      const parsed = parseInt(post.timestamp, 10);
      if (!isNaN(parsed)) {
        return parsed > 10000000000 ? parsed : parsed * 1000;
      }
      const dateParsed = Date.parse(post.timestamp);
      if (!isNaN(dateParsed)) return dateParsed;
    }
    if (post.time) {
      const parsed = Date.parse(post.time);
      if (!isNaN(parsed)) return parsed;
    }
    if (post.date) {
      const parsed = Date.parse(post.date);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  /**
   * Normalize various Apify post schema shapes into standard FacebookPost
   */
  public static normalizePost(raw: any): FacebookPost {
    const images: string[] = [];
    if (Array.isArray(raw.images)) {
      raw.images.forEach((img: any) => {
        if (typeof img === 'string') images.push(img);
        else if (img && typeof img.url === 'string') images.push(img.url);
      });
    } else if (typeof raw.imageUrl === 'string') {
      images.push(raw.imageUrl);
    } else if (Array.isArray(raw.media)) {
      raw.media.forEach((m: any) => {
        if (m?.url) images.push(m.url);
        else if (m?.thumbnail) images.push(m.thumbnail);
      });
    }

    let pageName = raw.pageName || raw.authorName || '';
    if (!pageName && raw.user?.name) {
      pageName = raw.user.name;
    }
    if (!pageName && raw.facebookUrl) {
      if (raw.facebookUrl.includes('MFU2Connect')) pageName = 'MFU2Connect';
      else if (raw.facebookUrl.includes('61563364138740')) pageName = 'profile.php?id=61563364138740';
    }

    return {
      postId: raw.postId || raw.id,
      pageName: pageName || 'Facebook Page',
      user: {
        name: raw.user?.name || pageName || 'Facebook Page',
        id: raw.user?.id || pageName,
        profilePic: raw.user?.profilePic || raw.profilePic,
      },
      caption: raw.caption || raw.text || raw.message || raw.content || '',
      facebookUrl: raw.facebookUrl || raw.url || raw.postUrl || '',
      timestamp: raw.timestamp || raw.time || raw.date,
      likesCount: raw.likesCount ?? raw.likes ?? raw.reactionsCount ?? 0,
      commentsCount: raw.commentsCount ?? raw.comments ?? 0,
      sharesCount: raw.sharesCount ?? raw.shares ?? 0,
      images,
      attachedLink: raw.attachedLink || (raw.link ? { url: raw.link, title: raw.linkTitle || raw.link } : undefined),
      sharedPost: raw.sharedPost,
    };
  }
}
