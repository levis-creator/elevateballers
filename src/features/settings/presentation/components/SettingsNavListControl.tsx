import { Plus, X } from 'lucide-react';
import type { Field } from '../settingsSections';

type NavItem = { label: string; path: string };

type Props = {
  field: Field;
  value: string;
  canManage: boolean;
  onChange: (key: string, value: string) => void;
};

function parseItems(value: string): NavItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      label: String(item?.label ?? ''),
      path: String(item?.path ?? ''),
    }));
  } catch {
    return [];
  }
}

export default function SettingsNavListControl({ field, value, canManage, onChange }: Props) {
  const items = parseItems(value);
  const maxItems = field.maxItems ?? 8;
  const atLimit = items.length >= maxItems;
  const write = (next: NavItem[]) => onChange(field.key, JSON.stringify(next));

  const update = (index: number, key: keyof NavItem, nextValue: string) =>
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
      <div className="eb-settings-list-labels">
        <span>Label</span>
        <span>Path</span>
        <span>Order</span>
      </div>
      {items.map((item, index) => (
        <div className="eb-settings-list-row" key={index}>
          <input
            className="eb-in"
            value={item.label}
            placeholder="Teams"
            disabled={!canManage}
            onChange={(event) => update(index, 'label', event.target.value)}
          />
          <input
            className="eb-in"
            value={item.path}
            placeholder="/teams"
            disabled={!canManage}
            onChange={(event) => update(index, 'path', event.target.value)}
          />
          <div className="eb-settings-list-actions">
            <button
              type="button"
              aria-label={`Move ${item.label || 'item'} up`}
              disabled={!canManage || index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${item.label || 'item'} down`}
              disabled={!canManage || index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="danger"
              aria-label={`Remove ${item.label || 'item'}`}
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
          onClick={() => write([...items, { label: '', path: '' }])}
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
