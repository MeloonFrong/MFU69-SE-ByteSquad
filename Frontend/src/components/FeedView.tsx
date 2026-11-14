import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Facebook,
  Instagram,
  Layers,
  MessageSquare,
  Music2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ThumbsUp,
  X,
} from 'lucide-react';
import { FacebookPost } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import { PostCard, detectPostPlatform, SocialPlatform } from './PostCard';
import { useI18n } from '../i18n/LanguageContext';
import { PlatformFilter } from '../i18n/strings';

interface FeedViewProps {
  posts: FacebookPost[];
  totalScanned: number;
  isLoading: boolean;
  selectedPage: string;
  onPageChange: (page: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  onOpenScraper: () => void;
  onImageClick: (url: string) => void;
  isSimulated: boolean;
  isDemoMode?: boolean;
  onClearData?: () => void;
  activeDatasetId?: string | null;
  onClearDatasetFilter?: () => void;
}

interface FollowedAccountItem {
  id: string;
  label: string;
  shortLabel: string;
  platform: SocialPlatform | 'all';
}

export function FeedView({
  posts,
  totalScanned,
  isLoading,
  selectedPage,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  onOpenScraper,
  onImageClick,
  isSimulated,
  isDemoMode = false,
  onClearData,
  activeDatasetId,
  onClearDatasetFilter,
}: FeedViewProps) {
  const { t, formatNumber } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformFilter>('all');

  // Count posts per platform before platform filtering
  const platformCounts = posts.reduce(
    (acc, post) => {
      const p = detectPostPlatform(post);
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    { facebook: 0, instagram: 0, tiktok: 0 }
  );

  // Build Followed Accounts list STRICTLY from active posts (0 accounts when posts is empty)
  const allAccounts: FollowedAccountItem[] = useMemo(() => {
    const accounts: FollowedAccountItem[] = [];
    const seenIds = new Set<string>();

    posts.forEach((p) => {
      const handle = (p.pageName || p.user?.id || '').trim();
      if (!handle) return;
      const lower = handle.toLowerCase();
      if (seenIds.has(lower)) return;
      seenIds.add(lower);

      const plat = detectPostPlatform(p);
      let label = p.user?.name || handle;
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

      accounts.push({
        id: handle,
        label,
        shortLabel,
        platform: plat,
      });
    });

    return accounts;
  }, [posts, t]);

  // Filter Followed Accounts by selectedPlatform
  const visibleAccounts: FollowedAccountItem[] = useMemo(() => {
    const filtered =
      selectedPlatform === 'all'
        ? allAccounts
        : allAccounts.filter((acc) => acc.platform === selectedPlatform);

    if (filtered.length === 0) {
      return [];
    }

    return [
      {
        id: 'all',
        label: t('sourceAll'),
        shortLabel: t('sourceAll'),
        platform: 'all',
      },
      ...filtered,
    ];
  }, [allAccounts, selectedPlatform, t]);

  const handlePlatformSelect = (plat: PlatformFilter) => {
    setSelectedPlatform(plat);
    if (plat !== 'all' && selectedPage !== 'all') {
      const currentAcc = allAccounts.find(
        (a) => a.id.toLowerCase() === selectedPage.toLowerCase()
      );
      if (currentAcc && currentAcc.platform !== plat) {
        onPageChange('all');
      }
    }
  };

  // Filter posts by selectedPage, selectedPlatform, and searchQuery
  const filteredPosts = posts.filter((post) => {
    if (selectedPage !== 'all') {
      const qPage = selectedPage.toLowerCase();
      const postPage = (post.pageName || '').toLowerCase();
      const postUserId = (post.user?.id || '').toLowerCase();
      const postUserName = (post.user?.name || '').toLowerCase();
      if (
        !postPage.includes(qPage) &&
        !postUserId.includes(qPage) &&
        !postUserName.includes(qPage)
      ) {
        return false;
      }
    }
    if (selectedPlatform !== 'all') {
      if (detectPostPlatform(post) !== selectedPlatform) return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const caption = (
      post.caption ||
      post.text ||
      post.message ||
      ''
    ).toLowerCase();
    const author = (post.user?.name || post.pageName || '').toLowerCase();
    return caption.includes(query) || author.includes(query);
  });

  const duplicatesFiltered = Math.max(0, totalScanned - posts.length);

  // Engagement totals for visible posts
  const engagementTotals = filteredPosts.reduce(
    (acc, post) => {
      acc.likes += post.likesCount ?? 0;
      acc.comments += post.commentsCount ?? 0;
      acc.shares += post.sharesCount ?? 0;
      return acc;
    },
    { likes: 0, comments: 0, shares: 0 }
  );

  const selectedAccountObj = allAccounts.find(
    (a) => a.id.toLowerCase() === selectedPage.toLowerCase()
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
    dotClass: string | null;
    iconColorClass: string;
    Icon: typeof Layers;
  }> = [
    {
      id: 'all',
      label: t('platformAll'),
      count: posts.length,
      dotClass: null,
      iconColorClass: 'text-ink-3',
      Icon: Layers,
    },
    {
      id: 'facebook',
      label: t('platformFacebook'),
      count: platformCounts.facebook,
      dotClass: 'bg-platform-fb',
      iconColorClass: 'text-platform-fb',
      Icon: Facebook,
    },
    {
      id: 'instagram',
      label: t('platformInstagram'),
      count: platformCounts.instagram,
      dotClass: 'bg-platform-ig',
      iconColorClass: 'text-platform-ig',
      Icon: Instagram,
    },
    {
      id: 'tiktok',
      label: t('platformTiktok'),
      count: platformCounts.tiktok,
      dotClass: 'bg-platform-tt',
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

  const hasAnyPosts = posts.length > 0;

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

      {/* Demo mode banner when sample data was manually loaded from Developer Tools */}
      {isDemoMode && hasAnyPosts && (
        <div className="mb-6 bg-card border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-[13px]">
          <span className="text-ink-2">
            {t('demoModeBanner', { n: formatNumber(posts.length) })}
          </span>
          {onClearData && (
            <button
              type="button"
              onClick={onClearData}
              className="text-accent hover:text-accent-hover font-medium transition-colors shrink-0"
            >
              {t('toolClearData')}
            </button>
          )}
        </div>
      )}

      {/* Dataset items active banner */}
      {activeDatasetId && (
        <div className="mb-6 bg-card border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-[13px]">
          <span className="text-ink-2">
            {t('datasetBanner', { n: posts.length, id: activeDatasetId })}
          </span>
          {onClearDatasetFilter && (
            <button
              type="button"
              onClick={onClearDatasetFilter}
              className="text-accent hover:text-accent-hover font-medium transition-colors"
            >
              {t('backToLatest')}
            </button>
          )}
        </div>
      )}

      {/* 3-Column Social Feed Hub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-6 items-start">
        {/* LEFT COLUMN: Platform Filter & Followed Accounts */}
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

          {/* Followed Accounts Card */}
          <div className="bg-card border border-line rounded-2xl p-4 shadow-[var(--shadow-small)]">
            <div className="px-2 pb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-ink-3 truncate">
                {t('sourcesTitle')}
              </span>
              <button
                type="button"
                onClick={onOpenScraper}
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
                      : selectedPage.toLowerCase() === src.id.toLowerCase();
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => onPageChange(src.id)}
                      className={`w-full h-9 px-2.5 rounded-lg text-left text-[13px] transition-colors flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-raised text-ink font-medium'
                          : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                      }`}
                    >
                      {renderPlatformLogo(src.platform)}
                      <span className="truncate">{src.label}</span>
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
                  onClick={onOpenScraper}
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
          {/* Feed Header & Search Controls Card */}
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
                  total: formatNumber(totalScanned),
                })}
              </div>
            </div>

            {/* Mobile/Tablet Platform & Account Switchers */}
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

              {visibleAccounts.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-raised border border-line rounded-xl overflow-x-auto">
                  {visibleAccounts.map((src) => {
                    const isActive =
                      src.id === 'all'
                        ? selectedPage === 'all'
                        : selectedPage.toLowerCase() === src.id.toLowerCase();
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

            {/* Search & Display Limit Bar */}
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
                  className="w-full h-10 pl-10 pr-9 text-[14px] bg-raised border border-line rounded-lg text-ink placeholder:text-ink-3 focus:bg-card focus:outline-hidden focus:border-accent transition-colors"
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
                <label
                  htmlFor="feed-limit-select"
                  className="text-[13px] text-ink-3 whitespace-nowrap"
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
          ) : !hasAnyPosts ? (
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

              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onOpenScraper}
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
              <div className="pt-2 flex items-center justify-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="h-9 px-4 text-[13px] font-medium text-ink bg-raised hover:bg-line rounded-lg transition-colors"
                  >
                    {t('clearSearch')}
                  </button>
                )}
                {selectedPlatform !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect('all')}
                    className="h-9 px-4 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                  >
                    {t('showAllPlatforms')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Quick Controls, Engagement Pulse Chart & Feed Insights */}
        <aside className="space-y-4 lg:sticky lg:top-22">
          {/* Quick Controls Card */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-3">
            <h2 className="text-[13px] font-medium text-ink">
              {t('quickControlsTitle')}
            </h2>
            <p className="text-[12px] text-ink-3 leading-relaxed">
              {t('syncNowDesc')}
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenScraper}
                className="w-full h-10 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" strokeWidth={1.5} />
                <span>{t('syncNowButton')}</span>
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="w-full h-9 px-4 rounded-lg bg-raised hover:bg-line border border-line text-ink text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 text-ink-3 ${
                    isLoading ? 'animate-spin' : ''
                  }`}
                  strokeWidth={1.5}
                />
                <span>{t('refresh')}</span>
              </button>
            </div>
          </div>

          {/* Engagement Pulse Multi-Series SVG Chart Card */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-medium text-ink">
                  {t('pulseTitle')}
                </h2>
                <p className="text-[11px] text-ink-3 mt-0.5">
                  {t('pulseSubtitle')}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <svg
                viewBox="0 0 260 110"
                className="w-full h-28 overflow-visible"
                role="img"
                aria-label={t('pulseTitle')}
              >
                <defs>
                  <linearGradient id="fbFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-platform-fb)"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-platform-fb)"
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                  <linearGradient id="igFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-platform-ig)"
                      stopOpacity="0.16"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-platform-ig)"
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal dashed grid lines */}
                <line
                  x1="0"
                  y1="20"
                  x2="260"
                  y2="20"
                  stroke="var(--color-line)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="52"
                  x2="260"
                  y2="52"
                  stroke="var(--color-line)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="84"
                  x2="260"
                  y2="84"
                  stroke="var(--color-line)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />

                {hasAnyPosts ? (
                  <>
                    {/* Instagram Series Area + Line */}
                    <path
                      d="M0,76 C40,68 75,38 115,44 C155,50 190,22 230,18 L260,14 L260,92 L0,92 Z"
                      fill="url(#igFill)"
                    />
                    <path
                      d="M0,76 C40,68 75,38 115,44 C155,50 190,22 230,18 L260,14"
                      fill="none"
                      stroke="var(--color-platform-ig)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />

                    {/* TikTok Series Line */}
                    <path
                      d="M0,82 C45,74 80,62 120,34 C160,18 200,32 235,24 L260,20"
                      fill="none"
                      stroke="var(--color-platform-tt)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />

                    {/* Facebook Series Area + Line */}
                    <path
                      d="M0,68 C40,62 85,58 130,50 C175,42 210,48 260,38 L260,92 L0,92 Z"
                      fill="url(#fbFill)"
                    />
                    <path
                      d="M0,68 C40,62 85,58 130,50 C175,42 210,48 260,38"
                      fill="none"
                      stroke="var(--color-platform-fb)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />

                    {/* Endpoint markers */}
                    <circle
                      cx="260"
                      cy="14"
                      r="3"
                      fill="var(--color-platform-ig)"
                    />
                    <circle
                      cx="260"
                      cy="20"
                      r="3"
                      fill="var(--color-platform-tt)"
                    />
                    <circle
                      cx="260"
                      cy="38"
                      r="3"
                      fill="var(--color-platform-fb)"
                    />
                  </>
                ) : (
                  <>
                    {/* Flat zero baseline when feed is empty */}
                    <line
                      x1="0"
                      y1="84"
                      x2="260"
                      y2="84"
                      stroke="var(--color-ink-3)"
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                    />
                    <circle
                      cx="260"
                      cy="84"
                      r="2.5"
                      fill="var(--color-ink-3)"
                    />
                  </>
                )}

                {/* Axis labels */}
                <text
                  x="0"
                  y="106"
                  fill="var(--color-ink-3)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Sep
                </text>
                <text
                  x="115"
                  y="106"
                  fill="var(--color-ink-3)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Oct
                </text>
                <text
                  x="235"
                  y="106"
                  fill="var(--color-ink-3)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Nov
                </text>
              </svg>

              {/* Inline Legend */}
              <div className="flex items-center justify-between pt-2 border-t border-line text-[11px] font-mono text-ink-2 tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-platform-fb" />
                  <span>FB ({platformCounts.facebook})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-platform-ig" />
                  <span>IG ({platformCounts.instagram})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-platform-tt" />
                  <span>TT ({platformCounts.tiktok})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Feed Insights Card */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-[var(--shadow-small)] space-y-4">
            <h2 className="text-[13px] font-medium text-ink">
              {t('insightsTitle')}
            </h2>

            {/* Breakdown by platform */}
            <div className="space-y-2.5">
              <div className="text-[12px] text-ink-3">
                {t('insightsByPlatform')}
              </div>

              {platforms
                .filter((p) => p.id !== 'all')
                .map((plat) => {
                  const Icon = plat.Icon;
                  const pct =
                    posts.length > 0
                      ? Math.round((plat.count / posts.length) * 100)
                      : 0;
                  return (
                    <div key={plat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-ink-2">
                          <Icon
                            className={`w-3.5 h-3.5 ${plat.iconColorClass}`}
                            strokeWidth={1.75}
                          />
                          <span>{plat.label}</span>
                        </span>
                        <span className="font-mono text-[12px] text-ink tabular-nums">
                          {formatNumber(plat.count)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            plat.dotClass || 'bg-accent'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Deduplication & scan metrics */}
            <div className="pt-3 border-t border-line space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-ink-2">
                <span>{t('insightsUniqueShown')}</span>
                <span className="font-mono text-ink font-medium tabular-nums">
                  {formatNumber(filteredPosts.length)}
                </span>
              </div>
              <div className="flex items-center justify-between text-ink-2">
                <span>{t('insightsTotalScanned')}</span>
                <span className="font-mono text-ink tabular-nums">
                  {formatNumber(totalScanned)}
                </span>
              </div>
              <div className="flex items-center justify-between text-ink-2">
                <span>{t('insightsDuplicates')}</span>
                <span className="font-mono text-ink tabular-nums">
                  {formatNumber(duplicatesFiltered)}
                </span>
              </div>
            </div>

            {/* Engagement totals */}
            <div className="pt-3 border-t border-line space-y-2">
              <div className="text-[12px] text-ink-3">
                {t('insightsEngagement')}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-raised border border-line text-center">
                  <ThumbsUp
                    className="w-3.5 h-3.5 text-ink-3 mx-auto mb-1"
                    strokeWidth={1.5}
                  />
                  <div className="font-mono text-[13px] font-medium text-ink tabular-nums">
                    {formatNumber(engagementTotals.likes)}
                  </div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {t('likes')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-raised border border-line text-center">
                  <MessageSquare
                    className="w-3.5 h-3.5 text-ink-3 mx-auto mb-1"
                    strokeWidth={1.5}
                  />
                  <div className="font-mono text-[13px] font-medium text-ink tabular-nums">
                    {formatNumber(engagementTotals.comments)}
                  </div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {t('comments')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-raised border border-line text-center">
                  <Share2
                    className="w-3.5 h-3.5 text-ink-3 mx-auto mb-1"
                    strokeWidth={1.5}
                  />
                  <div className="font-mono text-[13px] font-medium text-ink tabular-nums">
                    {formatNumber(engagementTotals.shares)}
                  </div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {t('shares')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
