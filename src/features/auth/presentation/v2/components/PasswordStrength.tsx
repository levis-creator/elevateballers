import { passwordRequirements, passwordScore } from "@/features/auth/lib/password-rules";

const SEG_COLORS = ["#4a443d", "#e4002b", "#ff8a3d", "#f5c518", "#3fbf6f"];
const SEG_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

/**
 * Live password strength meter + requirements checklist. Pure presentation —
 * everything derives from `password` via the shared `password-rules` helpers, so
 * the meter can never drift from the actual validation.
 */
export default function PasswordStrength({ password }: { password: string }) {
	const score = passwordScore(password); // 0..4
	const reqs = passwordRequirements(password);
	const activeColor = password ? SEG_COLORS[score] : "#4a443d";
	const label = password ? SEG_LABELS[score] : "Enter a password";

	return (
		<div className="mt-3">
			<div className="mb-1.5 flex gap-1.5">
				{[0, 1, 2, 3].map((i) => (
					<span
						key={i}
						className="h-1.5 flex-1 rounded-full transition-colors duration-200"
						style={{ background: password && i < score ? activeColor : "rgba(255,255,255,0.08)" }}
					/>
				))}
			</div>
			<div className="mb-4">
				<span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: activeColor }}>
					{label}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-x-4 gap-y-2">
				{reqs.map((r) => (
					<span key={r.label} className="flex items-center gap-2 font-body text-[12px]" style={{ color: r.ok ? "#8fd3aa" : "#6f665c" }}>
						<span
							className="flex h-[15px] w-[15px] flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold leading-none"
							style={
								r.ok
									? { background: "#1f9d55", color: "#fff" }
									: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.18)", color: "transparent" }
							}
						>
							{r.ok ? "✓" : ""}
						</span>
						{r.label}
					</span>
				))}
			</div>
		</div>
	);
}
