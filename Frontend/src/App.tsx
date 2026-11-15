import { useState, useEffect, useCallback } from 'react';
import { FacebookPost, SubscriptionItem } from './types/facebook';
import { FacebookApiClient } from './services/api';
import { filterPostsBySubscriptions } from './services/subscriptionUtils';
import { Navbar, ActiveSection } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { ScraperModal } from './components/ScraperModal';
import { RefreshConfigModal } from './components/RefreshConfigModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { LanguageProvider, useI18n } from './i18n/LanguageContext';

function AppShell() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveSection>('feed');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');
  const [limit, setLimit] = useState(20);
  const [isSimulated, setIsSimulated] = useState(false);

  // Modals
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshConfigOpen, setIsRefreshConfigOpen] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

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

  // Trigger Scraper & Storage sync strictly for subscribed accounts only
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
          targetSubs
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

  // Add new page(s)/account(s) to Subscription list (default 1 post per page)
  const handleAddSubscriptions = async (newItems: SubscriptionItem[]) => {
    if (!newItems || newItems.length === 0) return;

    const mergedMap = new Map<string, SubscriptionItem>();
    subscriptions.forEach((sub) => mergedMap.set(sub.id, sub));
    newItems.forEach((item) => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, {
          ...item,
          postsLimit: item.postsLimit || 1,
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
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          selectedPage={selectedPage}
          onPageChange={setSelectedPage}
          limit={limit}
          onLimitChange={setLimit}
          onRefresh={() => handleRefresh()}
          onOpenAddSubscription={() => setIsAddSourceOpen(true)}
          onOpenRefreshConfig={() => setIsRefreshConfigOpen(true)}
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
