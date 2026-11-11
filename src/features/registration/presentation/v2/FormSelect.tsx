import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Dropdown, { DropdownChevron, type DropdownOption } from './Dropdown';

/**
 * A form field dropdown with the same look as the text inputs. A hidden
 * input carries the value so the browser's "required" check still works and
 * points at this field.
 */
export default function FormSelect({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  onChange,
  required,
  disabled,
  loading,
  searchPlaceholder,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: DropdownOption[];
  placeholder: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value && option.value !== '');
  return (
    <div ref={wrapperRef} className="relative">
      <Dropdown
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled || loading}
        ariaLabel={`${label}${selected ? `: ${selected.label}` : ''}`}
        searchPlaceholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
        triggerClassName="flex w-full items-center gap-3 rounded-lg border border-black/15 bg-paper2 px-4 py-3 text-left outline-none transition-shadow hover:border-black/25 focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/[0.12] disabled:cursor-not-allowed disabled:opacity-60 aria-expanded:border-brand aria-expanded:ring-[3px] aria-expanded:ring-brand/[0.12]"
        trigger={(_, open) => (
          <>
            <span className={`min-w-0 flex-1 truncate font-body text-[14px] ${selected ? 'text-ink2' : 'text-muted2/70'}`}>
              {loading ? 'Loading…' : (selected?.label ?? placeholder)}
            </span>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden /> : <DropdownChevron open={open} />}
          </>
        )}
      />
      <input
        tabIndex={-1}
        aria-hidden
        name={name}
        value={value}
        required={required}
        onChange={() => undefined}
        // If the browser flags this field as missing, move focus to the button.
        onFocus={() => wrapperRef.current?.querySelector('button')?.focus()}
        className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
      />
    </div>
  );
}
