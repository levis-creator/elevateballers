import type { Field } from '../settingsSections';
import SettingsImageControl from './SettingsImageControl';
import SettingsFileControl from './SettingsFileControl';
import SettingsNavListControl from './SettingsNavListControl';

type Props = {
  field: Field;
  value: string;
  dirty: boolean;
  canManage: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (field: Field) => void;
};

export default function SettingsField({
  field,
  value,
  dirty,
  canManage,
  onChange,
  onReset,
}: Props) {
  const validPreviewColor = /^#[0-9a-f]{6}$/i.test(value.trim());

  return (
    <div className="eb-settings-field">
      <div className="eb-settings-field-copy">
        <div className="eb-settings-field-top">
          <label htmlFor={`setting-${field.key}`}>{field.label}</label>
          {dirty && <span className="eb-settings-dirty-dot" aria-label="Unsaved" />}
        </div>
        {field.help && <p>{field.help}</p>}
        {dirty && (
          <button className="eb-settings-reset" type="button" onClick={() => onReset(field)}>
            Reset
          </button>
        )}
      </div>
      <div className="eb-settings-field-control">
        {field.type === 'file' ? (
          <SettingsFileControl field={field} value={value} canManage={canManage} onChange={onChange} />
        ) : field.type === 'image' ? (
          <SettingsImageControl
            field={field}
            value={value}
            canManage={canManage}
            onChange={onChange}
          />
        ) : field.type === 'list' ? (
          <SettingsNavListControl
            field={field}
            value={value}
            canManage={canManage}
            onChange={onChange}
          />
        ) : field.type === 'toggle' ? (
          <button
            type="button"
            className="eb-settings-toggle"
            role="switch"
            aria-checked={value !== 'false'}
            onClick={() => onChange(field.key, value === 'false' ? 'true' : 'false')}
            disabled={!canManage}
          >
            <span className={`eb-settings-toggle-track ${value !== 'false' ? 'is-on' : ''}`}>
              <span className="eb-settings-toggle-knob" />
            </span>
            <span className="eb-settings-toggle-label">
              {value !== 'false' ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        ) : field.type === 'select' ? (
          <select
            id={`setting-${field.key}`}
            className="eb-in"
            value={value}
            onChange={(event) => onChange(field.key, event.target.value)}
            disabled={!canManage}
          >
            {field.options?.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'area' || field.type === 'json' ? (
          <textarea
            id={`setting-${field.key}`}
            className="eb-in eb-settings-textarea"
            value={value}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            disabled={!canManage}
          />
        ) : field.colorPreview ? (
          <div className="eb-settings-color-input">
            <input
              id={`setting-${field.key}`}
              className="eb-in"
              value={value}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              disabled={!canManage}
              spellCheck={false}
            />
            <span
              className={`eb-settings-color-swatch ${validPreviewColor ? '' : 'is-invalid'}`}
              style={validPreviewColor ? { backgroundColor: value } : undefined}
              aria-label={validPreviewColor ? `Colour preview ${value}` : 'Invalid hex colour'}
              title={validPreviewColor ? value : 'Enter a 6-digit hex colour'}
            />
          </div>
        ) : (
          <input
            id={`setting-${field.key}`}
            className="eb-in"
            value={value}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            disabled={!canManage}
          />
        )}
        {field.counter && field.type !== 'image' && field.type !== 'list' && (
          <div className="eb-settings-character-count">
            <span>{value.length > field.counter ? 'Over recommended length' : 'Recommended length'}</span>
            <span className={value.length > field.counter ? 'is-over' : ''}>
              {value.length} / {field.counter}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
