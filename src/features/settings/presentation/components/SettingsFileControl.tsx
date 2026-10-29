import { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import type { Field } from '../settingsSections';
import { looksLikePdf, UPLOAD_PART_BYTES } from '@/lib/pdf-upload';

/** Reads an upload reply; a platform or proxy error has no JSON body, so say what happened instead of a bare failure. */
async function readReply(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = response.status === 413 ? 'the file is larger than the server accepts' : `error ${response.status}`;
    throw new Error(result.error || `Upload failed (${reason}).`);
  }
  return result;
}

/** Sends a PDF bigger than one request allows in pieces, then asks the server to join them. */
async function uploadInPieces(file: File, onProgress: (sent: number, total: number) => void) {
  const uploadId = crypto.randomUUID();
  const parts = Math.ceil(file.size / UPLOAD_PART_BYTES);
  for (let index = 0; index < parts; index += 1) {
    onProgress(index, parts);
    const body = new FormData();
    body.append('uploadId', uploadId);
    body.append('index', String(index));
    body.append('part', file.slice(index * UPLOAD_PART_BYTES, (index + 1) * UPLOAD_PART_BYTES), 'part');
    await readReply(await fetch('/api/settings/rules-upload-part', { method: 'POST', body }));
  }
  onProgress(parts, parts);
  return readReply(await fetch('/api/settings/rules-upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, parts, fileName: file.name }),
  }));
}

type Props = { field: Field; value: string; canManage: boolean; onChange: (key: string, value: string) => void; maxSizeMB?: number };

export default function SettingsFileControl({ field, value, canManage, onChange, maxSizeMB = 25 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const upload = async (file?: File) => {
    if (!file) return;
    if (!looksLikePdf(file)) { setError('Only PDF files are allowed.'); return; }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`The PDF must be ${maxSizeMB} MB or smaller.`); return; }
    setUploading(true); setError('');
    try {
      let result;
      if (file.size > UPLOAD_PART_BYTES) {
        result = await uploadInPieces(file, (sent, total) => setProgress(`Uploading ${Math.round((sent / total) * 100)}%…`));
      } else {
        const body = new FormData(); body.append('file', file);
        result = await readReply(await fetch('/api/settings/rules-upload', { method: 'POST', body }));
      }
      if (!result.url && !result.filePath) throw new Error('Upload finished but no file address came back.');
      onChange(field.key, String(result.url || result.filePath));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setUploading(false); setProgress(''); if (input.current) input.current.value = '';
    }
  };

  return <div className="eb-settings-image-control">
    <div className="eb-settings-image-preview"><FileText size={24} /></div>
    <div className="eb-settings-image-details">
      <strong>{value ? value.split('/').pop() : 'No rulebook uploaded'}</strong>
      <span>{error || field.placeholder || `PDF up to ${maxSizeMB} MB`}</span>
      <div>
        <button type="button" disabled={!canManage || uploading} onClick={() => input.current?.click()}><Upload size={13} /> {uploading ? progress || 'Uploading…' : value ? 'Replace file' : 'Upload file'}</button>
        {value && <button type="button" className="danger" disabled={!canManage || uploading} onClick={() => onChange(field.key, '')}><Trash2 size={13} /> Remove</button>}
      </div>
      <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => upload(event.target.files?.[0])} />
    </div>
  </div>;
}
