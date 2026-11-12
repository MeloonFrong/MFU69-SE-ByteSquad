import { useState } from 'react';
import { X, Play, Plus, Trash2, Check, Copy, AlertCircle, FileCode, ExternalLink } from 'lucide-react';
import { ScraperRunInput, FacebookPost } from '../types/facebook';
import { FacebookApiClient } from '../services/api';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapeComplete: (newPostsCount: number) => void;
}

export function ScraperModal({ isOpen, onClose, onScrapeComplete }: ScraperModalProps) {
  const [urls, setUrls] = useState<string[]>([
    'https://www.facebook.com/MFU2Connect',
    'https://www.facebook.com/profile.php?id=61563364138740',
  ]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [resultsLimit, setResultsLimit] = useState<number>(2);
  const [captionText, setCaptionText] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'json' | 'preview'>('config');

  if (!isOpen) return null;

  const handleAddUrl = () => {
    if (!newUrlInput.trim()) return;
    let url = newUrlInput.trim();
    if (!url.startsWith('http')) {
      url = 'https://www.facebook.com/' + url;
    }
    if (!urls.includes(url)) {
      setUrls([...urls, url]);
      setNewUrlInput('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const currentPayload: ScraperRunInput = {
    captionText,
    resultsLimit,
    startUrls: urls.map((url) => ({ url })),
  };

  const handleExecuteScrape = async () => {
    if (urls.length === 0) {
      setError('กรุณาระบุอย่างน้อย 1 Facebook URL');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResultData(null);

    try {
      const response = await FacebookApiClient.runFacebookScraper(currentPayload);
      if (response.success) {
        setResultData(response);
        setActiveTab('preview');
        onScrapeComplete(response.postsAdded);
      } else {
        setError('เกิดข้อผิดพลาดในการเรียก Scraper');
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถสั่งงาน Scraper ได้');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              สั่งงาน Apify Facebook Posts Scraper
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              POST /api/actors/facebook-posts-scraper/run
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ตั้งค่ารีเควสต์ (Parameters)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Payload JSON & HTTP Format
          </button>
          {resultData && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 transition-colors border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              ผลลัพธ์ที่ได้ ({resultData.postsAdded} โพสต์)
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Target URLs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">
                    รายการโปรไฟล์หรือเพจ Facebook ที่ต้องการ Scrape (startUrls)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {urls.length} URLs
                  </span>
                </div>

                <div className="space-y-2">
                  {urls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-mono text-slate-700 truncate">{url}</span>
                      <button
                        onClick={() => handleRemoveUrl(idx)}
                        title="ลบ URL"
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add URL Row */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="ใส่ URL เช่น https://www.facebook.com/MFU2Connect"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม URL</span>
                  </button>
                </div>
              </div>

              {/* resultsLimit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">
                    จำนวนโพสต์สูงสุดที่ดึงต่อโปรไฟล์ (resultsLimit)
                  </label>
                  <span className="text-xs font-mono font-semibold text-blue-600">
                    {resultsLimit} โพสต์
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={resultsLimit}
                  onChange={(e) => setResultsLimit(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>1 โพสต์ (ด่วน)</span>
                  <span>10 โพสต์</span>
                  <span>20 โพสต์</span>
                </div>
              </div>

              {/* captionText Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">captionText</div>
                  <div className="text-[11px] text-slate-500">
                    กำหนดค่า captionText สำหรับ Apify Actor (ค่าปริยาย: false)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCaptionText(!captionText)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    captionText ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      captionText ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  HTTP Request Spec (ตรงกับ C# Backend):
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <div className="text-blue-400 mb-1">POST {'{{baseUrl}}'}/api/actors/facebook-posts-scraper/run</div>
                <div className="text-slate-400 mb-3">Content-Type: application/json</div>
                <pre>{JSON.stringify(currentPayload, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'preview' && resultData && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                <span>
                  Scrape สำเร็จ! ได้รับข้อมูลมาทั้งหมด <strong>{resultData.postsAdded}</strong> โพสต์
                </span>
                {resultData.isSimulated && (
                  <span className="font-mono text-[11px] text-amber-700">
                    (ผลลัพธ์จากโหมดจำลอง)
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-800">ตัวอย่างโพสต์ที่ได้รับ:</h4>
                <div className="space-y-2">
                  {(Array.isArray(resultData.data) ? resultData.data : [resultData.data]).map(
                    (p: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900">
                          {p.pageName || p.user?.name || 'Facebook Post'}
                        </div>
                        <p className="text-slate-600 line-clamp-2">
                          {p.caption || p.text || 'ไม่มีแคปชั่น'}
                        </p>
                        {p.facebookUrl && (
                          <a
                            href={p.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline pt-1"
                          >
                            <span>{p.facebookUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={handleExecuteScrape}
            disabled={isRunning}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>
              {isRunning
                ? 'กำลังเชื่อมต่อ Apify Scraper...'
                : 'เริ่ม Scrape ข้อมูล (Run Scraper)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
