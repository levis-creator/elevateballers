// QuickEventButtons is now a thin re-export of CourtConsole. The underlying
// fast-paced courtside UX (tile grid + one-tap events + compound prompts)
// lives there; this module preserves the original import path used by
// GameTrackingPanel and any external callers.
export { default } from './CourtConsole';
