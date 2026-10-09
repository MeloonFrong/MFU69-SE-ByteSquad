import React from 'react';
import { X, Trash2, ExternalLink, Hash } from 'lucide-react';
import { Source, Tag, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ManageSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  sources: Source[];
  tags: Tag[];
  onToggleSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
  onUpdateSourceTags: (sourceId: string, tags: string[]) => void;
}

export const ManageSourcesModal: React.FC<ManageSourcesModalProps> = ({
  isOpen,
  onClose,
  language,
  sources,
  tags,
  onToggleSource,
  onDeleteSource,
  onUpdateSourceTags,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  return (
    <div className="css-modal-overlay">
      <div className="css-modal-box max-w-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-heading)' }}>{t.manageSources}</h3>
            <p className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Python REST API Endpoint: /api/sources
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-4 rounded-xl border transition"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                opacity: src.enabled ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: src.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{src.name}</h4>
                      <span className="text-2xs px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-indigo-500/10 text-indigo-400">
                        {src.platform}
                      </span>
                    </div>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{src.handle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSource(src.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition"
                    style={{
                      backgroundColor: src.enabled ? 'rgba(16, 185, 129, 0.15)' : 'var(--input-bg)',
                      borderColor: src.enabled ? '#10b981' : 'var(--border-default)',
                      color: src.enabled ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {src.enabled ? t.sourceActive : t.sourceMuted}
                  </button>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-slate-800/40"
                    style={{ color: 'var(--text-muted)' }}
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {!src.isDefault && (
                    <button
                      onClick={() => onDeleteSource(src.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                      title="Unsubscribe and remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 pt-2 border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Hash className="w-3 h-3" />
                  <span>Assigned tags:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => {
                    const isAssigned = src.tags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const newTags = isAssigned
                            ? src.tags.filter((t) => t !== tag.name)
                            : [...src.tags, tag.name];
                          onUpdateSourceTags(src.id, newTags);
                        }}
                        className={`text-2xs px-2 py-0.5 rounded-md font-medium border transition ${
                          isAssigned
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 font-semibold'
                            : 'bg-transparent text-slate-500 border-slate-700/60 hover:text-slate-300'
                        }`}
                      >
                        {tag.name} {isAssigned && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="css-btn-primary"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
