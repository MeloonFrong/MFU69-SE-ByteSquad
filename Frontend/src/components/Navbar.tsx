import { Activity, Database, Server, RefreshCw, Rss } from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'scraper' | 'datasets' | 'api-docs';
  setActiveTab: (tab: 'feed' | 'scraper' | 'datasets' | 'api-docs') => void;
  isConnected: boolean;
  isSimulated: boolean;
  onOpenSettings: () => void;
  onRefreshFeed: () => void;
  isRefreshing?: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  isSimulated,
  onOpenSettings,
  onRefreshFeed,
  isRefreshing = false,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element, whitespace-nowrap shrink-0) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <Rss className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Facebook Feed Hub
            </span>
          </button>
        </div>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('feed')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'feed'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Feed ข่าวสาร
          </button>
          <button
            onClick={() => setActiveTab('scraper')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'scraper'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>สั่งงาน Scraper</span>
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'datasets'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Apify Datasets</span>
          </button>
          <button
            onClick={() => setActiveTab('api-docs')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'api-docs'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <span>HTTP & C# API</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onRefreshFeed}
            disabled={isRefreshing}
            title="รีเฟรชโพสต์"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenSettings}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : isSimulated
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>
              {isConnected
                ? 'C# Live: 5030'
                : isSimulated
                ? 'C# Simulator'
                : 'ตั้งค่า Backend'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
