import { useState } from 'react';
import {
  AlertCircle,
  Facebook,
  Instagram,
  Music2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { SubscriptionItem } from '../types/facebook';
import {
  DEFAULT_POSTS_PER_PAGE,
  parseSubscriptionInput,
} from '../services/subscriptionUtils';
import { useI18n } from '../i18n/LanguageContext';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubscriptions: (newItems: SubscriptionItem[]) => Promise<void> | void;
}

export function ScraperModal({
  isOpen,
  onClose,
  onAddSubscriptions,
}: ScraperModalProps) {
  const { t, formatNumber } = useI18n();
  const [queuedItems, setQueuedItems] = useState<SubscriptionItem[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleAddUrlToQueue = () => {
    if (!newUrlInput.trim()) return;
    const parsed = parseSubscriptionInput(
      newUrlInput,
      'facebook',
      DEFAULT_POSTS_PER_PAGE
    );
    if (!parsed) {
      setError(t('scraperNeedUrl'));
      return;
    }
    if (!queuedItems.some((item) => item.id === parsed.id)) {
      setQueuedItems((prev) => [...prev, parsed]);
    }
    setNewUrlInput('');
    setError(null);
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
        DEFAULT_POSTS_PER_PAGE
      );
      if (pending && !finalItems.some((item) => item.id === pending.id)) {
        finalItems.push(pending);
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
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
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

          {/* URL Input */}
          <div className="space-y-3">
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

            {queuedItems.length > 0 && (
              <div className="space-y-2 pt-1">
                {queuedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 h-11 px-3.5 bg-raised border border-line rounded-xl text-[13px]"
                  >
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
                      <span className="font-mono text-[11px] text-ink-3 tabular-nums">
                        {t('scraperLimitValue', { n: item.postsLimit })}
                      </span>
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
                ))}
              </div>
            )}
          </div>
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
