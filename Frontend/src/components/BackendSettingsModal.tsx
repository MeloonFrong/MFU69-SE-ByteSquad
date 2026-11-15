import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  RefreshCw,
  Server,
  X,
} from 'lucide-react';
import { FacebookApiClient } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => Promise<void> | void;
}

export function BackendSettingsModal({
  isOpen,
  onClose,
  onStatusChange,
}: BackendSettingsModalProps) {
  const { t } = useI18n();
  const [urlInput, setUrlInput] = useState(FacebookApiClient.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isCopiedCors, setIsCopiedCors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(FacebookApiClient.getBaseUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    FacebookApiClient.setBaseUrl(urlInput);
    await onStatusChange();
    onClose();
  };

  const handleReset = async () => {
    FacebookApiClient.resetBaseUrl();
    setUrlInput(FacebookApiClient.getBaseUrl());
    setTestResult(null);
    await onStatusChange();
  };

  const handleTestConnection = async () => {
    FacebookApiClient.setBaseUrl(urlInput);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await FacebookApiClient.checkConnection();
      setTestResult(res);
      await onStatusChange();
    } finally {
      setIsTesting(false);
    }
  };

  const corsCSharpSnippet = `${t('backendCorsComment')}
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors(); ${t('backendCorsLine')}`;

  const handleCopyCors = () => {
    navigator.clipboard.writeText(corsCSharpSnippet);
    setIsCopiedCors(true);
    setTimeout(() => setIsCopiedCors(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 overflow-y-auto">
      <div className="bg-card border border-line-strong rounded-2xl w-full max-w-xl shadow-[var(--shadow-float)] overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <h2 className="font-display text-[16px] font-semibold text-ink">
              {t('toolBackend')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeImage')}
            className="h-8 w-8 text-ink-3 hover:text-ink hover:bg-raised rounded-lg transition-colors inline-flex items-center justify-center"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[13px] text-ink-2">{t('backendDesc')}</p>

          {/* Base URL input */}
          <div className="space-y-2">
            <label
              htmlFor="backend-url-input"
              className="text-[13px] font-medium text-ink block"
            >
              {t('backendUrl')}
            </label>
            <div className="flex gap-2">
              <input
                id="backend-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestConnection()}
                placeholder="https://infocenter-c4a7fqdegrhecdee.eastasia-01.azurewebsites.net"
                className="flex-1 h-10 px-3 text-[13px] bg-card border border-line rounded-lg font-mono text-ink focus:outline-hidden focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="h-10 px-4 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`}
                  strokeWidth={1.5}
                />
                <span>
                  {isTesting ? t('backendTesting') : t('backendTest')}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] text-ink-3">
              <span>{t('backendPresets')}:</span>
              <button
                type="button"
                onClick={() =>
                  setUrlInput(
                    'https://infocenter-c4a7fqdegrhecdee.eastasia-01.azurewebsites.net'
                  )
                }
                className="font-mono text-ink-2 hover:text-ink underline"
              >
                Azure (Production)
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setUrlInput('http://localhost:5030')}
                className="font-mono text-ink-2 hover:text-ink underline"
              >
                http://localhost:5030
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              role="alert"
              className={`p-4 rounded-xl border text-[13px] flex items-start gap-3 ${
                testResult.ok
                  ? 'bg-raised border-line text-ink'
                  : 'bg-negative-soft border-negative-line text-negative-ink'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2
                  className="w-5 h-5 text-positive shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
              ) : (
                <AlertCircle
                  className="w-5 h-5 text-negative shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
              )}
              <div className="space-y-1">
                <p className="font-medium">
                  {testResult.ok ? t('backendOk') : t('backendFail')}
                </p>
                <p className="text-[12px] text-ink-2 font-mono">
                  {testResult.message}
                </p>
                {!testResult.ok && (
                  <p className="text-[12px] text-ink-2 pt-1">
                    {t('backendFailHint')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CORS snippet */}
          <div className="space-y-2.5 pt-4 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">
                {t('backendCors')}
              </span>
              <button
                type="button"
                onClick={handleCopyCors}
                className="h-8 px-2.5 text-[12px] text-ink-2 hover:text-ink bg-raised hover:bg-line rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                {isCopiedCors ? (
                  <Check className="w-3.5 h-3.5 text-positive" strokeWidth={1.5} />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
                )}
                <span>{isCopiedCors ? t('copied') : t('copyLink')}</span>
              </button>
            </div>
            <div className="p-4 bg-raised border border-line text-ink rounded-xl font-mono text-[12px] overflow-x-auto leading-relaxed">
              <pre>{corsCSharpSnippet}</pre>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-raised/60 border-t border-line flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3 text-[13px] text-ink-3 hover:text-ink transition-colors"
          >
            {t('backendReset')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-4 bg-ink hover:bg-ink/90 text-white text-[13px] font-medium rounded-lg transition-colors"
          >
            {t('backendSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
