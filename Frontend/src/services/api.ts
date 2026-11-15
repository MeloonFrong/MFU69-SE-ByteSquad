import { FacebookPost, RecentPostsResponse, ScraperRunInput, ApifyDataset, SubscriptionItem } from '../types/facebook';
import { INITIAL_MOCK_POSTS, DEMO_MOCK_POSTS, MOCK_APIFY_DATASETS, normalizeSocialPost } from './mockData';
import { doesPostMatchSubscription, filterPostsBySubscriptions, parseSubscriptionInput } from './subscriptionUtils';

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
          const rawList = Array.isArray(json) ? json : json.posts || json.items || [];
          // Normalize post structure across Facebook, Instagram, and TikTok
          const normalizedPosts = rawList.map((p: any) => this.normalizePost(p));
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

    // Local Simulation using real multi-platform output files
    const filtered = localStoredPosts.filter((p) => {
      if (!page || page === 'all') return true;
      const q = page.toLowerCase();
      const candidates = [
        p.pageName,
        p.user?.id,
        p.user?.name,
        p.facebookUrl,
        p.url,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return candidates.some((c) => c.includes(q));
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

    // Simulation of Apify Run (strictly for requested URLs only)
    await new Promise((res) => setTimeout(res, 600));

    const limitPerUrl = Math.max(1, input.resultsLimit || 1);
    const simulatedNewPosts: FacebookPost[] = [];

    input.startUrls.forEach((startUrl, idx) => {
      const sub = parseSubscriptionInput(startUrl.url, 'facebook', limitPerUrl);
      if (!sub) return;
      const matchedFromDemo = this.deduplicatePosts(
        DEMO_MOCK_POSTS.filter((p) => doesPostMatchSubscription(p, sub))
      )
        .sort((a, b) => this.getPostTimestamp(b) - this.getPostTimestamp(a))
        .slice(0, limitPerUrl);

      if (matchedFromDemo.length > 0) {
        simulatedNewPosts.push(
          ...matchedFromDemo.map((p) => ({ ...p, isScrapedNew: true }))
        );
      } else {
        const timestamp = Date.now() - idx * 1800000;
        simulatedNewPosts.push(
          this.normalizePost({
            postId: `sim_${sub.platform}_${sub.handle}_${Date.now()}_${idx}`,
            platform: sub.platform,
            pageName: sub.handle,
            user: {
              name: sub.displayName,
              id: sub.handle,
            },
            caption: `[Synced ${new Date().toLocaleTimeString('th-TH')}] อัปเดตข้อมูลโพสต์ล่าสุดจาก ${sub.displayName} (${sub.url})`,
            url: sub.url,
            facebookUrl: sub.url,
            timestamp,
            likesCount: 120,
            commentsCount: 14,
            sharesCount: 9,
            isScrapedNew: true,
          })
        );
      }
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
   * POST /api/actors/instagram-scraper/run
   */
  public static async runInstagramScraper(
    directUrls: string[],
    resultsLimit: number = 1,
    forceSimulation: boolean = false
  ): Promise<{
    success: boolean;
    data: FacebookPost[];
    postsAdded: number;
    isSimulated: boolean;
  }> {
    if (!forceSimulation && directUrls.length > 0) {
      try {
        const url = `${this.baseUrl}/api/actors/instagram-scraper/run`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            resultsType: 'posts',
            directUrls,
            resultsLimit,
            addParentData: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const items = Array.isArray(json) ? json : json.items || [json];
          const normalized = items
            .filter(Boolean)
            .map((item: any) => ({
              ...this.normalizePost(item),
              isScrapedNew: true,
            }));
          localStoredPosts = this.deduplicatePosts([
            ...normalized,
            ...localStoredPosts,
          ]);
          return {
            success: true,
            data: normalized,
            postsAdded: normalized.length,
            isSimulated: false,
          };
        }
      } catch (err: any) {
        console.warn(`Instagram Scraper POST failed: ${err.message}. Simulating run.`);
      }
    }

    const fbSim = await this.runFacebookScraper(
      {
        captionText: false,
        resultsLimit,
        startUrls: directUrls.map((u) => ({ url: u })),
      },
      true
    );
    return {
      success: fbSim.success,
      data: Array.isArray(fbSim.data) ? fbSim.data : [],
      postsAdded: fbSim.postsAdded,
      isSimulated: true,
    };
  }

  /**
   * POST /api/actors/tiktok-posts-scraper/run
   */
  public static async runTikTokScraper(
    profiles: string[],
    resultsPerPage: number = 1,
    forceSimulation: boolean = false
  ): Promise<{
    success: boolean;
    data: FacebookPost[];
    postsAdded: number;
    isSimulated: boolean;
  }> {
    if (!forceSimulation && profiles.length > 0) {
      try {
        const url = `${this.baseUrl}/api/actors/tiktok-posts-scraper/run`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            aiVideoDescription: false,
            aiVideoSummary: false,
            commentsPerPost: 0,
            excludePinnedPosts: false,
            maxFollowersPerProfile: 0,
            maxFollowingPerProfile: 0,
            maxRepliesPerComment: 0,
            profileScrapeSections: ['videos'],
            profiles,
            proxyCountryCode: 'None',
            resultsPerPage,
            scrapeAdditionalAuthorMeta: false,
            scrapeRelatedSearchWords: false,
            scrapeRelatedVideos: false,
            shouldDownloadAvatars: false,
            shouldDownloadCovers: false,
            shouldDownloadMusicCovers: false,
            shouldDownloadSlideshowImages: false,
            shouldDownloadVideos: false,
            topLevelCommentsPerPost: 0,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const items = Array.isArray(json) ? json : json.items || [json];
          const normalized = items
            .filter(Boolean)
            .map((item: any) => ({
              ...this.normalizePost(item),
              isScrapedNew: true,
            }));
          localStoredPosts = this.deduplicatePosts([
            ...normalized,
            ...localStoredPosts,
          ]);
          return {
            success: true,
            data: normalized,
            postsAdded: normalized.length,
            isSimulated: false,
          };
        }
      } catch (err: any) {
        console.warn(`TikTok Scraper POST failed: ${err.message}. Simulating run.`);
      }
    }

    const fbSim = await this.runFacebookScraper(
      {
        captionText: false,
        resultsLimit: resultsPerPage,
        startUrls: profiles.map((handle) => ({
          url: `https://www.tiktok.com/@${handle.replace(/^@/, '')}`,
        })),
      },
      true
    );
    return {
      success: fbSim.success,
      data: Array.isArray(fbSim.data) ? fbSim.data : [],
      postsAdded: fbSim.postsAdded,
      isSimulated: true,
    };
  }

  /**
   * GET /api/posts/recent/instagram?profile={profile}&limit={limit}
   */
  public static async getRecentInstagramPosts(
    profile: string,
    limit: number = 1
  ): Promise<{ posts: FacebookPost[]; totalScanned: number; isSimulated: boolean }> {
    try {
      const url = `${this.baseUrl}/api/posts/recent/instagram?profile=${encodeURIComponent(profile)}&limit=${limit}`;
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
        const rawList = Array.isArray(json) ? json : json.posts || json.items || [];
        const normalized = rawList.map((p: any) => this.normalizePost(p));
        return {
          posts: this.deduplicatePosts(normalized),
          totalScanned: json.totalScanned || normalized.length,
          isSimulated: false,
        };
      }
    } catch {
      // Fallback below
    }

    const sub = parseSubscriptionInput(profile, 'instagram', limit);
    const filtered = sub
      ? localStoredPosts.filter((p) => doesPostMatchSubscription(p, sub))
      : [];
    const sorted = this.deduplicatePosts(filtered).sort(
      (a, b) => this.getPostTimestamp(b) - this.getPostTimestamp(a)
    );
    return {
      posts: sorted.slice(0, limit),
      totalScanned: localStoredPosts.length,
      isSimulated: true,
    };
  }

  /**
   * GET /api/posts/recent/tiktok?profile={profile}&limit={limit}
   */
  public static async getRecentTikTokPosts(
    profile: string,
    limit: number = 1
  ): Promise<{ posts: FacebookPost[]; totalScanned: number; isSimulated: boolean }> {
    try {
      const url = `${this.baseUrl}/api/posts/recent/tiktok?profile=${encodeURIComponent(profile)}&limit=${limit}`;
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
        const rawList = Array.isArray(json) ? json : json.posts || json.items || [];
        const normalized = rawList.map((p: any) => this.normalizePost(p));
        return {
          posts: this.deduplicatePosts(normalized),
          totalScanned: json.totalScanned || normalized.length,
          isSimulated: false,
        };
      }
    } catch {
      // Fallback below
    }

    const sub = parseSubscriptionInput(profile, 'tiktok', limit);
    const filtered = sub
      ? localStoredPosts.filter((p) => doesPostMatchSubscription(p, sub))
      : [];
    const sorted = this.deduplicatePosts(filtered).sort(
      (a, b) => this.getPostTimestamp(b) - this.getPostTimestamp(a)
    );
    return {
      posts: sorted.slice(0, limit),
      totalScanned: localStoredPosts.length,
      isSimulated: true,
    };
  }

  /**
   * Strict Subscription-Only Storage Reader:
   * Fetches stored posts ONLY for subscribed accounts and filters out any non-subscribed account.
   */
  public static async fetchSubscribedPostsFromStorage(
    subscriptions: SubscriptionItem[]
  ): Promise<{
    posts: FacebookPost[];
    totalScanned: number;
    isSimulated: boolean;
  }> {
    if (!subscriptions || subscriptions.length === 0) {
      return { posts: [], totalScanned: 0, isSimulated: false };
    }

    let anyLiveSuccess = false;
    let maxTotalScanned = 0;
    const collected: FacebookPost[] = [];

    for (const sub of subscriptions) {
      const limit = Math.max(1, sub.postsLimit || 1);
      if (sub.platform === 'instagram') {
        const res = await this.getRecentInstagramPosts(sub.handle, limit);
        if (!res.isSimulated) anyLiveSuccess = true;
        maxTotalScanned = Math.max(maxTotalScanned, res.totalScanned);
        collected.push(...res.posts);
      } else if (sub.platform === 'tiktok') {
        const res = await this.getRecentTikTokPosts(sub.handle, limit);
        if (!res.isSimulated) anyLiveSuccess = true;
        maxTotalScanned = Math.max(maxTotalScanned, res.totalScanned);
        collected.push(...res.posts);
      } else {
        const pageParam =
          sub.handle === '61563364138740'
            ? 'International-Student-Club-MFU'
            : sub.handle;
        const res = await this.getRecentPosts(pageParam, limit);
        if (!res.isSimulated) anyLiveSuccess = true;
        maxTotalScanned = Math.max(maxTotalScanned, res.data.totalScanned);
        collected.push(...res.data.posts);
      }
    }

    const deduped = this.deduplicatePosts(collected);
    const strictlyFiltered = filterPostsBySubscriptions(
      deduped,
      subscriptions,
      true,
      (p) => this.getPostTimestamp(p)
    );

    return {
      posts: strictlyFiltered,
      totalScanned: maxTotalScanned || strictlyFiltered.length,
      isSimulated: !anyLiveSuccess,
    };
  }

  /**
   * Strict Subscription-Only Scraper Runner:
   * Sends scraper requests ONLY for the user's subscribed accounts using each account's configured postsLimit,
   * then strictly filters all results against `subscriptions`.
   */
  public static async scrapeSubscribedAccounts(
    subscriptions: SubscriptionItem[]
  ): Promise<{
    posts: FacebookPost[];
    postsAdded: number;
    isSimulated: boolean;
  }> {
    if (!subscriptions || subscriptions.length === 0) {
      return { posts: [], postsAdded: 0, isSimulated: false };
    }

    let anyLiveSuccess = false;
    const newlyScraped: FacebookPost[] = [];

    for (const sub of subscriptions) {
      const limit = Math.max(1, sub.postsLimit || 1);
      if (sub.platform === 'instagram') {
        const res = await this.runInstagramScraper([sub.url], limit);
        if (!res.isSimulated) anyLiveSuccess = true;
        newlyScraped.push(...res.data);
      } else if (sub.platform === 'tiktok') {
        const res = await this.runTikTokScraper([sub.handle], limit);
        if (!res.isSimulated) anyLiveSuccess = true;
        newlyScraped.push(...res.data);
      } else {
        const res = await this.runFacebookScraper({
          captionText: false,
          resultsLimit: limit,
          startUrls: [{ url: sub.url }],
        });
        if (!res.isSimulated) anyLiveSuccess = true;
        const rawItems = Array.isArray(res.data)
          ? res.data
          : res.data?.items || [res.data];
        newlyScraped.push(
          ...rawItems.filter(Boolean).map((item: any) => this.normalizePost(item))
        );
      }
    }

    // Merge with any stored posts for these subscriptions and apply strict subscription + per-page limit filter
    const storageRes = await this.fetchSubscribedPostsFromStorage(subscriptions);
    if (!storageRes.isSimulated) anyLiveSuccess = true;

    const combined = this.deduplicatePosts([
      ...newlyScraped,
      ...storageRes.posts,
      ...localStoredPosts,
    ]);

    const strictlyFiltered = filterPostsBySubscriptions(
      combined,
      subscriptions,
      true,
      (p) => this.getPostTimestamp(p)
    );

    return {
      posts: strictlyFiltered,
      postsAdded: strictlyFiltered.length,
      isSimulated: !anyLiveSuccess,
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
    } catch (error) {
      console.warn('Failed to fetch live Apify datasets, returning mock datasets:', error);
      return {
        data: MOCK_APIFY_DATASETS,
        isSimulated: true,
      };
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
    } catch {
      // Fallback
    }

    if (datasetId === 'ds_fb_mfu_output') {
      const fbOnly = localStoredPosts.filter((p) => p.platform === 'facebook');
      return { items: fbOnly.slice(offset, offset + limit), isSimulated: true };
    }
    if (datasetId === 'ds_ig_humansofny_output') {
      const igOnly = localStoredPosts.filter((p) => p.platform === 'instagram');
      return { items: igOnly.slice(offset, offset + limit), isSimulated: true };
    }
    if (datasetId === 'ds_tt_creators_output') {
      const ttOnly = localStoredPosts.filter((p) => p.platform === 'tiktok');
      return { items: ttOnly.slice(offset, offset + limit), isSimulated: true };
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
      const trimmed = post.timestamp.trim();
      if (/^\d+$/.test(trimmed)) {
        const parsed = parseInt(trimmed, 10);
        if (!isNaN(parsed)) {
          return parsed > 10000000000 ? parsed : parsed * 1000;
        }
      }
      const dateParsed = Date.parse(trimmed);
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
   * Normalize various Apify post schema shapes (Facebook, Instagram, TikTok) into standard FacebookPost
   */
  public static normalizePost(raw: any): FacebookPost {
    return normalizeSocialPost(raw);
  }
}
