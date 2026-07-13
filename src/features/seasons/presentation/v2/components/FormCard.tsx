import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	/** Optional control on the right of the header (a link, a toggle…). */
	action?: ReactNode;
	children: ReactNode;
}

/** The section card every part of the season form sits in. */
export default function FormCard({ icon: Icon, title, subtitle, action, children }: Props) {
	return (
		<div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 max-[600px]:p-5">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-3">
					<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
						<Icon className="h-4 w-4" />
					</span>
					<div>
						<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">{title}</h2>
						<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{subtitle}</p>
					</div>
				</div>
				{action}
			</div>
			{children}
		</div>
	);
}

/** Space Mono uppercase field label, with an optional required marker. */
export function Label({ children, required = false }: { children: ReactNode; required?: boolean }) {
	return (
		<label className="mb-1.5 block font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txd)]">
			{children} {required && <span className="text-[var(--brand)]">*</span>}
		</label>
	);
}

export function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return <p className="mt-1.5 font-['Archivo'] text-[11.5px] text-[var(--brand)]">{message}</p>;
}
