import { useState, useEffect, useCallback } from 'react';
import { FacebookPost } from './types/facebook';
import { FacebookApiClient } from './services/api';
import { DEMO_MOCK_POSTS } from './services/mockData';
import { Navbar, ActiveSection } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { ScraperModal } from './components/ScraperModal';
import { DatasetViewer } from './components/DatasetViewer';
import { ApiInspectorModal } from './components/ApiInspectorModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { LanguageProvider, useI18n } from './i18n/LanguageContext';

function AppShell() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveSection>('feed');
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');
  const [limit, setLimit] = useState(20);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  // Modals
  const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  const loadPosts = useCallback(
    async (pageToLoad: string = selectedPage, limitToLoad: number = limit) => {
      setIsLoading(true);
      try {
        const result = await FacebookApiClient.getRecentPosts(
          pageToLoad,
          limitToLoad
        );
        setIsSimulated(result.isSimulated);
        if (!result.isSimulated) {
          setIsConnected(true);
          setPosts(result.data.posts);
          setTotalScanned(result.data.totalScanned);
          setIsDemoMode(false);
          setActiveDatasetId(null);
        } else {
          // Offline / Simulated: only populate if user scraped sources in this session; otherwise keep Clean Start (0 posts)
          setPosts(result.data.posts);
          setTotalScanned(result.data.totalScanned);
        }
        return result;
      } catch (err: any) {
        console.error('Failed to load posts', err);
        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPage, limit]
  );

  const checkStatus = useCallback(async () => {
    try {
      const res = await FacebookApiClient.checkConnection();
      setIsConnected(res.ok);
      return res.ok;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  const syncConnectionAndFeed = useCallback(async () => {
    setIsRefreshing(true);
    const [ok, postRes] = await Promise.all([
      checkStatus(),
      loadPosts(selectedPage, limit),
    ]);
    if (ok || (postRes && !postRes.isSimulated)) {
      setIsConnected(true);
      setIsSimulated(false);
    }
  }, [checkStatus, loadPosts, selectedPage, limit]);

  useEffect(() => {
    checkStatus();
    loadPosts('all', 20);
  }, [checkStatus, loadPosts]);

  const handleRefresh = () => {
    if (isDemoMode) {
      const sorted = [...FacebookApiClient.deduplicatePosts(DEMO_MOCK_POSTS)].sort(
        (a, b) =>
          FacebookApiClient.getPostTimestamp(b) -
          FacebookApiClient.getPostTimestamp(a)
      );
      setPosts(sorted.slice(0, limit));
      setTotalScanned(DEMO_MOCK_POSTS.length);
      return;
    }
    syncConnectionAndFeed();
  };

  const handlePageChange = (newPage: string) => {
    setSelectedPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    if (isDemoMode) {
      const sorted = [...FacebookApiClient.deduplicatePosts(DEMO_MOCK_POSTS)].sort(
        (a, b) =>
          FacebookApiClient.getPostTimestamp(b) -
          FacebookApiClient.getPostTimestamp(a)
      );
      setPosts(sorted.slice(0, newLimit));
    }
  };

  const handleScrapeComplete = (_count: number, newPosts?: FacebookPost[]) => {
    if (newPosts && newPosts.length > 0) {
      setPosts((prev) => {
        const merged = FacebookApiClient.deduplicatePosts([
          ...newPosts,
          ...prev,
        ]);
        return merged.sort(
          (a, b) =>
            FacebookApiClient.getPostTimestamp(b) -
            FacebookApiClient.getPostTimestamp(a)
        );
      });
      setTotalScanned((prev) => prev + newPosts.length);
    } else {
      syncConnectionAndFeed();
    }
  };

  // Requirement 3: Manual Demo Mode from Developer Tools menu
  const handleLoadDemoData = () => {
    const uniqueDemo = FacebookApiClient.deduplicatePosts(DEMO_MOCK_POSTS);
    const sorted = [...uniqueDemo].sort(
      (a, b) =>
        FacebookApiClient.getPostTimestamp(b) -
        FacebookApiClient.getPostTimestamp(a)
    );
    setPosts(sorted.slice(0, limit));
    setTotalScanned(DEMO_MOCK_POSTS.length);
    setSelectedPage('all');
    setIsDemoMode(true);
    setActiveDatasetId(null);
    setActiveTab('feed');
  };

  // Requirement 3: Clear All Data back to Clean Start (0 posts, 0 accounts)
  const handleClearData = () => {
    setPosts([]);
    setTotalScanned(0);
    setSelectedPage('all');
    setIsDemoMode(false);
    setActiveDatasetId(null);
    setActiveTab('feed');
  };

  const handleLoadDatasetItemsToFeed = (items: any[], datasetId?: string) => {
    const normalized = items.map((item) => FacebookApiClient.normalizePost(item));
    const unique = FacebookApiClient.deduplicatePosts(normalized);
    setPosts(unique);
    setTotalScanned(items.length);
    setIsDemoMode(false);
    setActiveDatasetId(datasetId || 'dataset');
    setActiveTab('feed');
  };

  return (
    <div className="min-h-screen bg-page flex flex-col text-ink">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        isSimulated={isSimulated}
        onOpenScraper={() => setIsScraperModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshFeed={handleRefresh}
        onLoadDemoData={handleLoadDemoData}
        onClearData={handleClearData}
        hasPosts={posts.length > 0}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1">
        {activeTab === 'feed' && (
          <FeedView
            posts={posts}
            totalScanned={totalScanned}
            isLoading={isLoading}
            selectedPage={selectedPage}
            onPageChange={handlePageChange}
            limit={limit}
            onLimitChange={handleLimitChange}
            onRefresh={handleRefresh}
            onOpenScraper={() => setIsScraperModalOpen(true)}
            onImageClick={(url) => setGalleryImage(url)}
            isSimulated={isSimulated}
            isDemoMode={isDemoMode}
            onClearData={handleClearData}
            activeDatasetId={activeDatasetId}
            onClearDatasetFilter={() => {
              setActiveDatasetId(null);
              handleClearData();
            }}
          />
        )}

        {activeTab === 'datasets' && (
          <DatasetViewer onLoadItemsToFeed={handleLoadDatasetItemsToFeed} />
        )}

        {activeTab === 'api-docs' && <ApiInspectorModal />}
      </main>

      <footer className="border-t border-line bg-card py-5 mt-12 text-[12px] text-ink-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink">{t('appName')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('appTagline')}</span>
          </div>
          <div>{t('footerNote')}</div>
        </div>
      </footer>

      <ScraperModal
        isOpen={isScraperModalOpen}
        onClose={() => setIsScraperModalOpen(false)}
        onScrapeComplete={handleScrapeComplete}
      />

      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStatusChange={syncConnectionAndFeed}
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
