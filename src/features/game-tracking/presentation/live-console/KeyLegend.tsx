export interface KeyItem {
  k: string;
  d: string;
  /** Marks a key whose meaning changed in the v2 console. */
  was?: string;
}

export const KEY_LEGEND = (homeName: string, awayShort: string): KeyItem[] => [
  { k: 'Q W E R T', d: `${homeName} on floor` },
  { k: 'Y U I O P', d: `${awayShort} on floor` },
  { k: '2 · 3 · M', d: 'Made 2 / 3 / FT' },
  { k: '⇧ + 2 · 3 · M', d: 'Missed 2 / 3 / FT' },
  { k: 'A', d: 'Assist' },
  { k: 'X', d: 'Off. rebound', was: 'was O' },
  { k: 'D', d: 'Def. rebound' },
  { k: 'B', d: 'Block' },
  { k: 'V', d: 'Turnover → type 1–9 · stealer key · ↵ untyped', was: 'was G' },
  { k: 'F', d: 'Personal foul' },
  { k: 'G', d: 'Technical', was: 'new' },
  { k: 'H · J', d: 'Unsport. · Ejection' },
  { k: 'K · L', d: 'Bench T · Coach T' },
  { k: 'Space', d: 'Start / stop clock' },
  { k: '← →', d: 'Possession' },
  { k: 'Esc', d: 'Skip prompt / clear' },
  { k: '⌘Z', d: 'Undo last' },
];

export function KeyLegend({ items }: { items: KeyItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.k} className="flex justify-between gap-3">
          <span className="text-[var(--tx)]">{item.k}</span>
          <span className="flex items-center justify-end gap-1.5 text-right">
            {item.d}
            {item.was && (
              <span className="rounded bg-[var(--warn)] px-1 text-[9px] font-bold uppercase leading-[14px] text-[var(--bg)]">
                {item.was}
              </span>
            )}
          </span>
        </div>
      ))}
    </>
  );
}
