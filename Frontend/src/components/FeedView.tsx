import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
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
import { FacebookPost, SubscriptionItem } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import {
  DEFAULT_SUGGESTED_TAGS,
  doesPostMatchSubscription,
  filterPostsBySubscriptions,
  findMatchingSubscription,
  normalizeTag,
  normalizeTagList,
} from '../services/subscriptionUtils';
import { PostCard, detectPostPlatform, SocialPlatform } from './PostCard';
import { useI18n } from '../i18n/LanguageContext';
import { PlatformFilter } from '../i18n/strings';

interface FeedViewProps {
  posts: FacebookPost[];
  subscriptions: SubscriptionItem[];
  availableTags?: string[];
  isLoading: boolean;
  isRefreshing?: boolean;
  selectedPage: string;
  onPageChange: (page: string) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  onRefresh: () => void;
  onOpenAddSubscription: () => void;
  onOpenRefreshConfig: () => void;
  onCreateTag?: (newTag: string) => void;
  onToggleSubscriptionTag?: (subscriptionId: string, tag: string) => void;
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
  availableTags = [],
  isLoading,
  isRefreshing = false,
  selectedPage,
  onPageChange,
  onRefresh,
  onOpenAddSubscription,
  onOpenRefreshConfig,
  onCreateTag,
  onToggleSubscriptionTag,
  onImageClick,
  isSimulated,
}: FeedViewProps) {
  const { t, formatNumber } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [includeKeywordsInput, setIncludeKeywordsInput] = useState('');
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformFilter>('all');

  // "แสดงแท็ก" (Show Tags) expandable window state & hidden tags set
  const [isShowTagsOpen, setIsShowTagsOpen] = useState(false);
  const [hiddenTags, setHiddenTags] = useState<string[]>([]);
  const [globalNewTagInput, setGlobalNewTagInput] = useState('');
  const [localCreatedTags, setLocalCreatedTags] = useState<string[]>([]);

  // Per-source tag assignment window state (expanded when clicking a subscribed source)
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [sourceNewTagInput, setSourceNewTagInput] = useState('');

  // Strict Subscription-Only filtering on every post in the feed
  const subscribedPosts = useMemo(() => {
    return filterPostsBySubscriptions(
      posts,
      subscriptions,
      true,
      (p) => FacebookApiClient.getPostTimestamp(p)
    );
  }, [posts, subscriptions]);

  // Collect all known tags (FR-3)
  const allKnownTags = useMemo(() => {
    return normalizeTagList([
      ...DEFAULT_SUGGESTED_TAGS,
      ...availableTags,
      ...localCreatedTags,
      ...subscriptions.flatMap((s) => s.tags || []),
    ]);
  }, [availableTags, localCreatedTags, subscriptions]);

  const hiddenTagsLowerSet = useMemo(() => {
    return new Set(hiddenTags.map((tag) => tag.toLowerCase()));
  }, [hiddenTags]);

  const isTagShown = (tag: string) => {
    return !hiddenTagsLowerSet.has(tag.toLowerCase());
  };

  const handleToggleTagVisibility = (tag: string) => {
    const norm = normalizeTag(tag);
    if (!norm) return;
    const lower = norm.toLowerCase();
    setHiddenTags((prev) =>
      prev.some((tItem) => tItem.toLowerCase() === lower)
        ? prev.filter((tItem) => tItem.toLowerCase() !== lower)
        : [...prev, norm]
    );
  };

  const handleShowAllTags = () => {
    setHiddenTags([]);
  };

  const handleHideAllTags = () => {
    setHiddenTags([...allKnownTags]);
  };

  const handleCreateGlobalTag = () => {
    const norm = normalizeTag(globalNewTagInput);
    if (!norm) return;
    setLocalCreatedTags((prev) => normalizeTagList([...prev, norm]));
    onCreateTag?.(norm);
    // Ensure newly created tag is shown
    setHiddenTags((prev) =>
      prev.filter((tItem) => tItem.toLowerCase() !== norm.toLowerCase())
    );
    setGlobalNewTagInput('');
  };

  const handleCreateTagForSource = (sourceId: string) => {
    const norm = normalizeTag(sourceNewTagInput);
    if (!norm) return;
    setLocalCreatedTags((prev) => normalizeTagList([...prev, norm]));
    onCreateTag?.(norm);
    // Assign the newly created tag to this source if not already assigned
    const targetSub = subscriptions.find((s) => s.id === sourceId);
    const alreadyHas = (targetSub?.tags || []).some(
      (tItem) => tItem.toLowerCase() === norm.toLowerCase()
    );
    if (!alreadyHas) {
      onToggleSubscriptionTag?.(sourceId, norm);
    }
    setSourceNewTagInput('');
  };

  // Count posts per tag across subscribedPosts
  const tagPostCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allKnownTags.forEach((tag) => {
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
  }, [allKnownTags, subscribedPosts, subscriptions]);

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

  // Filter Followed Accounts by selectedPlatform
  const visibleAccounts: FollowedAccountItem[] = useMemo(() => {
    const filtered = allAccounts.filter((acc) => {
      if (selectedPlatform !== 'all' && acc.platform !== selectedPlatform) {
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
  }, [allAccounts, selectedPlatform, t]);

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

  const areAllTagsHidden =
    allKnownTags.length > 0 &&
    allKnownTags.every((tag) => hiddenTagsLowerSet.has(tag.toLowerCase()));

  // Filter subscribedPosts by selectedPage, selectedPlatform, Tag Show/Hide state (FR-3),
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

      // FR-3: Filter by Shown / Hidden tags
      if (hiddenTagsLowerSet.size > 0) {
        if (areAllTagsHidden) {
          return false;
        }
        const subTags = ownerSub?.tags || [];
        if (subTags.length > 0) {
          const hasAnyShownTag = subTags.some(
            (tItem) => !hiddenTagsLowerSet.has(tItem.toLowerCase())
          );
          if (!hasAnyShownTag) {
            return false;
          }
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

      // FR-4: Must Include keywords
      if (includeKeywords.length > 0) {
        const hasAllIncluded = includeKeywords.every((kw) =>
          searchableText.includes(kw)
        );
        if (!hasAllIncluded) return false;
      }

      // FR-4: Exclude keywords
      if (excludeKeywords.length > 0) {
        const hasAnyExcluded = excludeKeywords.some((kw) =>
          searchableText.includes(kw)
        );
        if (hasAnyExcluded) return false;
      }

      return true;
    });

    // Sort posts chronologically (newest first)
    const sorted = [...matching].sort((a, b) => {
      return (
        FacebookApiClient.getPostTimestamp(b) -
        FacebookApiClient.getPostTimestamp(a)
      );
    });

    return sorted;
  }, [
    subscribedPosts,
    subscriptions,
    selectedPage,
    allAccounts,
    selectedPlatform,
    hiddenTagsLowerSet,
    areAllTagsHidden,
    searchQuery,
    includeKeywords,
    excludeKeywords,
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
    hiddenTags.length > 0 ||
    selectedPlatform !== 'all' ||
    selectedPage !== 'all';

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setIncludeKeywordsInput('');
    setExcludeKeywordsInput('');
    setHiddenTags([]);
    setSelectedPlatform('all');
    onPageChange('all');
  };

  const shownTagsCount = allKnownTags.filter((tag) => isTagShown(tag)).length;

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
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_290px] gap-6 items-start">
        {/* LEFT COLUMN: Platform Filter, "แสดงแท็ก" (Show Tags) Window & Subscribed Accounts */}
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

          {/* FR-3: "แสดงแท็ก" (Show Tags) Button & Expandable Window */}
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)] space-y-3">
            <button
              type="button"
              onClick={() => setIsShowTagsOpen((prev) => !prev)}
              aria-expanded={isShowTagsOpen}
              className="w-full h-9 px-3 rounded-lg bg-raised hover:bg-line border border-line text-[13px] font-medium text-ink transition-colors flex items-center justify-between gap-2"
            >
              <span className="inline-flex items-center gap-2">
                <TagIcon
                  className="w-4 h-4 text-ink-2 shrink-0"
                  strokeWidth={1.5}
                />
                <span>{t('showTagsButton')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-ink-3 tabular-nums">
                  {formatNumber(shownTagsCount)}/{formatNumber(allKnownTags.length)}
                </span>
                {isShowTagsOpen ? (
                  <ChevronUp className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
                ) : (
                  <ChevronDown
                    className="w-4 h-4 text-ink-3"
                    strokeWidth={1.5}
                  />
                )}
              </span>
            </button>

            {isShowTagsOpen && (
              <div className="p-3 bg-raised/60 border border-line rounded-xl space-y-2.5">
                {/* 1. Top-most item: Create Tag input & button */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={t('tagInputPlaceholder')}
                    value={globalNewTagInput}
                    onChange={(e) => setGlobalNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateGlobalTag();
                      }
                    }}
                    className="flex-1 min-w-0 h-8 px-2.5 text-[12px] bg-card border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCreateGlobalTag}
                    className="h-8 px-2.5 bg-accent hover:bg-accent-hover text-white text-[12px] font-medium rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{t('createTagButton')}</span>
                  </button>
                </div>

                {/* 2. Show All / Hide All buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={handleShowAllTags}
                    disabled={hiddenTags.length === 0}
                    className="flex-1 h-7 px-2 rounded-md bg-card hover:bg-line border border-line text-[11px] font-medium text-ink disabled:opacity-40 transition-colors"
                  >
                    {t('showAllTags')}
                  </button>
                  <button
                    type="button"
                    onClick={handleHideAllTags}
                    disabled={areAllTagsHidden}
                    className="flex-1 h-7 px-2 rounded-md bg-card hover:bg-line border border-line text-[11px] font-medium text-ink disabled:opacity-40 transition-colors"
                  >
                    {t('hideAllTags')}
                  </button>
                </div>

                {/* 3. Existing Tags List (click to check/uncheck show/hide) */}
                <div className="space-y-1 pt-1 border-t border-line max-h-56 overflow-y-auto">
                  {allKnownTags.map((tag) => {
                    const shown = isTagShown(tag);
                    const count = tagPostCounts[tag.toLowerCase()] || 0;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTagVisibility(tag)}
                        aria-pressed={shown}
                        className={`w-full h-8 px-2.5 rounded-lg text-left text-[12px] transition-colors flex items-center justify-between gap-2 border ${
                          shown
                            ? 'bg-card text-ink border-line font-medium'
                            : 'bg-transparent text-ink-3 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-sm flex items-center justify-center border shrink-0 ${
                              shown
                                ? 'bg-accent border-accent text-white'
                                : 'bg-card border-line text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={2.25} />
                          </span>
                          <span className="font-mono truncate">{tag}</span>
                        </span>
                        <span className="font-mono text-[11px] text-ink-3 tabular-nums">
                          {formatNumber(count)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Followed / Subscribed Accounts Card (Click an account to expand its Tag Assignment Window) */}
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
                className="h-6 px-2 rounded-md bg-raised hover:bg-line border border-line text-[11px] font-medium text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" strokeWidth={1.75} />
                <span>{t('addSourceTooltip')}</span>
              </button>
            </div>

            {visibleAccounts.length > 0 ? (
              <div className="space-y-1" aria-label={t('sourcesTitle')}>
                <p className="px-2 pb-1 text-[11px] text-ink-3">
                  {t('clickSourceToManageTags')}
                </p>
                {visibleAccounts.map((src) => {
                  const isAllItem = src.id === 'all';
                  const isActive = isAllItem
                    ? selectedPage === 'all'
                    : selectedPage.toLowerCase() === src.id.toLowerCase() ||
                      selectedPage.toLowerCase() === src.handle.toLowerCase();
                  const isTagPanelExpanded =
                    !isAllItem && expandedSourceId === src.id;

                  return (
                    <div key={src.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllItem) {
                            onPageChange('all');
                            setExpandedSourceId(null);
                          } else {
                            setExpandedSourceId((prev) =>
                              prev === src.id ? null : src.id
                            );
                            setSourceNewTagInput('');
                          }
                        }}
                        aria-expanded={!isAllItem ? isTagPanelExpanded : undefined}
                        className={`w-full py-2 px-2.5 rounded-lg text-left text-[13px] transition-colors flex flex-col gap-1 ${
                          isActive || isTagPanelExpanded
                            ? 'bg-raised text-ink font-medium'
                            : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2.5 min-w-0">
                            {renderPlatformLogo(src.platform)}
                            <span className="truncate">{src.label}</span>
                          </span>
                          {!isAllItem && (
                            <span className="inline-flex items-center gap-1 text-ink-3 shrink-0">
                              <TagIcon
                                className="w-3 h-3"
                                strokeWidth={1.5}
                              />
                              {isTagPanelExpanded ? (
                                <ChevronUp
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.5}
                                />
                              ) : (
                                <ChevronDown
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.5}
                                />
                              )}
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

                      {/* Expanded Tag Assignment Window for this specific source (NO Show/Hide All button) */}
                      {isTagPanelExpanded && (
                        <div className="ml-2 p-3 bg-raised/70 border border-line rounded-xl space-y-2.5">
                          <div className="text-[11px] font-medium text-ink-2 truncate">
                            {t('sourceTagsPanelTitle', { source: src.label })}
                          </div>

                          {/* 1. Top-most item: Create Tag input & button */}
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder={t('tagInputPlaceholder')}
                              value={sourceNewTagInput}
                              onChange={(e) =>
                                setSourceNewTagInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateTagForSource(src.id);
                                }
                              }}
                              className="flex-1 min-w-0 h-8 px-2.5 text-[12px] bg-card border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleCreateTagForSource(src.id)}
                              className="h-8 px-2.5 bg-accent hover:bg-accent-hover text-white text-[12px] font-medium rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus
                                className="w-3.5 h-3.5"
                                strokeWidth={1.75}
                              />
                              <span>{t('createTagButton')}</span>
                            </button>
                          </div>

                          {/* 2. Existing Tags List (click to assign / un-assign to this source; NO Show/Hide All button) */}
                          <div className="space-y-1 pt-1 border-t border-line max-h-48 overflow-y-auto">
                            {allKnownTags.map((tag) => {
                              const assigned = src.tags.some(
                                (tItem) =>
                                  tItem.toLowerCase() === tag.toLowerCase()
                              );
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    onToggleSubscriptionTag?.(src.id, tag)
                                  }
                                  aria-pressed={assigned}
                                  className={`w-full h-8 px-2.5 rounded-lg text-left text-[12px] transition-colors flex items-center justify-between gap-2 border ${
                                    assigned
                                      ? 'bg-card text-ink border-line font-medium'
                                      : 'bg-transparent text-ink-3 border-transparent hover:bg-card/60 hover:text-ink'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-4 h-4 rounded-sm flex items-center justify-center border shrink-0 ${
                                        assigned
                                          ? 'bg-accent border-accent text-white'
                                          : 'bg-card border-line text-transparent'
                                      }`}
                                    >
                                      <Check
                                        className="w-3 h-3"
                                        strokeWidth={2.25}
                                      />
                                    </span>
                                    <span className="font-mono truncate">
                                      {tag}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
          {/* Search & Keyword Filter Controls Card */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="min-w-0">
                <h1 className="font-display text-[20px] leading-snug font-medium text-ink">
                  {t('feedTitle')}
                </h1>
                <p className="text-[13px] text-ink-2 mt-1">{subtitle}</p>
              </div>

              <span className="text-[12px] text-ink-3 font-mono tabular-nums shrink-0">
                {t('showingCount', {
                  shown: formatNumber(filteredPosts.length),
                  total: formatNumber(subscribedPosts.length),
                })}
              </span>
            </div>

            {/* Mobile/Tablet Platform Switcher */}
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
            </div>

            {/* Search & Keyword Include/Exclude Controls */}
            <div className="space-y-3">
              <div className="relative">
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

              {/* FR-4 Keyword Include & Exclude Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)] space-y-2.5">
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
              className="w-full h-10 px-4 rounded-lg bg-raised hover:bg-line border border-line text-ink text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <SlidersHorizontal
                className="w-4 h-4 text-ink-3"
                strokeWidth={1.5}
              />
              <span>{t('editRefreshConfigButton')}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
