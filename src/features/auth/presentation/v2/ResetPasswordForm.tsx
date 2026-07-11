import { Lock, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useResetPassword } from "./hooks/useResetPassword";
import LoginField from "./components/LoginField";
import PasswordStrength from "./components/PasswordStrength";

/**
 * Reset-password form (right column). Pure presentation — all state and the
 * submit flow live in `useResetPassword`, the rules/meter in the shared
 * password-rules helper + PasswordStrength. Reuses `LoginField` for both inputs
 * so the admin auth screens stay visually consistent (DRY).
 */
export default function ResetPasswordForm() {
	const f = useResetPassword();

	return (
		<div className="relative w-full max-w-[400px]">
			<div className="mb-6 flex h-[54px] w-[54px] items-center justify-center rounded-xl border border-brand/40 bg-brand/[0.12]">
				<KeyRound className="h-[26px] w-[26px] text-brandsoft" strokeWidth={1.8} aria-hidden />
			</div>

			<div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brand">Admin Console</div>
			<h2 className="mb-1.5 font-display text-[40px] uppercase leading-none text-cream">Create New Password</h2>
			<p className="mb-8 text-[14px] leading-[1.5] text-muted2">Your reset link checked out. Set a new password below to secure your account.</p>

			{f.done ? (
				<div className="rounded-2xl border border-[#1f9d55]/50 bg-[#1f9d55]/[0.1] px-6 py-8 text-center [animation:eb-pop_.3s_ease]">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55]">
						<CheckCircle2 className="h-7 w-7 text-white" aria-hidden />
					</div>
					<h3 className="mb-2 font-display text-[26px] uppercase leading-none text-cream">Password Updated</h3>
					<p className="mx-auto mb-6 max-w-[300px] text-[14px] leading-[1.5] text-creamdim">
						Your new password is set. Sign in with it to get back to the console.
					</p>
					<a
						href="/admin/login"
						className="inline-flex items-center gap-2.5 rounded-lg bg-brand px-7 py-3.5 font-display text-[15px] uppercase tracking-[0.06em] text-white no-underline transition-colors hover:bg-brandlt"
					>
						Go to Login
						<ArrowRight className="h-[17px] w-[17px]" aria-hidden />
					</a>
				</div>
			) : (
				<form onSubmit={f.submit} noValidate className="space-y-5">
					{f.error && (
						<div className="flex items-start gap-3 rounded-lg border border-brand/40 bg-brand/[0.1] px-4 py-3 [animation:eb-shake_.4s_ease]">
							<AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-brand" aria-hidden />
							<span className="font-body text-[13px] leading-[1.45] text-brandsoft">{f.error}</span>
						</div>
					)}

					<div>
						<LoginField
							id="password"
							label="New Password"
							icon={Lock}
							type={f.showPassword ? "text" : "password"}
							value={f.password}
							onChange={f.setPassword}
							placeholder="Enter a new password"
							autoComplete="new-password"
							disabled={f.loading}
							required
							rightSlot={
								<button
									type="button"
									onClick={f.toggleShowPassword}
									aria-label={f.showPassword ? "Hide password" : "Show password"}
									className="flex-shrink-0 cursor-pointer border-none bg-transparent p-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2 hover:text-brand"
								>
									{f.showPassword ? "Hide" : "Show"}
								</button>
							}
						/>
						<PasswordStrength password={f.password} />
					</div>

					<div>
						<LoginField
							id="confirmPassword"
							label="Confirm Password"
							icon={Lock}
							type={f.showPassword ? "text" : "password"}
							value={f.confirmPassword}
							onChange={f.setConfirmPassword}
							placeholder="Re-enter your new password"
							autoComplete="new-password"
							disabled={f.loading}
							required
							rightSlot={f.match ? <span className="flex-shrink-0 font-body text-[13px] font-bold text-[#3fbf6f]">✓</span> : undefined}
						/>
						<div className="mt-2 h-4">
							{f.mismatch && <span className="font-mono text-[10px] tracking-[0.04em] text-brandsoft">Passwords don&rsquo;t match yet</span>}
						</div>
					</div>

					<button
						type="submit"
						disabled={f.loading || !f.token}
						className="group flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand px-6 py-[17px] font-display text-[17px] uppercase tracking-[0.08em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#3a332c] disabled:opacity-70"
					>
						{f.loading ? (
							<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
						) : (
							<span className="inline-flex items-center gap-2.5">
								Update Password
								<ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
							</span>
						)}
					</button>
				</form>
			)}

			<div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
				<a href="/admin/login" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold text-brandsoft no-underline hover:text-brand">
					<span className="font-mono text-[13px]">←</span>Back to login
				</a>
				<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574e]">Nairobi</span>
			</div>
		</div>
	);
}
