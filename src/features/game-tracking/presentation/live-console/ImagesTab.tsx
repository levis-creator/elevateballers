/**
 * Match photos: an upload tile, then every image tagged to the match. Uploads
 * go to the "matches" media folder tagged `match:<id>`, like the media library.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';

interface MatchImage {
  id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  createdAt: string;
}

export default function ImagesTab({ matchId, flash }: { matchId: string; flash: (msg: string) => void }) {
  const [images, setImages] = useState<MatchImage[] | null>(null);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/images?limit=200&_=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    setImages(data?.images ?? []);
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(list.length);
    let failed = 0;
    for (const file of list) {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('folder', 'matches');
      form.append('title', file.name.replace(/\.[^.]+$/, ''));
      form.append('tags', JSON.stringify([`match:${matchId}`]));
      const res = await fetch('/api/upload/image', { method: 'POST', body: form }).catch(() => null);
      if (!res?.ok) failed++;
      setUploading((n) => n - 1);
    }
    flash(failed ? `${failed} of ${list.length} uploads failed` : `${list.length} photo${list.length === 1 ? '' : 's'} uploaded`);
    load();
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { timeZone: MATCH_TIMEZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
        className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-[var(--surf)] text-center ${
          over ? 'border-[var(--brand)]' : 'border-[var(--bord)] hover:border-[var(--tx)]'
        }`}
      >
        <span className="text-[14px] font-semibold">{uploading ? `Uploading ${uploading}…` : 'Upload photos'}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">Drop files · JPG / PNG</span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = '';
          }}
        />
      </button>
      {(images ?? []).map((im) => (
        <a
          key={im.id}
          href={im.url}
          target="_blank"
          rel="noreferrer"
          className="overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] text-[var(--tx)] no-underline hover:border-[var(--tx)] hover:text-[var(--tx)]"
        >
          <div
            className="aspect-[4/3] bg-cover bg-center"
            style={{ backgroundImage: `url("${im.thumbnail || im.url}")`, backgroundColor: 'var(--surf2)' }}
          />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-[12px] font-semibold">{im.title || 'Match photo'}</span>
            <span className="flex-shrink-0 font-mono text-[10px] text-[var(--txm)]">{when(im.createdAt)}</span>
          </div>
        </a>
      ))}
      {images === null && (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-[var(--bord)] bg-[var(--surf)] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">
          Loading…
        </div>
      )}
    </div>
  );
}
