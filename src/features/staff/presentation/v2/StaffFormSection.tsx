import type { ReactNode } from "react";

export function StaffFormSection({ title, description, headerAside, children }: { title: string; description: string; headerAside?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] text-[var(--tx)] shadow-[0_18px_50px_rgba(0,0,0,0.18)]"><div className="flex items-center gap-2.5 border-b border-[var(--bord2)] px-5 py-3.5"><div className="min-w-0 flex-1"><h2 className="font-display text-[16px] uppercase tracking-[0.02em]">{title}</h2><p className="mt-0.5 font-body text-[11.5px] text-[var(--txm)]">{description}</p></div>{headerAside}</div><div className="p-5">{children}</div></section>;
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{label}</label>{children}{hint && <p className="font-body text-[11px] text-[var(--faint)]">{hint}</p>}</div>;
}

export const staffInputClass = "eb-in border-[var(--bord)] bg-[var(--surf2)] text-[var(--tx)] placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus:ring-[var(--brand)]/20";
