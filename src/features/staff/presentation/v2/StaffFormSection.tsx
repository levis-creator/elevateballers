import type { ReactNode } from "react";

export function StaffFormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#d8cbb8] bg-[#fffdf8] p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="font-heading text-xl font-semibold text-[#27231f]">{title}</h2><p className="mt-1 text-sm text-[#746b61]">{description}</p></div>{children}</section>;
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-medium text-[#3b342d]">{label}</label>{children}{hint && <p className="text-xs text-[#85796c]">{hint}</p>}</div>;
}
