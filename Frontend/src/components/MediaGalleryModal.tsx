import { X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface MediaGalleryModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function MediaGalleryModal({
  imageUrl,
  onClose,
}: MediaGalleryModalProps) {
  const { t } = useI18n();
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/85"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/15 rounded-lg transition-colors inline-flex items-center justify-center"
        title={t('closeImage')}
        aria-label={t('closeImage')}
      >
        <X className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <div
        className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-[var(--shadow-float)]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={t('imagePreview')}
          referrerPolicy="no-referrer"
          className="w-full h-full max-h-[85vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
