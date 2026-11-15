import { useState } from 'react';
import { AlertCircle, Check, Copy, Send, Terminal } from 'lucide-react';
import { FacebookApiClient } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

export function ApiInspectorModal() {
  const { t, formatNumber } = useI18n();
  const [activeEndpoint, setActiveEndpoint] = useState<
    'recent' | 'run' | 'datasets' | 'debug'
  >('recent');
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
          status: res.isSimulated ? 503 : 200,
          elapsedMs: elapsed,
          data: res.data,
          isSimulated: res.isSimulated,
        });
      } else if (activeEndpoint === 'datasets') {
        const res = await FacebookApiClient.getDatasets();
        const elapsed = Math.round(performance.now() - start);
        setTestResult({
          status: res.isSimulated ? 503 : 200,
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
          status: res.isSimulated ? 503 : 200,
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
          isSimulated: !ping.ok,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 500,
        error: err.message,
        isSimulated: true,
      });
    } finally {
      setIsCalling(false);
    }
  };

  const httpSnippets = {
    recent: `@baseUrl = ${baseUrl}\n\nGET {{baseUrl}}/api/posts/recent?page=${queryPage}&limit=${queryLimit}\nAccept: application/json`,
    run: `@baseUrl = ${baseUrl}\n\nPOST {{baseUrl}}/api/actors/facebook-posts-scraper/run\nContent-Type: application/json\nAccept: application/json\n\n{\n  "captionText": false,\n  "resultsLimit": 1,\n  "startUrls": [\n    {\n      "url": "https://www.facebook.com/MFU2Connect"\n    }\n  ]\n}`,
    datasets: `@baseUrl = ${baseUrl}\n\nGET {{baseUrl}}/api/datasets?limit=100&offset=0\nAccept: application/json`,
    debug: `@baseUrl = ${baseUrl}\n\nGET {{baseUrl}}/\nAccept: text/plain, application/json`,
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="pb-5 border-b border-line">
        <h1 className="text-[28px] leading-tight font-medium text-ink tracking-tight">
          {t('toolApi')}
        </h1>
        <p className="text-[14px] text-ink-2 mt-1">{t('apiDesc')}</p>
      </div>

      {/* Endpoint tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'recent', label: 'GET /api/posts/recent' },
            { id: 'run', label: 'POST /api/actors/.../run' },
            { id: 'datasets', label: 'GET /api/datasets' },
            { id: 'debug', label: `GET / (${t('apiHealth')})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveEndpoint(item.id);
              setTestResult(null);
            }}
            className={`h-9 px-3.5 text-[13px] font-mono rounded-lg border transition-colors whitespace-nowrap ${
              activeEndpoint === item.id
                ? 'bg-raised text-ink border-line-strong font-medium'
                : 'bg-card text-ink-2 border-line hover:bg-raised/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeEndpoint === 'recent' && (
        <div className="p-4 bg-card border border-line rounded-xl flex flex-wrap items-center gap-4 text-[13px]">
          <label className="flex items-center gap-2">
            <span className="font-medium text-ink">page</span>
            <input
              type="text"
              value={queryPage}
              onChange={(e) => setQueryPage(e.target.value)}
              className="h-9 px-3 border border-line rounded-lg font-mono text-ink bg-card"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-medium text-ink">limit</span>
            <input
              type="number"
              min={1}
              max={100}
              value={queryLimit}
              onChange={(e) => setQueryLimit(Number(e.target.value))}
              className="w-20 h-9 px-3 border border-line rounded-lg font-mono text-ink bg-card tabular-nums"
            />
          </label>
        </div>
      )}

      {activeEndpoint === 'run' && (
        <div className="text-[13px] text-ink-2">{t('apiRunWarning')}</div>
      )}

      {/* Snippet Box */}
      <div className="bg-card rounded-2xl overflow-hidden border border-line shadow-[var(--shadow-small)]">
        <div className="px-5 py-3 bg-raised/60 border-b border-line flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px] font-mono text-ink-3">
            <Terminal className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span>request.http</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(httpSnippets[activeEndpoint], 'http')}
              className="h-8 px-3 text-[12px] bg-card border border-line hover:bg-raised text-ink rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              {copiedKey === 'http' ? (
                <Check className="w-3.5 h-3.5 text-positive" strokeWidth={1.5} />
              ) : (
                <Copy className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
              )}
              <span>{copiedKey === 'http' ? t('copied') : t('apiCopyHttp')}</span>
            </button>

            <button
              type="button"
              onClick={handleTestCall}
              disabled={isCalling}
              className="h-8 px-3.5 text-[12px] bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isCalling ? t('apiSending') : t('apiSend')}</span>
            </button>
          </div>
        </div>

        <div className="p-5 font-mono text-[12px] text-ink overflow-x-auto">
          <pre>{httpSnippets[activeEndpoint]}</pre>
        </div>
      </div>

      {/* Response Box */}
      {testResult && (
        <div className="space-y-3">
          {testResult.isSimulated && (
            <div
              role="alert"
              className="p-4 bg-negative-soft border border-negative-line rounded-xl text-[13px] text-negative-ink flex items-start gap-2.5"
            >
              <AlertCircle
                className="w-4 h-4 text-negative shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <span>{t('apiFailedBody')}</span>
            </div>
          )}

          <div className="bg-card border border-line rounded-2xl overflow-hidden shadow-[var(--shadow-small)]">
            <div className="px-5 py-3 border-b border-line bg-raised/60 flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink">{t('apiResponse')}</span>
                <span
                  className={`font-mono text-[12px] px-2 py-0.5 rounded-md font-medium ${
                    testResult.status === 200
                      ? 'bg-raised text-positive'
                      : 'bg-negative-soft text-negative'
                  }`}
                >
                  HTTP {testResult.status}
                </span>
                {testResult.elapsedMs !== undefined && (
                  <span className="font-mono text-[12px] text-ink-3 tabular-nums">
                    {formatNumber(testResult.elapsedMs)} ms
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 bg-raised text-ink font-mono text-[12px] overflow-x-auto max-h-96">
              <pre>{JSON.stringify(testResult.data || testResult, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
