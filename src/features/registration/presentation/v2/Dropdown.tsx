import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export type DropdownOption = {
  value: string;
  label: string;
  /** Short tag shown before the label, e.g. a country code. */
  badge?: string;
  /** Muted text at the end of the row, e.g. a dial code. */
  meta?: string;
  /** Extra text that search should match. */
  keywords?: string;
};

/**
 * The registration form's dropdown: a button that opens a card listing the
 * options, searchable when the list is long. Keyboard: Enter/Space/↓ open,
 * ↑↓ move, Enter choose, Escape close; typing filters when searchable.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  trigger,
  triggerClassName,
  popoverClassName = 'left-0 right-0',
  searchable = options.length > 7,
  searchPlaceholder = 'Search',
  disabled,
  id,
  invalid,
  rootClassName = 'relative',
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  trigger: (selected: DropdownOption | undefined, open: boolean) => ReactNode;
  triggerClassName: string;
  popoverClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  rootClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^\+/, '');
    if (!term) return options;
    return options.filter((option) =>
      `${option.label} ${option.badge ?? ''} ${option.meta ?? ''} ${option.keywords ?? ''}`.toLowerCase().includes(term)
    );
  }, [options, query]);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };
  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };
  const choose = (option: DropdownOption) => {
    onChange(option.value);
    close();
  };

  useEffect(() => {
    if (!open) return;
    if (searchable) searchRef.current?.focus();
    else listRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, searchable]);

  useEffect(() => {
    if (active >= matches.length) setActive(Math.max(0, matches.length - 1));
  }, [matches.length, active]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onPopoverKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActive(event.key === 'Home' ? 0 : matches.length - 1);
    } else if (event.key === 'Enter' || (event.key === ' ' && !searchable)) {
      event.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const activeId = matches[active] ? `${listId}-${active}` : undefined;

  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            openList();
          }
        }}
        className={triggerClassName}
      >
        {trigger(selected, open)}
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_18px_40px_-12px_rgba(17,12,8,0.28),0_2px_6px_rgba(17,12,8,0.06)] ${popoverClassName}`}
          onKeyDown={onPopoverKeyDown}
        >
          {searchable && (
            <label className="flex items-center gap-2 border-b border-black/[0.08] px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={activeId}
                className="w-full bg-transparent font-body text-[14px] text-ink2 outline-none placeholder:text-muted2/70"
              />
            </label>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={searchable ? undefined : -1}
            aria-activedescendant={searchable ? undefined : activeId}
            className="max-h-[248px] overflow-y-auto py-1.5 outline-none"
          >
            {matches.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value || '__empty'}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                    index === active ? 'bg-paper2' : ''
                  } ${isSelected ? 'text-brand' : option.value ? 'text-ink2' : 'text-muted'}`}
                >
                  {option.badge && (
                    <span
                      className={`w-7 shrink-0 rounded-[4px] py-[3px] text-center font-mono text-[10px] font-bold leading-none tracking-[0.06em] ${
                        isSelected ? 'bg-brand text-white' : 'bg-black/[0.06] text-ink2'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  <span className={`min-w-0 flex-1 truncate font-body text-[14px] ${isSelected ? 'font-semibold' : ''}`}>
                    {option.label}
                  </span>
                  {option.meta && <span className="font-mono text-[12px] tabular-nums text-muted">{option.meta}</span>}
                  <Check className={`h-4 w-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
                </li>
              );
            })}
            {matches.length === 0 && (
              <li className="px-4 py-6 text-center font-body text-[13px] text-muted" role="presentation">
                Nothing matches “{query}”
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The chevron used by every dropdown trigger. */
export function DropdownChevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <ChevronDown
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''} ${className}`}
      aria-hidden
    />
  );
}
