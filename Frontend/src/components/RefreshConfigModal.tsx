import { useState, useEffect } from 'react';
import {
  Facebook,
  Instagram,
  Minus,
  Music2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { SubscriptionItem, SubscriptionPlatform } from '../types/facebook';
import { useI18n } from '../i18n/LanguageContext';

interface RefreshConfigModalProps {
  isOpen: boolean;
  subscriptions: SubscriptionItem[];
  onClose: () => void;
  onSaveConfig: (updatedSubscriptions: SubscriptionItem[], triggerRefresh?: boolean) => void;
  onOpenAddSubscription: () => void;
}

export function RefreshConfigModal({
  isOpen,
  subscriptions,
  onClose,
  onSaveConfig,
  onOpenAddSubscription,
}: RefreshConfigModalProps) {
  const { t, formatNumber } = useI18n();
  const [draftSubs, setDraftSubs] = useState<SubscriptionItem[]>(subscriptions);

  useEffect(() => {
    if (isOpen) {
      setDraftSubs(subscriptions.map((s) => ({ ...s, postsLimit: s.postsLimit || 1 })));
    }
  }, [isOpen, subscriptions]);

  if (!isOpen) return null;

  const handleLimitChange = (id: string, nextLimit: number) => {
    const clamped = Math.max(1, Math.min(20, nextLimit));
    setDraftSubs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, postsLimit: clamped } : item
      )
    );
  };

  const handleUnsubscribe = (id: string) => {
    setDraftSubs((prev) => prev.filter((item) => item.id !== id));
  };

  const categories: Array<{
    platform: SubscriptionPlatform;
    label: string;
    iconColorClass: string;
    Icon: typeof Facebook;
  }> = [
    {
      platform: 'facebook',
      label: t('platformFacebook'),
      iconColorClass: 'text-platform-fb',
      Icon: Facebook,
    },
    {
      platform: 'instagram',
      label: t('platformInstagram'),
      iconColorClass: 'text-platform-ig',
      Icon: Instagram,
    },
    {
      platform: 'tiktok',
      label: t('platformTiktok'),
      iconColorClass: 'text-platform-tt',
      Icon: Music2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 overflow-y-auto">
      <div className="bg-card border border-line-strong rounded-2xl w-full max-w-xl shadow-[var(--shadow-float)] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-ink">
              {t('refreshConfigTitle')}
            </h2>
            <p className="text-[12px] text-ink-3 mt-0.5">
              {t('refreshConfigDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeImage')}
            className="h-8 w-8 text-ink-3 hover:text-ink hover:bg-raised rounded-lg transition-colors inline-flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
          {draftSubs.length === 0 ? (
            <div className="p-8 bg-raised border border-line rounded-xl text-center space-y-3">
              <div className="text-[14px] font-medium text-ink">
                {t('refreshConfigEmptyTitle')}
              </div>
              <p className="text-[13px] text-ink-2 max-w-md mx-auto leading-relaxed">
                {t('refreshConfigEmptyBody')}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddSubscription();
                  }}
                  className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  <span>{t('addSourceButton').replace(/^\+\s*/, '')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat) => {
                const Icon = cat.Icon;
                const items = draftSubs.filter((s) => s.platform === cat.platform);

                return (
                  <div key={cat.platform} className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${cat.iconColorClass}`}
                          strokeWidth={1.75}
                        />
                        <span className="text-[13px] font-medium text-ink">
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-[12px] font-mono text-ink-3 tabular-nums">
                        {formatNumber(items.length)}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="px-3.5 py-2.5 rounded-xl bg-raised/50 border border-line text-[12px] text-ink-3">
                        {t('refreshConfigCategoryEmpty')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3.5 bg-raised border border-line rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-medium text-ink truncate">
                                {sub.displayName}
                              </div>
                              <div className="text-[12px] font-mono text-ink-3 truncate">
                                {sub.url}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div
                                className="h-8 px-1.5 rounded-lg bg-card border border-line inline-flex items-center gap-1"
                                aria-label={t('refreshConfigPostsPerPage')}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLimitChange(sub.id, sub.postsLimit - 1)
                                  }
                                  disabled={sub.postsLimit <= 1}
                                  className="w-6 h-6 rounded-md text-ink-2 hover:text-ink hover:bg-raised disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center transition-colors"
                                  aria-label="Decrease posts limit"
                                >
                                  <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                                <span className="w-8 text-center font-mono text-[13px] font-medium text-ink tabular-nums">
                                  {formatNumber(sub.postsLimit)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLimitChange(sub.id, sub.postsLimit + 1)
                                  }
                                  disabled={sub.postsLimit >= 20}
                                  className="w-6 h-6 rounded-md text-ink-2 hover:text-ink hover:bg-raised disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center transition-colors"
                                  aria-label="Increase posts limit"
                                >
                                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleUnsubscribe(sub.id)}
                                title={t('unsubscribeTooltip')}
                                aria-label={t('unsubscribeTooltip')}
                                className="h-8 w-8 rounded-lg text-ink-3 hover:text-negative hover:bg-card transition-colors inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-raised/60 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[12px] text-ink-3">
            {t('refreshConfigDefaultHint')}
          </span>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 text-[13px] font-medium text-ink-2 hover:text-ink rounded-lg transition-colors"
            >
              {t('refreshConfigCancel')}
            </button>

            <button
              type="button"
              onClick={() => {
                onSaveConfig(draftSubs, false);
                onClose();
              }}
              className="h-9 px-3.5 bg-raised hover:bg-line border border-line text-ink text-[13px] font-medium rounded-lg transition-colors"
            >
              {t('refreshConfigSave')}
            </button>

            {draftSubs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSaveConfig(draftSubs, true);
                  onClose();
                }}
                className="h-9 px-4 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{t('refreshConfigSaveAndRefresh')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
