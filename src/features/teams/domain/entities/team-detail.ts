/** Domain entities for the v2 single-team page. */
export interface FormBadge {
	label: string; // W / L / D
	result: "win" | "loss" | "draw";
}

export interface HeroStat {
	value: string;
	label: string;
	color: string;
}

export interface ResultMatch {
	id: string;
	/** Link to the match detail page. */
	href: string;
	tag: string; // Win / Loss / Draw
	result: "win" | "loss" | "draw";
	date: string;
	season: string;
	home: string;
	away: string;
	hs: number;
	as: number;
	homeColor: string;
	awayColor: string;
}

export interface UpcomingMatch {
	id: string;
	/** Link to the match detail page. */
	href: string;
	when: string;
	league: string;
	home: string;
	away: string;
}

export interface SquadPlayer {
	id: string;
	jersey: string;
	initials: string;
	/** Resolved photo URL, or null → render the initials avatar. */
	image: string | null;
	name: string;
	pos: string;
	height: string;
	weight: string;
	href: string;
	ppg: string;
	rpg: string;
	apg: string;
	fg: string;
	ft: string;
	tp: string;
	ppgColor: string;
}

export interface StaffMember {
	initials: string;
	/** Resolved photo URL, or null → render the initials avatar. */
	image: string | null;
	name: string;
	role: string;
}

export interface TeamDetail {
	name: string;
	slug: string;
	initials: string;
	/** Resolved logo URL, or null → render the initials crest. */
	logo: string | null;
	league: string;
	leagueAbbr: string;
	headCoach: string;
	/** Most recent season with matches ("" when none). The hero record + form
	 *  are scoped to this season. */
	currentSeason: string;
	form: FormBadge[];
	heroStats: HeroStat[];
	recent: ResultMatch[];
	upcoming: UpcomingMatch[];
	seasons: string[];
	players: SquadPlayer[];
	playerCount: number;
	staff: StaffMember[];
}
