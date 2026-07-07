import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/features/rbac/usePermissions";
import { FOOTER_CONTENT_KEY, FOOTER_DEFAULTS, parseFooterContent, type FooterContent } from "@/features/layout/lib/footer-content";

interface SiteSetting {
	id: string;
	key: string;
	value: string;
	category: string | null;
}

export default function FooterSettingsEditor() {
	const { can } = usePermissions();
	const canManage = can("site_settings:manage");

	const [setting, setSetting] = useState<SiteSetting | null>(null);
	const [content, setContent] = useState<FooterContent>(FOOTER_DEFAULTS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savedFlash, setSavedFlash] = useState(false);

	const fetchSetting = async (): Promise<SiteSetting | null> => {
		const res = await fetch("/api/settings?category=footer", { cache: "no-store" });
		if (!res.ok) throw new Error(`Failed to fetch footer settings (${res.status})`);
		const data: SiteSetting[] = await res.json();
		return data.find((s) => s.key === FOOTER_CONTENT_KEY) ?? null;
	};

	useEffect(() => {
		let cancelled = false;
		fetchSetting()
			.then((found) => {
				if (cancelled) return;
				setSetting(found);
				setContent(parseFooterContent(found?.value));
			})
			.catch((error) => console.error("Error fetching footer settings:", error))
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const set = <K extends keyof FooterContent>(key: K, value: FooterContent[K]) => setContent((c) => ({ ...c, [key]: value }));
	const setLink = (i: number, field: "label" | "href", value: string) =>
		setContent((c) => ({ ...c, exploreLinks: c.exploreLinks.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)) }));
	const addLink = () => setContent((c) => ({ ...c, exploreLinks: [...c.exploreLinks, { label: "", href: "" }] }));
	const removeLink = (i: number) => setContent((c) => ({ ...c, exploreLinks: c.exploreLinks.filter((_, idx) => idx !== i) }));

	const handleSave = async () => {
		if (!canManage) {
			alert("You do not have permission to manage site settings.");
			return;
		}
		setSaving(true);
		try {
			// Drop blank link rows before saving.
			const clean: FooterContent = {
				...content,
				exploreLinks: content.exploreLinks.filter((l) => l.label.trim() && l.href.trim()),
			};
			const value = JSON.stringify(clean);

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
						key: FOOTER_CONTENT_KEY,
						value,
						type: "json",
						label: "Footer content",
						description: "Footer explore links, newsletter text and copyright.",
						category: "footer",
					}),
				});
				if (!res.ok) throw new Error(`Failed to create setting (${res.status})`);
			}

			const persisted = await fetchSetting();
			setSetting(persisted);
			setContent(parseFooterContent(persisted?.value));
			setSavedFlash(true);
			setTimeout(() => setSavedFlash(false), 2000);
		} catch (error) {
			console.error("Error saving footer settings:", error);
			alert(`Failed to save footer settings: ${error instanceof Error ? error.message : "Unknown error"}.`);
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div className="p-6 text-sm text-gray-500">Loading footer settings…</div>;

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<div>
					<h2 className="text-xl font-bold font-heading text-gray-900">Footer</h2>
					<p className="text-sm text-gray-500 mt-0.5">Explore links, newsletter blurb and copyright. Contact + social links live on the Contact &amp; Social tab.</p>
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

			<fieldset disabled={!canManage} className="p-6 space-y-6">
				{/* EXPLORE LINKS */}
				<div className="rounded-lg border border-gray-200 p-4">
					<div className="mb-3 flex items-center justify-between">
						<Label className="text-base font-semibold text-gray-900">Explore column</Label>
						<Button type="button" variant="outline" size="sm" onClick={addLink} disabled={!canManage}>Add link</Button>
					</div>
					<div className="mb-3">
						<Label htmlFor="footer-explore-title" className="text-xs text-gray-500">Heading</Label>
						<Input id="footer-explore-title" value={content.exploreTitle} onChange={(e) => set("exploreTitle", e.target.value)} placeholder="Explore" />
					</div>
					<div className="space-y-2">
						{content.exploreLinks.map((link, i) => (
							<div key={i} className="flex items-center gap-2">
								<Input value={link.label} onChange={(e) => setLink(i, "label", e.target.value)} placeholder="Label (e.g. Teams)" className="flex-1" />
								<Input value={link.href} onChange={(e) => setLink(i, "href", e.target.value)} placeholder="/teams" className="flex-1" />
								<Button type="button" variant="ghost" size="sm" onClick={() => removeLink(i)} disabled={!canManage} aria-label="Remove link">✕</Button>
							</div>
						))}
						{content.exploreLinks.length === 0 && <p className="text-sm text-gray-400">No links — add one above.</p>}
					</div>
				</div>

				{/* NEWSLETTER */}
				<div className="rounded-lg border border-gray-200 p-4 space-y-3">
					<Label className="text-base font-semibold text-gray-900">Newsletter column</Label>
					<div>
						<Label htmlFor="footer-nl-title" className="text-xs text-gray-500">Heading</Label>
						<Input id="footer-nl-title" value={content.newsletterTitle} onChange={(e) => set("newsletterTitle", e.target.value)} placeholder="Sign up for email alerts" />
					</div>
					<div>
						<Label htmlFor="footer-nl-text" className="text-xs text-gray-500">Blurb</Label>
						<Textarea id="footer-nl-text" value={content.newsletterText} onChange={(e) => set("newsletterText", e.target.value)} rows={2} placeholder="Select topics and stay current with our latest news." />
					</div>
				</div>

				{/* COPYRIGHT */}
				<div className="rounded-lg border border-gray-200 p-4">
					<Label htmlFor="footer-copyright" className="text-base font-semibold text-gray-900">Copyright line</Label>
					<Input id="footer-copyright" className="mt-2" value={content.copyright} onChange={(e) => set("copyright", e.target.value)} placeholder="© 2024–2026 Elevate Ballers · All Rights Reserved" />
					<p className="mt-1.5 text-xs text-gray-400">Contact details, social links and the logo are managed elsewhere (Contact &amp; Social tab / public/logo).</p>
				</div>
			</fieldset>
		</div>
	);
}
