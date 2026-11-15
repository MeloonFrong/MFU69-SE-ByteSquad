import { useState, useEffect, useCallback, useMemo } from 'react';
import { FacebookPost, SubscriptionItem } from './types/facebook';
import { FacebookApiClient } from './services/api';
import { DEMO_MOCK_POSTS } from './services/mockData';
import {
  DEFAULT_POSTS_PER_PAGE,
  DEFAULT_SUGGESTED_TAGS,
  DEFAULT_VIEW_POSTS_PER_PAGE,
  filterPostsBySubscriptions,
  normalizeTag,
  normalizeTagList,
  parseSubscriptionInput,
} from './services/subscriptionUtils';
import { Navbar, ActiveSection } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { ScraperModal } from './components/ScraperModal';
import { RefreshConfigModal } from './components/RefreshConfigModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { LanguageProvider, useI18n } from './i18n/LanguageContext';

function getInitialPrototypeSubscriptions(): SubscriptionItem[] {
  const isStandalonePrototype =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { __INFOCENTER_STANDALONE_PROTOTYPE__?: boolean })
        .__INFOCENTER_STANDALONE_PROTOTYPE__
    );

  if (!isStandalonePrototype) {
    return [];
  }

  const seeds: Array<{ url: string; tags: string[]; limit: number }> = [
    {
      url: 'https://www.facebook.com/MFU2Connect',
      tags: ['MFU', 'Academic'],
      limit: 2,
    },
    {
      url: 'https://www.instagram.com/humansofny',
      tags: ['News', 'Creator'],
      limit: 2,
    },
    {
      url: 'https://www.tiktok.com/@khaby.lame',
      tags: ['Creator'],
      limit: 2,
    },
  ];

  return seeds
    .map((seed) => {
      return parseSubscriptionInput(seed.url, undefined, seed.limit, seed.tags);
    })
    .filter((item): item is SubscriptionItem => item !== null);
}

function AppShell() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveSection>('feed');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() =>
    getInitialPrototypeSubscriptions()
  );
  const [posts, setPosts] = useState<FacebookPost[]>(() => {
    const initialSubs = getInitialPrototypeSubscriptions();
    if (initialSubs.length === 0) return [];
    return filterPostsBySubscriptions(
      DEMO_MOCK_POSTS,
      initialSubs,
      true,
      (p) => FacebookApiClient.getPostTimestamp(p)
    );
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');
  const [limit, setLimit] = useState(20);
  const [isSimulated, setIsSimulated] = useState(false);

  // Modals
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshConfigOpen, setIsRefreshConfigOpen] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const existingTags = useMemo(() => {
    return normalizeTagList([
      ...DEFAULT_SUGGESTED_TAGS,
      ...customTags,
      ...subscriptions.flatMap((sub) => sub.tags || []),
    ]);
  }, [customTags, subscriptions]);

  const handleCreateTag = useCallback((rawTag: string) => {
    const norm = normalizeTag(rawTag);
    if (!norm) return;
    setCustomTags((prev) => normalizeTagList([...prev, norm]));
  }, []);

  const handleToggleSubscriptionTag = useCallback(
    (subscriptionId: string, rawTag: string) => {
      const norm = normalizeTag(rawTag);
      if (!norm) return;
      setCustomTags((prev) => normalizeTagList([...prev, norm]));
      setSubscriptions((prev) =>
        prev.map((sub) => {
          if (sub.id !== subscriptionId) return sub;
          const current = sub.tags || [];
          const hasTag = current.some(
            (tItem) => tItem.toLowerCase() === norm.toLowerCase()
          );
          return {
            ...sub,
            tags: hasTag
              ? current.filter(
                  (tItem) => tItem.toLowerCase() !== norm.toLowerCase()
                )
              : normalizeTagList([...current, norm]),
          };
        })
      );
    },
    []
  );

  const checkStatus = useCallback(async () => {
    try {
      const res = await FacebookApiClient.checkConnection();
      setIsSimulated(!res.ok);
      return res.ok;
    } catch {
      setIsSimulated(true);
      return false;
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Trigger Scraper (default 1) & Storage Reader (default 10) strictly for subscribed accounts
  const handleRefresh = useCallback(
    async (subsOverride?: SubscriptionItem[]) => {
      const targetSubs = subsOverride ?? subscriptions;
      setIsRefreshing(true);
      try {
        const ok = await checkStatus();
        if (targetSubs.length === 0) {
          setPosts([]);
          setIsSimulated(!ok);
          return;
        }

        setIsLoading(true);
        const result = await FacebookApiClient.scrapeSubscribedAccounts(
          targetSubs,
          (storagePosts, storageSimulated) => {
            const initialFiltered = filterPostsBySubscriptions(
              storagePosts,
              targetSubs,
              true,
              (p) => FacebookApiClient.getPostTimestamp(p)
            );
            setPosts(initialFiltered);
            setIsLoading(false);
            if (!storageSimulated) {
              setIsSimulated(false);
            }
          }
        );
        const strictlyFiltered = filterPostsBySubscriptions(
          result.posts,
          targetSubs,
          true,
          (p) => FacebookApiClient.getPostTimestamp(p)
        );
        setPosts(strictlyFiltered);
        setIsSimulated(result.isSimulated && !ok);
      } catch (err) {
        console.error('Failed to refresh subscribed accounts:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [subscriptions, checkStatus]
  );

  // Add new page(s)/account(s) to Subscription list (default scrape 1, view 10)
  const handleAddSubscriptions = async (newItems: SubscriptionItem[]) => {
    if (!newItems || newItems.length === 0) return;

    const mergedMap = new Map<string, SubscriptionItem>();
    subscriptions.forEach((sub) => mergedMap.set(sub.id, sub));
    newItems.forEach((item) => {
      const existing = mergedMap.get(item.id);
      if (!existing) {
        mergedMap.set(item.id, {
          ...item,
          postsLimit: item.postsLimit || DEFAULT_POSTS_PER_PAGE,
          viewLimit: item.viewLimit || DEFAULT_VIEW_POSTS_PER_PAGE,
          tags: normalizeTagList(item.tags),
        });
      } else {
        mergedMap.set(item.id, {
          ...existing,
          viewLimit: existing.viewLimit || DEFAULT_VIEW_POSTS_PER_PAGE,
          tags: normalizeTagList([
            ...(existing.tags || []),
            ...(item.tags || []),
          ]),
        });
      }
    });

    const nextSubscriptions = Array.from(mergedMap.values());
    setSubscriptions(nextSubscriptions);
    await handleRefresh(nextSubscriptions);
  };

  // Save updated per-page limits or unsubscribed accounts from Edit Refresh Config
  const handleSaveRefreshConfig = (
    updatedSubscriptions: SubscriptionItem[],
    triggerRefresh: boolean = false
  ) => {
    setSubscriptions(updatedSubscriptions);

    // Immediately enforce strict subscription filter on existing posts
    setPosts((prev) =>
      filterPostsBySubscriptions(
        prev,
        updatedSubscriptions,
        true,
        (p) => FacebookApiClient.getPostTimestamp(p)
      )
    );

    if (
      selectedPage !== 'all' &&
      !updatedSubscriptions.some(
        (s) =>
          s.id.toLowerCase() === selectedPage.toLowerCase() ||
          s.handle.toLowerCase() === selectedPage.toLowerCase()
      )
    ) {
      setSelectedPage('all');
    }

    if (triggerRefresh) {
      handleRefresh(updatedSubscriptions);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col text-ink">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        <FeedView
          posts={posts}
          subscriptions={subscriptions}
          availableTags={existingTags}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          selectedPage={selectedPage}
          onPageChange={setSelectedPage}
          limit={limit}
          onLimitChange={setLimit}
          onRefresh={() => handleRefresh()}
          onOpenAddSubscription={() => setIsAddSourceOpen(true)}
          onOpenRefreshConfig={() => setIsRefreshConfigOpen(true)}
          onCreateTag={handleCreateTag}
          onToggleSubscriptionTag={handleToggleSubscriptionTag}
          onImageClick={(url) => setGalleryImage(url)}
          isSimulated={isSimulated}
        />
      </main>

      <footer className="border-t border-line bg-card py-5 mt-12 text-[12px] text-ink-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink">
              {t('appName')}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t('appTagline')}</span>
          </div>
          <div>{t('footerNote')}</div>
        </div>
      </footer>

      <ScraperModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onAddSubscriptions={handleAddSubscriptions}
        existingTags={existingTags}
        onCreateTag={handleCreateTag}
      />

      <RefreshConfigModal
        isOpen={isRefreshConfigOpen}
        subscriptions={subscriptions}
        onClose={() => setIsRefreshConfigOpen(false)}
        onSaveConfig={handleSaveRefreshConfig}
        onOpenAddSubscription={() => setIsAddSourceOpen(true)}
      />

      <MediaGalleryModal
        imageUrl={galleryImage}
        onClose={() => setGalleryImage(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
