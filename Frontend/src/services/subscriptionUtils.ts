import { FacebookPost, SubscriptionItem, SubscriptionPlatform } from '../types/facebook';

export const DEFAULT_POSTS_PER_PAGE = 1;

export const DEFAULT_SUGGESTED_TAGS = [
  '#MFU',
  '#Academic',
  '#Activity',
  '#News',
  '#Creator',
];

export function normalizeTag(raw: string): string {
  const cleaned = raw.trim().replace(/^#+/, '').trim();
  if (!cleaned) return '';
  return `#${cleaned}`;
}

export function normalizeTagList(tags?: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tags) {
    const norm = normalizeTag(t);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(norm);
    }
  }
  return result;
}

export function detectPlatformFromPost(post: FacebookPost): SubscriptionPlatform {
  if (
    post.platform === 'facebook' ||
    post.platform === 'instagram' ||
    post.platform === 'tiktok'
  ) {
    return post.platform;
  }
  const url = (post.facebookUrl || post.url || post.postUrl || '').toLowerCase();
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'facebook';
}

export function resolveDisplayName(
  platform: SubscriptionPlatform,
  handle: string
): string {
  const lower = handle.toLowerCase();
  if (platform === 'facebook') {
    if (lower === 'mfu2connect') return 'MFU2Connect';
    if (
      lower === '61563364138740' ||
      lower === 'international-student-club-mfu'
    ) {
      return 'International Student Club MFU';
    }
  }
  if (platform === 'instagram') {
    if (lower === 'humansofny') return 'Humans of New York';
  }
  if (platform === 'tiktok') {
    if (lower === 'zenlesszonezero') return 'Zenless Zone Zero';
    if (lower === 'khaby.lame') return 'Khabane lame';
  }
  return handle;
}

/**
 * Parse a user-entered URL or handle into a normalized SubscriptionItem
 * with a default postsLimit of 1 post per page and optional custom tags.
 */
export function parseSubscriptionInput(
  rawInput: string,
  fallbackPlatform: SubscriptionPlatform = 'facebook',
  postsLimit: number = DEFAULT_POSTS_PER_PAGE,
  tags: string[] = []
): SubscriptionItem | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  let platform: SubscriptionPlatform = fallbackPlatform;
  let handle = '';
  let canonicalUrl = '';

  if (lower.includes('instagram.com')) {
    platform = 'instagram';
    const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
    handle = (match?.[1] || '').replace(/^@/, '').trim();
    if (!handle) return null;
    canonicalUrl = `https://www.instagram.com/${handle}/`;
  } else if (lower.includes('tiktok.com')) {
    platform = 'tiktok';
    const match = trimmed.match(/tiktok\.com\/@?([^/?#]+)/i);
    handle = (match?.[1] || '').replace(/^@/, '').trim();
    if (!handle) return null;
    canonicalUrl = `https://www.tiktok.com/@${handle}`;
  } else if (lower.includes('facebook.com') || lower.includes('fb.com')) {
    platform = 'facebook';
    const idMatch = trimmed.match(/[?&]id=(\d+)/i);
    if (idMatch?.[1]) {
      handle = idMatch[1];
      canonicalUrl = `https://www.facebook.com/profile.php?id=${handle}`;
    } else {
      const pathMatch = trimmed.match(/(?:facebook|fb)\.com\/([^/?#]+)/i);
      handle = (pathMatch?.[1] || '').replace(/^@/, '').trim();
      if (!handle) return null;
      canonicalUrl = `https://www.facebook.com/${handle}`;
    }
  } else {
    // Plain handle or username
    handle = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^@/, '')
      .replace(/\/+$/, '')
      .trim();
    if (!handle) return null;

    if (platform === 'instagram') {
      canonicalUrl = `https://www.instagram.com/${handle}/`;
    } else if (platform === 'tiktok') {
      canonicalUrl = `https://www.tiktok.com/@${handle}`;
    } else {
      if (/^\d+$/.test(handle)) {
        canonicalUrl = `https://www.facebook.com/profile.php?id=${handle}`;
      } else {
        canonicalUrl = `https://www.facebook.com/${handle}`;
      }
    }
  }

  const normalizedKey =
    platform === 'facebook' &&
    (handle.toLowerCase() === '61563364138740' ||
      handle.toLowerCase() === 'international-student-club-mfu')
      ? 'facebook:61563364138740'
      : `${platform}:${handle.toLowerCase()}`;

  return {
    id: normalizedKey,
    platform,
    handle,
    displayName: resolveDisplayName(platform, handle),
    url: canonicalUrl,
    postsLimit: Math.max(
      1,
      Math.min(50, Math.round(postsLimit || DEFAULT_POSTS_PER_PAGE))
    ),
    tags: normalizeTagList(tags),
  };
}

export const PRESET_SUBSCRIPTION_SOURCES: Array<{
  label: string;
  url: string;
  platform: SubscriptionPlatform;
  defaultTags: string[];
}> = [
  {
    label: 'MFU2Connect',
    url: 'https://www.facebook.com/MFU2Connect',
    platform: 'facebook',
    defaultTags: ['#MFU', '#Academic'],
  },
  {
    label: 'ISC MFU',
    url: 'https://www.facebook.com/profile.php?id=61563364138740',
    platform: 'facebook',
    defaultTags: ['#MFU', '#Activity'],
  },
  {
    label: 'Humans of NY',
    url: 'https://www.instagram.com/humansofny/',
    platform: 'instagram',
    defaultTags: ['#News', '#Creator'],
  },
  {
    label: 'Khaby Lame',
    url: 'https://www.tiktok.com/@khaby.lame',
    platform: 'tiktok',
    defaultTags: ['#Creator'],
  },
  {
    label: 'Zenless Zone Zero',
    url: 'https://www.tiktok.com/@zenlesszonezero',
    platform: 'tiktok',
    defaultTags: ['#Activity'],
  },
];

/**
 * Strictly checks if a post belongs to a specific subscribed page/account.
 */
export function doesPostMatchSubscription(
  post: FacebookPost,
  sub: SubscriptionItem
): boolean {
  const postPlatform = detectPlatformFromPost(post);
  if (postPlatform !== sub.platform) {
    return false;
  }

  const target = sub.handle.toLowerCase().replace(/^@/, '').trim();
  if (!target) return false;

  const postPage = (post.pageName || '').toLowerCase().replace(/^@/, '').trim();
  const postUserId = (post.user?.id || '').toLowerCase().replace(/^@/, '').trim();
  const postUserName = (post.user?.name || '').toLowerCase().trim();
  const postUrl = (
    post.facebookUrl ||
    post.url ||
    post.postUrl ||
    ''
  ).toLowerCase();

  if (postPage === target || postUserId === target || postUserName === target) {
    return true;
  }

  // Handle Facebook numeric profile IDs <-> International-Student-Club-MFU
  if (sub.platform === 'facebook') {
    const isIscSub =
      target === '61563364138740' ||
      target === 'international-student-club-mfu';
    const isIscPost =
      postPage === 'international-student-club-mfu' ||
      postUserId === '61563364138740' ||
      postUrl.includes('61563364138740');
    if (isIscSub && isIscPost) {
      return true;
    }

    if (
      postUrl.includes(`facebook.com/${target}`) ||
      postUrl.includes(`id=${target}`)
    ) {
      return true;
    }
  }

  if (sub.platform === 'instagram') {
    if (postUrl.includes(`instagram.com/${target}/`)) {
      return true;
    }
  }

  if (sub.platform === 'tiktok') {
    if (postUrl.includes(`tiktok.com/@${target}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the SubscriptionItem that owns a given post.
 */
export function findMatchingSubscription(
  post: FacebookPost,
  subscriptions: SubscriptionItem[]
): SubscriptionItem | undefined {
  return subscriptions.find((sub) => doesPostMatchSubscription(post, sub));
}

/**
 * Strictly filter an array of posts against the user's active Subscription list.
 * Any post from an account that is NOT in `subscriptions` is discarded.
 * When `enforcePerPageLimit` is true, at most `sub.postsLimit` newest posts are kept per subscription.
 */
export function filterPostsBySubscriptions(
  posts: FacebookPost[],
  subscriptions: SubscriptionItem[],
  enforcePerPageLimit: boolean = false,
  getTimestamp?: (p: FacebookPost) => number
): FacebookPost[] {
  if (!subscriptions || subscriptions.length === 0) {
    return [];
  }

  const matched = posts.filter((post) =>
    subscriptions.some((sub) => doesPostMatchSubscription(post, sub))
  );

  if (!enforcePerPageLimit) {
    return matched;
  }

  const sortFn = getTimestamp
    ? (a: FacebookPost, b: FacebookPost) => getTimestamp(b) - getTimestamp(a)
    : undefined;

  const collected: FacebookPost[] = [];
  for (const sub of subscriptions) {
    const subPosts = matched.filter((p) => doesPostMatchSubscription(p, sub));
    const ordered = sortFn ? [...subPosts].sort(sortFn) : subPosts;
    collected.push(...ordered.slice(0, Math.max(1, sub.postsLimit)));
  }

  return sortFn ? collected.sort(sortFn) : collected;
}
