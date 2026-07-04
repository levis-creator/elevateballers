/**
 * v2 Rules page entity. `RulesData` is what the page renders: hero (CMS-editable
 * copy + rulebook PDF), quick-reference tiles, numbered rule sections (with
 * anchors for the sticky side-nav), and the conduct callout.
 */
import type { RuleItem, QuickRefItem } from "@/features/rules/lib/rules-content";

/** A rule section with its display number and anchor computed. */
export interface RulesSectionView {
	id: string;
	/** Zero-padded index, e.g. "01". */
	no: string;
	/** "#<id>" for the side-nav + section heading link. */
	anchor: string;
	title: string;
	rules: RuleItem[];
}

export interface RulesData {
	hero: {
		eyebrow: string;
		title: string;
		intro: string;
		downloadLabel: string;
		/** Rulebook PDF URL, or null → hide the download button. */
		pdfUrl: string | null;
	};
	quickRef: QuickRefItem[];
	sections: RulesSectionView[];
	conduct: { eyebrow: string; heading: string; body: string };
}
