import { Mail, KeyRound, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useForgotPassword } from "./hooks/useForgotPassword";
import LoginField from "./components/LoginField";

/**
 * Forgot-password form (right column). Pure presentation — email state and the
 * submit flow live in `useForgotPassword`. Reuses `LoginField` so the admin auth
 * screens stay visually consistent (DRY).
 */
export default function ForgotPasswordForm() {
	const f = useForgotPassword();

	return (
		<div className="relative w-full max-w-[400px]">
			<div className="mb-6 flex h-[54px] w-[54px] items-center justify-center rounded-xl border border-brand/40 bg-brand/[0.12]">
				<KeyRound className="h-[26px] w-[26px] text-brandsoft" strokeWidth={1.8} aria-hidden />
			</div>

			<div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brand">Admin Console</div>
			<h2 className="mb-1.5 font-display text-[40px] uppercase leading-none text-cream">Reset Your Password</h2>
			<p className="mb-8 text-[14px] leading-[1.5] text-muted2">Enter the email tied to your admin account. If it&rsquo;s on file, we&rsquo;ll send a reset link right away.</p>

			<form onSubmit={f.submit} noValidate className="space-y-6">
				{f.error && (
					<div className="flex items-start gap-3 rounded-lg border border-brand/40 bg-brand/[0.1] px-4 py-3 [animation:eb-shake_.4s_ease]">
						<AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-brand" aria-hidden />
						<span className="font-body text-[13px] leading-[1.45] text-brandsoft">{f.error}</span>
					</div>
				)}

				<LoginField
					id="email"
					label="Email Address"
					icon={Mail}
					type="email"
					value={f.email}
					onChange={f.setEmail}
					placeholder="admin@elevateballers.com"
					autoComplete="email"
					disabled={f.loading || f.sent}
					required
				/>

				<button
					type="submit"
					disabled={!f.canSubmit}
					className="group flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand px-6 py-[17px] font-display text-[17px] uppercase tracking-[0.08em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#3a332c] disabled:opacity-70"
				>
					{f.loading || f.sent ? (
						<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
					) : (
						<span className="inline-flex items-center gap-2.5">
							Send Reset Link
							<ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
						</span>
					)}
				</button>
			</form>

			<div className="mt-6 rounded-lg border border-white/[0.08] bg-[#16130f] px-4 py-3.5">
				<p className="font-body text-[12.5px] leading-[1.5] text-muted2">
					<span className="font-bold text-creamdim">Can&rsquo;t access this email?</span> Contact the league office at{" "}
					<a href="mailto:ballers@elevateballers.com" className="text-brandsoft no-underline hover:text-brand">ballers@elevateballers.com</a> and we&rsquo;ll verify you manually.
				</p>
			</div>

			<div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
				<a href="/admin/login" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold text-brandsoft no-underline hover:text-brand">
					<span className="font-mono text-[13px]">←</span>Back to login
				</a>
				<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574e]">Nairobi</span>
			</div>
		</div>
	);
}
