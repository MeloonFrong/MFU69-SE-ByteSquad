import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FacebookPost, ScraperRunInput } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapeComplete: (newPostsCount: number, newPosts?: FacebookPost[]) => void;
}

export function ScraperModal({
  isOpen,
  onClose,
  onScrapeComplete,
}: ScraperModalProps) {
  const { t, formatNumber } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [resultsLimit, setResultsLimit] = useState<number>(3);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  if (!isOpen) return null;

  const normalizeInputUrl = (raw: string): string => {
    let url = raw.trim();
    if (!url.startsWith('http')) {
      url = 'https://www.facebook.com/' + url;
    }
    return url;
  };

  const handleAddUrl = () => {
    if (!newUrlInput.trim()) return;
    const url = normalizeInputUrl(newUrlInput);
    if (!urls.includes(url)) {
      setUrls([...urls, url]);
    }
    setNewUrlInput('');
    setError(null);
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleExecuteScrape = async () => {
    let activeUrls = [...urls];
    if (newUrlInput.trim()) {
      const pendingUrl = normalizeInputUrl(newUrlInput);
      if (!activeUrls.includes(pendingUrl)) {
        activeUrls.push(pendingUrl);
      }
      setUrls(activeUrls);
      setNewUrlInput('');
    }

    if (activeUrls.length === 0) {
      setError(t('scraperNeedUrl'));
      return;
    }

    const payload: ScraperRunInput = {
      captionText: false,
      resultsLimit,
      startUrls: activeUrls.map((url) => ({ url })),
    };

    setIsRunning(true);
    setError(null);
    setResultData(null);

    try {
      const response = await FacebookApiClient.runFacebookScraper(payload);
      if (response.success) {
        setResultData(response);
        const rawItems = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [response.data];
        const normalizedItems = rawItems
          .filter(Boolean)
          .map((item: any) => FacebookApiClient.normalizePost(item));
        onScrapeComplete(response.postsAdded, normalizedItems);
      } else {
        setError(t('scraperFailedTitle'));
      }
    } catch (err: any) {
      setError(err.message || t('scraperFailedTitle'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 overflow-y-auto">
      <div className="bg-card border border-line-strong rounded-2xl w-full max-w-xl shadow-[var(--shadow-float)] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-4">
          <h2 className="font-display text-[17px] font-semibold text-ink">
            {t('toolScraper')}
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
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          <p className="text-[13px] text-ink-2">{t('scraperDesc')}</p>

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

          {/* Target URLs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="scraper-url-input"
                className="text-[13px] font-medium text-ink"
              >
                {t('scraperUrls')}
              </label>
              <span className="text-[12px] font-mono text-ink-3 tabular-nums">
                {t('scraperUrlsCount', { n: formatNumber(urls.length) })}
              </span>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2">
                {urls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 h-10 px-3 bg-raised border border-line rounded-lg text-[13px]"
                  >
                    <span className="font-mono text-ink-2 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(idx)}
                      title={t('scraperRemove')}
                      aria-label={t('scraperRemove')}
                      className="h-7 w-7 text-ink-3 hover:text-negative rounded-md transition-colors inline-flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add URL */}
            <div className="flex gap-2">
              <input
                id="scraper-url-input"
                type="url"
                placeholder={t('scraperAddPlaceholder')}
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                className="flex-1 h-10 px-3 text-[13px] bg-card border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="h-10 px-3.5 bg-raised hover:bg-line text-ink text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
                <span>{t('scraperAdd')}</span>
              </button>
            </div>
          </div>

          {/* resultsLimit */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <label
                htmlFor="scraper-limit-range"
                className="text-[13px] font-medium text-ink"
              >
                {t('scraperLimit')}
              </label>
              <span className="text-[13px] font-mono font-medium text-ink tabular-nums">
                {t('scraperLimitValue', { n: formatNumber(resultsLimit) })}
              </span>
            </div>
            <input
              id="scraper-limit-range"
              type="range"
              min={1}
              max={20}
              value={resultsLimit}
              onChange={(e) => setResultsLimit(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[12px] text-ink-3 font-mono tabular-nums">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Scrape results preview when completed */}
          {resultData && (
            <div className="space-y-4 pt-4 border-t border-line">
              {resultData.isSimulated ? (
                <div
                  role="alert"
                  className="p-4 bg-negative-soft border border-negative-line rounded-xl text-[13px] text-negative-ink flex items-start gap-3"
                >
                  <AlertCircle
                    className="w-5 h-5 text-negative shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="space-y-1">
                    <div className="font-semibold">{t('scraperFailedTitle')}</div>
                    <div className="text-ink-2">
                      {t('scraperFailedBody', {
                        url: FacebookApiClient.getBaseUrl(),
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-raised border border-line rounded-xl text-[13px] text-ink flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-positive shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="space-y-1">
                    <div className="font-medium">
                      {t('scraperDoneTitle', {
                        n: formatNumber(resultData.postsAdded),
                      })}
                    </div>
                    <div className="text-ink-2">{t('scraperDoneBody')}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-[13px] font-medium text-ink">
                  {t('scraperResults')} ({formatNumber(resultData.postsAdded)})
                </h4>
                <div className="space-y-2">
                  {(Array.isArray(resultData.data)
                    ? resultData.data
                    : [resultData.data]
                  ).map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-raised border border-line rounded-xl text-[13px] space-y-1"
                    >
                      <div className="font-medium text-ink">
                        {p.user?.name || p.pageName || t('untitledPost')}
                      </div>
                      <p className="text-ink-2 line-clamp-2">
                        {p.caption || p.text || t('noCaption')}
                      </p>
                      {(p.facebookUrl || p.url) && (
                        <a
                          href={p.facebookUrl || p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-accent hover:text-accent-hover pt-1"
                        >
                          <span className="truncate max-w-md">
                            {p.facebookUrl || p.url}
                          </span>
                          <ExternalLink
                            className="w-3.5 h-3.5 shrink-0"
                            strokeWidth={1.5}
                          />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-raised/60 border-t border-line flex items-center justify-between gap-4">
          <span className="text-[12px] text-ink-3">{t('scraperRunHint')}</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-ink-2 hover:text-ink rounded-lg transition-colors"
            >
              {t('closeImage')}
            </button>

            <button
              type="button"
              onClick={handleExecuteScrape}
              disabled={isRunning}
              className="h-9 px-4 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" strokeWidth={1.5} />
              <span>
                {isRunning ? t('scraperRunning') : t('scraperRun')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
