/**
 * v2 Rules data source. Reuses the existing "rules" site settings for the hero
 * copy + rulebook PDF (managed by the Rules Page settings tab), derives the
 * season year, and reads the structured rule sections from the optional
 * `rules_v2_content` setting merged over the transcribed defaults.
 */
import { prisma } from "@/lib/prisma";
import { getSiteSettingsByCategory, getSiteSettingByKey } from "@/features/cms/lib/queries";
import { RULES_CONTENT_KEY, parseRulesContent } from "@/features/rules/lib/rules-content";
import type { RulesData, RulesSectionView } from "@/features/rules/domain/entities/rules-v2";

const DEFAULT_PDF = "/documents/elevate-ballers-league-rules-2026.pdf";

export async function fetchRulesData(): Promise<RulesData | null> {
	try {
		const [rulesSettings, contentSetting, latestSeason] = await Promise.all([
			getSiteSettingsByCategory("rules").catch(() => [] as any[]),
			getSiteSettingByKey(RULES_CONTENT_KEY).catch(() => null),
			prisma.season.findFirst({ orderBy: { startDate: "desc" }, select: { startDate: true } }).catch(() => null),
		]);

		const map = new Map<string, string>((rulesSettings as any[]).map((s) => [s.key, s.value]));
		const val = (key: string, fallback: string) => {
			const v = map.get(key);
			return v != null && String(v).trim() !== "" ? String(v) : fallback;
		};
		const year = latestSeason?.startDate ? new Date(latestSeason.startDate).getFullYear() : new Date().getFullYear();

		const content = parseRulesContent(contentSetting?.value);
		const sections: RulesSectionView[] = content.sections.map((s, i) => ({
			id: s.id,
			no: String(i + 1).padStart(2, "0"),
			anchor: `#${s.id}`,
			title: s.title,
			rules: s.rules,
		}));

		const pdfUrl = val("rules_pdf_url", DEFAULT_PDF).trim();

		return {
			hero: {
				eyebrow: `Official Rules & Regulations · ${year}`,
				title: "Rules",
				intro: val(
					"rules_page_intro",
					`The official rules and regulations governing Elevate Ballers play. Valid as of 1 January ${year}, based on FIBA Official Basketball Rules 2024 with league-specific amendments.`,
				),
				downloadLabel: val("rules_download_label", "Download Full Rulebook"),
				pdfUrl: pdfUrl || null,
			},
			quickRef: content.quickRef,
			sections,
			conduct: { eyebrow: content.conductEyebrow, heading: content.conductHeading, body: content.conductBody },
		};
	} catch {
		return null;
	}
}
