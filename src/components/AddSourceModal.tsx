import React, { useState, useEffect } from 'react';
import { X, Link2, Sparkles, Check, Plus, AlertCircle, CheckCircle2, Tag as TagIcon } from 'lucide-react';
import { Source, SourcePlatform, Tag, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  tags: Tag[];
  onAddSource: (newSource: Source, samplePosts: boolean) => void;
  onAddNewTag?: (newTag: Tag) => void;
  existingSourceUrls: string[];
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  language,
  tags,
  onAddSource,
  onAddNewTag,
  existingSourceUrls,
}) => {
  const t = TRANSLATIONS[language];
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<SourcePlatform>('facebook');
  const [selectedTags, setSelectedTags] = useState<string[]>(['#MFU']);
  const [description, setDescription] = useState('');
  
  // Available Tags list (up to 100 tags)
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagFeedback, setTagFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync available tags from props (capped at 100)
  useEffect(() => {
    if (tags && tags.length > 0) {
      setAvailableTags(tags.slice(0, 100));
    }
  }, [tags]);

  // Clear feedback after 3.5 seconds
  useEffect(() => {
    if (tagFeedback) {
      const timer = setTimeout(() => setTagFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [tagFeedback]);

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError('');

    let detectedPlatform: SourcePlatform = 'facebook';
    let suggestedName = '';
    let suggestedHandle = '';

    if (newUrl.includes('facebook.com') || newUrl.includes('fb.me')) {
      detectedPlatform = 'facebook';
      const match = newUrl.match(/facebook\.com\/([^/?#]+)/);
      if (match && match[1]) {
        suggestedHandle = `@${match[1]}`;
        suggestedName = match[1].replace(/[._-]/g, ' ').toUpperCase() + ' Page';
      }
    } else if (newUrl.includes('instagram.com')) {
      detectedPlatform = 'instagram';
      const match = newUrl.match(/instagram\.com\/([^/?#]+)/);
      if (match && match[1]) {
        suggestedHandle = `@${match[1]}`;
        suggestedName = match[1].replace(/[._-]/g, ' ') + ' Official';
      }
    } else if (newUrl.includes('tiktok.com')) {
      detectedPlatform = 'tiktok';
      const match = newUrl.match(/tiktok\.com\/@([^/?#]+)/);
      if (match && match[1]) {
        suggestedHandle = `@${match[1]}`;
        suggestedName = match[1].replace(/[._-]/g, ' ');
      }
    }

    setPlatform(detectedPlatform);
    if (!name && suggestedName) setName(suggestedName);
    if (!handle && suggestedHandle) setHandle(suggestedHandle);
  };

  // Toggle tag selection for this source
  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Remove a selected tag directly from the source
  const handleRemoveSelectedTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  // Add new Tag (up to 100 tags, spaces auto-converted to '-')
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTagInput.trim()) return;

    // Convert spaces to hyphens automatically to prevent discrepancies
    let formatted = newTagInput.trim().replace(/\s+/g, '-');
    if (!formatted.startsWith('#')) {
      formatted = `#${formatted}`;
    }

    // Check maximum limit of 100 tags
    if (availableTags.length >= 100) {
      setTagFeedback({
        message: language === 'th' 
          ? 'จำกัดตัวเลือกแท็กสูงสุด 100 อัน (ครบ 100 แล้ว)' 
          : 'Tags limit reached (maximum 100 tags).',
        isError: true,
      });
      return;
    }

    // Check if tag already exists in available tags
    const existing = availableTags.find((t) => t.name.toLowerCase() === formatted.toLowerCase());
    if (existing) {
      if (!selectedTags.includes(existing.name)) {
        setSelectedTags([...selectedTags, existing.name]);
      }
      setTagFeedback({
        message: language === 'th'
          ? `มีแท็ก "${existing.name}" ในตัวเลือกแล้ว (เลือกให้แหล่งนี้เรียบร้อย)`
          : `Tag "${existing.name}" already in available tags (assigned to this source).`,
        isError: false,
      });
      setNewTagInput('');
      return;
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: formatted,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      description: 'Tag added by user',
    };

    // Update available tags list
    const updatedTags = [...availableTags, newTag];
    setAvailableTags(updatedTags);

    // Automatically select it for this current source as well
    if (!selectedTags.includes(formatted)) {
      setSelectedTags([...selectedTags, formatted]);
    }

    // Save to persistent storage / backend
    if (onAddNewTag) {
      onAddNewTag(newTag);
    }

    setTagFeedback({
      message: language === 'th'
        ? `เพิ่มแท็ก "${formatted}" สำเร็จ (${updatedTags.length}/100)`
        : `Added tag "${formatted}" successfully (${updatedTags.length}/100).`,
      isError: false,
    });
    setNewTagInput('');
  };

  // Remove a tag from the available list
  const handleRemoveAvailableTag = (tagId: string, tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableTags(availableTags.filter((t) => t.id !== tagId));
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
    setTagFeedback({
      message: language === 'th'
        ? `ลบแท็ก "${tagName}" ออกจากรายการแล้ว`
        : `Removed tag "${tagName}".`,
      isError: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError(language === 'th' ? 'กรุณาระบุลิงก์ URL' : 'Please provide a source URL');
      return;
    }

    if (existingSourceUrls.includes(url.trim())) {
      setError(language === 'th' ? 'คุณติดตามลิงก์นี้อยู่แล้ว' : 'You are already subscribed to this URL link.');
      return;
    }

    setLoading(true);

    const colorPalette: Record<SourcePlatform, string> = {
      facebook: '#1877F2',
      instagram: '#E1306C',
      tiktok: '#000000',
    };

    const newSource: Source = {
      id: `src-${Date.now()}`,
      name: name.trim() || (language === 'th' ? 'แหล่งข่าวสารใหม่' : 'Custom Announcement Source'),
      handle: handle.trim() || `@feed_${Math.floor(Math.random() * 900 + 100)}`,
      url: url.trim(),
      platform,
      color: colorPalette[platform] || '#1877F2',
      tags: selectedTags.length > 0 ? selectedTags : ['#MFU'],
      enabled: true,
      postCount: 1,
      lastUpdated: new Date().toISOString(),
      description: description.trim() || `Subscribed source via ${url}`,
    };

    onAddSource(newSource, true);
    setLoading(false);
    onClose();
  };

  // Recommended quick add sources for MFU students (only FB, IG, TikTok)
  const quickRecommendations = [
    {
      name: 'MFU Central Library',
      handle: '@mfulibrary',
      url: 'https://facebook.com/MFULibrary',
      platform: 'facebook' as SourcePlatform,
      tags: ['#MFU', '#CampusLife'],
      desc: 'Study rooms booking, 24/7 exam opening hours, and digital academic resources.'
    },
    {
      name: 'MFU International Affairs (IAD)',
      handle: '@mfu.iad',
      url: 'https://facebook.com/MFUInternationalAffairs',
      platform: 'facebook' as SourcePlatform,
      tags: ['#MFU', '#Scholarships'],
      desc: 'Visa 90-day notification, international student support, and exchange partner universities.'
    },
    {
      name: 'ByteSquad SE Lab (Group 17)',
      handle: '@bytesquad.mfu',
      url: 'https://instagram.com/bytesquad_se',
      platform: 'instagram' as SourcePlatform,
      tags: ['#TechNews', '#MFU'],
      desc: 'Software Engineering student updates, InfoCenter release news, and project showcases.'
    },
  ];

  return (
    <div className="css-modal-overlay">
      <div className="css-modal-box max-w-xl max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b shrink-0" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-heading)' }}>{t.addNewSource}</h3>
              <p className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>Facebook • Instagram • TikTok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-xs font-bold block mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.recommendedSourcesTitle}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickRecommendations.map((rec) => (
                <button
                  type="button"
                  key={rec.name}
                  onClick={() => {
                    setUrl(rec.url);
                    setName(rec.name);
                    setHandle(rec.handle);
                    setPlatform(rec.platform);
                    setSelectedTags(rec.tags);
                    setDescription(rec.desc);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border font-medium transition"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  + {rec.name}
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
              {t.sourceUrlLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://facebook.com/..., https://instagram.com/..., or https://tiktok.com/@..."
              className="w-full css-input font-mono"
            />
          </div>

          {/* Platform Selector (Only Facebook, Instagram, TikTok) & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                Platform <span className="text-2xs font-normal" style={{ color: 'var(--text-muted)' }}>(FB / IG / TikTok)</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SourcePlatform)}
                className="w-full css-input"
              >
                <option value="facebook">Facebook (📘)</option>
                <option value="instagram">Instagram (📷)</option>
                <option value="tiktok">TikTok (🎵)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                {t.sourceNameLabel} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MFU Registrar"
                className="w-full css-input"
              />
            </div>
          </div>

          {/* Handle */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
              {t.sourceHandleLabel}
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. @mfuregistrar"
              className="w-full css-input font-mono"
            />
          </div>

          {/* ========================================================================= */}
          {/* ASSIGN TAGS SECTION                                                        */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
            
            {/* 1. VISIBLE FEEDBACK: Shows what tags are assigned to this source */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
                  <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {language === 'th' ? 'แท็กที่เลือกสำหรับแหล่งนี้:' : 'Tags Assigned to this Source:'}
                  </span>
                  <span className="text-2xs font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400">
                    {selectedTags.length}
                  </span>
                </label>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-2xs font-medium text-slate-400 hover:text-rose-400 transition"
                  >
                    {language === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}
                  </button>
                )}
              </div>

              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-subtle)' }}>
                  {selectedTags.map((tagName) => (
                    <span
                      key={tagName}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      <span>{tagName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedTag(tagName)}
                        className="hover:bg-indigo-700 p-0.5 rounded-full transition"
                        title={language === 'th' ? `ลบ ${tagName} ออกจากแหล่งนี้` : `Remove ${tagName}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-center text-xs" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {language === 'th' 
                    ? '(ยังไม่ได้เลือกแท็ก — คลิกเลือกจากตัวเลือกแท็กด้านล่าง)' 
                    : '(No tags selected yet — click from available tags below)'}
                </div>
              )}
            </div>

            {/* Notification Feedback Toast */}
            {tagFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200 border ${
                  tagFeedback.isError
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {tagFeedback.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{tagFeedback.message}</span>
              </div>
            )}

            {/* 2. AVAILABLE TAGS (Limit up to 100 tags) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span>{language === 'th' ? 'แท็กทั้งหมดที่มีให้เลือก' : 'Available Tags (Click to select/unselect)'}</span>
                </label>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                  {availableTags.length}/100 {language === 'th' ? 'แท็ก' : 'tags'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <div
                      key={tag.id}
                      className="inline-flex items-center rounded-lg border group transition"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--input-bg)',
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag.name)}
                        className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {isSelected ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <Plus className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        )}
                        <span>{tag.name}</span>
                      </button>

                      {/* Small delete icon to manage tags */}
                      {availableTags.length > 5 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAvailableTag(tag.id, tag.name, e)}
                          className={`pr-1.5 pl-0.5 py-1 opacity-0 group-hover:opacity-80 hover:opacity-100 transition ${
                            isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-400'
                          }`}
                          title={language === 'th' ? 'ลบแท็กนี้ออกจากตัวเลือก' : 'Delete this tag'}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. ADD NEW TAG SECTION (Auto converts space to hyphen '-', max 100 limit) */}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                  {language === 'th' ? '+ เพิ่มแท็กใหม่เข้าสู่ระบบ' : '+ Add New Tag'}
                </span>
                <span className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {availableTags.length >= 100 
                    ? (language === 'th' ? 'ครบ 100 แล้ว' : 'Max 100 reached') 
                    : `${100 - availableTags.length} ${language === 'th' ? 'ช่องว่างเหลือ' : 'slots left'}`}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => {
                    // Automatically convert spaces to '-' as requested
                    const cleanValue = e.target.value.replace(/\s+/g, '-');
                    setNewTagInput(cleanValue);
                  }}
                  disabled={availableTags.length >= 100}
                  placeholder={
                    availableTags.length >= 100
                      ? (language === 'th' ? 'แท็กครบลิมิต 100 อันแล้ว' : 'Tag limit of 100 reached')
                      : (language === 'th' ? 'พิมพ์แท็ก เช่น #campus-life (ช่องว่างจะกลายเป็น -)' : 'Enter tag e.g. #campus-life')
                  }
                  className="flex-1 css-input !py-1.5 !text-xs font-mono disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={availableTags.length >= 100 || !newTagInput.trim()}
                  className="css-btn-secondary !py-1.5 !px-3 !text-xs font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'th' ? 'เพิ่มแท็ก' : 'Add Tag'}</span>
                </button>
              </div>
              <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {language === 'th'
                  ? '* รองรับสูงสุด 100 แท็ก และหากพิมพ์ช่องว่าง (space) ระบบจะเปลี่ยนเป็นเครื่องหมาย "-" ให้อัตโนมัติ'
                  : '* Supports up to 100 tags. Spaces are automatically replaced with "-" to prevent discrepancies.'}
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="pt-3 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onClose}
              className="css-btn-secondary"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="css-btn-primary"
            >
              {loading ? t.subscribing : t.subscribeConfirm}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
