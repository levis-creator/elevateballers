import { Plus, X } from 'lucide-react';
import type { Field } from '../settingsSections';

type ListItem = Record<string, string>;

type Props = {
  field: Field;
  value: string;
  canManage: boolean;
  onChange: (key: string, value: string) => void;
};

function parseItems(value: string, keys: string[]): ListItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      Object.fromEntries(keys.map((key) => [key, String(item?.[key] ?? '')]))
    );
  } catch {
    return [];
  }
}

export default function SettingsNavListControl({ field, value, canManage, onChange }: Props) {
  const columns = field.columns ?? [
    { key: 'label', label: 'Label', placeholder: 'Teams', width: '1fr' },
    { key: 'path', label: 'Path', placeholder: '/teams', width: '1fr' },
  ];
  const items = parseItems(value, columns.map((column) => column.key));
  const maxItems = field.maxItems ?? 8;
  const atLimit = items.length >= maxItems;
  const write = (next: ListItem[]) => onChange(field.key, JSON.stringify(next));
  const gridTemplateColumns = `${columns.map((column) => column.width ?? '1fr').join(' ')} 106px`;

  const update = (index: number, key: string, nextValue: string) =>
    write(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: nextValue } : item))
    );

  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    const next = [...items];
    [next[index], next[destination]] = [next[destination], next[index]];
    write(next);
  };

  return (
    <div className="eb-settings-list-control">
      <div className="eb-settings-list-labels" style={{ gridTemplateColumns }}>
        {columns.map((column) => <span key={column.key}>{column.label}</span>)}
        <span>Order</span>
      </div>
      {items.map((item, index) => (
        <div className="eb-settings-list-row" style={{ gridTemplateColumns }} key={index}>
          {columns.map((column) => (
            <input
              className="eb-in"
              key={column.key}
              value={item[column.key] ?? ''}
              placeholder={column.placeholder}
              disabled={!canManage}
              onChange={(event) => update(index, column.key, event.target.value)}
            />
          ))}
          <div className="eb-settings-list-actions">
            <button
              type="button"
              aria-label={`Move ${item.label || item.path || 'item'} up`}
              disabled={!canManage || index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${item.label || item.path || 'item'} down`}
              disabled={!canManage || index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="danger"
              aria-label={`Remove ${item.label || item.path || 'item'}`}
              disabled={!canManage}
              onClick={() => write(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
      <div className="eb-settings-list-footer">
        <button
          type="button"
          disabled={!canManage || atLimit}
          title={atLimit ? `Remove an item before adding another (maximum ${maxItems})` : undefined}
          onClick={() => write([...items, Object.fromEntries(columns.map((column) => [column.key, '']))])}
        >
          <Plus size={13} /> {field.addLabel || 'Add item'}
        </button>
        <span>
          {items.length} / {maxItems} items
          {atLimit ? ' · remove one to add another' : ''}
        </span>
      </div>
    </div>
  );
}
