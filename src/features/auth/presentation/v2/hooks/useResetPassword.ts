import { useEffect, useState, type FormEvent } from "react";
import { validateNewPassword } from "@/features/auth/lib/password-rules";

/**
 * Owns the reset-password application logic (SRP): the token from the URL, the
 * two password fields, validation and the submit flow. Presentation renders the
 * returned state; it never touches the endpoint. Preserves the original flow:
 * POST /api/auth/reset-password { token, password } → /admin/login.
 */
export function useResetPassword() {
	const [token, setToken] = useState("");
	const [password, setPasswordRaw] = useState("");
	const [confirmPassword, setConfirmPasswordRaw] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	// The reset token arrives as a `?token=` query param on the emailed link.
	useEffect(() => {
		const t = new URLSearchParams(window.location.search).get("token") || "";
		setToken(t);
		if (!t) setError("Reset token is missing. Please request a new link.");
	}, []);

	const setPassword = (v: string) => {
		setPasswordRaw(v);
		if (error) setError("");
	};
	const setConfirmPassword = (v: string) => {
		setConfirmPasswordRaw(v);
		if (error) setError("");
	};

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!token) {
			setError("Reset token is missing. Please request a new link.");
			return;
		}
		const validationError = validateNewPassword(password);
		if (validationError) {
			setError(validationError);
			return;
		}
		if (password !== confirmPassword) {
			setError("Both passwords must match before you continue.");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setError(data.error || "Failed to reset password");
				return;
			}

			setDone(true);
			setTimeout(() => {
				window.location.href = "/admin/login";
			}, 2500);
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return {
		token,
		password,
		setPassword,
		confirmPassword,
		setConfirmPassword,
		showPassword,
		toggleShowPassword: () => setShowPassword((s) => !s),
		error,
		loading,
		done,
		submit,
		match: confirmPassword.length > 0 && password === confirmPassword,
		mismatch: confirmPassword.length > 0 && password !== confirmPassword,
		canSubmit: !loading && !!token,
	};
}
