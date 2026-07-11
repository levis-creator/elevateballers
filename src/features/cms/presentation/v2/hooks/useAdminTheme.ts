import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "eb-cms-theme";
const ROOT_ID = "eb-admin-root";

/** What the user chose. `system` (the default) tracks the OS preference. */
export type ThemePref = "system" | "dark" | "light";
/** What is actually shown. */
export type ResolvedTheme = "dark" | "light";

function systemTheme(): ResolvedTheme {
	return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readPref(): ThemePref {
	try {
		const t = localStorage.getItem(THEME_KEY);
		if (t === "dark" || t === "light" || t === "system") return t;
	} catch {
		/* ignore */
	}
	return "system";
}

function resolve(pref: ThemePref): ResolvedTheme {
	return pref === "system" ? systemTheme() : pref;
}

function apply(resolved: ResolvedTheme): void {
	const el = document.getElementById(ROOT_ID);
	if (!el) return;
	// `light` drives the eb-root v2 tokens; `dark` activates admin.css's existing
	// shadcn dark palette so the legacy editor pages follow the shell theme too.
	el.classList.toggle("light", resolved === "light");
	el.classList.toggle("dark", resolved === "dark");
}

/**
 * Admin shell theme. Defaults to `system` (follows the OS `prefers-color-scheme`
 * and updates live when the OS switches). The header toggle sets an explicit
 * dark/light preference, persisted to localStorage (`eb-cms-theme`) and applied
 * to `#eb-admin-root` (an inline script in the layout applies it before paint to
 * avoid a flash).
 */
export function useAdminTheme() {
	const [pref, setPref] = useState<ThemePref>("system");
	const [resolved, setResolved] = useState<ResolvedTheme>("dark");

	useEffect(() => {
		const p = readPref();
		const r = resolve(p);
		setPref(p);
		setResolved(r);
		apply(r);

		// Track OS changes only while in `system` mode.
		const mq = window.matchMedia("(prefers-color-scheme: light)");
		const onChange = () => {
			if (readPref() === "system") {
				const nr = systemTheme();
				setResolved(nr);
				apply(nr);
			}
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	const toggle = useCallback(() => {
		setResolved((prev) => {
			const next: ResolvedTheme = prev === "dark" ? "light" : "dark";
			try {
				localStorage.setItem(THEME_KEY, next);
			} catch {
				/* ignore */
			}
			setPref(next);
			apply(next);
			return next;
		});
	}, []);

	/** Return to following the OS preference. */
	const useSystem = useCallback(() => {
		try {
			localStorage.removeItem(THEME_KEY);
		} catch {
			/* ignore */
		}
		const nr = systemTheme();
		setPref("system");
		setResolved(nr);
		apply(nr);
	}, []);

	return { theme: resolved, pref, toggle, useSystem };
}
