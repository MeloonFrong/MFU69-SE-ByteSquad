import { useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Code } from 'lucide-react';
import { FacebookApiClient } from '../services/api';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

export function BackendSettingsModal({
  isOpen,
  onClose,
  onStatusChange,
}: BackendSettingsModalProps) {
  const [urlInput, setUrlInput] = useState(FacebookApiClient.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isCopiedCors, setIsCopiedCors] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    FacebookApiClient.setBaseUrl(urlInput);
    onStatusChange();
  };

  const handleTestConnection = async () => {
    FacebookApiClient.setBaseUrl(urlInput);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await FacebookApiClient.checkConnection();
      setTestResult(res);
      onStatusChange();
    } finally {
      setIsTesting(false);
    }
  };

  const corsCSharpSnippet = `// ในไฟล์ Program.cs ของ C# Backend:
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors(); // <-- เพิ่มบรรทัดนี้ก่อน map endpoints`;

  const handleCopyCors = () => {
    navigator.clipboard.writeText(corsCSharpSnippet);
    setIsCopiedCors(true);
    setTimeout(() => setIsCopiedCors(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              การเชื่อมต่อ C# Backend
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Base URL configuration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900">
              Backend Base URL (พอร์ตของ C# ASP.NET Core)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:5030"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบ Ping'}</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span>เลือกด่วน:</span>
              <button
                type="button"
                onClick={() => setUrlInput('http://localhost:5030')}
                className="font-mono text-[11px] text-blue-600 hover:underline"
              >
                http://localhost:5030
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setUrlInput('http://127.0.0.1:5030')}
                className="font-mono text-[11px] text-blue-600 hover:underline"
              >
                http://127.0.0.1:5030
              </button>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {testResult.ok
                    ? 'เชื่อมต่อ C# Backend สำเร็จ!'
                    : 'ยังไม่สามารถเชื่อมต่อไปยัง URL นี้ได้โดยตรง'}
                </p>
                <p className="text-[11px] opacity-90">{testResult.message}</p>
                {!testResult.ok && (
                  <p className="text-[11px] text-amber-800 pt-1">
                    ระบบจะเปิดโหมด <strong>Simulator อัตโนมัติ</strong> เพื่อให้สามารถใช้งาน ทดสอบ Scraper และดูตัวอย่าง Feed ได้ทันที
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CORS Guide for C# */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-500" />
                <span>คำแนะนำ: การตั้งค่า CORS ใน C# Backend</span>
              </span>
              <button
                onClick={handleCopyCors}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {isCopiedCors ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedCors ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
              <pre>{corsCSharpSnippet}</pre>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              handleSave();
              onClose();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            บันทึกและปิด
          </button>
        </div>
      </div>
    </div>
  );
}
