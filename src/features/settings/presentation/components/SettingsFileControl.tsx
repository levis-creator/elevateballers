import { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import type { Field } from '../settingsSections';
import { looksLikePdf } from '@/lib/pdf-upload';

type Props = { field: Field; value: string; canManage: boolean; onChange: (key: string, value: string) => void; maxSizeMB?: number };

export default function SettingsFileControl({ field, value, canManage, onChange, maxSizeMB = 25 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file?: File) => {
    if (!file) return;
    if (!looksLikePdf(file)) { setError('Only PDF files are allowed.'); return; }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`The PDF must be ${maxSizeMB} MB or smaller.`); return; }
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/settings/rules-upload', { method: 'POST', body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        // A platform or proxy error has no JSON body; say what happened instead of a bare failure.
        const reason = response.status === 413 ? 'the file is larger than the server accepts' : `error ${response.status}`;
        throw new Error(result.error || `Upload failed (${reason}).`);
      }
      if (!result.url && !result.filePath) throw new Error('Upload finished but no file address came back.');
      onChange(field.key, String(result.url || result.filePath));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setUploading(false); if (input.current) input.current.value = '';
    }
  };

  return <div className="eb-settings-image-control">
    <div className="eb-settings-image-preview"><FileText size={24} /></div>
    <div className="eb-settings-image-details">
      <strong>{value ? value.split('/').pop() : 'No rulebook uploaded'}</strong>
      <span>{error || field.placeholder || `PDF up to ${maxSizeMB} MB`}</span>
      <div>
        <button type="button" disabled={!canManage || uploading} onClick={() => input.current?.click()}><Upload size={13} /> {uploading ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}</button>
        {value && <button type="button" className="danger" disabled={!canManage || uploading} onClick={() => onChange(field.key, '')}><Trash2 size={13} /> Remove</button>}
      </div>
      <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => upload(event.target.files?.[0])} />
    </div>
  </div>;
}
