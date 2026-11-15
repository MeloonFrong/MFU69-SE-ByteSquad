import { useState, useMemo } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Facebook,
  Filter,
  Instagram,
  Layers,
  MinusCircle,
  Music2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  X,
} from 'lucide-react';
import { FacebookPost, SortOrder, SubscriptionItem } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import {
  doesPostMatchSubscription,
  filterPostsBySubscriptions,
  findMatchingSubscription,
  normalizeTagList,
} from '../services/subscriptionUtils';
import { PostCard, detectPostPlatform, SocialPlatform } from './PostCard';
import { useI18n } from '../i18n/LanguageContext';
import { PlatformFilter } from '../i18n/strings';

interface FeedViewProps {
  posts: FacebookPost[];
  subscriptions: SubscriptionItem[];
  isLoading: boolean;
  isRefreshing?: boolean;
  selectedPage: string;
  onPageChange: (page: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  onOpenAddSubscription: () => void;
  onOpenRefreshConfig: () => void;
  onImageClick: (url: string) => void;
  isSimulated: boolean;
}

interface FollowedAccountItem {
  id: string;
  handle: string;
  label: string;
  shortLabel: string;
  platform: SocialPlatform | 'all';
  postsLimit?: number;
  tags: string[];
  subscription?: SubscriptionItem;
}

export function FeedView({
  posts,
  subscriptions,
  isLoading,
  isRefreshing = false,
  selectedPage,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  onOpenAddSubscription,
  onOpenRefreshConfig,
  onImageClick,
  isSimulated,
}: FeedViewProps) {
  const { t, formatNumber } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [includeKeywordsInput, setIncludeKeywordsInput] = useState('');
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Strict Subscription-Only filtering on every post in the feed
  const subscribedPosts = useMemo(() => {
    return filterPostsBySubscriptions(
      posts,
      subscriptions,
      true,
      (p) => FacebookApiClient.getPostTimestamp(p)
    );
  }, [posts, subscriptions]);

  // Collect all unique tags across subscribed accounts (FR-3)
  const allSubscribedTags = useMemo(() => {
    return normalizeTagList(subscriptions.flatMap((s) => s.tags || []));
  }, [subscriptions]);

  // Count posts per tag across subscribedPosts
  const tagPostCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSubscribedTags.forEach((tag) => {
      counts[tag.toLowerCase()] = 0;
    });
    subscribedPosts.forEach((post) => {
      const ownerSub = findMatchingSubscription(post, subscriptions);
      const tags = ownerSub?.tags || [];
      tags.forEach((tag) => {
        const key = tag.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [allSubscribedTags, subscribedPosts, subscriptions]);

  // Count strictly subscribed posts per platform
  const platformCounts = useMemo(() => {
    return subscribedPosts.reduce(
      (acc, post) => {
        const p = detectPostPlatform(post);
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      },
      { facebook: 0, instagram: 0, tiktok: 0 }
    );
  }, [subscribedPosts]);

  // Build Followed Accounts list STRICTLY from user's Subscriptions
  const allAccounts: FollowedAccountItem[] = useMemo(() => {
    return subscriptions.map((sub) => {
      const lower = sub.handle.toLowerCase();
      let label = sub.displayName || sub.handle;
      let shortLabel = label;

      if (lower === 'mfu2connect') {
        label = t('sourceMfu');
        shortLabel = t('sourceMfuShort');
      } else if (
        lower.includes('international-student-club') ||
        lower.includes('61563364138740')
      ) {
        label = t('sourceOrg');
        shortLabel = t('sourceOrgShort');
      } else if (lower === 'humansofny') {
        label = t('sourceHony');
        shortLabel = t('sourceHonyShort');
      } else if (lower === 'zenlesszonezero') {
        label = t('sourceZzz');
        shortLabel = t('sourceZzzShort');
      } else if (lower === 'khaby.lame') {
        label = t('sourceKhaby');
        shortLabel = t('sourceKhabyShort');
      }

      return {
        id: sub.id,
        handle: sub.handle,
        label,
        shortLabel,
        platform: sub.platform,
        postsLimit: sub.postsLimit,
        tags: normalizeTagList(sub.tags),
        subscription: sub,
      };
    });
  }, [subscriptions, t]);

  // Filter Followed Accounts by selectedPlatform and selectedTag
  const visibleAccounts: FollowedAccountItem[] = useMemo(() => {
    const filtered = allAccounts.filter((acc) => {
      if (selectedPlatform !== 'all' && acc.platform !== selectedPlatform) {
        return false;
      }
      if (
        selectedTag !== 'all' &&
        !acc.tags.some((tItem) => tItem.toLowerCase() === selectedTag.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return [];
    }

    return [
      {
        id: 'all',
        handle: 'all',
        label: t('sourceAll'),
        shortLabel: t('sourceAll'),
        platform: 'all',
        tags: [],
      },
      ...filtered,
    ];
  }, [allAccounts, selectedPlatform, selectedTag, t]);

  const handlePlatformSelect = (plat: PlatformFilter) => {
    setSelectedPlatform(plat);
    if (plat !== 'all' && selectedPage !== 'all') {
      const currentAcc = allAccounts.find(
        (a) =>
          a.id.toLowerCase() === selectedPage.toLowerCase() ||
          a.handle.toLowerCase() === selectedPage.toLowerCase()
      );
      if (currentAcc && currentAcc.platform !== plat) {
        onPageChange('all');
      }
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    if (tag !== 'all' && selectedPage !== 'all') {
      const currentAcc = allAccounts.find(
        (a) =>
          a.id.toLowerCase() === selectedPage.toLowerCase() ||
          a.handle.toLowerCase() === selectedPage.toLowerCase()
      );
      if (
        currentAcc &&
        !currentAcc.tags.some((tItem) => tItem.toLowerCase() === tag.toLowerCase())
      ) {
        onPageChange('all');
      }
    }
  };

  // Parse comma-separated keyword lists for FR-4 Include and Exclude filters
  const includeKeywords = useMemo(() => {
    return includeKeywordsInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [includeKeywordsInput]);

  const excludeKeywords = useMemo(() => {
    return excludeKeywordsInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [excludeKeywordsInput]);

  // Filter subscribedPosts by selectedPage, selectedPlatform, selectedTag (FR-3),
  // searchQuery, includeKeywords & excludeKeywords (FR-4), then sort (FR-4) and slice by limit
  const filteredPosts = useMemo(() => {
    const matching = subscribedPosts.filter((post) => {
      const ownerSub = findMatchingSubscription(post, subscriptions);

      // Filter by selected account
      if (selectedPage !== 'all') {
        const selectedAcc = allAccounts.find(
          (a) =>
            a.id.toLowerCase() === selectedPage.toLowerCase() ||
            a.handle.toLowerCase() === selectedPage.toLowerCase()
        );
        if (selectedAcc?.subscription) {
          if (!doesPostMatchSubscription(post, selectedAcc.subscription)) {
            return false;
          }
        } else {
          return false;
        }
      }

      // Filter by selected platform
      if (selectedPlatform !== 'all') {
        if (detectPostPlatform(post) !== selectedPlatform) return false;
      }

      // FR-3: Filter by selected tag
      if (selectedTag !== 'all') {
        const subTags = ownerSub?.tags || [];
        if (
          !subTags.some((tItem) => tItem.toLowerCase() === selectedTag.toLowerCase())
        ) {
          return false;
        }
      }

      const caption = (
        post.caption ||
        post.text ||
        post.message ||
        ''
      ).toLowerCase();
      const author = (post.user?.name || post.pageName || '').toLowerCase();
      const searchableText = `${caption} ${author}`;

      // General search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // FR-4: Must Include keywords (every keyword in includeKeywords must appear)
      if (includeKeywords.length > 0) {
        const hasAllIncluded = includeKeywords.every((kw) =>
          searchableText.includes(kw)
        );
        if (!hasAllIncluded) return false;
      }

      // FR-4: Exclude keywords (if any keyword in excludeKeywords appears, hide post)
      if (excludeKeywords.length > 0) {
        const hasAnyExcluded = excludeKeywords.some((kw) =>
          searchableText.includes(kw)
        );
        if (hasAnyExcluded) return false;
      }

      return true;
    });

    // FR-4: Sort posts by Latest or Most Liked
    const sorted = [...matching].sort((a, b) => {
      if (sortOrder === 'most_liked') {
        const likesDiff = (b.likesCount ?? 0) - (a.likesCount ?? 0);
        if (likesDiff !== 0) return likesDiff;
      }
      return (
        FacebookApiClient.getPostTimestamp(b) -
        FacebookApiClient.getPostTimestamp(a)
      );
    });

    return sorted.slice(0, limit);
  }, [
    subscribedPosts,
    subscriptions,
    selectedPage,
    allAccounts,
    selectedPlatform,
    selectedTag,
    searchQuery,
    includeKeywords,
    excludeKeywords,
    sortOrder,
    limit,
  ]);

  const selectedAccountObj = allAccounts.find(
    (a) =>
      a.id.toLowerCase() === selectedPage.toLowerCase() ||
      a.handle.toLowerCase() === selectedPage.toLowerCase()
  );
  const activeSourceLabel =
    selectedPage === 'all'
      ? t('sourceAll')
      : selectedAccountObj?.label || selectedPage;

  const subtitle =
    selectedPage === 'all'
      ? t('feedSubtitleAll')
      : t('feedSubtitleOne', { source: activeSourceLabel });

  const platforms: Array<{
    id: PlatformFilter;
    label: string;
    count: number;
    iconColorClass: string;
    Icon: typeof Layers;
  }> = [
    {
      id: 'all',
      label: t('platformAll'),
      count: subscribedPosts.length,
      iconColorClass: 'text-ink-3',
      Icon: Layers,
    },
    {
      id: 'facebook',
      label: t('platformFacebook'),
      count: platformCounts.facebook,
      iconColorClass: 'text-platform-fb',
      Icon: Facebook,
    },
    {
      id: 'instagram',
      label: t('platformInstagram'),
      count: platformCounts.instagram,
      iconColorClass: 'text-platform-ig',
      Icon: Instagram,
    },
    {
      id: 'tiktok',
      label: t('platformTiktok'),
      count: platformCounts.tiktok,
      iconColorClass: 'text-platform-tt',
      Icon: Music2,
    },
  ];

  const renderPlatformLogo = (platform: SocialPlatform | 'all') => {
    if (platform === 'facebook') {
      return (
        <Facebook
          className="w-4 h-4 text-platform-fb shrink-0"
          strokeWidth={1.75}
        />
      );
    }
    if (platform === 'instagram') {
      return (
        <Instagram
          className="w-4 h-4 text-platform-ig shrink-0"
          strokeWidth={1.75}
        />
      );
    }
    if (platform === 'tiktok') {
      return (
        <Music2
          className="w-4 h-4 text-platform-tt shrink-0"
          strokeWidth={1.75}
        />
      );
    }
    return (
      <Layers className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
    );
  };

  const selectedPlatformLabel =
    platforms.find((p) => p.id === selectedPlatform)?.label || '';

  const hasSubscriptions = subscriptions.length > 0;
  const hasAnyPosts = subscribedPosts.length > 0;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    includeKeywords.length > 0 ||
    excludeKeywords.length > 0 ||
    selectedTag !== 'all' ||
    selectedPlatform !== 'all' ||
    selectedPage !== 'all';

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setIncludeKeywordsInput('');
    setExcludeKeywordsInput('');
    setSelectedTag('all');
    setSelectedPlatform('all');
    onPageChange('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Explicit Bilingual Alert Banner when Backend is offline */}
      {isSimulated && (
        <div
          role="alert"
          className="mb-6 bg-negative-soft border border-negative-line rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-negative shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <div className="space-y-1">
              <h2 className="text-[14px] font-semibold text-negative-ink">
                {t('offlineTitle')}
              </h2>
              <p className="text-[13px] text-ink-2 leading-relaxed max-w-3xl">
                {t('offlineBody', { url: FacebookApiClient.getBaseUrl() })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 px-3.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
              <span>{t('retry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Social Feed Hub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-6 items-start">
        {/* LEFT COLUMN: Platform Filter, Tag Filter (FR-3) & Subscribed Accounts */}
        <aside className="hidden lg:block sticky top-22 space-y-4">
          {/* Platform Filter Card */}
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)]">
            <div className="px-2 pb-2 text-[12px] font-medium text-ink-3">
              {t('platformsTitle')}
            </div>
            <nav className="space-y-1" aria-label={t('platformsTitle')}>
              {platforms.map((plat) => {
                const Icon = plat.Icon;
                const isActive = selectedPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handlePlatformSelect(plat.id)}
                    className={`w-full h-9 px-2.5 rounded-lg text-left text-[13px] transition-colors flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-raised text-ink font-medium'
                        : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${plat.iconColorClass}`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{plat.label}</span>
                    </span>
                    <span className="font-mono text-[12px] text-ink-3 tabular-nums">
                      {formatNumber(plat.count)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* FR-3: Tag Filter Card */}
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)]">
            <div className="px-2 pb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-ink-3 truncate">
                {t('tagsTitle')}
              </span>
              <TagIcon className="w-3.5 h-3.5 text-ink-3 shrink-0" strokeWidth={1.5} />
            </div>

            {allSubscribedTags.length > 0 ? (
              <nav className="space-y-1" aria-label={t('tagsTitle')}>
                <button
                  type="button"
                  onClick={() => handleTagSelect('all')}
                  className={`w-full h-8 px-2.5 rounded-lg text-left text-[13px] transition-colors flex items-center justify-between gap-2 ${
                    selectedTag === 'all'
                      ? 'bg-raised text-ink font-medium'
                      : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                  }`}
                >
                  <span className="truncate">{t('tagAll')}</span>
                  <span className="font-mono text-[12px] text-ink-3 tabular-nums">
                    {formatNumber(subscribedPosts.length)}
                  </span>
                </button>
                {allSubscribedTags.map((tag) => {
                  const isActive =
                    selectedTag.toLowerCase() === tag.toLowerCase();
                  const count = tagPostCounts[tag.toLowerCase()] || 0;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className={`w-full h-8 px-2.5 rounded-lg text-left text-[13px] transition-colors flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-raised text-ink font-medium'
                          : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                      }`}
                    >
                      <span className="font-mono text-[12px] truncate">
                        {tag}
                      </span>
                      <span className="font-mono text-[12px] text-ink-3 tabular-nums">
                        {formatNumber(count)}
                      </span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              <p className="px-2 pt-1 text-[12px] text-ink-3 leading-relaxed">
                {t('noTagsYet')}
              </p>
            )}
          </div>

          {/* Followed / Subscribed Accounts Card (with Tag Badges underneath account name) */}
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)]">
            <div className="px-2 pb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-ink-3 truncate">
                {t('sourcesTitle')}
              </span>
              <button
                type="button"
                onClick={onOpenAddSubscription}
                title={t('addSourceTooltip')}
                aria-label={t('addSourceTooltip')}
                className="w-6 h-6 rounded-md bg-raised hover:bg-line border border-line text-ink-2 hover:text-ink transition-colors inline-flex items-center justify-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            {visibleAccounts.length > 0 ? (
              <nav className="space-y-1" aria-label={t('sourcesTitle')}>
                {visibleAccounts.map((src) => {
                  const isActive =
                    src.id === 'all'
                      ? selectedPage === 'all'
                      : selectedPage.toLowerCase() === src.id.toLowerCase() ||
                        selectedPage.toLowerCase() === src.handle.toLowerCase();
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => onPageChange(src.id)}
                      className={`w-full py-2 px-2.5 rounded-lg text-left text-[13px] transition-colors flex flex-col gap-1 ${
                        isActive
                          ? 'bg-raised text-ink font-medium'
                          : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5 min-w-0">
                          {renderPlatformLogo(src.platform)}
                          <span className="truncate">{src.label}</span>
                        </span>
                        {src.postsLimit !== undefined && (
                          <span className="font-mono text-[11px] text-ink-3 tabular-nums shrink-0">
                            {formatNumber(src.postsLimit)}
                          </span>
                        )}
                      </div>

                      {src.tags.length > 0 && (
                        <div className="pl-6 flex flex-wrap gap-1">
                          {src.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded-sm bg-card border border-line font-mono text-[10px] leading-tight text-ink-3"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            ) : (
              <div className="px-2 pt-2 pb-1 space-y-2.5">
                <p className="text-[12px] text-ink-3 leading-relaxed">
                  {t('noFollowedSources')}
                </p>
                <button
                  type="button"
                  onClick={onOpenAddSubscription}
                  className="w-full h-8 px-2.5 rounded-lg bg-raised hover:bg-line border border-line text-[12px] font-medium text-ink transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                  <span>{t('addSourceTooltip')}</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Main Social Feed */}
        <div className="min-w-0 space-y-5">
          {/* Feed Header, Search, FR-4 Keyword Include/Exclude & Sorting Controls Card */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h1 className="font-display text-[24px] leading-tight font-semibold text-ink tracking-tight">
                  {t('feedTitle')}
                </h1>
                <p className="text-[13px] text-ink-2 mt-1">{subtitle}</p>
              </div>

              <div className="text-[12px] text-ink-3 font-mono tabular-nums">
                {t('showingCount', {
                  shown: formatNumber(filteredPosts.length),
                  total: formatNumber(subscribedPosts.length),
                })}
              </div>
            </div>

            {/* Mobile/Tablet Platform, Tag & Account Switchers */}
            <div className="lg:hidden space-y-2">
              <div className="flex items-center gap-1 p-1 bg-raised border border-line rounded-xl overflow-x-auto">
                {platforms.map((plat) => {
                  const Icon = plat.Icon;
                  const isActive = selectedPlatform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => handlePlatformSelect(plat.id)}
                      className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${plat.iconColorClass}`}
                        strokeWidth={1.75}
                      />
                      <span>{plat.label}</span>
                      <span className="font-mono text-[11px] text-ink-3 tabular-nums">
                        {formatNumber(plat.count)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {allSubscribedTags.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-raised border border-line rounded-xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleTagSelect('all')}
                    className={`h-7 px-2.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedTag === 'all'
                        ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {t('tagAll')}
                  </button>
                  {allSubscribedTags.map((tag) => {
                    const isActive =
                      selectedTag.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagSelect(tag)}
                        className={`h-7 px-2.5 rounded-lg font-mono text-[12px] transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-card text-ink font-medium shadow-[var(--shadow-small)]'
                            : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

              {visibleAccounts.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-raised border border-line rounded-xl overflow-x-auto">
                  {visibleAccounts.map((src) => {
                    const isActive =
                      src.id === 'all'
                        ? selectedPage === 'all'
                        : selectedPage.toLowerCase() === src.id.toLowerCase() ||
                          selectedPage.toLowerCase() === src.handle.toLowerCase();
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => onPageChange(src.id)}
                        className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                            : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {renderPlatformLogo(src.platform)}
                        <span>{src.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 1: Search, Sort Order (FR-4) & Display Limit Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="search"
                  aria-label={t('searchLabel')}
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 text-[13px] bg-raised border border-line rounded-lg text-ink placeholder:text-ink-3 focus:bg-card focus:outline-hidden focus:border-accent transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('clearSearch')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink rounded-md"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center">
                  <ArrowUpDown
                    className="w-3.5 h-3.5 text-ink-3 absolute left-3 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <select
                    id="feed-sort-select"
                    aria-label={t('sortLabel')}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="h-10 pl-8 pr-3 text-[13px] bg-raised border border-line rounded-lg text-ink focus:outline-hidden focus:border-accent transition-colors"
                  >
                    <option value="newest">{t('sortNewest')}</option>
                    <option value="most_liked">{t('sortMostLiked')}</option>
                  </select>
                </div>

                <label
                  htmlFor="feed-limit-select"
                  className="text-[13px] text-ink-3 whitespace-nowrap hidden sm:inline"
                >
                  {t('showLabel')}
                </label>
                <select
                  id="feed-limit-select"
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="h-10 px-3 text-[13px] bg-raised border border-line rounded-lg text-ink focus:outline-hidden focus:border-accent transition-colors font-mono tabular-nums"
                >
                  <option value={5}>{t('limitOption', { n: 5 })}</option>
                  <option value={10}>{t('limitOption', { n: 10 })}</option>
                  <option value={20}>{t('limitOption', { n: 20 })}</option>
                  <option value={50}>{t('limitOption', { n: 50 })}</option>
                </select>
              </div>
            </div>

            {/* Row 2: FR-4 Keyword Include & Exclude Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="relative">
                <Filter
                  className="w-3.5 h-3.5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  aria-label={t('includeKeywordsLabel')}
                  placeholder={t('includeKeywordsPlaceholder')}
                  value={includeKeywordsInput}
                  onChange={(e) => setIncludeKeywordsInput(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-[12px] bg-raised border border-line rounded-lg text-ink placeholder:text-ink-3 focus:bg-card focus:outline-hidden focus:border-accent transition-colors"
                />
                {includeKeywordsInput && (
                  <button
                    type="button"
                    onClick={() => setIncludeKeywordsInput('')}
                    aria-label="Clear include filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink rounded-md"
                  >
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="relative">
                <MinusCircle
                  className="w-3.5 h-3.5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  aria-label={t('excludeKeywordsLabel')}
                  placeholder={t('excludeKeywordsPlaceholder')}
                  value={excludeKeywordsInput}
                  onChange={(e) => setExcludeKeywordsInput(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-[12px] bg-raised border border-line rounded-lg text-ink placeholder:text-ink-3 focus:bg-card focus:outline-hidden focus:border-accent transition-colors"
                />
                {excludeKeywordsInput && (
                  <button
                    type="button"
                    onClick={() => setExcludeKeywordsInput('')}
                    aria-label="Clear exclude filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink rounded-md"
                  >
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Post Stream or Empty State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-card border border-line rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-raised rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="w-36 h-3.5 bg-raised rounded-sm" />
                      <div className="w-24 h-3 bg-raised rounded-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3.5 bg-raised rounded-sm" />
                    <div className="w-4/5 h-3.5 bg-raised rounded-sm" />
                    <div className="w-2/3 h-3.5 bg-raised rounded-sm" />
                  </div>
                  <div className="w-full h-52 bg-raised rounded-xl" />
                </div>
              ))}
            </div>
          ) : !hasSubscriptions || !hasAnyPosts ? (
            /* Clean Start / Zero Initial Data Onboarding Empty State */
            <div className="bg-card border border-line rounded-2xl p-10 sm:p-12 text-center shadow-[var(--shadow-small)] space-y-5">
              <div className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-raised border border-line mx-auto">
                <span className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center">
                  <Facebook
                    className="w-4 h-4 text-platform-fb"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center">
                  <Instagram
                    className="w-4 h-4 text-platform-ig"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center">
                  <Music2
                    className="w-4 h-4 text-platform-tt"
                    strokeWidth={1.75}
                  />
                </span>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="font-display text-[18px] font-semibold text-ink">
                  {t('onboardingTitle')}
                </h2>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {t('onboardingBody')}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddSubscription}
                  className="h-10 px-5 rounded-lg bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2"
                >
                  <span>{t('addSourceButton')}</span>
                </button>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-5 enter">
              {filteredPosts.map((post) => (
                <PostCard
                  key={FacebookApiClient.getPostKey(post)}
                  post={post}
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-line rounded-2xl p-10 text-center space-y-3 shadow-[var(--shadow-small)]">
              <h3 className="text-[15px] font-medium text-ink">
                {searchQuery
                  ? t('noMatchTitle', { q: searchQuery })
                  : selectedPlatform !== 'all'
                  ? t('emptyPlatformTitle', { platform: selectedPlatformLabel })
                  : t('emptyTitle')}
              </h3>
              <p className="text-[13px] text-ink-2 max-w-md mx-auto">
                {searchQuery
                  ? t('noMatchBody')
                  : selectedPlatform !== 'all'
                  ? t('emptyPlatformBody', { platform: selectedPlatformLabel })
                  : t('emptyBody')}
              </p>
              {hasActiveFilters && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="h-9 px-4 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                  >
                    {t('clearFilters')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Refresh & Edit Refresh Config Controls ONLY */}
        <aside className="space-y-4 lg:sticky lg:top-22">
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-medium text-ink">
                {t('quickControlsTitle')}
              </h2>
              <span className="font-mono text-[11px] text-ink-3 tabular-nums">
                {t('subscribedSummary', {
                  n: formatNumber(subscriptions.length),
                })}
              </span>
            </div>

            <p className="text-[12px] text-ink-3 leading-relaxed">
              {t('syncNowDesc')}
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading || isRefreshing || !hasSubscriptions}
                className="w-full h-10 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isLoading || isRefreshing ? 'animate-spin' : ''
                  }`}
                  strokeWidth={1.5}
                />
                <span>{t('refreshButton')}</span>
              </button>

              <button
                type="button"
                onClick={onOpenRefreshConfig}
                className="w-full h-9 px-4 rounded-lg bg-raised hover:bg-line border border-line text-ink text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                <SlidersHorizontal
                  className="w-4 h-4 text-ink-3"
                  strokeWidth={1.5}
                />
                <span>{t('editRefreshConfigButton')}</span>
              </button>
            </div>

            {!hasSubscriptions && (
              <p className="text-[11px] text-ink-3 leading-relaxed pt-1">
                {t('noSubscriptionsHint')}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
