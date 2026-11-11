import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/lib/phone';
import Dropdown, { DropdownChevron } from './Dropdown';

const COUNTRY_OPTIONS = PHONE_COUNTRIES.map((country) => ({
  value: country.dial,
  label: country.name,
  badge: country.code,
  meta: `+${country.dial}`,
  keywords: country.dial,
}));

/** Country dial-code prefix inside a phone field: a compact `KE +254` button. */
export default function CountryDialPicker({
  dial,
  onChange,
  label,
}: {
  dial: string;
  onChange: (dial: string) => void;
  label: string;
}) {
  const country = PHONE_COUNTRIES.find((entry) => entry.dial === dial) ?? DEFAULT_PHONE_COUNTRY;
  return (
    <Dropdown
      value={dial}
      options={COUNTRY_OPTIONS}
      onChange={onChange}
      ariaLabel={`${label} country code: ${country.name} +${country.dial}`}
      searchable
      rootClassName="relative flex shrink-0"
      searchPlaceholder="Search country or code"
      popoverClassName="left-[-1px] w-[min(300px,calc(100vw-48px))]"
      triggerClassName="flex h-full items-center gap-2 rounded-l-lg border-r border-black/10 pl-3 pr-2.5 outline-none transition-colors hover:bg-black/[0.03] focus-visible:bg-brand/[0.06]"
      trigger={(_, open) => (
        <>
          <span className="rounded-[4px] bg-ink2 px-1.5 py-[3px] font-mono text-[10px] font-bold leading-none tracking-[0.06em] text-paper2">
            {country.code}
          </span>
          <span className="font-body text-[14px] font-semibold tabular-nums text-ink2">+{country.dial}</span>
          <DropdownChevron open={open} className="h-3.5 w-3.5" />
        </>
      )}
    />
  );
}
