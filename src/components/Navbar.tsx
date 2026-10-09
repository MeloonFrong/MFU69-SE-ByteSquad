import React from 'react';
import { Newspaper, Plus, Search, Globe, Bookmark, Layers, Info, Moon, Sun } from 'lucide-react';
import { Language, ViewTab, Theme } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddSource: () => void;
  onOpenAbout: () => void;
  activeSourceCount: number;
  totalSourceCount: number;
  postCount: number;
  bookmarkedCount: number;
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  searchQuery,
  onSearchChange,
  onOpenAddSource,
  onOpenAbout,
  activeSourceCount,
  totalSourceCount,
  postCount,
  bookmarkedCount,
  currentTab,
  onTabChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="css-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white dark:text-white" style={{ color: 'var(--text-heading)' }}>
                  Info<span className="text-indigo-400" style={{ color: 'var(--accent-color)' }}>Center</span>
                </span>
              </div>
              <p className="text-xs font-medium hidden md:block" style={{ color: 'var(--text-muted)' }}>
                Aggregated Social Updates in One Place
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm css-input"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Quick Metrics in Header */}
            <div className="hidden lg:flex items-center gap-2.5 text-xs border-r pr-3" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-1.5" title="Active Sources">
                <Layers className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activeSourceCount}</strong>/{totalSourceCount}
                </span>
              </div>
              <button 
                onClick={() => onTabChange(currentTab === 'bookmarked' ? 'all' : 'bookmarked')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${currentTab === 'bookmarked' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800/40'}`}
                title="Saved Bookmarks"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{bookmarkedCount}</span>
              </button>
            </div>

            {/* THEME TOGGLE: 🌙 Moon for Dark (Default), ☀️ Sun for Light */}
            <button
              onClick={onThemeToggle}
              className="css-theme-toggle"
              title={theme === 'dark' ? 'Current Theme: Dark 🌙 (Click to switch to Light ☀️)' : 'Current Theme: Light ☀️ (Click to switch to Dark 🌙)'}
              aria-label="Toggle UI Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/40" />
                  <span className="hidden sm:inline font-bold">Dark 🌙</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-500/30" />
                  <span className="hidden sm:inline font-bold">Light ☀️</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'th' : 'en')}
              className="css-btn-secondary !py-1.5 !px-2.5 !text-xs font-semibold"
              title="Toggle Language (English / ไทย)"
            >
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span>{language === 'en' ? 'EN' : 'TH'}</span>
            </button>

            {/* Primary Action: Add Source */}
            <button
              onClick={onOpenAddSource}
              className="css-btn-primary !py-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm font-bold shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{t.addSourceBtn}</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
