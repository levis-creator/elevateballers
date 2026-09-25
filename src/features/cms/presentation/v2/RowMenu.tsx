import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type RowMenuItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  /** Draws a divider above this item. */
  separatorBefore?: boolean;
};

const MENU_WIDTH = 200;
const GAP = 6;

/**
 * An actions dropdown for a table row. The menu is portalled into the admin
 * root and positioned against the trigger, so a scrolling table cannot clip
 * it; it flips upward when there is no room below. Keyboard: arrows, Home and
 * End move, Enter selects, Escape and Tab close and return focus.
 */
export default function RowMenu({ label, icon, items }: { label: string; icon: ReactNode; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  // Place the menu once it has rendered and its height is known.
  useLayoutEffect(() => {
    if (!open || !trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const height = menu.current.offsetHeight;
    const up = rect.bottom + GAP + height > window.innerHeight && rect.top - GAP - height > 0;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setPosition({ top: up ? rect.top - GAP - height : rect.bottom + GAP, left, up });
    menu.current.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    const onMove = () => close(false);
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, close]);

  const onMenuKey = (event: React.KeyboardEvent) => {
    const entries = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const focus = (next: number) => entries[(next + entries.length) % entries.length]?.focus();
    if (event.key === 'ArrowDown') focus(index + 1);
    else if (event.key === 'ArrowUp') focus(index - 1);
    else if (event.key === 'Home') focus(0);
    else if (event.key === 'End') focus(entries.length - 1);
    else if (event.key === 'Escape') close();
    else if (event.key === 'Tab') close(false);
    else return;
    if (event.key !== 'Tab') event.preventDefault();
  };

  const host = typeof document !== 'undefined' ? document.getElementById('eb-admin-root') ?? document.body : null;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`eb-kebab${open ? ' open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {icon}
      </button>
      {open &&
        host &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            className={`eb-row-menu${position?.up ? ' up' : ''}`}
            style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, width: MENU_WIDTH, visibility: position ? 'visible' : 'hidden' }}
            onKeyDown={onMenuKey}
          >
            {items.map((item) => {
              const className = `eb-row-menu-item${item.danger ? ' danger' : ''}`;
              return (
                <div key={item.label}>
                  {item.separatorBefore && <div className="eb-row-menu-sep" role="separator" />}
                  {item.href ? (
                    <a role="menuitem" tabIndex={-1} className={className} href={item.href} onClick={() => close(false)}>
                      {item.label}
                    </a>
                  ) : (
                    <button
                      role="menuitem"
                      tabIndex={-1}
                      type="button"
                      className={className}
                      onClick={() => {
                        close(false);
                        item.onSelect?.();
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>,
          host
        )}
    </>
  );
}
