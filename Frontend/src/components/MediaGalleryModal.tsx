import { X } from 'lucide-react';

interface MediaGalleryModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function MediaGalleryModal({ imageUrl, onClose }: MediaGalleryModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        title="ปิด"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="max-w-4xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full size media preview"
          referrerPolicy="no-referrer"
          className="w-full h-full max-h-[85vh] object-contain rounded-xl"
        />
      </div>
    </div>
  );
}
