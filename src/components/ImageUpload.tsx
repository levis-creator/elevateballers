import { useState, useRef, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

const tekoFont = { fontFamily: 'Teko, sans-serif' };

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
  accept?: string;
  folder?: string;
  maxWidthOrHeight?: number;
  quality?: number;
  maxSizeMB?: number;
  variant?: 'default' | 'player';
}

type UploadMode = 'upload' | 'url';

export default function ImageUpload({
  value,
  onChange,
  disabled = false,
  label = 'Image',
  helperText,
  className,
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  folder = 'general',
  maxWidthOrHeight = 1920,
  quality = 0.8,
  maxSizeMB = 5,
  variant = 'default',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(value || null);
  const [mode, setMode] = useState<UploadMode>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  
  const isPlayerVariant = variant === 'player';

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const processFile = async (file: File) => {
    const validTypes = accept.split(',').map(t => t.trim());
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed types: ${accept}`);
      return;
    }

    setError('');
    setCompressing(true);

    try {
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
        quality: quality,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      
      setCompressing(false);
      setUploading(true);

      const formData = new FormData();
      formData.append('file', compressedFile, file.name);
      formData.append('folder', folder);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      setPreview(data.url);
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      console.error('Upload error:', err);
    } finally {
      setCompressing(false);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (!disabled && !uploading && !compressing) {
      fileInputRef.current?.click();
    }
  };

  const isProcessing = compressing || uploading;

  // Player variant - square image preview with hover overlay
  if (isPlayerVariant) {
    const defaultImage = 'https://placehold.co/400x400/3b82f6/ffffff?text=Player+Photo';
    const displayImage = preview || defaultImage;

    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label className="text-sm font-semibold text-slate-700">{label}</Label>}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl overflow-hidden transition-all',
            'border-slate-300 hover:border-yellow-400',
            (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="aspect-square relative">
            <img
              src={displayImage}
              alt="Player preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">
                    {compressing ? 'Compressing image...' : 'Uploading image...'}
                  </span>
                </div>
              </div>
            )}
            {!isProcessing && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <label htmlFor={inputId} className="cursor-pointer">
                  <div className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg">
                    <Upload className="w-4 h-4" />
                    <span style={tekoFont} className="text-base">Change Photo</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Click to upload
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing || disabled}
        />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  // Default variant - original design
  return (
    <div className={cn('space-y-3', className)}>
      <Label>{label}</Label>

      {/* Image Preview */}
      {preview && (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-[300px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">
                    {compressing ? 'Compressing image...' : 'Uploading image...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setMode('upload')}
          disabled={isProcessing || disabled}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            mode === 'upload'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
            (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          disabled={isProcessing || disabled}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            mode === 'url'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
            (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Add URL
          </div>
        </button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-sm text-muted-foreground">
                {compressing ? 'Compressing image...' : 'Uploading image...'}
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadClick}
              disabled={disabled}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          )}
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => {
              const url = e.target.value;
              onChange(url);
              if (url) {
                setPreview(url);
              } else {
                setPreview(null);
              }
            }}
            disabled={isProcessing || disabled}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing || disabled}
      />

      {helperText && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
