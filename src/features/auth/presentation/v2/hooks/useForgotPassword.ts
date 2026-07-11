import { useState, type FormEvent } from "react";

/**
 * Owns the forgot-password application logic (SRP): the email field, validation
 * and the submit flow. Presentation renders the returned state. Preserves the
 * original flow: POST /api/auth/forgot-password { email } → the "check your
 * email" confirmation page.
 */
export function useForgotPassword() {
	const [email, setEmailRaw] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const setEmail = (v: string) => {
		setEmailRaw(v);
		if (error) setError("");
	};

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		const trimmed = email.trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			setError("Please enter a valid email address.");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmed }),
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setError(data.error || "Failed to request reset link");
				return;
			}

			// Success is intentionally generic (no account-existence leak); the
			// confirmation page explains what to expect.
			setSent(true);
			setTimeout(() => {
				window.location.href = "/admin/forgot-password-success";
			}, 600);
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return { email, setEmail, error, loading, sent, submit, canSubmit: !loading && !sent };
}
