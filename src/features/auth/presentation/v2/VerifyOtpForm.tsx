import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useVerifyOtp } from "./hooks/useVerifyOtp";
import OtpInput from "./components/OtpInput";

/**
 * Two-step verification form (right column). Pure presentation — the OTP state
 * and submit flow live in `useVerifyOtp`, the segmented input in `OtpInput`.
 * Mirrors the login form's chrome so the two admin auth screens read as a pair.
 */
export default function VerifyOtpForm() {
	const f = useVerifyOtp();

	return (
		<div className="relative w-full max-w-[400px]">
			<div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-brand/30 bg-brand/[0.1]">
				<ShieldCheck className="h-6 w-6 text-brand" aria-hidden />
			</div>

			<div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brand">Admin Console</div>
			<h2 className="mb-1.5 font-display text-[40px] uppercase leading-none text-cream">Two-Step Verification</h2>
			<p className="mb-8 text-[14px] leading-[1.5] text-muted2">Enter the 6-digit code we emailed you to finish signing in.</p>

			<form onSubmit={f.submit} noValidate className="space-y-5">
				{f.error && (
					<div className="flex items-start gap-3 rounded-lg border border-brand/40 bg-brand/[0.1] px-4 py-3 [animation:eb-shake_.4s_ease]">
						<AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-brand" aria-hidden />
						<span className="font-body text-[13px] leading-[1.45] text-brandsoft">{f.error}</span>
					</div>
				)}

				{f.verified && (
					<div className="flex items-start gap-3 rounded-lg border border-[#1f9d55]/40 bg-[#1f9d55]/[0.12] px-4 py-3 [animation:eb-pop_.3s_ease]">
						<CheckCircle2 className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#1f9d55]" aria-hidden />
						<span className="font-body text-[13px] leading-[1.45] text-[#1f9d55]">Code accepted — taking you to the console…</span>
					</div>
				)}

				<div>
					<label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-creamdim">Verification Code</label>
					<OtpInput value={f.code} onChange={f.setCode} disabled={f.loading || f.verified} autoFocus />
					<p className="mt-2.5 font-mono text-[11px] tracking-[0.04em] text-[#5f574e]">Paste supported — you can paste the whole code at once.</p>
				</div>

				<button
					type="submit"
					disabled={!f.canSubmit}
					className="group flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand px-6 py-[17px] font-display text-[17px] uppercase tracking-[0.08em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#3a332c] disabled:opacity-70"
				>
					{f.loading ? (
						<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
					) : (
						<span className="inline-flex items-center gap-2.5">
							Verify &amp; Sign In
							<ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
						</span>
					)}
				</button>
			</form>

			<div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
				<a href="/admin/login" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold text-brandsoft no-underline hover:text-brand">
					<span className="font-mono text-[13px]">←</span>Back to login
				</a>
				<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574e]">Nairobi</span>
			</div>
		</div>
	);
}
