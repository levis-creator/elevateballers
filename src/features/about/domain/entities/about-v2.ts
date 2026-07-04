/**
 * v2 About page entities. `AboutData` is what the page consumes. The data layer
 * fills the quantitative bits from real queries (stat counts, per-league team /
 * player counts, venue contacts); the editorial prose (values, timeline,
 * leadership) is static content supplied by the use case.
 */

/** A tile in the stat strip. `accent` → brand colour (else ink). */
export interface AboutStat {
	value: string;
	label: string;
	accent: boolean;
}

/** One of the two league cards. `dark` styles the first card on a dark panel. */
export interface AboutLeague {
	abbr: string;
	title: string;
	teams: string;
	players: string;
	body: string;
	dark: boolean;
}

export interface AboutValue {
	num: string;
	title: string;
	body: string;
}

export interface AboutMilestone {
	year: string;
	title: string;
	body: string;
}

export interface AboutPerson {
	name: string;
	role: string;
	/** Portrait URL, or null → render the placeholder tile. */
	image: string | null;
}

/** A labelled venue/contact line (Where / When / Reach). */
export interface AboutContact {
	k: string;
	v: string;
}

export interface AboutData {
	stats: AboutStat[];
	leagues: AboutLeague[];
	values: AboutValue[];
	timeline: AboutMilestone[];
	people: AboutPerson[];
	contacts: AboutContact[];
}
