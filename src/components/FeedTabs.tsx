import React from 'react';
import { Sparkles, AlertCircle, Mail, Bookmark, ArrowDownUp } from 'lucide-react';
import { ViewTab, SortOption, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface FeedTabsProps {
  language: Language;
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    all: number;
    important: number;
    unread: number;
    bookmarked: number;
  };
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  language,
  currentTab,
  onTabChange,
  sortBy,
  onSortChange,
  counts,
}) => {
  const t = TRANSLATIONS[language];

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: t.allPostsTab, icon: <Sparkles className="w-4 h-4" />, count: counts.all },
    { id: 'important', label: t.importantTab, icon: <AlertCircle className="w-4 h-4 text-rose-400" />, count: counts.important },
    { id: 'unread', label: t.unreadTab, icon: <Mail className="w-4 h-4 text-blue-400" />, count: counts.unread },
    { id: 'bookmarked', label: t.bookmarkedTab, icon: <Bookmark className="w-4 h-4 text-amber-400" />, count: counts.bookmarked },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all"
              style={{
                backgroundColor: isActive ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-mono font-medium"
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--input-bg)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort Select */}
      <div className="flex items-center gap-2 self-end sm:self-auto text-xs sm:text-sm">
        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <ArrowDownUp className="w-3.5 h-3.5" />
          <span className="font-medium text-xs">{t.sortBy}:</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="css-input !py-1 !text-xs sm:!text-sm font-medium"
        >
          <option value="newest">{t.sortNewest}</option>
          <option value="important">{t.sortImportant}</option>
          <option value="oldest">{t.sortOldest}</option>
        </select>
      </div>
    </div>
  );
};
