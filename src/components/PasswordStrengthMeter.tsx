/**
 * PasswordStrengthMeter
 *
 * Real-time password guidance that mirrors the server-side rules in
 * src/features/cms/lib/auth.ts → validatePasswordStrength().
 *
 * Usage:
 *   <PasswordStrengthMeter password={password} />
 */

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'At least 10 characters',          test: (pw) => pw.length >= 10 },
  { label: 'One uppercase letter (A–Z)',       test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)',       test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number (0–9)',                 test: (pw) => /\d/.test(pw) },
  { label: 'One special character (!@#$…)',    test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function getStrength(password: string): number {
  if (!password) return 0;
  return RULES.filter((r) => r.test(password)).length;
}

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  '',           // 0 — empty
  '#ef4444',    // 1 — red
  '#f97316',    // 2 — orange
  '#eab308',    // 3 — yellow
  '#22c55e',    // 4 — green
  '#16a34a',    // 5 — dark green
];

interface Props {
  password: string;
}

export default function PasswordStrengthMeter({ password }: Props) {
  if (!password) return null;

  const strength = getStrength(password);
  const color = STRENGTH_COLORS[strength];
  const label = STRENGTH_LABELS[strength];

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      {/* Segmented strength bar */}
      <div className="flex gap-1" role="meter" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={5} aria-label="Password strength">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < strength ? color : '#e5e7eb',
            }}
          />
        ))}
      </div>

      {/* Strength label */}
      <p className="text-xs font-medium transition-colors" style={{ color }}>
        {label}
      </p>

      {/* Per-rule checklist */}
      <ul className="space-y-0.5">
        {RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: met ? '#22c55e' : '#d1d5db' }}
                aria-hidden="true"
              >
                {met ? '✓' : ''}
              </span>
              <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
