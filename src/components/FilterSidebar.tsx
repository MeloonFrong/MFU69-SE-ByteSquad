import React, { useState } from 'react';
import { 
  Filter, 
  Hash, 
  Layers, 
  Plus, 
  X, 
  Check, 
  Settings2,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { Source, Tag, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  sources: Source[];
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onClearTags: () => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  mustIncludeKeywords: string[];
  onAddMustInclude: (keyword: string) => void;
  onRemoveMustInclude: (keyword: string) => void;
  excludeKeywords: string[];
  onAddExclude: (keyword: string) => void;
  onRemoveExclude: (keyword: string) => void;
  onToggleSource: (sourceId: string) => void;
  onOpenManageSources: () => void;
  onOpenManageTags: () => void;
  onResetAllFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  language,
  sources,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  selectedPlatform,
  onSelectPlatform,
  mustIncludeKeywords,
  onAddMustInclude,
  onRemoveMustInclude,
  excludeKeywords,
  onAddExclude,
  onRemoveExclude,
  onToggleSource,
  onOpenManageSources,
  onOpenManageTags,
  onResetAllFilters,
  hasActiveFilters,
}) => {
  const t = TRANSLATIONS[language];
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  const handleAddInclude = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (includeInput.trim()) {
      onAddMustInclude(includeInput.trim());
      setIncludeInput('');
    }
  };

  const handleAddExclude = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (excludeInput.trim()) {
      onAddExclude(excludeInput.trim());
      setExcludeInput('');
    }
  };

  // Platform list strictly limited to Facebook, Instagram, and TikTok as requested
  const platformList: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: language === 'th' ? 'ทั้งหมด' : 'All', icon: '🌐' },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📷' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Left Popup Drawer (independent scroll container) */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside 
          className="w-85 sm:w-96 max-w-[90vw] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r"
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Drawer Header */}
          <div 
            className="p-4 flex items-center justify-between border-b shrink-0"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>
                  {language === 'th' ? 'ตัวกรองและแหล่งข่าว' : 'Filters & Subscriptions'}
                </h3>
                <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                  {language === 'th' ? 'เลื่อนดูแยกจากหน้าฟีดหลัก' : 'Independent sidebar drawer'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={onResetAllFilters}
                  className="text-xs font-semibold text-indigo-400 hover:underline"
                >
                  {t.clearFilters}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800/40 transition"
                style={{ color: 'var(--text-muted)' }}
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Body (Independent scroll) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Active Filters Summary Header */}
            {hasActiveFilters && (
              <div 
                className="rounded-xl p-3 flex items-center justify-between border"
                style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent-color)' }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                  <Filter className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <span>{language === 'th' ? 'กำลังใช้งานตัวกรอง' : 'Active Filters Applied'}</span>
                </div>
                <button
                  onClick={onResetAllFilters}
                  className="text-xs font-bold hover:underline"
                  style={{ color: 'var(--accent-color)' }}
                >
                  {t.clearFilters}
                </button>
              </div>
            )}

            {/* Platform Filter: Limited to Instagram, Facebook, TikTok */}
            <div className="css-card p-4">
              <h4 className="text-sm font-bold mb-2.5 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                <span>{t.filterByPlatform}</span>
                <span className="text-2xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
                  (IG • FB • TikTok)
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {platformList.map((p) => {
                  const isSelected = selectedPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPlatform(p.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition ${
                        isSelected
                          ? 'border-indigo-500 font-bold'
                          : 'border-transparent hover:bg-slate-800/20'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      <span>{p.icon}</span>
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category & Tag Filter */}
            <div className="css-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-heading)' }}>
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <span>{t.filterByTags}</span>
                  <span className="text-2xs font-mono font-bold px-1.5 py-0.2 rounded-full" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>
                    {tags.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTags.length > 0 && (
                    <button
                      onClick={onClearTags}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={onOpenManageTags}
                    className="p-1 rounded-md transition"
                    style={{ color: 'var(--text-muted)' }}
                    title={t.manageTags}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag(tag.name)}
                      className={`css-tag-pill ${isSelected ? 'active' : ''}`}
                    >
                      <span>{tag.name}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information Sorting & Keyword Filtering */}
            <div className="css-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-heading)' }}>
                  <Filter className="w-4 h-4 text-amber-400" />
                  <span>{t.keywordFilterTitle}</span>
                </div>
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t.keywordFilterDesc}
              </p>

              {/* Must Include Keywords */}
              <div className="space-y-1.5 mb-3">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {t.mustIncludeKeywords}
                </label>
                <form onSubmit={handleAddInclude} className="flex gap-1.5">
                  <input
                    type="text"
                    value={includeInput}
                    onChange={(e) => setIncludeInput(e.target.value)}
                    placeholder="e.g. Exam, Scholarship"
                    className="flex-1 min-w-0 css-input !py-1 !text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
                {mustIncludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mustIncludeKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium font-mono"
                      >
                        +{kw}
                        <button
                          onClick={() => onRemoveMustInclude(kw)}
                          className="hover:text-emerald-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exclude Keywords (Hide Noise) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  {t.excludeKeywords}
                </label>
                <form onSubmit={handleAddExclude} className="flex gap-1.5">
                  <input
                    type="text"
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    placeholder="e.g. Sponsor, Food"
                    className="flex-1 min-w-0 css-input !py-1 !text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
                {excludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {excludeKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-xs font-medium font-mono"
                      >
                        -{kw}
                        <button
                          onClick={() => onRemoveExclude(kw)}
                          className="hover:text-rose-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subscribed Sources Toggle List */}
            <div className="css-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-heading)' }}>
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>{t.sourcesSubscribed}</span>
                </div>
                <button
                  onClick={onOpenManageSources}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--accent-color)' }}
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-2 rounded-lg border transition"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-subtle)',
                      opacity: source.enabled ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: source.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {source.name}
                        </p>
                        <p className="text-2xs truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                          {source.handle}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleSource(source.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        source.enabled ? 'bg-indigo-600' : 'bg-slate-600'
                      }`}
                      title={source.enabled ? t.sourceActive : t.sourceMuted}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          source.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div 
            className="p-4 border-t flex items-center justify-between shrink-0"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {sources.filter(s => s.enabled).length}/{sources.length} {language === 'th' ? 'แหล่งที่เปิด' : 'sources active'}
            </span>
            <button
              onClick={onClose}
              className="css-btn-primary !py-1.5 !px-4 !text-xs font-bold"
            >
              {language === 'th' ? 'ดูฟีดข่าว' : 'View Feed'}
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
};
