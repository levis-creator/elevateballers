import { useState } from "react";
import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";
import TurnstileWidget from "@/components/TurnstileWidget";

/**
 * v2 contact form — React island. Posts to the existing, Turnstile-protected
 * /api/contact-messages endpoint (server verifies the token). The topic maps to
 * the message subject; optional team + phone are folded into the message body,
 * since the API stores name / email / subject / message.
 */
export default function ContactFormV2({ topics }: { topics: string[] }) {
	const [name, setName] = useState("");
	const [team, setTeam] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [topic, setTopic] = useState(topics[0] ?? "General enquiry");
	const [message, setMessage] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [hp, setHp] = useState(""); // honeypot
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [feedback, setFeedback] = useState("");

	const busy = status === "loading" || status === "success";
	const field =
		"rounded-lg border border-black/15 bg-paper2 px-4 py-3 font-body text-[14px] text-ink2 outline-none focus:border-brand disabled:opacity-60";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (hp) {
			setStatus("success");
			setFeedback("Thanks — your message has been sent.");
			return;
		}
		if (!token) {
			setStatus("error");
			setFeedback("Please complete the security check before submitting.");
			return;
		}
		setStatus("loading");
		setFeedback("");

		// Fold team + phone into the message so nothing is lost.
		const extras = [team.trim() && `Team: ${team.trim()}`, phone.trim() && `Phone: ${phone.trim()}`]
			.filter(Boolean)
			.join("\n");
		const body = extras ? `${message.trim()}\n\n—\n${extras}` : message.trim();

		try {
			const res = await fetch("/api/contact-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					subject: topic,
					message: body,
					"cf-turnstile-token": token,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setStatus("error");
				setFeedback(data.error || "Something went wrong. Please try again.");
				return;
			}
			setStatus("success");
			setFeedback("Message sent — the right team will get back to you, usually within 48 hours.");
			setName("");
			setTeam("");
			setEmail("");
			setPhone("");
			setMessage("");
			setToken(null);
		} catch {
			setStatus("error");
			setFeedback("Something went wrong. Please try again.");
		}
	};

	if (status === "success") {
		return (
			<div className="flex flex-col items-start gap-3 rounded-xl border border-[#3fbf6f]/30 bg-[#3fbf6f]/[0.08] px-6 py-8">
				<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3fbf6f]/15 font-mono text-[18px] text-[#2f9e44]">✓</span>
				<div className="font-display text-[20px] uppercase text-ink">Message sent</div>
				<p className="text-[14px] leading-[1.6] text-muted">{feedback}</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
			<div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
				<label className="flex flex-col gap-2">
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Full name</span>
					<input type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="Your name" className={field} />
				</label>
				<label className="flex flex-col gap-2">
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Team (optional)</span>
					<input type="text" value={team} onChange={(e) => setTeam(e.target.value)} disabled={busy} placeholder="Your club" className={field} />
				</label>
			</div>
			<div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
				<label className="flex flex-col gap-2">
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Email</span>
					<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} placeholder="you@email.com" className={field} />
				</label>
				<label className="flex flex-col gap-2">
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Phone (optional)</span>
					<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} placeholder="07XX XXX XXX" className={field} />
				</label>
			</div>
			<label className="flex flex-col gap-2">
				<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Topic</span>
				<div className="relative">
					<select value={topic} onChange={(e) => setTopic(e.target.value)} disabled={busy} className={`w-full appearance-none ${field}`}>
						{topics.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
					<span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
				</div>
			</label>
			<label className="flex flex-col gap-2">
				<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Message</span>
				<textarea rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} placeholder="How can we help?" className={`resize-y ${field}`} />
			</label>

			{/* Honeypot — hidden from real users */}
			<input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

			<TurnstileWidget
				siteKey={PUBLIC_TURNSTILE_SITE_KEY}
				onSuccess={setToken}
				onExpire={() => setToken(null)}
				onError={() => setToken(null)}
				appearance="interaction-only"
			/>

			{status === "error" && feedback && <p className="text-[13px] text-brand">{feedback}</p>}

			<button
				type="submit"
				disabled={busy}
				className="self-start rounded-lg bg-brand px-8 py-4 font-body text-[13px] font-extrabold uppercase tracking-[0.05em] text-white hover:bg-brandlt disabled:cursor-not-allowed disabled:opacity-60"
			>
				{status === "loading" ? "Sending…" : "Send Message"}
			</button>
		</form>
	);
}
