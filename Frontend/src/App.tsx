import { useState, useEffect, useCallback } from 'react';
import { FacebookPost } from './types/facebook';
import { FacebookApiClient } from './services/api';
import { Navbar } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { ScraperModal } from './components/ScraperModal';
import { DatasetViewer } from './components/DatasetViewer';
import { ApiInspectorModal } from './components/ApiInspectorModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'scraper' | 'datasets' | 'api-docs'>('feed');
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPage, setSelectedPage] = useState('MFU2Connect');
  const [limit, setLimit] = useState(10);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | undefined>(undefined);

  // Modals
  const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  // Load posts from API
  const loadPosts = useCallback(
    async (pageToLoad: string = selectedPage, limitToLoad: number = limit) => {
      setIsLoading(true);
      try {
        const result = await FacebookApiClient.getRecentPosts(pageToLoad, limitToLoad);
        setPosts(result.data.posts);
        setTotalScanned(result.data.totalScanned);
        setIsSimulated(result.isSimulated);
        setErrorNotice(result.errorNotice);
      } catch (err: any) {
        console.error('Failed to load posts', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPage, limit]
  );

  // Check connection status
  const checkStatus = useCallback(async () => {
    try {
      const res = await FacebookApiClient.checkConnection();
      setIsConnected(res.ok);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    loadPosts(selectedPage, limit);
  }, [checkStatus, loadPosts, selectedPage, limit]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    checkStatus();
    loadPosts(selectedPage, limit);
  };

  const handlePageChange = (newPage: string) => {
    setSelectedPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  const handleScrapeComplete = (newPostsCount: number) => {
    // Reload posts to include fresh scrapes
    loadPosts(selectedPage, limit);
  };

  const handleLoadDatasetItemsToFeed = (items: any[]) => {
    const normalized = items.map((item) => FacebookApiClient.normalizePost(item));
    setPosts((prev) => FacebookApiClient.deduplicatePosts([...normalized, ...prev]));
    setActiveTab('feed');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Strict 3-zone Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        isSimulated={isSimulated}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshFeed={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
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
            errorNotice={errorNotice}
          />
        )}

        {activeTab === 'scraper' && (
          <div className="py-6">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  ส่งคำสั่ง Scrape ไปยัง Apify Actor ผ่าน C# Backend
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  สั่งงาน Facebook Posts Scraper ดึงโพสต์ล่าสุดจากโปรไฟล์ที่ระบุ (เช่น MFU2Connect หรือ profile.php?id=61563364138740) และบันทึกลงฐานข้อมูลแบบทันที
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsScraperModalOpen(true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <span>เปิดหน้าต่างส่งคำสั่ง Scrape (POST /run)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <DatasetViewer onLoadItemsToFeed={handleLoadDatasetItemsToFeed} />
        )}

        {activeTab === 'api-docs' && <ApiInspectorModal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Facebook Feed & Apify Scraper Hub</span>
            <span aria-hidden="true">·</span>
            <span>ASP.NET Core C# Backend Integration</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Deduplication Algorithm: postId → url → content hash
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScraperModal
        isOpen={isScraperModalOpen}
        onClose={() => setIsScraperModalOpen(false)}
        onScrapeComplete={handleScrapeComplete}
      />

      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStatusChange={() => {
          checkStatus();
          loadPosts(selectedPage, limit);
        }}
      />

      <MediaGalleryModal
        imageUrl={galleryImage}
        onClose={() => setGalleryImage(null)}
      />
    </div>
  );
}
