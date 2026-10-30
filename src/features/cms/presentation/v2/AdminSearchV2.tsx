import { useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import { navigate } from 'astro:transitions/client';
import { Search, Users, Shield, Newspaper, Calendar, Briefcase, Loader2 } from 'lucide-react';
import { usePermissions } from '@/features/rbac/usePermissions';
import { ADMIN_NAV } from './lib/admin-nav';
import { Presence, m, popoverMotion } from '@/shared/components/motion/Presence';
import type { AdminSearchKind, AdminSearchResult } from '@/pages/api/admin/search';

const KIND_META: Record<AdminSearchKind, { group: string; icon: ComponentType<{ className?: string }> }> = {
  player: { group: 'Players', icon: Users },
  team: { group: 'Teams', icon: Shield },
  article: { group: 'Articles', icon: Newspaper },
  match: { group: 'Matches', icon: Calendar },
  staff: { group: 'Staff', icon: Briefcase },
};

interface Option {
  key: string;
  group: string;
  label: string;
  detail: string | null;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * v2 topbar search. Matches admin pages locally (only the ones the user can
 * open) and records via /api/admin/search. Arrow keys move, Enter opens,
 * Ctrl/Cmd+K focuses.
 */
export default function AdminSearchV2() {
  const { can, canAny } = usePermissions();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim();

  // Debounced record search; aborts the previous request when the query changes.
  useEffect(() => {
    if (q.length < 2) {
      setRecords([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const body = res.ok ? await res.json() : { results: [] };
        setRecords(body.results ?? []);
      } catch {
        if (!controller.signal.aborted) setRecords([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  const options = useMemo<Option[]>(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    const pages = ADMIN_NAV.flatMap((g) => g.items)
      .filter((item) => (!item.permission || can(item.permission)) && (!item.permissionsAny || canAny(item.permissionsAny)))
      .filter((item) => item.label.toLowerCase().includes(lower))
      // Prefer labels that start with the query: "staff" → Staff before League Staff.
      .sort((a, b) => Number(!a.label.toLowerCase().startsWith(lower)) - Number(!b.label.toLowerCase().startsWith(lower)))
      .map((item) => ({ key: `page:${item.href}`, group: 'Pages', label: item.label, detail: null, href: item.href, icon: item.icon }));
    const found = records.map((r) => ({
      key: `${r.kind}:${r.id}`,
      group: KIND_META[r.kind].group,
      label: r.label,
      detail: r.detail,
      href: r.href,
      icon: KIND_META[r.kind].icon,
    }));
    return [...pages, ...found];
  }, [q, records, can, canAny]);

  useEffect(() => setActive(0), [options.length, q]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Ctrl/Cmd+K focuses the search from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (option: Option) => {
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    navigate(option.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' && options[active]) {
      e.preventDefault();
      go(options[active]);
    }
  };

  const showPanel = open && q.length > 0;
  const waiting = loading && q.length >= 2;

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-[360px] flex-1 max-[720px]:hidden">
      <div className="flex items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 focus-within:border-[var(--brand)]">
        {waiting ? (
          <Loader2 className="h-[15px] w-[15px] flex-shrink-0 animate-spin text-[var(--txm)]" />
        ) : (
          <Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="admin-search-results"
          aria-activedescendant={showPanel && options[active] ? `admin-search-${active}` : undefined}
          aria-label="Search admin"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search players, teams, articles…"
          className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
        />
        <kbd className="flex-shrink-0 rounded border border-[var(--bord)] px-1.5 py-0.5 font-['Space_Mono'] text-[9px] text-[var(--faint)]">Ctrl K</kbd>
      </div>

      <Presence>{showPanel && (
        <m.div
          {...popoverMotion}
          id="admin-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[420px] overflow-y-auto rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
        >
          {options.map((option, index) => {
            const Icon = option.icon;
            const startsGroup = index === 0 || options[index - 1].group !== option.group;
            return (
              <div key={option.key}>
                {startsGroup && (
                  <div className="px-2.5 pb-1 pt-2 font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--txm)]">
                    {option.group}
                  </div>
                )}
                <button
                  type="button"
                  id={`admin-search-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(option)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${index === active ? 'bg-[var(--hov)]' : ''}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-[var(--txm)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-['Archivo'] text-[12.5px] font-semibold text-[var(--tx)]">{option.label}</span>
                    {option.detail && (
                      <span className="block truncate font-['Archivo'] text-[11px] text-[var(--txd)]">{option.detail}</span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-6 text-center font-['Archivo'] text-[12px] text-[var(--txd)]">
              {q.length < 2 ? 'Keep typing to search records…' : waiting ? 'Searching…' : `No results for “${q}”`}
            </div>
          )}
        </m.div>
      )}</Presence>
    </div>
  );
}
