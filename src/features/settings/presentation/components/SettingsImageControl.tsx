import { useState } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import MediaPickerV2 from '@/features/media/presentation/v2/MediaPickerV2';
import type { Field } from '../settingsSections';

type Props = {
  field: Field;
  value: string;
  canManage: boolean;
  onChange: (key: string, value: string) => void;
};

function previewPath(value: string): string {
  if (value === 'assets/elevate-logo.png') return '/logo/Elevate_Logo.png';
  if (!value || value.startsWith('/') || /^(https?:)?\/\//.test(value)) return value;
  return `/${value}`;
}

export default function SettingsImageControl({ field, value, canManage, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const src = previewPath(value);

  return (
    <>
      <div className="eb-settings-image-control">
        <div className="eb-settings-image-preview">
          {src ? <img src={src} alt="" /> : <ImageIcon size={24} />}
        </div>
        <div className="eb-settings-image-details">
          <strong>
            {value ? value.split('/').pop() : field.placeholder || 'No image selected'}
          </strong>
          {field.meta && <span>{field.meta}</span>}
          <div>
            <button type="button" onClick={() => setPickerOpen(true)} disabled={!canManage}>
              <ImageIcon size={13} /> {value ? 'Change' : 'Choose from library'}
            </button>
            {value && (
              <button
                type="button"
                className="danger"
                onClick={() => onChange(field.key, '')}
                disabled={!canManage}
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaPickerV2
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => {
          onChange(field.key, url);
          setPickerOpen(false);
        }}
        title="Select logo"
        subtitle="Transparent PNG or SVG recommended"
      />
    </>
  );
}
