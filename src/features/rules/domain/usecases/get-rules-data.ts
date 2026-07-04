/**
 * getRulesData — loads the v2 Rules page. Falls back to the transcribed default
 * content (with the current year) if the data source fails, so the page always
 * renders.
 */
import type { RulesData } from "@/features/rules/domain/entities/rules-v2";
import { fetchRulesData } from "@/features/rules/data/datasources/rules-v2";
import { RULES_DEFAULTS } from "@/features/rules/lib/rules-content";

function fallback(): RulesData {
	const year = new Date().getFullYear();
	return {
		hero: {
			eyebrow: `Official Rules & Regulations · ${year}`,
			title: "Rules",
			intro: `The official rules and regulations governing Elevate Ballers play. Valid as of 1 January ${year}, based on FIBA Official Basketball Rules 2024 with league-specific amendments.`,
			downloadLabel: "Download Full Rulebook",
			pdfUrl: "/documents/elevate-ballers-league-rules-2026.pdf",
		},
		quickRef: RULES_DEFAULTS.quickRef,
		sections: RULES_DEFAULTS.sections.map((s, i) => ({
			id: s.id,
			no: String(i + 1).padStart(2, "0"),
			anchor: `#${s.id}`,
			title: s.title,
			rules: s.rules,
		})),
		conduct: { eyebrow: RULES_DEFAULTS.conductEyebrow, heading: RULES_DEFAULTS.conductHeading, body: RULES_DEFAULTS.conductBody },
	};
}

export async function getRulesData(): Promise<RulesData> {
	return (await fetchRulesData()) ?? fallback();
}
