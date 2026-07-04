/**
 * Structured Rules content, transcribed from the official Elevate Ballers League
 * Rules & Regulations 2026 rulebook (RULE ONE–SIX / Articles 1–12, FIBA 2024
 * base). Stored as one JSON `SiteSetting` (`rules_v2_content`) when customised;
 * the public page reads it merged over these defaults. Dependency-free so both
 * server (public read) and client (a future admin editor) can import it.
 *
 * The hero copy + rulebook PDF are managed separately via the existing "Rules
 * Page" settings (rules_page_title / rules_page_intro / rules_pdf_url /
 * rules_download_label).
 */

export interface RuleItem {
	/** e.g. "1.1" — the article.section tag. */
	tag: string;
	title: string;
	body: string;
}
export interface RuleSection {
	/** anchor id, e.g. "admin". */
	id: string;
	title: string;
	rules: RuleItem[];
}
export interface QuickRefItem {
	value: string;
	label: string;
}
export interface RulesContent {
	quickRef: QuickRefItem[];
	sections: RuleSection[];
	conductEyebrow: string;
	conductHeading: string;
	conductBody: string;
}

export const RULES_CONTENT_KEY = "rules_v2_content";

export const RULES_DEFAULTS: RulesContent = {
	quickRef: [
		{ value: "4×10", label: "Minute quarters" },
		{ value: "5v5", label: "On court (min. 5)" },
		{ value: "12", label: "On the score sheet" },
		{ value: "Win = 2", label: "Classification pts" },
	],
	sections: [
		{
			id: "admin",
			title: "League Administration & Structure",
			rules: [
				{
					tag: "1.1",
					title: "Payment Structure",
					body: "Half of the league fee is due upon registration; the second half upon release of fixtures and before the first game. No refunds are issued after payment. Teams failing to make the second payment receive walkover losses for all fixtures until payment is completed.",
				},
				{
					tag: "1.2",
					title: "Roster Additions",
					body: "Players may be added until the 2nd Monday of July (transfer deadline) via a letter to the league with full details and professional photos. A non-refundable Ksh. 500 fee applies per addition; new players are eligible one week after submission. Required: a passport-size photo and a full-body photo in full team kit.",
				},
				{
					tag: "1.3",
					title: "Transfer Window",
					body: "During the first two weeks of July, transferring players pay a Ksh. 1,000 fee split 50:50 between the league and the former team, and provide photos in the new kit. Transfers are initiated by the receiving manager via a “Request for Transfer” letter to the current team, CC’d to elevateballers@gmail.com, and approved in reply. All communication and payment must be completed by midnight on 14 July; transfers take effect (and players become eligible) from 21 July. Maximum of THREE acquisitions per team during the window.",
				},
				{
					tag: "2.1",
					title: "Fixture Changes",
					body: "Teams may request up to 3 fixture changes per season, in writing at least 2 weeks before the original date, subject to league approval. Academic institutions in national/regional events may get special consideration with 2 weeks’ notice. The league responds within 48 hours.",
				},
				{
					tag: "2.2",
					title: "Game Time & Walkovers",
					body: "Games start on time; teams more than 15 minutes late forfeit by walkover. A walkover means a 20–0 forfeit loss, a 1-point deduction on the table, and a Ksh. 500 fine for each subsequent walkover (payable before the next game). Three walkovers in the regular season means suspension for the rest of the season; one walkover in the playoffs forfeits the series.",
				},
			],
		},
		{
			id: "teams",
			title: "Teams & Equipment",
			rules: [
				{
					tag: "3.1",
					title: "Eligibility",
					body: "Each team may register up to 22 members, but only 12 (including a captain) may be listed on the score sheet to play. A minimum of 5 players is required to start (FIBA 9.3); a team with fewer than 2 players able to play loses by default (FIBA 21.1). Teams must also indicate a coach/manager, who may also be registered as a player.",
				},
				{
					tag: "3.2",
					title: "Uniforms",
					body: "Shirts must share a dominant colour front and back with the shorts (FIBA 4.3.1). Shirts must be numbered front and back in a contrasting colour, using 0, 00, or 1–99, with no duplicate numbers on a team (FIBA 4.3.2). Players may not sub in with swapped, inside-out, or non-matching jerseys. The home team (named first) wears light colours (preferably white); visitors wear dark (FIBA 4.3.3).",
				},
				{
					tag: "3.3",
					title: "Permitted Equipment",
					body: "No equipment that may cause injury (FIBA 4.4.2): no hard guards, casts or braces, no sharp objects (nails closely cut), no jewelry or hair accessories. Permitted: padded arm/thigh/leg protectors, knee/shoulder/ankle braces, clear mouth guards, safe spectacles, and textile wrist/head bands up to 10 cm. All compression garments, headgear, bands and tapings must be one solid matching colour.",
				},
				{
					tag: "4.1",
					title: "Court & Equipment Provided",
					body: "Games are played on a regular, safe court. The league provides basketballs, a scoreboard, game clock and shot clock, the official scoresheet, and player/team foul markers.",
				},
				{
					tag: "4.3",
					title: "Venue Cleanliness",
					body: "Coaches providing water and refreshments must ensure all litter is collected and deposited at designated locations so the venue stays clean.",
				},
			],
		},
		{
			id: "game",
			title: "Game Procedures",
			rules: [
				{
					tag: "5.1",
					title: "Playing Time",
					body: "Four quarters of 10 minutes each, a 10-minute half-time interval, and 2-minute intervals between the 1st–2nd and 3rd–4th quarters and before each overtime.",
				},
				{
					tag: "5.2",
					title: "Overtime",
					body: "If tied at the end of the fourth quarter, play continues in 5-minute overtime periods until the tie is broken.",
				},
				{
					tag: "6.1",
					title: "Time-Outs",
					body: "Each team gets 2 time-outs in the first half and 3 in the second (max 2 of them when the clock shows 2:00 or less in the fourth), plus 1 per overtime. Each time-out lasts 1 minute.",
				},
				{
					tag: "6.2",
					title: "Substitutions",
					body: "Teams may substitute during a substitution opportunity — when the ball is dead, the clock stopped, and the referee has finished with the scorer’s table; after a successful last free throw; or, for the non-scoring team, on a made basket when the clock shows 2:00 or less in the fourth quarter and each overtime.",
				},
			],
		},
		{
			id: "conduct",
			title: "Conduct & Discipline",
			rules: [
				{
					tag: "7.1",
					title: "Technical Fouls",
					body: "A behavioural, non-contact foul — ignoring referee warnings, disrespecting officials/opponents/bench, inciting spectators, delaying the game, or faking a foul. A player is disqualified on 2 technical fouls, 2 unsportsmanlike fouls, or 1 of each.",
				},
				{
					tag: "7.2",
					title: "Unsportsmanlike & Disqualifying Fouls",
					body: "An unsportsmanlike foul is contact not legitimately playing the ball, excessive/hard contact, or unnecessary contact to stop a transition. A disqualifying foul is any flagrant unsportsmanlike act by players, subs, coaches, or delegation members.",
				},
				{
					tag: "7.3",
					title: "Fighting Policy",
					body: "Fighting is physical interaction between opponents or bench persons. Anyone leaving the bench area during a fight (or a situation that may lead to one) is disqualified. The disciplinary committee may review incidents and impose further, proportionate sanctions.",
				},
				{
					tag: "7.4",
					title: "Conduct Towards Referees",
					body: "Address officials respectfully, preferably at the end of a quarter, through the captain or coach. Teams and players who ignore procedure receive ONE warning before officials apply available measures.",
				},
				{
					tag: "8.1",
					title: "Environmental Responsibility",
					body: "Teams keep their bench area clean and dispose of all trash in provided bins. Failure may result in disciplinary action at the league’s discretion.",
				},
			],
		},
		{
			id: "officials",
			title: "Officials & Protest Procedure",
			rules: [
				{
					tag: "9.1",
					title: "Arrival & Preparedness",
					body: "Officials must arrive at least 30 minutes before the first game and remain for the entire day’s schedule unless excused for emergencies.",
				},
				{
					tag: "9.2",
					title: "Authority",
					body: "Referees’ power begins 20 minutes before tip-off and ends at the final game-clock signal as approved by the crew chief. Their interpretation of the Official Basketball Rules is final and cannot be contested, except where a protest is allowed.",
				},
				{
					tag: "10.1",
					title: "Protest Procedure",
					body: "The captain must inform the crew chief within 15 minutes of the game ending and sign the scoresheet’s protest column. Protests are allowed for scorekeeping/timekeeping/shot-clock errors the referees could have corrected, forfeit decisions, or eligibility violations. A written protest with a Ksh. 1,500 fee (refunded if upheld) must follow within 1 hour.",
				},
			],
		},
		{
			id: "classification",
			title: "Classification & Playoffs",
			rules: [
				{
					tag: "11.1",
					title: "Point System",
					body: "Win = 2 classification points. Loss (including by default) = 1 point. Loss by forfeit = 0 points. A walkover loss (treated as a forfeit) = 0 points, plus an additional 1-point deduction per league rule.",
				},
				{
					tag: "11.2",
					title: "Tiebreakers",
					body: "For teams level on win-loss record, apply in order (FIBA Appendix D.1.3): 1) higher points difference in games between them; 2) higher points scored between them; 3) higher points difference across all group games; 4) higher points scored across all group games.",
				},
				{
					tag: "12.1",
					title: "Playoffs",
					body: "The playoff structure is announced before the season. Higher-seeded teams receive home-court advantage. A walkover in the playoffs results in series forfeiture. These rules may be amended by the Elevate Ballers League Committee with prior notice to all teams.",
				},
			],
		},
	],
	conductEyebrow: "Zero Tolerance",
	conductHeading: "Respect the game",
	conductBody:
		"Fighting leads to disqualification, and anyone leaving the bench area during a fight is disqualified. Two technical or unsportsmanlike fouls (or one of each) disqualify a player for the game. The disciplinary committee may review any incident and impose further, proportionate sanctions. Play hard, play fair.",
};

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

const cleanRules = (v: unknown): RuleItem[] =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ tag: String(x?.tag ?? "").trim(), title: String(x?.title ?? "").trim(), body: String(x?.body ?? "").trim() }))
				.filter((r) => r.title || r.body)
		: [];

const cleanSections = (v: unknown): RuleSection[] | null =>
	Array.isArray(v)
		? v
				.map((x: any, i: number) => ({
					id: String(x?.id ?? `section-${i + 1}`).trim() || `section-${i + 1}`,
					title: String(x?.title ?? "").trim(),
					rules: cleanRules(x?.rules),
				}))
				.filter((s) => s.title && s.rules.length)
		: null;

const cleanQuickRef = (v: unknown): QuickRefItem[] | null =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ value: String(x?.value ?? "").trim(), label: String(x?.label ?? "").trim() }))
				.filter((q) => q.value || q.label)
		: null;

/** Merge stored (possibly partial) content over defaults so the page never renders a hole. */
export function mergeRulesContent(stored: Partial<RulesContent> | null | undefined): RulesContent {
	const s = stored ?? {};
	const sections = cleanSections(s.sections);
	const quickRef = cleanQuickRef(s.quickRef);
	return {
		quickRef: quickRef && quickRef.length ? quickRef : RULES_DEFAULTS.quickRef,
		sections: sections && sections.length ? sections : RULES_DEFAULTS.sections,
		conductEyebrow: nonEmpty(s.conductEyebrow) ? String(s.conductEyebrow) : RULES_DEFAULTS.conductEyebrow,
		conductHeading: nonEmpty(s.conductHeading) ? String(s.conductHeading) : RULES_DEFAULTS.conductHeading,
		conductBody: nonEmpty(s.conductBody) ? String(s.conductBody) : RULES_DEFAULTS.conductBody,
	};
}

/** Parse a raw stored JSON string (or null) into a full RulesContent. */
export function parseRulesContent(raw: string | null | undefined): RulesContent {
	if (!raw) return RULES_DEFAULTS;
	try {
		return mergeRulesContent(JSON.parse(raw));
	} catch {
		return RULES_DEFAULTS;
	}
}
