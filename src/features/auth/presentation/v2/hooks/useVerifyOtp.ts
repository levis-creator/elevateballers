import { useState, type FormEvent } from "react";

/**
 * Owns the OTP verification state + submit (single responsibility). Presentation
 * components render the returned state; they never touch the auth endpoint.
 * Preserves the original flow: POST /api/auth/verify-otp { code } → /admin.
 */
export function useVerifyOtp() {
	const [code, setCodeRaw] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [verified, setVerified] = useState(false);

	const setCode = (next: string) => {
		setCodeRaw(next);
		if (error) setError("");
	};

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		const trimmed = code.trim();
		if (!/^\d{6}$/.test(trimmed)) {
			setError("Please enter all 6 digits of your code.");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/verify-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ code: trimmed }),
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setError(data.error || "Verification failed. Please try again.");
				setCodeRaw("");
				return;
			}

			setVerified(true);
			setTimeout(() => {
				window.location.href = "/admin";
			}, 400);
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return {
		code,
		setCode,
		error,
		loading,
		verified,
		submit,
		canSubmit: code.length === 6 && !loading && !verified,
	};
}
