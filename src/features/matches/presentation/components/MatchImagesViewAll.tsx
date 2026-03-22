import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  ArrowLeft,
  DownloadCloud,
  X
} from 'lucide-react';

interface MatchImage {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
}

interface MatchImagesViewAllProps {
  matchId: string;
}

interface ImagesResponse {
  images: MatchImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MatchImagesViewAll({ matchId }: MatchImagesViewAllProps) {
  const [images, setImages] = useState<MatchImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const imagesPerPage = 24; // More images per page for "view all"

  const fetchMatchImages = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/matches/${matchId}/images?page=${page}&limit=${imagesPerPage}`);
      if (!response.ok) throw new Error('Failed to fetch match images');
      const data: ImagesResponse = await response.json();
      setImages(data.images);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setCurrentPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Failed to load match images');
    } finally {
      setLoading(false);
    }
  }, [matchId, imagesPerPage]);

  useEffect(() => {
    if (matchId) {
      fetchMatchImages(currentPage);
    }
  }, [matchId, fetchMatchImages, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedImages(new Set()); // Clear selection on page change
    }
  };

  const handleDownload = async (image: MatchImage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract file extension from URL or use default
      const urlPath = new URL(image.url).pathname;
      const extension = urlPath.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0] || '.jpg';
      a.download = `${image.title || `match-image-${image.id}`}${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
      // Fallback: open in new tab
      window.open(image.url, '_blank');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return;
    
    setDownloading(true);
    try {
      const selectedImageObjects = images.filter(img => selectedImages.has(img.id));
      
      // Download images one by one with a small delay to avoid browser blocking
      for (let i = 0; i < selectedImageObjects.length; i++) {
        await handleDownload(selectedImageObjects[i]);
        // Small delay between downloads
        if (i < selectedImageObjects.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setSelectedImages(new Set());
    } catch (err) {
      console.error('Error downloading images:', err);
      alert('Some images failed to download. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              All Match Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              All Match Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * imagesPerPage + 1;
  const endIndex = Math.min(currentPage * imagesPerPage, total);
  const allSelected = images.length > 0 && selectedImages.size === images.length;
  const someSelected = selectedImages.size > 0 && selectedImages.size < images.length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/admin/matches/view/${matchId}`} data-astro-prefetch>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Match
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              All Match Images
            </h1>
            {total > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {total} {total === 1 ? 'image' : 'images'} total
              </p>
            )}
          </div>
        </div>
        {selectedImages.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedImages.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDownload}
              disabled={downloading}
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : `Download ${selectedImages.size}`}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedImages(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {images.length > 0 ? (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label className="text-sm font-medium cursor-pointer" onClick={toggleSelectAll}>
                    {allSelected ? 'Deselect All' : someSelected ? `${selectedImages.size} Selected` : 'Select All'}
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{total}</span> images
                </p>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {images.map((image) => {
                  const isSelected = selectedImages.has(image.id);
                  return (
                    <div
                      key={image.id}
                      className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div 
                        className="absolute top-2 left-2 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSelection(image.id);
                        }}
                      >
                        <div className={`w-6 h-6 rounded bg-background/90 backdrop-blur-sm flex items-center justify-center border-2 ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Image */}
                      <img
                        src={image.thumbnail || image.url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onClick={() => window.open(image.url, '_blank')}
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(image.url, '_blank');
                          }}
                          title="View full size"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={(e) => handleDownload(image, e)}
                          title="Download image"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                        {image.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No images uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
