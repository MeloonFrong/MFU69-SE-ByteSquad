import React, { useState } from 'react';
import { 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Check, 
  AlertCircle, 
  Pin, 
  CheckCircle2, 
  Circle,
  ThumbsUp,
  Clock
} from 'lucide-react';
import { Post, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface PostCardProps {
  post: Post;
  language: Language;
  onToggleBookmark: (postId: string) => void;
  onToggleRead: (postId: string) => void;
  onTagClick: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  language,
  onToggleBookmark,
  onToggleRead,
  onTagClick,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getPlatformDetails = () => {
    switch (post.platform) {
      case 'facebook':
        return { label: 'Facebook', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '📘' };
      case 'instagram':
        return { label: 'Instagram', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: '📷' };
      case 'tiktok':
        return { label: 'TikTok', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20', icon: '🎵' };
      default:
        return { label: 'Facebook', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '📘' };
    }
  };

  const platform = getPlatformDetails();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(post.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHrs > 0) return `${diffHrs}h ago`;
      return 'Just now';
    } catch {
      return 'Recently';
    }
  };

  const title = (language === 'th' && post.titleTh) ? post.titleTh : post.title;
  const content = (language === 'th' && post.contentTh) ? post.contentTh : post.content;

  return (
    <article
      className="css-card overflow-hidden"
      style={{
        opacity: post.isRead ? 0.75 : 1,
        borderColor: post.isPinned ? 'var(--accent-color)' : undefined,
      }}
    >
      {/* Top Banner for Pinned / Urgent */}
      {(post.isPinned || post.isImportant) && (
        <div className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between ${
          post.isImportant ? 'bg-amber-500/90 text-slate-950 font-bold' : 'bg-indigo-600 text-white'
        }`}>
          <div className="flex items-center gap-1.5">
            {post.isPinned && <Pin className="w-3.5 h-3.5 fill-current" />}
            {post.isImportant && <AlertCircle className="w-3.5 h-3.5" />}
            <span>{post.isImportant ? (language === 'th' ? 'ประกาศสำคัญ / ติดตามผล' : 'Official High-Priority Notice') : (language === 'th' ? 'ปักหมุดข่าวสาร' : 'Pinned Announcement')}</span>
          </div>
          <span className="text-2xs uppercase tracking-wider font-mono opacity-90">
            ByteSquad InfoCenter
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Source Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-2xs shrink-0"
              style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              {platform.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-heading)' }}>
                  {post.sourceName}
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border ${platform.bg}`}>
                  {platform.label}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <span>{post.sourceHandle}</span>
                <span>•</span>
                <Clock className="w-3 h-3 inline" />
                <span>{formatRelativeTime(post.publishedAt)}</span>
              </p>
            </div>
          </div>

          {/* Quick Read Status & Bookmark */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleRead(post.id)}
              className="p-1.5 rounded-lg transition"
              style={{ color: post.isRead ? '#10b981' : 'var(--text-muted)' }}
              title={post.isRead ? t.markAsUnread : t.markAsRead}
            >
              {post.isRead ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onToggleBookmark(post.id)}
              className="p-1.5 rounded-lg transition"
              style={{ color: post.isBookmarked ? '#f59e0b' : 'var(--text-muted)' }}
              title={post.isBookmarked ? t.unbookmark : t.bookmark}
            >
              <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold mb-2 leading-snug" style={{ color: 'var(--text-heading)' }}>
          {title}
        </h3>

        {/* Content */}
        <div className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          <p className={expanded ? '' : 'line-clamp-3'}>
            {content}
          </p>
          {content.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold mt-1 inline-block"
              style={{ color: 'var(--accent-color)' }}
            >
              {expanded ? (language === 'th' ? 'ย่อเนื้อหา' : 'Show less') : (language === 'th' ? 'อ่านเพิ่มเติม' : 'Read more...')}
            </button>
          )}
        </div>

        {/* Image / Banner Attachment */}
        {post.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border max-h-72" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-101 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Tags / Categories (FR-3) */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="css-tag-pill"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Engagement Mock stats */}
          <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            {post.engagement && (
              <>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.engagement.likes}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{post.engagement.shares}</span>
                </span>
              </>
            )}
          </div>

          {/* External Link & Share */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="css-btn-secondary !py-1 !px-2.5 !text-xs"
              title="Copy original link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Fulfills FR-2: Direct source redirection */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="css-btn-primary !py-1 !px-3 !text-xs font-semibold"
            >
              <span>{t.openOriginalPost}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </article>
  );
};
