import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Database,
  FolderPlus,
  Menu,
  Moon,
  Play,
  RefreshCw,
  Server,
  Sun,
  Terminal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

export type ActiveSection = 'feed' | 'datasets' | 'api-docs';

interface NavbarProps {
  activeTab: ActiveSection;
  setActiveTab: (tab: ActiveSection) => void;
  isConnected: boolean;
  isSimulated: boolean;
  onOpenScraper: () => void;
  onOpenSettings: () => void;
  onRefreshFeed: () => void;
  onLoadDemoData: () => void;
  onClearData: () => void;
  hasPosts?: boolean;
  isRefreshing?: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  isSimulated,
  onOpenScraper,
  onOpenSettings,
  onRefreshFeed,
  onLoadDemoData,
  onClearData,
  hasPosts = false,
  isRefreshing = false,
}: NavbarProps) {
  const { lang, setLang, theme, setTheme, t } = useI18n();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isInToolsView = activeTab === 'datasets' || activeTab === 'api-docs';

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand identity + main navigation */}
        <div className="flex items-center gap-6 min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-3 text-left shrink-0"
          >
            <span className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center text-sm font-semibold tracking-tight shrink-0">
              IC
            </span>
            <div className="min-w-0">
              <div className="font-display text-[16px] font-semibold text-ink tracking-tight leading-tight">
                {t('appName')}
              </div>
              <div className="text-[12px] text-ink-3 font-normal leading-tight truncate">
                {t('appTagline')}
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`h-9 px-3 rounded-lg text-[14px] font-medium transition-colors ${
                activeTab === 'feed'
                  ? 'bg-raised text-ink'
                  : 'text-ink-2 hover:text-ink hover:bg-raised/60'
              }`}
            >
              {t('navFeed')}
            </button>

            {/* Developer Tools submenu */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setIsToolsOpen((v) => !v)}
                aria-expanded={isToolsOpen}
                className={`h-9 px-3 rounded-lg text-[14px] font-medium transition-colors inline-flex items-center gap-2 ${
                  isInToolsView || isToolsOpen
                    ? 'bg-raised text-ink'
                    : 'text-ink-2 hover:text-ink hover:bg-raised/60'
                }`}
              >
                <Wrench className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
                <span>{t('navTools')}</span>
                <ChevronDown
                  className={`w-4 h-4 text-ink-3 transition-transform duration-150 ${
                    isToolsOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {isToolsOpen && (
                <div
                  role="menu"
                  className="menu-enter absolute left-0 mt-2 w-64 bg-card border border-line-strong rounded-xl p-1.5 shadow-[var(--shadow-float)] z-40"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenScraper();
                    }}
                    className="w-full h-9 px-3 rounded-lg text-left text-[13px] text-ink hover:bg-raised transition-colors flex items-center gap-2.5"
                  >
                    <Play className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{t('toolScraper')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsOpen(false);
                      setActiveTab('datasets');
                    }}
                    className={`w-full h-9 px-3 rounded-lg text-left text-[13px] transition-colors flex items-center gap-2.5 ${
                      activeTab === 'datasets'
                        ? 'bg-raised text-ink font-medium'
                        : 'text-ink hover:bg-raised'
                    }`}
                  >
                    <Database className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{t('toolDatasets')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsOpen(false);
                      setActiveTab('api-docs');
                    }}
                    className={`w-full h-9 px-3 rounded-lg text-left text-[13px] transition-colors flex items-center gap-2.5 ${
                      activeTab === 'api-docs'
                        ? 'bg-raised text-ink font-medium'
                        : 'text-ink hover:bg-raised'
                    }`}
                  >
                    <Terminal className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{t('toolApi')}</span>
                  </button>

                  <div className="my-1 border-t border-line" />

                  {/* Manual Demo Mode Controls */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onLoadDemoData();
                    }}
                    className="w-full h-9 px-3 rounded-lg text-left text-[13px] text-ink hover:bg-raised transition-colors flex items-center gap-2.5"
                  >
                    <FolderPlus className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{t('toolLoadDemo')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={!hasPosts}
                    onClick={() => {
                      setIsToolsOpen(false);
                      onClearData();
                    }}
                    className="w-full h-9 px-3 rounded-lg text-left text-[13px] text-ink hover:bg-raised transition-colors flex items-center gap-2.5 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{t('toolClearData')}</span>
                  </button>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full h-9 px-3 rounded-lg text-left text-[13px] text-ink hover:bg-raised transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Server className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{t('toolBackend')}</span>
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isConnected && !isSimulated ? 'bg-positive' : 'bg-negative'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Status, Refresh, Light/Dark Switcher, TH/EN Switcher, Mobile menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Connection status button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={t('statusTitle')}
            className="hidden sm:inline-flex h-9 px-3 rounded-lg border border-line bg-card hover:bg-raised text-[13px] text-ink-2 transition-colors items-center gap-2"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected && !isSimulated ? 'bg-positive' : 'bg-negative'
              }`}
            />
            <span>{isConnected && !isSimulated ? t('statusOnline') : t('statusOffline')}</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefreshFeed}
            disabled={isRefreshing}
            title={t('refresh')}
            aria-label={t('refresh')}
            className="h-9 w-9 rounded-lg border border-line bg-card hover:bg-raised text-ink-2 hover:text-ink transition-colors inline-flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              strokeWidth={1.5}
            />
          </button>

          {/* Light / Dark Mode Switcher */}
          <div
            role="group"
            aria-label={t('themeToggle')}
            className="h-9 p-1 rounded-lg bg-raised border border-line inline-flex items-center gap-0.5"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              title={t('themeLight')}
              aria-label={t('themeLight')}
              className={`h-7 px-2 rounded-md text-[12px] font-medium transition-colors inline-flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">{t('themeLight')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              title={t('themeDark')}
              aria-label={t('themeDark')}
              className={`h-7 px-2 rounded-md text-[12px] font-medium transition-colors inline-flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">{t('themeDark')}</span>
            </button>
          </div>

          {/* Bilingual TH / EN Switcher */}
          <div
            role="group"
            aria-label={t('langSwitch')}
            className="h-9 p-1 rounded-lg bg-raised border border-line inline-flex items-center gap-0.5"
          >
            <button
              type="button"
              onClick={() => setLang('th')}
              aria-pressed={lang === 'th'}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                lang === 'th'
                  ? 'bg-accent text-white'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-accent text-white'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              EN
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={t('navMenu')}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden h-9 w-9 rounded-lg border border-line bg-card hover:bg-raised text-ink-2 inline-flex items-center justify-center"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile collapsible navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-card px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('feed');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full h-10 px-3 rounded-lg text-left text-[14px] font-medium flex items-center justify-between ${
              activeTab === 'feed' ? 'bg-raised text-ink' : 'text-ink-2'
            }`}
          >
            <span>{t('navFeed')}</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[12px] text-ink-3 font-medium">
            {t('navTools')}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenScraper();
            }}
            className="w-full h-10 px-3 rounded-lg text-left text-[14px] text-ink-2 hover:bg-raised flex items-center gap-2.5"
          >
            <Play className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>{t('toolScraper')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('datasets');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full h-10 px-3 rounded-lg text-left text-[14px] flex items-center gap-2.5 ${
              activeTab === 'datasets' ? 'bg-raised text-ink font-medium' : 'text-ink-2'
            }`}
          >
            <Database className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>{t('toolDatasets')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('api-docs');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full h-10 px-3 rounded-lg text-left text-[14px] flex items-center gap-2.5 ${
              activeTab === 'api-docs' ? 'bg-raised text-ink font-medium' : 'text-ink-2'
            }`}
          >
            <Terminal className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>{t('toolApi')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onLoadDemoData();
            }}
            className="w-full h-10 px-3 rounded-lg text-left text-[14px] text-ink-2 hover:bg-raised flex items-center gap-2.5"
          >
            <FolderPlus className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>{t('toolLoadDemo')}</span>
          </button>

          <button
            type="button"
            disabled={!hasPosts}
            onClick={() => {
              setIsMobileMenuOpen(false);
              onClearData();
            }}
            className="w-full h-10 px-3 rounded-lg text-left text-[14px] text-ink-2 hover:bg-raised flex items-center gap-2.5 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>{t('toolClearData')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSettings();
            }}
            className="w-full h-10 px-3 rounded-lg text-left text-[14px] text-ink-2 hover:bg-raised flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
              <span>{t('toolBackend')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected && !isSimulated ? 'bg-positive' : 'bg-negative'
                }`}
              />
              <span>{isConnected && !isSimulated ? t('statusOnline') : t('statusOffline')}</span>
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
