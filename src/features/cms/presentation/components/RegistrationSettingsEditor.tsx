import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/features/rbac/usePermissions";

interface SiteSetting {
	id: string;
	key: string;
	value: string;
	type: string;
	label: string;
	description: string | null;
	category: string | null;
}

const VISIBLE_KEY = "registration_form_visible";

export default function RegistrationSettingsEditor() {
	const { can } = usePermissions();
	const canManage = can("site_settings:manage");

	const [setting, setSetting] = useState<SiteSetting | null>(null);
	// Default ON — when the setting has never been created, the form is visible.
	const [visible, setVisible] = useState(true);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savedFlash, setSavedFlash] = useState(false);

	const fetchSetting = async (): Promise<SiteSetting | null> => {
		const res = await fetch("/api/settings?category=registration", { cache: "no-store" });
		if (!res.ok) throw new Error(`Failed to fetch registration settings (${res.status})`);
		const data: SiteSetting[] = await res.json();
		return data.find((s) => s.key === VISIBLE_KEY) ?? null;
	};

	useEffect(() => {
		let cancelled = false;
		fetchSetting()
			.then((found) => {
				if (cancelled) return;
				setSetting(found);
				setVisible(found ? found.value === "true" : true);
			})
			.catch((error) => console.error("Error fetching registration settings:", error))
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleSave = async () => {
		if (!canManage) {
			alert("You do not have permission to manage site settings.");
			return;
		}
		setSaving(true);
		try {
			const value = visible ? "true" : "false";
			if (setting) {
				const res = await fetch(`/api/settings/${setting.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					cache: "no-store",
					body: JSON.stringify({ value }),
				});
				if (!res.ok) throw new Error(`Failed to update setting (${res.status})`);
			} else {
				const res = await fetch("/api/settings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					cache: "no-store",
					body: JSON.stringify({
						key: VISIBLE_KEY,
						value,
						type: "text",
						label: "Show the public registration form",
						description: "When off, /league-registration hides the form and shows a closed notice.",
						category: "registration",
					}),
				});
				if (!res.ok) throw new Error(`Failed to create setting (${res.status})`);
			}

			const persisted = await fetchSetting();
			setSetting(persisted);
			setVisible(persisted ? persisted.value === "true" : true);
			if ((persisted?.value ?? "true") !== value) {
				throw new Error("Server did not persist the new value");
			}

			setSavedFlash(true);
			setTimeout(() => setSavedFlash(false), 2000);
		} catch (error) {
			console.error("Error saving registration settings:", error);
			alert(`Failed to save registration settings: ${error instanceof Error ? error.message : "Unknown error"}.`);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="p-6 text-sm text-gray-500">Loading registration settings…</div>;
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<div>
					<h2 className="text-xl font-bold font-heading text-gray-900">Registration</h2>
					<p className="text-sm text-gray-500 mt-0.5">Control the public league-registration form.</p>
				</div>
				<Button onClick={handleSave} disabled={saving || !canManage}>
					{saving ? "Saving…" : savedFlash ? "Saved" : "Save"}
				</Button>
			</div>

			{!canManage && (
				<div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
					You have read-only access to site settings. Contact an admin to make changes.
				</div>
			)}

			<div className="p-6 space-y-6">
				<div className="flex items-start justify-between gap-6 rounded-lg border border-gray-200 p-4">
					<div className="space-y-1">
						<Label htmlFor="registration-form-visible" className="text-base font-semibold text-gray-900">
							Show the public registration form
						</Label>
						<p className="text-sm text-gray-500">
							When on, visitors can submit the team / player registration form at{" "}
							<span className="font-mono">/league-registration</span>. Turn it off to close registration site-wide — the page
							then shows a “registration is currently closed” notice instead of the form.
						</p>
						<p className="text-xs text-gray-400">
							Per-league registration windows (open/close dates) still apply on top of this master switch.
						</p>
					</div>
					<Switch id="registration-form-visible" checked={visible} onCheckedChange={setVisible} disabled={!canManage} />
				</div>
			</div>
		</div>
	);
}
