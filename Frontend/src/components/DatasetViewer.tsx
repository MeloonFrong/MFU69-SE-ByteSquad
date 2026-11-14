import { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Database,
  RefreshCw,
} from 'lucide-react';
import { ApifyDataset } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

interface DatasetViewerProps {
  onLoadItemsToFeed?: (items: any[], datasetId?: string) => void;
}

export function DatasetViewer({ onLoadItemsToFeed }: DatasetViewerProps) {
  const { t, formatNumber, formatDateTime } = useI18n();
  const [datasets, setDatasets] = useState<ApifyDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetItems, setDatasetItems] = useState<any[]>([]);
  const [isItemsSimulated, setIsItemsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async (datasetId: string) => {
    setIsLoadingItems(true);
    try {
      const res = await FacebookApiClient.getDatasetItems(datasetId, 25, 0);
      setDatasetItems(res.items);
      setIsItemsSimulated(res.isSimulated);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchDatasets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await FacebookApiClient.getDatasets();
      setDatasets(res.data);

      if (res.data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(res.data[0].id);
        fetchItems(res.data[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('datasetsLoadFailed')
      );
      setDatasets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    fetchItems(id);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(datasetItems, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <h1 className="text-[28px] leading-tight font-medium text-ink tracking-tight">
            {t('toolDatasets')}
          </h1>
          <p className="text-[14px] text-ink-2 mt-1">{t('datasetsDesc')}</p>
        </div>

        <button
          type="button"
          onClick={fetchDatasets}
          disabled={isLoading}
          className="h-9 px-3.5 text-[13px] font-medium text-ink bg-card border border-line rounded-lg hover:bg-raised transition-colors inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-ink-3 ${isLoading ? 'animate-spin' : ''}`}
            strokeWidth={1.5}
          />
          <span>{t('datasetsReload')}</span>
        </button>
      </div>

      {/* Explicit Alert when Dataset API fails */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-negative-line bg-negative-soft p-4 sm:p-5 text-negative-ink flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-negative shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="space-y-1 text-[13px]">
            <p className="font-semibold">{t('datasetsLoadFailed')}</p>
            <p className="text-ink-2 font-mono text-[12px]">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Datasets list */}
        <div className="space-y-3">
          <div className="text-[12px] font-medium text-ink-3 tabular-nums">
            {t('datasetsCount', { n: formatNumber(datasets.length) })}
          </div>

          <div className="space-y-2">
            {datasets.map((ds) => {
              const isSelected = ds.id === selectedDatasetId;
              return (
                <button
                  type="button"
                  key={ds.id}
                  onClick={() => handleSelectDataset(ds.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? 'bg-raised border-line-strong text-ink'
                      : 'bg-card border-line hover:border-line-strong text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[13px] font-medium truncate">
                      {ds.id}
                    </span>
                    <span className="text-[12px] font-mono tabular-nums text-ink-3 shrink-0">
                      {t('datasetItemsCount', {
                        n: formatNumber(ds.itemCount ?? ds.cleanItemCount ?? 0),
                      })}
                    </span>
                  </div>

                  {ds.name && (
                    <div className="text-[13px] text-ink-2 mt-1 truncate">
                      {ds.name}
                    </div>
                  )}

                  {ds.createdAt && (
                    <div className="text-[12px] text-ink-3 mt-1 font-mono tabular-nums">
                      {formatDateTime(Date.parse(ds.createdAt))}
                    </div>
                  )}
                </button>
              );
            })}

            {datasets.length === 0 && !isLoading && (
              <div className="p-6 bg-card border border-line rounded-xl text-center text-[13px] text-ink-3">
                {t('datasetsEmpty')}
              </div>
            )}
          </div>
        </div>

        {/* Dataset items inspector */}
        <div className="md:col-span-2 space-y-4">
          {isItemsSimulated && selectedDatasetId && (
            <div
              role="alert"
              className="rounded-xl border border-negative-line bg-negative-soft p-4 text-negative-ink flex items-start gap-2.5 text-[13px]"
            >
              <AlertCircle className="w-4 h-4 text-negative shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{t('datasetItemsFailed')}</span>
            </div>
          )}

          <div className="bg-card border border-line rounded-2xl overflow-hidden shadow-[var(--shadow-small)]">
            <div className="px-5 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-raised/50">
              <div className="flex items-center gap-2 min-w-0">
                <Database className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                <span className="text-[13px] font-medium text-ink font-mono truncate">
                  {selectedDatasetId || t('datasetSelect')}
                </span>
                <span className="text-[12px] text-ink-3 tabular-nums font-mono">
                  ({t('datasetItemsLoaded', { n: formatNumber(datasetItems.length) })})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  disabled={datasetItems.length === 0}
                  className="h-8 px-3 text-[12px] bg-card border border-line hover:bg-raised text-ink rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-positive" strokeWidth={1.5} />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
                  )}
                  <span>{isCopied ? t('copied') : t('copyJson')}</span>
                </button>

                {onLoadItemsToFeed && datasetItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onLoadItemsToFeed(
                        datasetItems,
                        selectedDatasetId || undefined
                      )
                    }
                    className="h-8 px-3 text-[12px] bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{t('datasetToFeed')}</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 max-h-[540px] overflow-y-auto">
              {isLoadingItems ? (
                <div className="py-12 text-center text-[13px] text-ink-3 space-y-2">
                  <RefreshCw
                    className="w-5 h-5 mx-auto animate-spin text-ink-3"
                    strokeWidth={1.5}
                  />
                  <div>{t('datasetItemsLoading')}</div>
                </div>
              ) : datasetItems.length > 0 ? (
                <div className="bg-raised border border-line text-ink p-4 rounded-xl font-mono text-[12px] overflow-x-auto max-h-[460px]">
                  <pre>{JSON.stringify(datasetItems, null, 2)}</pre>
                </div>
              ) : (
                <div className="py-12 text-center text-[13px] text-ink-3">
                  {t('datasetItemsEmpty')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
