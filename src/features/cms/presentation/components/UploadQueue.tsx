import { useState, useEffect, type ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';
import { useMediaOperations } from '../../hooks/useMediaOperations';

interface UploadQueueProps {
  onRefresh?: () => void;
}

export default function UploadQueue({ onRefresh }: UploadQueueProps) {
  const [icons, setIcons] = useState<{
    Check?: ComponentType<any>;
    X?: ComponentType<any>;
    Pause?: ComponentType<any>;
    Play?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
  }>({});

  const {
    uploadQueue,
    uploadQueuePaused,
    clearUploadQueue,
    pauseUpload,
    resumeUpload,
    removeUploadQueueItem,
  } = useMediaGalleryStore();

  const { handleFilesUpload } = useMediaOperations();

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Check: mod.Check,
        X: mod.X,
        Pause: mod.Pause,
        Play: mod.Play,
        RefreshCw: mod.RefreshCw,
        AlertCircle: mod.AlertCircle,
      });
    });
  }, []);

  const CheckIcon = icons.Check;
  const XIcon = icons.X;
  const PauseIcon = icons.Pause;
  const PlayIcon = icons.Play;
  const RefreshCwIcon = icons.RefreshCw;
  const AlertCircleIcon = icons.AlertCircle;

  const handleCancelUpload = (uploadId: string) => {
    removeUploadQueueItem(uploadId);
  };

  const handleRetryUpload = async (uploadId: string) => {
    const uploadItem = uploadQueue.find((item) => item.id === uploadId);
    if (!uploadItem || uploadItem.status !== 'error') return;

    const { updateUploadQueueItem } = useMediaGalleryStore.getState();
    updateUploadQueueItem(uploadId, { status: 'pending', progress: 0, error: undefined });

    // Trigger re-upload
    const refreshCallback = onRefresh || fetchMedia;
    await handleFilesUpload([uploadItem.file], refreshCallback);
  };

  if (uploadQueue.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upload Queue ({uploadQueue.length})</h3>
          <Button variant="ghost" size="sm" onClick={clearUploadQueue}>
            Clear All
          </Button>
        </div>
        <div className="space-y-2">
          {uploadQueue.map((item) => {
            const isPaused = uploadQueuePaused.has(item.id);
            return (
              <div key={item.id} className="space-y-1 p-2 border rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{item.file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {item.status === 'pending' && (isPaused ? 'Paused' : 'Pending')}
                      {item.status === 'uploading' && (isPaused ? 'Paused' : `${item.progress}%`)}
                      {item.status === 'success' && 'Success'}
                      {item.status === 'error' && 'Error'}
                    </span>
                    {item.status === 'pending' && (
                      <>
                        {isPaused ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => resumeUpload(item.id)}
                            title="Resume"
                          >
                            {PlayIcon ? <PlayIcon size={12} /> : null}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => pauseUpload(item.id)}
                            title="Pause"
                          >
                            {PauseIcon && <PauseIcon size={12} />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCancelUpload(item.id)}
                          title="Cancel"
                        >
                          {XIcon ? <XIcon size={12} /> : null}
                        </Button>
                      </>
                    )}
                    {item.status === 'uploading' && (
                      <>
                        {isPaused ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => resumeUpload(item.id)}
                            title="Resume"
                          >
                            {PlayIcon ? <PlayIcon size={12} /> : null}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => pauseUpload(item.id)}
                            title="Pause"
                          >
                            {PauseIcon && <PauseIcon size={12} />}
                          </Button>
                        )}
                      </>
                    )}
                    {item.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRetryUpload(item.id)}
                        title="Retry"
                      >
                        {RefreshCwIcon ? <RefreshCwIcon size={12} /> : null}
                      </Button>
                    )}
                  </div>
                </div>
                {(item.status === 'uploading' || (item.status === 'pending' && !isPaused)) && (
                  <Progress value={item.progress} className="h-2" />
                )}
                {item.status === 'success' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    {CheckIcon ? <CheckIcon size={14} /> : null}
                    Upload complete
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    {AlertCircleIcon ? <AlertCircleIcon size={14} /> : null}
                    {item.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
