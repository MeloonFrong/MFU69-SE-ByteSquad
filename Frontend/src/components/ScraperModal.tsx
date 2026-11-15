import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Facebook,
  Instagram,
  Music2,
  Plus,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';
import { SubscriptionItem } from '../types/facebook';
import {
  DEFAULT_POSTS_PER_PAGE,
  DEFAULT_SUGGESTED_TAGS,
  normalizeTag,
  normalizeTagList,
  parseSubscriptionInput,
} from '../services/subscriptionUtils';
import { useI18n } from '../i18n/LanguageContext';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubscriptions: (newItems: SubscriptionItem[]) => Promise<void> | void;
  existingTags?: string[];
  onCreateTag?: (newTag: string) => void;
  onDeleteTag?: (tag: string) => void;
}

export function ScraperModal({
  isOpen,
  onClose,
  onAddSubscriptions,
  existingTags = [],
  onCreateTag,
  onDeleteTag,
}: ScraperModalProps) {
  const { t, formatNumber } = useI18n();
  const [queuedItems, setQueuedItems] = useState<SubscriptionItem[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [selectedTagsForNew, setSelectedTagsForNew] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customCreatedTags, setCustomCreatedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allAvailableTags = normalizeTagList([
    ...DEFAULT_SUGGESTED_TAGS,
    ...existingTags,
    ...customCreatedTags,
    ...selectedTagsForNew,
    ...queuedItems.flatMap((q) => q.tags || []),
  ]);

  const renderPlatformIcon = (platform: SubscriptionItem['platform']) => {
    if (platform === 'instagram') {
      return (
        <Instagram
          className="w-4 h-4 text-platform-ig shrink-0"
          strokeWidth={1.75}
        />
      );
    }
    if (platform === 'tiktok') {
      return (
        <Music2
          className="w-4 h-4 text-platform-tt shrink-0"
          strokeWidth={1.75}
        />
      );
    }
    return (
      <Facebook
        className="w-4 h-4 text-platform-fb shrink-0"
        strokeWidth={1.75}
      />
    );
  };

  const handleToggleTagForNew = (tag: string) => {
    const norm = normalizeTag(tag);
    if (!norm) return;
    setSelectedTagsForNew((prev) =>
      prev.some((tItem) => tItem.toLowerCase() === norm.toLowerCase())
        ? prev.filter((tItem) => tItem.toLowerCase() !== norm.toLowerCase())
        : [...prev, norm]
    );
  };

  const handleCreateCustomTag = () => {
    const norm = normalizeTag(customTagInput);
    if (!norm) return;
    setCustomCreatedTags((prev) => normalizeTagList([...prev, norm]));
    setSelectedTagsForNew((prev) => normalizeTagList([...prev, norm]));
    onCreateTag?.(norm);
    setCustomTagInput('');
  };

  const handleDeleteTag = (rawTag: string) => {
    const norm = normalizeTag(rawTag);
    if (!norm) return;
    const lower = norm.toLowerCase();
    setCustomCreatedTags((prev) =>
      prev.filter((tItem) => tItem.toLowerCase() !== lower)
    );
    setSelectedTagsForNew((prev) =>
      prev.filter((tItem) => tItem.toLowerCase() !== lower)
    );
    setQueuedItems((prev) =>
      prev.map((item) => ({
        ...item,
        tags: (item.tags || []).filter(
          (tItem) => tItem.toLowerCase() !== lower
        ),
      }))
    );
    onDeleteTag?.(norm);
  };

  const handleAddUrlToQueue = () => {
    if (!newUrlInput.trim()) return;
    const parsed = parseSubscriptionInput(
      newUrlInput,
      'facebook',
      DEFAULT_POSTS_PER_PAGE,
      selectedTagsForNew
    );
    if (!parsed) {
      setError(t('scraperNeedUrl'));
      return;
    }
    setQueuedItems((prev) => {
      const exists = prev.find((item) => item.id === parsed.id);
      if (exists) {
        return prev.map((item) =>
          item.id === parsed.id
            ? {
                ...item,
                tags: normalizeTagList([
                  ...(item.tags || []),
                  ...(parsed.tags || []),
                ]),
              }
            : item
        );
      }
      return [...prev, parsed];
    });
    setNewUrlInput('');
    setError(null);
  };

  const handleToggleQueuedItemTag = (itemId: string, tag: string) => {
    const norm = normalizeTag(tag);
    if (!norm) return;
    setQueuedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const current = item.tags || [];
        const hasTag = current.some(
          (tItem) => tItem.toLowerCase() === norm.toLowerCase()
        );
        return {
          ...item,
          tags: hasTag
            ? current.filter(
                (tItem) => tItem.toLowerCase() !== norm.toLowerCase()
              )
            : normalizeTagList([...current, norm]),
        };
      })
    );
  };

  const handleRemoveQueued = (id: string) => {
    setQueuedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmSubscribe = async () => {
    const finalItems = [...queuedItems];
    if (newUrlInput.trim()) {
      const pending = parseSubscriptionInput(
        newUrlInput,
        'facebook',
        DEFAULT_POSTS_PER_PAGE,
        selectedTagsForNew
      );
      if (pending) {
        const existingIdx = finalItems.findIndex(
          (item) => item.id === pending.id
        );
        if (existingIdx >= 0) {
          finalItems[existingIdx] = {
            ...finalItems[existingIdx],
            tags: normalizeTagList([
              ...(finalItems[existingIdx].tags || []),
              ...(pending.tags || []),
            ]),
          };
        } else {
          finalItems.push(pending);
        }
      }
      setNewUrlInput('');
    }

    if (finalItems.length === 0) {
      setError(t('scraperNeedUrl'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddSubscriptions(finalItems);
      setQueuedItems([]);
      setSelectedTagsForNew([]);
      onClose();
    } catch (err: any) {
      setError(err.message || t('scraperFailedTitle'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 overflow-y-auto">
      <div className="bg-card border border-line-strong rounded-2xl w-full max-w-xl shadow-[var(--shadow-float)] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-4">
          <h2 className="font-display text-[17px] font-semibold text-ink">
            {t('addSubscriptionTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeImage')}
            className="h-8 w-8 text-ink-3 hover:text-ink hover:bg-raised rounded-lg transition-colors inline-flex items-center justify-center"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          <p className="text-[13px] text-ink-2 leading-relaxed">
            {t('addSubscriptionDesc')}
          </p>

          {error && (
            <div
              role="alert"
              className="p-4 bg-negative-soft border border-negative-line rounded-xl text-[13px] text-negative-ink flex items-start gap-2.5"
            >
              <AlertCircle
                className="w-4 h-4 shrink-0 mt-0.5 text-negative"
                strokeWidth={1.5}
              />
              <span>{error}</span>
            </div>
          )}

          {/* 1. URL Input ONLY (No recommended/preset sources) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="subscription-url-input"
                className="text-[13px] font-medium text-ink"
              >
                {t('addSubscriptionUrlLabel')}
              </label>
              <span className="text-[12px] font-mono text-ink-3 tabular-nums">
                {t('scraperUrlsCount', { n: formatNumber(queuedItems.length) })}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                id="subscription-url-input"
                type="url"
                placeholder={t('addSubscriptionPlaceholder')}
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrlToQueue()}
                className="flex-1 h-10 px-3 text-[13px] bg-card border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleAddUrlToQueue}
                className="h-10 px-3.5 bg-raised hover:bg-line border border-line text-ink text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
                <span>{t('scraperAdd')}</span>
              </button>
            </div>
          </div>

          {/* 2. Create Tag Button & Select Existing Tags to attach */}
          <div className="space-y-3 pt-3 border-t border-line">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <TagIcon className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
              <span>{t('selectExistingTagsLabel')}</span>
            </div>

            {/* Create Tag Control at the top */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('tagInputPlaceholder')}
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCustomTag();
                  }
                }}
                className="flex-1 h-9 px-3 text-[12px] bg-card border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleCreateCustomTag}
                className="h-9 px-3 bg-raised hover:bg-line border border-line text-ink text-[12px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                <span>{t('createTagButton')}</span>
              </button>
            </div>

            {/* Existing Tags Selection */}
            {allAvailableTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {allAvailableTags.map((tag) => {
                  const isSelected = selectedTagsForNew.some(
                    (tItem) => tItem.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <div
                      key={tag}
                      className={`h-7 rounded-md text-[12px] font-mono transition-colors inline-flex items-center border ${
                        isSelected
                          ? 'bg-accent text-white border-accent font-medium'
                          : 'bg-raised text-ink-2 border-line'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTagForNew(tag)}
                        aria-pressed={isSelected}
                        className={`h-full pl-2.5 pr-1.5 inline-flex items-center gap-1.5 transition-colors ${
                          isSelected ? 'text-white' : 'hover:text-ink'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 shrink-0" strokeWidth={2} />
                        )}
                        <span>{tag}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag)}
                        title={t('deleteTagTooltip')}
                        aria-label={`${t('deleteTagTooltip')} ${tag}`}
                        className={`h-full px-1.5 inline-flex items-center justify-center rounded-r-md transition-colors ${
                          isSelected
                            ? 'text-white/80 hover:text-white hover:bg-white/15'
                            : 'text-ink-3 hover:text-negative hover:bg-line'
                        }`}
                      >
                        <X className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-ink-3 pt-0.5">{t('noTagsYet')}</p>
            )}
          </div>

          {/* Queued Items with Per-Source Tag Assignment */}
          {queuedItems.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-line">
              <div className="text-[12px] font-medium text-ink-2">
                {t('addSubscriptionQueueTitle')}
              </div>
              {queuedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-raised border border-line rounded-xl text-[13px] space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderPlatformIcon(item.platform)}
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate leading-tight">
                          {item.displayName}
                        </div>
                        <div className="font-mono text-[11px] text-ink-3 truncate leading-tight">
                          {item.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveQueued(item.id)}
                        title={t('scraperRemove')}
                        aria-label={t('scraperRemove')}
                        className="h-7 w-7 text-ink-3 hover:text-negative rounded-md transition-colors inline-flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Per-item existing tag selection */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {allAvailableTags.map((tag) => {
                      const active = (item.tags || []).some(
                        (tItem) => tItem.toLowerCase() === tag.toLowerCase()
                      );
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleQueuedItemTag(item.id, tag)}
                          className={`h-6 px-2 rounded-sm text-[11px] font-mono transition-colors inline-flex items-center gap-1 border ${
                            active
                              ? 'bg-accent text-white border-accent'
                              : 'bg-card text-ink-3 border-line hover:text-ink'
                          }`}
                        >
                          {active && (
                            <Check
                              className="w-2.5 h-2.5 shrink-0"
                              strokeWidth={2}
                            />
                          )}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-raised/60 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[12px] text-ink-3">
            {t('addSubscriptionDefaultNote')}
          </span>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-ink-2 hover:text-ink rounded-lg transition-colors"
            >
              {t('closeImage')}
            </button>

            <button
              type="button"
              onClick={handleConfirmSubscribe}
              disabled={isSubmitting}
              className="h-9 px-4 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>
                {isSubmitting
                  ? t('addSubscriptionSubmitting')
                  : t('addSubscriptionSubmit')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
