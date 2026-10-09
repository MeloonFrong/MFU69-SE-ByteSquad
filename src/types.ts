export type SourcePlatform = 'facebook' | 'instagram' | 'tiktok';

export interface Source {
  id: string;
  name: string;
  handle: string;
  url: string;
  platform: SourcePlatform;
  avatarUrl?: string;
  color: string;
  tags: string[];
  enabled: boolean;
  postCount: number;
  lastUpdated: string;
  description?: string;
  isDefault?: boolean;
}

export interface Post {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceHandle: string;
  platform: SourcePlatform;
  title: string;
  titleTh?: string;
  content: string;
  contentTh?: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  isPinned?: boolean;
  isImportant?: boolean;
  isRead?: boolean;
  isBookmarked?: boolean;
  authorAvatar?: string;
  engagement?: {
    likes?: number;
    shares?: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export type SortOption = 'newest' | 'oldest' | 'important';
export type ViewTab = 'all' | 'important' | 'unread' | 'bookmarked';
export type Language = 'en' | 'th';
export type Theme = 'dark' | 'light';

export interface FilterOptions {
  search: string;
  mustInclude: string[];
  exclude: string[];
  selectedTags: string[];
  selectedPlatform: string; // 'all' or SourcePlatform
  sortBy: SortOption;
  viewTab: ViewTab;
}
