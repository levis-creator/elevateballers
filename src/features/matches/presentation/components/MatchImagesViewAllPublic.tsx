/**
 * MatchImagesViewAllPublic - View all match images on public page with download
 */

import { useState, useEffect, useCallback } from 'react';

interface MatchImage {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
}

interface ImagesResponse {
  images: MatchImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MatchImagesViewAllPublicProps {
  // Internal id used for API lookups (/api/matches/{id}/images).
  matchId: string;
  // Public slug used for /matches/{slug}/ navigation. Falls back to matchId.
  matchSlug?: string | null;
}

export default function MatchImagesViewAllPublic({ matchId, matchSlug }: MatchImagesViewAllPublicProps) {
  const matchPathId = matchSlug || matchId;
  const [images, setImages] = useState<MatchImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const imagesPerPage = 24;

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load match images');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      fetchMatchImages(currentPage);
    }
  }, [matchId, fetchMatchImages, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const urlPath = new URL(image.url).pathname;
      const extension = urlPath.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0] || '.jpg';
      a.download = `${image.title || `match-image-${image.id}`}${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
      window.open(image.url, '_blank');
    }
  };

  if (loading && images.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Match Photos</h1>
        <p>Loading photos...</p>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Match Photos</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Match Photos</h1>
        <p>No photos available for this match.</p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * imagesPerPage + 1;
  const endIndex = Math.min(currentPage * imagesPerPage, total);

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Match Photos</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {total} {total === 1 ? 'photo' : 'photos'} total
          </p>
        </div>
        <a href={`/matches/${matchPathId}/`} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          ← Back to Match
        </a>
      </div>

      <style>{`
        .match-images-public-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        .match-images-public-item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid #e2e8f0; }
        .match-images-public-item:hover .match-images-public-overlay { opacity: 1; pointer-events: auto; }
        .match-images-public-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; pointer-events: none; }
        .match-images-public-overlay button { pointer-events: auto; width: 40px; height: 40px; border-radius: 8px; border: none; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .match-images-public-overlay button:hover { background: #f1f5f9; }
      `}</style>

      <div className="match-images-public-grid">
        {images.map((image) => (
          <div key={image.id} className="match-images-public-item">
            <img
              src={image.thumbnail || image.url}
              alt={image.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onClick={() => window.open(image.url, '_blank')}
            />
            <div className="match-images-public-overlay">
              <button type="button" onClick={(e) => { e.stopPropagation(); window.open(image.url, '_blank'); }} title="View full size">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
              <button type="button" onClick={(e) => handleDownload(image, e)} title="Download">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.75rem', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {image.title}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Showing {startIndex}-{endIndex} of {total} photos
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) pageNum = i + 1;
              else if (currentPage <= 4) pageNum = i + 1;
              else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = currentPage - 3 + i;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: currentPage === pageNum ? '#dd3333' : 'white',
                    color: currentPage === pageNum ? 'white' : 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
