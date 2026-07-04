import { useState } from "react";
import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";
import TurnstileWidget from "@/components/TurnstileWidget";

/**
 * v2 footer newsletter form — React island.
 * Posts to the existing, Turnstile-protected /api/subscribers endpoint (server
 * verifies the token). Turnstile runs in interaction-only mode so it stays
 * invisible for legitimate visitors and only shows a challenge when needed.
 */
export default function SubscribeFormV2() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [hp, setHp] = useState(""); // honeypot

	const busy = status === "loading" || status === "success";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Honeypot: bots fill hidden fields — silently no-op.
		if (hp) {
			setStatus("success");
			setMessage("Thanks — you are subscribed!");
			return;
		}
		if (!token) {
			setStatus("error");
			setMessage("Please complete the security check.");
			return;
		}
		setStatus("loading");
		setMessage("");
		try {
			const res = await fetch("/api/subscribers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, "cf-turnstile-token": token }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setStatus("error");
				setMessage(data.error || "Something went wrong. Please try again.");
				return;
			}
			setStatus("success");
			setMessage(data.alreadySubscribed ? "You are already subscribed!" : "Thanks — you are subscribed!");
			setEmail("");
			setToken(null);
		} catch {
			setStatus("error");
			setMessage("Something went wrong. Please try again.");
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex gap-2">
				<input
					type="email"
					name="EMAIL"
					placeholder="your@email.com"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={busy}
					className="flex-1 rounded-md border border-white/[0.12] bg-[#141210] px-3.5 py-3 font-body text-[14px] text-cream outline-none disabled:opacity-60"
				/>
				<button
					type="submit"
					disabled={busy}
					className="cursor-pointer rounded-md border-none bg-brand px-[18px] font-body text-[13px] font-extrabold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
				>
					{status === "loading" ? "…" : "Join"}
				</button>
			</div>

			{/* Honeypot — hidden from real users */}
			<input
				type="text"
				name="website"
				value={hp}
				onChange={(e) => setHp(e.target.value)}
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
				className="hidden"
			/>

			<TurnstileWidget
				siteKey={PUBLIC_TURNSTILE_SITE_KEY}
				onSuccess={setToken}
				onExpire={() => setToken(null)}
				onError={() => setToken(null)}
				theme="dark"
				size="flexible"
				appearance="interaction-only"
			/>

			{message && (
				<p className={`mt-1 text-[13px] ${status === "error" ? "text-[#ff6b6b]" : "text-[#5fd08a]"}`}>{message}</p>
			)}
		</form>
	);
}
