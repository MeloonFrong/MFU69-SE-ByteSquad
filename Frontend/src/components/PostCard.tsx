import { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  ExternalLink,
  Facebook,
  Film,
  Image as ImageIcon,
  Instagram,
  MessageSquare,
  Music2,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import { FacebookPost } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok';

export function detectPostPlatform(post: FacebookPost): SocialPlatform {
  if (
    post.platform === 'facebook' ||
    post.platform === 'instagram' ||
    post.platform === 'tiktok'
  ) {
    return post.platform;
  }
  const url = (post.facebookUrl || post.url || post.postUrl || '').toLowerCase();
  const page = (post.pageName || post.user?.name || '').toLowerCase();
  if (
    url.includes('instagram.com') ||
    page.includes('instagram') ||
    page.includes('humansofny')
  ) {
    return 'instagram';
  }
  if (
    url.includes('tiktok.com') ||
    page.includes('tiktok') ||
    page.includes('zenlesszonezero') ||
    page.includes('khaby.lame')
  ) {
    return 'tiktok';
  }
  return 'facebook';
}

interface PostCardProps {
  post: FacebookPost;
  onImageClick?: (imageUrl: string) => void;
}

export function PostCard({ post, onImageClick }: PostCardProps) {
  const { t, formatNumber, formatPostTimestamp } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const caption = post.caption || post.text || post.message || '';
  const timestamp = FacebookApiClient.getPostTimestamp(post);
  const formattedTimestamp = timestamp
    ? formatPostTimestamp(timestamp)
    : t('noDate');

  const platform = detectPostPlatform(post);

  const platformMeta = {
    facebook: {
      label: t('platformFacebook'),
      dotClass: 'bg-platform-fb',
      iconColorClass: 'text-platform-fb',
      Icon: Facebook,
      openLabel: t('openOnFacebook'),
    },
    instagram: {
      label: t('platformInstagram'),
      dotClass: 'bg-platform-ig',
      iconColorClass: 'text-platform-ig',
      Icon: Instagram,
      openLabel: t('openOnInstagram'),
    },
    tiktok: {
      label: t('platformTiktok'),
      dotClass: 'bg-platform-tt',
      iconColorClass: 'text-platform-tt',
      Icon: Music2,
      openLabel: t('openOnTiktok'),
    },
  }[platform];

  const PlatformIcon = platformMeta.Icon;

  const handleCopyLink = () => {
    const targetUrl = post.facebookUrl || post.url || window.location.href;
    navigator.clipboard.writeText(targetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const images =
    post.images && post.images.length > 0
      ? post.images
      : post.imageUrl
      ? [post.imageUrl]
      : [];

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const isLongCaption = caption.length > 320;
  const displayedCaption =
    isLongCaption && !isExpanded ? caption.slice(0, 320) + '…' : caption;

  const rawPage = post.pageName || post.user?.id || '';
  const pageDisplayName =
    post.user?.name || post.pageName || t('untitledPost');

  const handleLabel =
    rawPage &&
    rawPage.toLowerCase() !== pageDisplayName.toLowerCase() &&
    !rawPage.includes('profile.php')
      ? `@${rawPage.replace(/^@/, '')}`
      : null;

  const avatarInitials = pageDisplayName
    .replace(/[^a-zA-Z0-9ก-๙]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'IC';

  const sharedPageName: any = post.sharedPost?.pageName;
  const sharedPostAuthor =
    post.sharedPost?.authorName ||
    (typeof sharedPageName === 'string'
      ? sharedPageName
      : sharedPageName?.name) ||
    t('originalPage');

  const originalUrl = post.facebookUrl || post.url || post.postUrl;

  const renderFallbackMedia = (idx: number, compact: boolean = false) => {
    const isVideoPost = post.isVideo || post.mediaType === 'Video';
    return (
      <a
        href={originalUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!originalUrl) e.preventDefault();
          e.stopPropagation();
        }}
        className={`w-full ${
          compact ? 'h-full min-h-[120px]' : 'h-56'
        } bg-raised flex flex-col items-center justify-center p-4 text-center gap-2 hover:bg-line/50 transition-colors`}
      >
        <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center">
          {isVideoPost ? (
            <Film className={`w-5 h-5 ${platformMeta.iconColorClass}`} strokeWidth={1.5} />
          ) : (
            <ImageIcon className={`w-5 h-5 ${platformMeta.iconColorClass}`} strokeWidth={1.5} />
          )}
        </div>
        <div className="space-y-0.5">
          <div className="text-[13px] font-medium text-ink">
            {platformMeta.label} · {post.mediaType || (isVideoPost ? 'Video' : `Media #${idx + 1}`)}
          </div>
          {!compact && (
            <div className="text-[12px] text-ink-3">
              {t('mediaFallbackHint')}
            </div>
          )}
        </div>
      </a>
    );
  };

  return (
    <article className="bg-card border border-line rounded-2xl overflow-hidden shadow-[var(--shadow-small)]">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-raised border border-line flex items-center justify-center text-ink-2 font-medium text-[13px]">
              <span className="select-none">{avatarInitials}</span>
              {post.user?.profilePic ? (
                <img
                  src={post.user.profilePic}
                  alt={pageDisplayName}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformIcon
                  className={`w-3.5 h-3.5 shrink-0 ${platformMeta.iconColorClass}`}
                  strokeWidth={1.75}
                />
                <h3 className="font-medium text-ink text-[15px] leading-snug truncate">
                  {pageDisplayName}
                </h3>
                {handleLabel && (
                  <span className="hidden sm:inline font-mono text-[12px] text-ink-3 truncate">
                    {handleLabel}
                  </span>
                )}
              </div>

              <div className="text-[12px] text-ink-3 mt-0.5 font-mono tabular-nums">
                {formattedTimestamp}
              </div>
            </div>
          </div>

          {/* Right corner: Platform Badge + Copy action */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="h-7 px-2.5 rounded-lg bg-raised border border-line inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2"
              title={platformMeta.label}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${platformMeta.dotClass}`}
                aria-hidden="true"
              />
              <PlatformIcon
                className={`w-3.5 h-3.5 ${platformMeta.iconColorClass}`}
                strokeWidth={1.5}
              />
              <span>{platformMeta.label}</span>
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              title={isCopied ? t('copied') : t('copyLink')}
              aria-label={isCopied ? t('copied') : t('copyLink')}
              className="h-8 w-8 text-ink-3 hover:text-ink hover:bg-raised rounded-lg transition-colors inline-flex items-center justify-center"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-positive" strokeWidth={1.5} />
              ) : (
                <Copy className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Caption */}
        {caption && (
          <div className="mt-4 text-ink text-[15px] leading-relaxed whitespace-pre-line font-normal break-words">
            {displayedCaption}
            {isLongCaption && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1.5 text-accent hover:text-accent-hover font-medium text-[13px] inline-block transition-colors"
              >
                {isExpanded ? t('seeLess') : t('seeMore')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full-bleed Media Gallery */}
      {images.length > 0 && (
        <div className="bg-raised border-y border-line overflow-hidden">
          {images.length === 1 && (
            <div
              className="relative w-full max-h-[540px] overflow-hidden bg-raised cursor-pointer"
              onClick={() => !imageErrors[0] && onImageClick?.(images[0])}
            >
              {!imageErrors[0] ? (
                <img
                  src={images[0]}
                  alt={t('imageAlt', { n: 1 })}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[540px] object-cover mx-auto"
                  onError={() => handleImageError(0)}
                />
              ) : (
                renderFallbackMedia(0, false)
              )}
            </div>
          )}

          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-1 bg-line">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 overflow-hidden bg-raised cursor-pointer"
                  onClick={() => !imageErrors[idx] && onImageClick?.(img)}
                >
                  {!imageErrors[idx] ? (
                    <img
                      src={img}
                      alt={t('imageAlt', { n: idx + 1 })}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(idx)}
                    />
                  ) : (
                    renderFallbackMedia(idx, true)
                  )}
                </div>
              ))}
            </div>
          )}

          {images.length === 3 && (
            <div className="grid grid-cols-3 gap-1 bg-line">
              <div
                className="col-span-2 aspect-4/3 overflow-hidden bg-raised cursor-pointer"
                onClick={() => !imageErrors[0] && onImageClick?.(images[0])}
              >
                {!imageErrors[0] ? (
                  <img
                    src={images[0]}
                    alt={t('imageAlt', { n: 1 })}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(0)}
                  />
                ) : (
                  renderFallbackMedia(0, false)
                )}
              </div>
              <div className="flex flex-col gap-1">
                {images.slice(1, 3).map((img, idx) => (
                  <div
                    key={idx + 1}
                    className="relative flex-1 min-h-[96px] overflow-hidden bg-raised cursor-pointer"
                    onClick={() => !imageErrors[idx + 1] && onImageClick?.(img)}
                  >
                    {!imageErrors[idx + 1] ? (
                      <img
                        src={img}
                        alt={t('imageAlt', { n: idx + 2 })}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(idx + 1)}
                      />
                    ) : (
                      renderFallbackMedia(idx + 1, true)
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length >= 4 && (
            <div className="grid grid-cols-2 gap-1 bg-line">
              {images.slice(0, 4).map((img, idx) => {
                const isLastWithMore = idx === 3 && images.length > 4;
                const remaining = images.length - 4;
                return (
                  <div
                    key={idx}
                    className="relative aspect-4/3 overflow-hidden bg-raised cursor-pointer"
                    onClick={() => !imageErrors[idx] && onImageClick?.(img)}
                  >
                    {!imageErrors[idx] ? (
                      <img
                        src={img}
                        alt={t('imageAlt', { n: idx + 1 })}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(idx)}
                      />
                    ) : (
                      renderFallbackMedia(idx, true)
                    )}
                    {isLastWithMore && (
                      <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white font-medium text-lg font-mono tabular-nums pointer-events-none">
                        {t('morePhotos', { n: remaining })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shared Post */}
      {post.sharedPost && (
        <div className="mx-6 my-4 p-4 bg-raised border border-line rounded-xl">
          <div className="text-[12px] text-ink-3 font-medium mb-1">
            {t('sharedFrom', { name: sharedPostAuthor })}
          </div>
          <p className="text-[14px] text-ink-2 leading-relaxed line-clamp-4 whitespace-pre-line">
            {post.sharedPost.text}
          </p>
          {post.sharedPost.url && (
            <a
              href={post.sharedPost.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-accent-hover font-medium transition-colors"
            >
              <span>{t('openShared')}</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>
      )}

      {/* Attached Link */}
      {post.attachedLink && (
        <div className="mx-6 my-4">
          <a
            href={post.attachedLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-line rounded-xl p-4 hover:border-line-strong transition-colors bg-raised/60"
          >
            <span className="text-[12px] font-mono text-ink-3 block truncate">
              {post.attachedLink.domain ||
                (() => {
                  try {
                    return new URL(post.attachedLink.url || 'https://facebook.com').hostname;
                  } catch {
                    return 'facebook.com';
                  }
                })()}
            </span>
            <h4 className="font-medium text-ink text-[14px] mt-1 line-clamp-1">
              {post.attachedLink.title || post.attachedLink.url}
            </h4>
            {post.attachedLink.description && (
              <p className="text-[13px] text-ink-2 mt-1 line-clamp-2">
                {post.attachedLink.description}
              </p>
            )}
          </a>
        </div>
      )}

      {/* Footer: Engagement Metrics & View Original Button */}
      <div className="px-6 py-3.5 border-t border-line flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-2">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="inline-flex items-center gap-1.5" title={t('likes')}>
            <ThumbsUp className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span className="font-mono tabular-nums text-[12px] font-medium text-ink">
              {formatNumber(post.likesCount ?? 0)}
            </span>
            <span className="hidden sm:inline text-[12px] text-ink-3">
              {t('likes')}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1.5"
            title={t('comments')}
          >
            <MessageSquare className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span className="font-mono tabular-nums text-[12px] font-medium text-ink">
              {formatNumber(post.commentsCount ?? 0)}
            </span>
            <span className="hidden sm:inline text-[12px] text-ink-3">
              {t('comments')}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5" title={t('shares')}>
            <Share2 className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            <span className="font-mono tabular-nums text-[12px] font-medium text-ink">
              {formatNumber(post.sharesCount ?? 0)}
            </span>
            <span className="hidden sm:inline text-[12px] text-ink-3">
              {t('shares')}
            </span>
          </span>
          {post.viewsCount !== undefined && post.viewsCount > 0 && (
            <span className="inline-flex items-center gap-1.5" title={t('views')}>
              <Eye className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
              <span className="font-mono tabular-nums text-[12px] font-medium text-ink">
                {formatNumber(post.viewsCount)}
              </span>
              <span className="hidden sm:inline text-[12px] text-ink-3">
                {t('views')}
              </span>
            </span>
          )}
        </div>

        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-lg bg-raised hover:bg-line border border-line inline-flex items-center gap-1.5 text-ink text-[12px] font-medium transition-colors"
          >
            <span>{t('openOriginal')}</span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
          </a>
        )}
      </div>
    </article>
  );
}
