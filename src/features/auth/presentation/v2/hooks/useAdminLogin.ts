import { useState } from "react";

/**
 * Admin login application logic — separated from presentation (SRP) so the form
 * component is purely visual and this can be tested/reused independently.
 * Mirrors the original flow exactly: Turnstile-gated POST to /api/auth/login,
 * then redirect to the 2FA (OTP) step on success.
 */
export interface AdminLogin {
	email: string;
	setEmail: (v: string) => void;
	password: string;
	setPassword: (v: string) => void;
	showPassword: boolean;
	toggleShowPassword: () => void;
	turnstileToken: string | null;
	setTurnstileToken: (t: string | null) => void;
	error: string;
	loading: boolean;
	canSubmit: boolean;
	submit: (e: React.FormEvent) => Promise<void>;
}

export function useAdminLogin(): AdminLogin {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!turnstileToken) {
			setError("Please complete the security check before signing in.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password, "cf-turnstile-token": turnstileToken }),
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || "Login failed");
				return;
			}
			window.location.href = "/admin/verify-otp";
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return {
		email,
		setEmail,
		password,
		setPassword,
		showPassword,
		toggleShowPassword: () => setShowPassword((v) => !v),
		turnstileToken,
		setTurnstileToken,
		error,
		loading,
		canSubmit: !loading && !!turnstileToken,
		submit,
	};
}
