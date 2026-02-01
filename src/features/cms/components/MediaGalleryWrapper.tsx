import { ToastProvider } from '@/components/ui/toast';
import MediaGallery from './MediaGallery';

export default function MediaGalleryWrapper() {
  try {
    return (
      <ToastProvider>
        <MediaGallery />
      </ToastProvider>
    );
  } catch (error: any) {
    console.error('MediaGalleryWrapper error:', error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error loading media gallery</h2>
          <pre className="text-sm text-muted-foreground overflow-auto">{error?.message || String(error)}</pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
