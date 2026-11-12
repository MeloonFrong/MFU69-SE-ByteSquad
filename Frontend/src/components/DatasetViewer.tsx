import { useState, useEffect } from 'react';
import { Database, RefreshCw, Eye, ArrowRight, FileJson, Check, Copy } from 'lucide-react';
import { ApifyDataset } from '../types/facebook';
import { FacebookApiClient } from '../services/api';

interface DatasetViewerProps {
  onLoadItemsToFeed?: (items: any[]) => void;
}

export function DatasetViewer({ onLoadItemsToFeed }: DatasetViewerProps) {
  const [datasets, setDatasets] = useState<ApifyDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetItems, setDatasetItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
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
    console.error('Failed to fetch datasets:', err);

    setError(
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while loading datasets.'
    );

    setDatasets([]);
  } finally {
    setIsLoading(false);
  }
};


  const fetchItems = async (datasetId: string) => {
    setIsLoadingItems(true);
    try {
      const res = await FacebookApiClient.getDatasetItems(datasetId, 25, 0);
      setDatasetItems(res.items);
    } finally {
      setIsLoadingItems(false);
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

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  
return (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    {/* Header */}

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Apify Datasets Explorer
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          สำรวจชุดข้อมูลที่เก็บไว้ใน Apify Account ผ่าน C# Endpoint{' '}
          <code className="font-mono text-slate-700">/api/datasets</code> และ{' '}
          <code className="font-mono text-slate-700">/api/datasets/{'{id}'}/items</code>
        </p>
      </div>

      <button
        onClick={fetchDatasets}
        disabled={isLoading}
        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>รีเฟรชรายการ Datasets</span>
      </button>
    </div>

    {/* Error Message */}
    {error && (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Failed to load datasets</p>
        <p className="text-sm">{error}</p>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column: Datasets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Datasets ทั้งหมด ({datasets.length})</span>
        </div>

        <div className="space-y-2">
          {datasets.map((ds) => {
            const isSelected = ds.id === selectedDatasetId;
            return (
              <div
                key={ds.id}
                onClick={() => handleSelectDataset(ds.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 text-blue-950 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold truncate max-w-[170px]">
                    {ds.id}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                    {ds.itemCount ?? ds.cleanItemCount ?? 0} รายการ
                  </span>
                </div>

                {ds.name && (
                  <div className="text-xs text-slate-600 mt-1 truncate">
                    {ds.name}
                  </div>
                )}

                {ds.createdAt && (
                  <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                    {new Date(ds.createdAt).toLocaleDateString('th-TH')}
                  </div>
                )}
              </div>
            );
          })}

          {datasets.length === 0 && !isLoading && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              ไม่พบ Datasets ในระบบ
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Dataset Items Inspector */}
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 font-mono">
                {selectedDatasetId || 'กรุณาเลือก Dataset'}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums font-mono">
                ({datasetItems.length} items loaded)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                disabled={datasetItems.length === 0}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
              </button>

              {onLoadItemsToFeed && datasetItems.length > 0 && (
                <button
                  onClick={() => onLoadItemsToFeed(datasetItems)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-1"
                >
                  <span>นำไปแสดงใน Feed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 max-h-[560px] overflow-y-auto">
            {isLoadingItems ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-blue-600" />
                <span>กำลังดึงรายการจาก Apify Dataset...</span>
              </div>
            ) : datasetItems.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[460px]">
                  <pre>{JSON.stringify(datasetItems, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                ไม่มีรายการข้อมูลใน Dataset นี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
