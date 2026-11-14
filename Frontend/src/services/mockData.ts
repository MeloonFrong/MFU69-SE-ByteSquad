import { FacebookPost, ApifyDataset } from '../types/facebook';
import fbRaw from '../mock/FacebookOutput.txt?raw';
import igRaw from '../mock/InstaOutput.txt?raw';
import ttRaw from '../mock/Tiktokoutput.txt?raw';

/**
 * Normalize raw JSON items from Facebook, Instagram, or TikTok Apify scrapers
 * into the unified FacebookPost structure used across the frontend.
 */
export function normalizeSocialPost(raw: any): FacebookPost {
  if (!raw || typeof raw !== 'object') {
    return {
      postId: `unknown_${Date.now()}`,
      pageName: 'Social Account',
      caption: '',
    };
  }

  // 1. Detect platform
  const urlCandidate = String(
    raw.webVideoUrl || raw.url || raw.facebookUrl || raw.postUrl || raw.inputUrl || ''
  ).toLowerCase();

  let platform: 'facebook' | 'instagram' | 'tiktok' = 'facebook';
  if (raw.platform === 'facebook' || raw.platform === 'instagram' || raw.platform === 'tiktok') {
    platform = raw.platform;
  } else if (raw.webVideoUrl || raw.authorMeta || urlCandidate.includes('tiktok.com')) {
    platform = 'tiktok';
  } else if (
    raw.ownerUsername ||
    raw.shortCode ||
    urlCandidate.includes('instagram.com')
  ) {
    platform = 'instagram';
  }

  // 2. Collect media / cover images across all 3 platform schemas
  const images: string[] = [];
  const pushImg = (u: unknown) => {
    if (typeof u === 'string' && u.trim() !== '') {
      const trimmed = u.trim();
      // Exclude HTML page permalinks accidentally placed in media[].url
      if (
        !trimmed.includes('facebook.com/permalink.php') &&
        !trimmed.includes('facebook.com/reel/') &&
        !trimmed.includes('facebook.com/photo/')
      ) {
        images.push(trimmed);
      }
    }
  };

  if (Array.isArray(raw.images)) {
    raw.images.forEach((img: any) => {
      if (typeof img === 'string') pushImg(img);
      else if (img && typeof img.url === 'string') pushImg(img.url);
    });
  }

  if (typeof raw.displayUrl === 'string') {
    pushImg(raw.displayUrl);
  }

  if (Array.isArray(raw.childPosts)) {
    raw.childPosts.forEach((child: any) => {
      if (child?.displayUrl) pushImg(child.displayUrl);
    });
  }

  if (raw.videoMeta?.coverUrl) {
    pushImg(raw.videoMeta.coverUrl);
  } else if (raw.videoMeta?.originalCoverUrl) {
    pushImg(raw.videoMeta.originalCoverUrl);
  }

  if (Array.isArray(raw.slideshowImageLinks)) {
    raw.slideshowImageLinks.forEach((slide: any) => {
      pushImg(slide?.tiktokLink || slide?.downloadLink);
    });
  }

  if (typeof raw.imageUrl === 'string') {
    pushImg(raw.imageUrl);
  }

  if (Array.isArray(raw.media)) {
    raw.media.forEach((m: any) => {
      const mediaUri =
        m?.photo_image?.uri ||
        m?.image?.uri ||
        m?.flexible_height_share_image?.uri ||
        m?.thumbnailImage?.uri ||
        m?.preferred_thumbnail?.image?.uri ||
        m?.thumbnail ||
        m?.url;
      pushImg(mediaUri);
    });
  }

  // 3. Extract Shared Post (if present, e.g. Facebook sharedPost)
  let sharedPost: FacebookPost['sharedPost'] = undefined;
  if (raw.sharedPost && typeof raw.sharedPost === 'object') {
    const sp = raw.sharedPost;
    const spPageObj = typeof sp.pageName === 'object' && sp.pageName !== null ? sp.pageName : null;
    const spAuthor =
      sp.authorName ||
      (typeof sp.pageName === 'string' ? sp.pageName : spPageObj?.name) ||
      sp.user?.name ||
      'Facebook Page';

    const spImages: string[] = [];
    if (Array.isArray(sp.media)) {
      sp.media.forEach((m: any) => {
        const uri =
          m?.photo_image?.uri ||
          m?.image?.uri ||
          m?.flexible_height_share_image?.uri ||
          m?.thumbnail;
        if (typeof uri === 'string' && uri.trim() !== '') {
          spImages.push(uri.trim());
        }
      });
    }

    sharedPost = {
      authorName: spAuthor,
      pageName: spAuthor,
      text: sp.text || sp.caption || '',
      url: sp.url || sp.facebookUrl || '',
      images: spImages.length > 0 ? Array.from(new Set(spImages)) : undefined,
    };

    if (images.length === 0 && spImages.length > 0) {
      spImages.forEach(pushImg);
    }
  }

  const uniqueImages = Array.from(new Set(images));

  // 4. Resolve Author / Page Name & User Profile across Facebook, Instagram, TikTok
  let pageName = '';
  let userName = '';
  let userId = '';
  let profilePic = '';

  if (platform === 'tiktok') {
    const handle = raw.authorMeta?.name || raw.input || raw.pageName || 'tiktok';
    const nickName = raw.authorMeta?.nickName || raw.user?.name || handle;
    pageName = String(handle);
    userName = String(nickName);
    userId = String(raw.authorMeta?.id || handle);
    profilePic =
      raw.authorMeta?.avatar ||
      raw.authorMeta?.originalAvatarUrl ||
      raw.user?.profilePic ||
      '';
  } else if (platform === 'instagram') {
    const handle = raw.ownerUsername || raw.pageName || 'instagram';
    const fullName = raw.ownerFullName || raw.user?.name || handle;
    pageName = String(handle);
    userName = String(fullName);
    userId = String(raw.ownerId || handle);
    profilePic =
      raw.ownerProfilePicUrl ||
      raw.user?.profilePic ||
      raw.latestComments?.[0]?.ownerProfilePicUrl ||
      '';
  } else {
    // Facebook
    const rawPageName =
      typeof raw.pageName === 'string'
        ? raw.pageName
        : raw.pageName?.name || raw.authorName || '';
    pageName = rawPageName || raw.user?.name || 'Facebook Page';
    if (!rawPageName && typeof raw.facebookUrl === 'string') {
      if (raw.facebookUrl.includes('MFU2Connect')) pageName = 'MFU2Connect';
      else if (raw.facebookUrl.includes('61563364138740'))
        pageName = 'International-Student-Club-MFU';
    }
    userName = raw.user?.name || pageName;
    userId = raw.user?.id || pageName;
    profilePic = raw.user?.profilePic || raw.profilePic || '';
  }

  // 5. Resolve Post URL, Caption, Timestamp, and Engagement Metrics
  const resolvedUrl =
    raw.webVideoUrl ||
    raw.url ||
    raw.topLevelUrl ||
    raw.facebookUrl ||
    raw.postUrl ||
    '';

  const caption =
    raw.caption ?? raw.text ?? raw.message ?? raw.content ?? '';

  const timestamp =
    raw.timestamp ??
    raw.createTime ??
    raw.time ??
    raw.createTimeISO ??
    raw.date;

  const timeIso =
    raw.time ??
    raw.createTimeISO ??
    (typeof raw.timestamp === 'string' ? raw.timestamp : undefined);

  const likesCount = Number(
    raw.likesCount ??
      raw.likes ??
      raw.diggCount ??
      raw.reactionsCount ??
      raw.reactionLikeCount ??
      0
  );

  const commentsCount = Number(
    raw.commentsCount ??
      raw.comments ??
      raw.commentCount ??
      (Array.isArray(raw.topComments) ? raw.topComments.length : undefined) ??
      0
  );

  const sharesCount = Number(
    raw.sharesCount ?? raw.shares ?? raw.shareCount ?? raw.repostCount ?? 0
  );

  const viewsCountRaw = Number(
    raw.viewsCount ??
      raw.videoPlayCount ??
      raw.videoViewCount ??
      raw.playCount ??
      raw.videoPostViewCount ??
      0
  );

  const isVideo = Boolean(
    raw.isVideo ||
      raw.type === 'Video' ||
      (raw.videoMeta && Number(raw.videoMeta.duration) > 0) ||
      (Array.isArray(raw.media) &&
        raw.media.some((m: any) => m?.__typename === 'Video'))
  );

  const mediaType = raw.isSlideshow
    ? 'Slideshow'
    : raw.type || (isVideo ? 'Video' : uniqueImages.length > 1 ? 'Carousel' : 'Photo');

  // 6. Attached Link
  const attachedLink =
    raw.attachedLink ||
    (raw.link
      ? {
          url: raw.link,
          title: raw.previewTitle || raw.linkTitle || raw.link,
          description: raw.previewDescription || raw.linkDescription,
          domain: raw.previewSource,
        }
      : undefined);

  return {
    postId: raw.postId ?? raw.id ?? raw.shortCode,
    id: String(raw.id ?? raw.postId ?? raw.shortCode ?? ''),
    platform,
    pageName,
    user: {
      name: userName,
      id: userId,
      profilePic,
    },
    caption,
    text: caption,
    url: resolvedUrl,
    facebookUrl: resolvedUrl,
    timestamp,
    time: timeIso,
    likesCount: Number.isFinite(likesCount) ? likesCount : 0,
    commentsCount: Number.isFinite(commentsCount) ? commentsCount : 0,
    sharesCount: Number.isFinite(sharesCount) ? sharesCount : 0,
    viewsCount: Number.isFinite(viewsCountRaw) && viewsCountRaw > 0 ? viewsCountRaw : undefined,
    isVideo,
    mediaType,
    images: uniqueImages,
    attachedLink,
    sharedPost,
    isScrapedNew: raw.isScrapedNew,
  };
}

function parseMockFile(rawText: string): any[] {
  try {
    const parsed = JSON.parse(rawText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse mock output file:', e);
    return [];
  }
}

const fbItems = parseMockFile(fbRaw);
const igItems = parseMockFile(igRaw);
const ttItems = parseMockFile(ttRaw);

// Clean Start: Initial mock posts start empty so the app opens with 0 posts and 0 accounts
export const INITIAL_MOCK_POSTS: FacebookPost[] = [];

// Manual Demo Mode: Real multi-platform sample data loaded only when the user clicks "Load Demo Data"
export const DEMO_MOCK_POSTS: FacebookPost[] = [
  ...fbItems.map(normalizeSocialPost),
  ...igItems.map(normalizeSocialPost),
  ...ttItems.map(normalizeSocialPost),
];

export const MOCK_APIFY_DATASETS: ApifyDataset[] = [
  {
    id: 'ds_fb_mfu_output',
    name: 'facebook-mfu-campus-posts',
    itemCount: fbItems.length,
    cleanItemCount: fbItems.length,
    actId: 'apify~facebook-posts-scraper',
    actRunId: 'run_fb_9410af81',
    createdAt: '2026-11-09T09:10:00.000Z',
    modifiedAt: '2026-11-09T13:05:00.000Z',
  },
  {
    id: 'ds_ig_humansofny_output',
    name: 'instagram-humansofny-feed',
    itemCount: igItems.length,
    cleanItemCount: igItems.length,
    actId: 'apify~instagram-scraper',
    actRunId: 'run_ig_3821ce72',
    createdAt: '2026-11-11T11:00:00.000Z',
    modifiedAt: '2026-11-11T23:30:00.000Z',
  },
  {
    id: 'ds_tt_creators_output',
    name: 'tiktok-zzz-khaby-feed',
    itemCount: ttItems.length,
    cleanItemCount: ttItems.length,
    actId: 'clockworks~tiktok-scraper',
    actRunId: 'run_tt_1109ff93',
    createdAt: '2026-11-11T04:20:00.000Z',
    modifiedAt: '2026-11-12T17:32:00.000Z',
  },
];
