import { useState } from 'react';
import { Copy, Check, Send, Play, Terminal, ArrowUpRight } from 'lucide-react';
import { FacebookApiClient } from '../services/api';

export function ApiInspectorModal() {
  const [activeEndpoint, setActiveEndpoint] = useState<'recent' | 'run' | 'datasets' | 'debug'>('recent');
  const [queryPage, setQueryPage] = useState('MFU2Connect');
  const [queryLimit, setQueryLimit] = useState(10);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const baseUrl = FacebookApiClient.getBaseUrl();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestCall = async () => {
    setIsCalling(true);
    setTestResult(null);
    const start = performance.now();

    try {
      if (activeEndpoint === 'recent') {
        const res = await FacebookApiClient.getRecentPosts(queryPage, queryLimit);
        const elapsed = Math.round(performance.now() - start);
        setTestResult({
          status: 200,
          elapsedMs: elapsed,
          data: res.data,
          isSimulated: res.isSimulated,
        });
      } else if (activeEndpoint === 'datasets') {
        const res = await FacebookApiClient.getDatasets();
        const elapsed = Math.round(performance.now() - start);
        setTestResult({
          status: 200,
          elapsedMs: elapsed,
          data: res.data,
          isSimulated: res.isSimulated,
        });
      } else if (activeEndpoint === 'run') {
        const res = await FacebookApiClient.runFacebookScraper({
          captionText: false,
          resultsLimit: 1,
          startUrls: [{ url: 'https://www.facebook.com/MFU2Connect' }],
        });
        const elapsed = Math.round(performance.now() - start);
        setTestResult({
          status: 200,
          elapsedMs: elapsed,
          data: res.data,
          isSimulated: res.isSimulated,
        });
      } else if (activeEndpoint === 'debug') {
        const ping = await FacebookApiClient.checkConnection();
        const elapsed = Math.round(performance.now() - start);
        setTestResult({
          status: ping.ok ? 200 : 503,
          elapsedMs: elapsed,
          data: ping,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 500,
        error: err.message,
      });
    } finally {
      setIsCalling(false);
    }
  };

  const httpSnippets = {
    recent: `@baseUrl = ${baseUrl}\n\n### Test: Get 10 recent unique posts\nGET {{baseUrl}}/api/posts/recent?page=${queryPage}&limit=${queryLimit}\nAccept: application/json`,
    run: `@baseUrl = ${baseUrl}\n\nPOST {{baseUrl}}/api/actors/facebook-posts-scraper/run\nContent-Type: application/json\nAccept: application/json\n\n{\n    "captionText": false,\n    "resultsLimit": 1,\n    "startUrls": [\n        {\n            "url": "https://www.facebook.com/MFU2Connect"\n        },\n        {\n            "url": "https://www.facebook.com/profile.php?id=61563364138740"\n        }\n    ]\n}`,
    datasets: `@baseUrl = ${baseUrl}\n\n### Get datasets owned by your Apify account\nGET {{baseUrl}}/api/datasets?limit=100&offset=0\nAccept: application/json`,
    debug: `@baseUrl = ${baseUrl}\n\n### Debug: List dataset IDs\nGET {{baseUrl}}/api/debug/datasets\nAccept: application/json`,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          C# Backend HTTP API Explorer
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          ทดสอบยิง Request ตรงไปยัง ASP.NET Core Backend (พอร์ต 5030) และคัดลอกไฟล์ .http หรือ cURL
        </p>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setActiveEndpoint('recent');
            setTestResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            activeEndpoint === 'recent'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          GET /api/posts/recent
        </button>
        <button
          onClick={() => {
            setActiveEndpoint('run');
            setTestResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            activeEndpoint === 'run'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          POST /api/actors/.../run
        </button>
        <button
          onClick={() => {
            setActiveEndpoint('datasets');
            setTestResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            activeEndpoint === 'datasets'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          GET /api/datasets
        </button>
        <button
          onClick={() => {
            setActiveEndpoint('debug');
            setTestResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            activeEndpoint === 'debug'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          GET /api/debug/datasets
        </button>
      </div>

      {/* Parameters Panel if active is recent */}
      {activeEndpoint === 'recent' && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">page:</span>
            <input
              type="text"
              value={queryPage}
              onChange={(e) => setQueryPage(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md font-mono text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">limit:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={queryLimit}
              onChange={(e) => setQueryLimit(Number(e.target.value))}
              className="w-16 px-2.5 py-1 border border-slate-200 rounded-md font-mono text-slate-800"
            />
          </div>
        </div>
      )}

      {/* Code Snippet Box */}
      <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-md">
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>rest-client.http</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(httpSnippets[activeEndpoint], 'http')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              {copiedKey === 'http' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'http' ? 'คัดลอกแล้ว' : 'คัดลอก .http'}</span>
            </button>

            <button
              onClick={handleTestCall}
              disabled={isCalling}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isCalling ? 'animate-pulse' : ''}`} />
              <span>{isCalling ? 'กำลังยิง...' : 'ยิงทดสอบ (Send Request)'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-xs overflow-x-auto">
          <pre>{httpSnippets[activeEndpoint]}</pre>
        </div>
      </div>

      {/* Response Box */}
      {testResult && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">ผลลัพธ์ตอบกลับ (Response):</span>
              <span className="font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                HTTP {testResult.status}
              </span>
              <span className="font-mono text-slate-500 tabular-nums">
                {testResult.elapsedMs} ms
              </span>
            </div>

            {testResult.isSimulated && (
              <span className="font-mono text-amber-700 text-[11px]">
                (Simulated Response Mode)
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96">
            <pre>{JSON.stringify(testResult.data || testResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
