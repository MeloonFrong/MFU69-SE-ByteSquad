import React from 'react';
import { X, CheckCircle, RotateCcw, Users, BookOpen, FileCheck, Server } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onResetData: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  language,
  onResetData,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const teamMembers = [
    { id: '6931503026', name: 'Kunut Wongtidatorn' },
    { id: '6931503084', name: 'Anansit Inta' },
    { id: '6931503004', name: 'Htet Wai Yan' },
    { id: '6931503096', name: 'Swan Naing Aung' },
    { id: '6931503091', name: 'Aung Phone Pyae Oo' },
  ];

  const coreFeatures = [
    {
      id: '1',
      title: 'Add & Subscribe to External Source via Link',
      desc: 'Users paste links (Facebook, Instagram, TikTok, MFU portals), and the Python backend extracts and subscribes to the source.',
      status: 'Implemented (Python REST)',
    },
    {
      id: '2',
      title: 'View Aggregated Content Feed',
      desc: 'Chronological unified feed with source redirection, timestamps, bookmarks, engagement, and CSS theming.',
      status: 'Implemented',
    },
    {
      id: '3',
      title: 'Categorize and Filter Subscriptions (Tagging)',
      desc: 'Users create custom labels (#MFU, #Registrar, #Scholarships) stored in Python SQLite database with Quick Tags.',
      status: 'Implemented (Python SQLite)',
    },
    {
      id: '4',
      title: 'Information Sorting & Keyword Filtering System',
      desc: 'Full-text search, Must-Include keyword rules, and Exclude noise filters with custom sort orders.',
      status: 'Implemented',
    },
  ];

  return (
    <div className="css-modal-overlay">
      <div className="css-modal-box max-w-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Group 17 ByteSquad
              </span>
              <span className="text-2xs text-slate-400">MFU SE 15031001</span>
            </div>
            <h3 className="font-extrabold text-lg text-white">
              InfoCenter — Full-Stack Python Backend & CSS Theming
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-sm">
          {/* Mission & Background */}
          <div>
            <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Project Mission & Problem Statement</span>
            </h4>
            <p className="leading-relaxed text-xs" style={{ color: 'var(--text-secondary)' }}>
              Students and newcomers frequently miss critical university announcements because notices are scattered across Facebook pages, Instagram, TikTok, and web portals. InfoCenter unifies all selected sources into a single, clean feed with bilingual Thai & English support and a robust Python backend service.
            </p>
          </div>

          {/* Architecture info */}
          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
            <h5 className="font-bold text-xs mb-1 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Architecture</span>
            </h5>
            <p className="text-2xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              • <strong>Backend:</strong> Python RESTful HTTP Service (<code>backend/server.py</code>) running with SQLite database (<code>backend/infocenter.db</code>).<br />
              • <strong>Frontend:</strong> Modern CSS Theming (Default Dark 🌙 & Light ☀️) with responsive design system.
            </p>
          </div>

          {/* Traceability Matrix */}
          <div>
            <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>{t.srsTraceability}</span>
            </h4>
            <div className="space-y-2">
              {coreFeatures.map((feat) => (
                <div key={feat.id} className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-indigo-400">
                      {feat.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      {feat.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h4 className="font-bold mb-2.5 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <Users className="w-4 h-4 text-indigo-400" />
              <span>ByteSquad Team Members</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-lg border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                  <span className="font-mono text-2xs font-medium" style={{ color: 'var(--text-muted)' }}>{member.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.resetDemoData}</p>
              <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                Restores starter Python SQLite database and sources.
              </p>
            </div>
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="css-btn-primary"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
