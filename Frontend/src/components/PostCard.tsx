import { useState } from 'react';
import { ExternalLink, Copy, Check, MessageSquare, ThumbsUp, Share2, Facebook, ShieldCheck } from 'lucide-react';
import { FacebookPost } from '../types/facebook';
import { FacebookApiClient } from '../services/api';

interface PostCardProps {
  post: FacebookPost;
  onImageClick?: (imageUrl: string) => void;
}

export function PostCard({ post, onImageClick }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const caption = post.caption || post.text || post.message || '';
  const postKey = FacebookApiClient.getPostKey(post);
  const timestamp = FacebookApiClient.getPostTimestamp(post);
  
  // Format Date & Time
  const formattedDate = timestamp ? new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp)) : 'ไม่ระบุวันเวลา';

  const relativeTime = (() => {
    if (!timestamp) return '';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} วันที่แล้ว`;
    return '';
  })();

  const handleCopyLink = () => {
    const targetUrl = post.facebookUrl || post.url || window.location.href;
    navigator.clipboard.writeText(targetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const images = post.images && post.images.length > 0 
    ? post.images 
    : post.imageUrl 
    ? [post.imageUrl] 
    : [];

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const isLongCaption = caption.length > 280;
  const displayedCaption = isLongCaption && !isExpanded 
    ? caption.slice(0, 280) + '...' 
    : caption;

  const pageDisplayName = post.user?.name || post.pageName || 'Facebook Page';
  const isMfuPage = pageDisplayName.includes('MFU') || (post.pageName && post.pageName.includes('MFU'));

  const sharedPageName: any = post.sharedPost?.pageName;

const sharedPostAuthor =
  post.sharedPost?.authorName ||
  (typeof sharedPageName === 'string'
    ? sharedPageName
    : sharedPageName?.name) ||
  'เพจต้นทาง';

  return (
    <article className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
      {/* New Scraped Badge Indicator (Clean inline banner, not pill) */}
      {post.isScrapedNew && (
        <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-1.5 text-xs font-medium text-blue-700 flex items-center justify-between">
          <span>เพิ่ง Scrape สำเร็จจาก Apify Actor (Real-time)</span>
          <span className="font-mono text-[11px] text-blue-600">ID: {post.postId || 'NEW'}</span>
        </div>
      )}

      {/* Header Profile Zone */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Profile Avatar with fallback */}
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {post.user?.profilePic ? (
                <img
                  src={post.user.profilePic}
                  alt={pageDisplayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="select-none">{pageDisplayName.slice(0, 2).toUpperCase()}</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900 text-sm tracking-tight hover:text-blue-600 transition-colors">
                  {pageDisplayName}
                </span>
                {isMfuPage && (
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" aria-label="เพจยืนยันตัวตน" />
                )}
              </div>

              {/* Unboxed Metadata with · separator (Zero-pill discipline) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-normal">
                {relativeTime && (
                  <>
                    <span>{relativeTime}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="tabular-nums">{formattedDate}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={postKey}>
                  {postKey}
                </span>
              </div>
            </div>
          </div>

          {/* Original Post Link & Copy Affordance */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์โพสต์"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            {post.facebookUrl && (
              <a
                href={post.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดโพสต์ต้นฉบับบน Facebook"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Caption Prose */}
        {caption && (
          <div className="mt-3.5 text-slate-800 text-[14.5px] leading-relaxed whitespace-pre-line font-normal break-words">
            {displayedCaption}
            {isLongCaption && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 text-blue-600 hover:text-blue-700 font-medium text-xs inline-block"
              >
                {isExpanded ? 'ย่อข้อความ' : 'ดูเพิ่มเติม'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Gallery Grid */}
      {images.length > 0 && (
        <div className="bg-slate-50 border-y border-slate-100 overflow-hidden">
          {images.length === 1 && (
            <div
              className="relative w-full max-h-[520px] overflow-hidden bg-slate-900/5 cursor-pointer group"
              onClick={() => onImageClick?.(images[0])}
            >
              {!imageErrors[0] ? (
                <img
                  src={images[0]}
                  alt="Post visual attachment"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[520px] object-cover mx-auto group-hover:scale-[1.01] transition-transform duration-200"
                  onError={() => handleImageError(0)}
                />
              ) : (
                <div className="w-full h-64 bg-linear-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Facebook className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-medium">รูปภาพแนบในโพสต์ Facebook</span>
                </div>
              )}
            </div>
          )}

          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-1 bg-slate-200">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer group"
                  onClick={() => onImageClick?.(img)}
                >
                  {!imageErrors[idx] ? (
                    <img
                      src={img}
                      alt={`Post attachment ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      onError={() => handleImageError(idx)}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      รูปภาพ {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {images.length === 3 && (
            <div className="grid grid-cols-3 gap-1 bg-slate-200">
              <div
                className="col-span-2 aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer group"
                onClick={() => onImageClick?.(images[0])}
              >
                {!imageErrors[0] ? (
                  <img
                    src={images[0]}
                    alt="Post attachment 1"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    onError={() => handleImageError(0)}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    รูปภาพ 1
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {images.slice(1, 3).map((img, idx) => (
                  <div
                    key={idx + 1}
                    className="relative flex-1 min-h-[90px] overflow-hidden bg-slate-100 cursor-pointer group"
                    onClick={() => onImageClick?.(img)}
                  >
                    {!imageErrors[idx + 1] ? (
                      <img
                        src={img}
                        alt={`Post attachment ${idx + 2}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        onError={() => handleImageError(idx + 1)}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        รูปภาพ {idx + 2}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length >= 4 && (
            <div className="grid grid-cols-2 gap-1 bg-slate-200">
              {images.slice(0, 4).map((img, idx) => {
                const isLastWithMore = idx === 3 && images.length > 4;
                const remaining = images.length - 4;
                return (
                  <div
                    key={idx}
                    className="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer group"
                    onClick={() => onImageClick?.(img)}
                  >
                    {!imageErrors[idx] ? (
                      <img
                        src={img}
                        alt={`Post attachment ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        onError={() => handleImageError(idx)}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        รูปภาพ {idx + 1}
                      </div>
                    )}
                    {isLastWithMore && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xl">
                        +{remaining} ภาพ
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shared Post Container */}
      {post.sharedPost && (
        <div className="mx-5 my-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500 font-medium mb-1">
            โพสต์ที่แชร์โดย {sharedPostAuthor}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{post.sharedPost.text}"
          </p>
          {post.sharedPost.url && (
            <a
              href={post.sharedPost.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <span>เปิดโพสต์ที่แชร์</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Attached Link Card Preview */}
      {post.attachedLink && (
        <div className="mx-5 my-3">
          <a
            href={post.attachedLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors bg-slate-50/50"
          >
            <div className="p-3">
              <span className="text-[11px] font-mono uppercase text-slate-500 block truncate">
                {post.attachedLink.domain || new URL(post.attachedLink.url || 'https://facebook.com').hostname}
              </span>
              <h4 className="font-semibold text-slate-900 text-sm mt-0.5 line-clamp-1">
                {post.attachedLink.title || post.attachedLink.url}
              </h4>
              {post.attachedLink.description && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {post.attachedLink.description}
                </p>
              )}
            </div>
          </a>
        </div>
      )}

      {/* Engagement & Action Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">{post.likesCount?.toLocaleString() ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">{post.commentsCount?.toLocaleString() ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">{post.sharesCount?.toLocaleString() ?? 0}</span>
          </span>
        </div>

        {post.facebookUrl && (
          <a
            href={post.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
          >
            <span>ดูโพสต์ต้นฉบับบน Facebook</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
