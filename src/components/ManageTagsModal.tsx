import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Tag, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  tags: Tag[];
  onAddTag: (newTag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  language,
  tags,
  onAddTag,
  onDeleteTag,
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorClass, setColorClass] = useState('bg-indigo-100 text-indigo-800 border-indigo-200');

  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { label: 'Red', class: 'bg-red-100 text-red-800 border-red-200' },
    { label: 'Emerald', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { label: 'Amber', class: 'bg-amber-100 text-amber-800 border-amber-200' },
    { label: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
    { label: 'Teal', class: 'bg-teal-100 text-teal-800 border-teal-200' },
  ];

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let tagName = name.trim();
    if (!tagName.startsWith('#')) {
      tagName = `#${tagName}`;
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: tagName,
      color: colorClass,
      description: description.trim() || undefined,
    };

    onAddTag(newTag);
    setName('');
    setDescription('');
  };

  return (
    <div className="css-modal-overlay">
      <div className="css-modal-box max-w-lg">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-heading)' }}>{t.manageTags}</h3>
            <p className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>Python Backend • /api/tags</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Create New Tag Form */}
          <form onSubmit={handleCreateTag} className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create New Tag</span>
            </h4>

            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Scholarships, Hackathon, Housing"
                className="w-full css-input font-mono !py-1.5"
              />
            </div>

            <div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tag purpose or description (optional)"
                className="w-full css-input !py-1.5 !text-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Color:</span>
              {colorOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => setColorClass(opt.class)}
                  className={`px-2 py-0.5 text-2xs font-semibold rounded-md border transition ${opt.class} ${colorClass === opt.class ? 'ring-2 ring-indigo-500 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full css-btn-primary !py-1.5 !text-xs font-bold"
            >
              Add Tag
            </button>
          </form>

          {/* Existing Tags List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Existing Tags ({tags.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="css-tag-pill active !text-2xs">
                      {tag.name}
                    </span>
                    {tag.description && (
                      <span className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                        {tag.description}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteTag(tag.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 transition"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
