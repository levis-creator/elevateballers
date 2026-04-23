import { useEffect } from 'react';

export interface ScorekeeperHotkeyHandlers {
  /** True only when the match is LIVE and hotkeys should be active. */
  enabled: boolean;
  /** Arm a team-1 on-floor player by index (0-4). */
  armTeam1At: (index: number) => void;
  /** Arm a team-2 on-floor player by index (0-4). */
  armTeam2At: (index: number) => void;
  /** Record an action event for the armed player. */
  recordAction: (eventType: ScorekeeperAction) => void;
  /** Toggle the game clock. */
  toggleClock: () => void;
}

export type ScorekeeperAction =
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'THREE_POINT_MADE'
  | 'THREE_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'FOUL_PERSONAL'
  | 'TURNOVER'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'STEAL'
  | 'BLOCK'
  | 'ASSIST';

// Left-hand row arms team-1, right-hand row arms team-2 (positions 1-5 each).
const TEAM1_KEYS = ['q', 'w', 'e', 'r', 't'];
const TEAM2_KEYS = ['y', 'u', 'i', 'o', 'p'];

function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Binds keyboard shortcuts for courtside scorekeepers. Guarded so it only
 * fires while the match is LIVE and no text input / select has focus.
 *
 * Layout:
 *   q w e r t   arm team-1 jersey 1-5
 *   y u i o p   arm team-2 jersey 1-5
 *   2 / 3       made 2-pt / 3-pt    (shift+2/3 = miss)
 *   m           made FT             (shift+m = miss)
 *   p           personal foul
 *   a r s b t   assist, rebound, steal, block, turnover
 *   space       toggle clock
 *
 * `r` records a rebound event where OREB/DREB is inferred from the armed
 * player's team relative to the shooting team — the CourtConsole's rebound
 * prompt handles that inference when it's open; otherwise we fall back to
 * defensive rebound (the more common case).
 */
export function useScorekeeperHotkeys(handlers: ScorekeeperHotkeyHandlers) {
  const { enabled, armTeam1At, armTeam2At, recordAction, toggleClock } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingContext(e.target)) return;
      // Ignore Ctrl / Meta combos to avoid clashing with browser shortcuts.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Roster arming
      const t1 = TEAM1_KEYS.indexOf(key);
      if (t1 !== -1) {
        e.preventDefault();
        armTeam1At(t1);
        return;
      }
      const t2 = TEAM2_KEYS.indexOf(key);
      if (t2 !== -1) {
        e.preventDefault();
        armTeam2At(t2);
        return;
      }

      // Space toggles the clock
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleClock();
        return;
      }

      // Shot actions
      switch (key) {
        case '2':
          e.preventDefault();
          recordAction(e.shiftKey ? 'TWO_POINT_MISSED' : 'TWO_POINT_MADE');
          return;
        case '3':
          e.preventDefault();
          recordAction(e.shiftKey ? 'THREE_POINT_MISSED' : 'THREE_POINT_MADE');
          return;
        case 'm':
          e.preventDefault();
          recordAction(e.shiftKey ? 'FREE_THROW_MISSED' : 'FREE_THROW_MADE');
          return;
        case 'f':
          e.preventDefault();
          recordAction('FOUL_PERSONAL');
          return;
        case 'a':
          e.preventDefault();
          recordAction('ASSIST');
          return;
        case 'd':
          e.preventDefault();
          recordAction('REBOUND_DEFENSIVE');
          return;
        case 'o':
          // Only if 'o' wasn't consumed as a team2 arm key above
          e.preventDefault();
          recordAction('REBOUND_OFFENSIVE');
          return;
        case 's':
          e.preventDefault();
          recordAction('STEAL');
          return;
        case 'b':
          e.preventDefault();
          recordAction('BLOCK');
          return;
        case 'g':
          // G for "give away" / turnover (T conflicts with team1 arm key)
          e.preventDefault();
          recordAction('TURNOVER');
          return;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, armTeam1At, armTeam2At, recordAction, toggleClock]);
}
