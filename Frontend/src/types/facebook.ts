export interface FacebookPost {
  postId?: string | number;
  id?: string;
  platform?: 'facebook' | 'instagram' | 'tiktok';
  pageName?: string;
  user?: {
    name?: string;
    id?: string;
    profilePic?: string;
  };
  text?: string;
  caption?: string;
  message?: string;
  url?: string;
  facebookUrl?: string;
  postUrl?: string;
  timestamp?: number | string;
  time?: string;
  date?: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  isVideo?: boolean;
  mediaType?: string;
  media?: Array<{
    type?: 'image' | 'video' | 'link';
    url?: string;
    thumbnail?: string;
    alt?: string;
  }>;
  images?: string[];
  imageUrl?: string;
  attachedLink?: {
    title?: string;
    description?: string;
    url?: string;
    thumbnail?: string;
    domain?: string;
  };
  sharedPost?: {
    authorName?: string;
    text?: string;
    url?: string;
    pageName?: string;
    images?: string[];
  };
  isScrapedNew?: boolean;
}

export interface ScraperRunInput {
  captionText: boolean;
  resultsLimit: number;
  startUrls: Array<{
    url: string;
  }>;
}

export interface RecentPostsResponse {
  page: string;
  requestedLimit: number;
  totalScanned: number;
  returned: number;
  posts: FacebookPost[];
}

export interface ApifyDataset {
  id: string;
  name?: string;
  itemCount?: number;
  cleanItemCount?: number;
  actId?: string;
  actRunId?: string;
  createdAt?: string;
  modifiedAt?: string;
  accessedAt?: string;
}

export interface BackendConfig {
  baseUrl: string;
  isCustomUrl: boolean;
  mode: 'auto' | 'live' | 'simulator';
}

export type SubscriptionPlatform = 'facebook' | 'instagram' | 'tiktok';

export interface SubscriptionItem {
  id: string;
  platform: SubscriptionPlatform;
  handle: string;
  displayName: string;
  url: string;
  postsLimit: number;
}
