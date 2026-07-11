import { Mail, Lock, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useAdminLogin } from "./hooks/useAdminLogin";
import LoginField from "./components/LoginField";

/**
 * Admin sign-in form (right column). Pure presentation — all auth state and the
 * submit flow live in `useAdminLogin`. Turnstile-gated; on success the hook
 * redirects to the OTP step.
 */
export default function AdminLoginForm() {
	const f = useAdminLogin();

	return (
		<div className="relative w-full max-w-[400px]">
			<div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brand">Admin Console</div>
			<h2 className="mb-1.5 font-display text-[40px] uppercase leading-none text-cream">Sign In</h2>
			<p className="mb-8 text-[14px] leading-[1.5] text-muted2">Authorized league staff only. Enter your credentials to continue.</p>

			<form onSubmit={f.submit} noValidate className="space-y-5">
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
					autoComplete="username"
					disabled={f.loading}
					required
				/>

				<LoginField
					id="password"
					label="Password"
					icon={Lock}
					type={f.showPassword ? "text" : "password"}
					value={f.password}
					onChange={f.setPassword}
					placeholder="Enter your password"
					autoComplete="current-password"
					disabled={f.loading}
					required
					labelRight={
						<a href="/admin/forgot-password" className="font-mono text-[11px] tracking-[0.04em] text-brandsoft no-underline hover:text-brand">
							Forgot password?
						</a>
					}
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

				{/* Real Cloudflare Turnstile (the design's "I'm not a robot" placeholder). */}
				<div className="rounded-lg border border-white/[0.1] bg-[#16130f] px-4 py-3.5">
					<TurnstileWidget
						siteKey={PUBLIC_TURNSTILE_SITE_KEY}
						onSuccess={f.setTurnstileToken}
						onExpire={() => f.setTurnstileToken(null)}
						onError={() => f.setTurnstileToken(null)}
					/>
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
							Sign In
							<ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
						</span>
					)}
				</button>
			</form>

			<div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
				<a href="/" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold text-brandsoft no-underline hover:text-brand">
					<span className="font-mono text-[13px]">←</span>Back to website
				</a>
				<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574e]">Nairobi</span>
			</div>
		</div>
	);
}
