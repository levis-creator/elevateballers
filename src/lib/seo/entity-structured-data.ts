/**
 * JSON-LD (schema.org) for the public match, team and player detail pages.
 *
 * Each builder returns a full `{ "@context", "@graph" }` document holding the
 * page's main entity plus a BreadcrumbList. Nodes reference the site-wide
 * organisation by `@id` (`<origin>/#organization`, defined in full on the home
 * page) so search engines can tie every page back to the league.
 *
 * Only real data is marked up: empty values, placeholders ("—", "Free Agent")
 * and team links without a slug are left out rather than emitted.
 */
import type { MatchView } from "@/features/matches/domain/entities/match-detail-v2";
import type { TeamDetail } from "@/features/teams/domain/entities/team-detail";
import type { PlayerView } from "@/features/player/domain/entities/player-detail-v2";

type Node = Record<string, unknown>;

const abs = (origin: string, url: string) => (/^https?:\/\//.test(url) ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`);

/** Detail-page URL with a trailing slash, matching the canonical tags. */
const pageUrl = (origin: string, path: string) => abs(origin, path.endsWith("/") ? path : `${path}/`);

/** A `/teams/<slug>` link is only real when it has a slug. */
const teamUrl = (origin: string, href: string | null | undefined) =>
	href && /^\/teams\/[^/]+/.test(href) ? pageUrl(origin, href) : undefined;

const organization = (origin: string): Node => ({
	"@type": "SportsOrganization",
	"@id": `${origin}/#organization`,
	name: "Elevate Ballers",
	url: `${origin}/`,
	sport: "Basketball",
});

function breadcrumb(id: string, items: Array<[name: string, url: string]>): Node {
	return {
		"@type": "BreadcrumbList",
		"@id": `${id}#breadcrumb`,
		itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
	};
}

const doc = (graph: Node[]) => ({ "@context": "https://schema.org", "@graph": graph });

function sideTeam(origin: string, side: MatchView["home"]): Node {
	const url = teamUrl(origin, side.href);
	return {
		"@type": "SportsTeam",
		name: side.name,
		sport: "Basketball",
		...(url ? { "@id": `${url}#team`, url } : {}),
		...(side.logo ? { logo: abs(origin, side.logo) } : {}),
	};
}

export function buildMatchJsonLd(origin: string, view: MatchView, image?: string) {
	const url = pageUrl(origin, `/matches/${view.slug || view.id}`);
	const name = `${view.home.name} vs ${view.away.name}`;
	const home = sideTeam(origin, view.home);
	const away = sideTeam(origin, view.away);
	const description =
		view.state === "final" && view.home.score != null && view.away.score != null
			? `Final score: ${view.home.name} ${view.home.score}, ${view.away.name} ${view.away.score}. ${view.league}.`
			: `${name} in the ${view.league}.`;

	const event: Node = {
		"@type": "SportsEvent",
		"@id": `${url}#event`,
		name,
		url,
		description,
		sport: "Basketball",
		...(view.startDate ? { startDate: view.startDate } : {}),
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
		homeTeam: home,
		awayTeam: away,
		competitor: [home, away],
		...(view.venue ? { location: { "@type": "Place", name: view.venue } } : {}),
		...(image ? { image: abs(origin, image) } : {}),
		organizer: { "@id": `${origin}/#organization` },
	};

	return doc([
		event,
		organization(origin),
		breadcrumb(url, [
			["Home", `${origin}/`],
			["Matches", `${origin}/matches/`],
			[name, url],
		]),
	]);
}

export function buildTeamJsonLd(origin: string, team: TeamDetail) {
	const url = pageUrl(origin, `/teams/${team.slug}`);
	const coach = team.headCoach && team.headCoach !== "—" ? team.headCoach : null;
	const athletes = team.players
		.filter((p) => p.name?.trim())
		.map((p) => {
			const playerUrl = p.href && /^\/players\/[^/]+/.test(p.href) ? pageUrl(origin, p.href) : undefined;
			return {
				"@type": "Person",
				name: p.name,
				...(playerUrl ? { "@id": `${playerUrl}#person`, url: playerUrl } : {}),
			};
		});

	const sportsTeam: Node = {
		"@type": "SportsTeam",
		"@id": `${url}#team`,
		name: team.name,
		...(team.nickname?.trim() ? { alternateName: team.nickname.trim() } : {}),
		url,
		sport: "Basketball",
		...(team.description?.trim() ? { description: team.description.trim() } : {}),
		...(team.logo ? { logo: abs(origin, team.logo), image: abs(origin, team.logo) } : {}),
		memberOf: team.league?.trim()
			? { "@type": "SportsOrganization", name: team.league.trim(), sport: "Basketball", parentOrganization: { "@id": `${origin}/#organization` } }
			: { "@id": `${origin}/#organization` },
		...(coach ? { coach: { "@type": "Person", name: coach } } : {}),
		...(athletes.length ? { athlete: athletes } : {}),
	};

	return doc([
		sportsTeam,
		organization(origin),
		breadcrumb(url, [
			["Home", `${origin}/`],
			["Teams", `${origin}/teams/`],
			[team.name, url],
		]),
	]);
}

export function buildPlayerJsonLd(origin: string, view: PlayerView) {
	const url = pageUrl(origin, `/players/${view.slug || view.id}`);
	const name = `${view.hero.first} ${view.hero.last}`.trim();
	const team = view.hero.team && view.hero.team !== "Free Agent" ? view.hero.team : null;
	const teamLink = teamUrl(origin, view.hero.teamHref);
	const sameAs = view.socialLinks.map((s) => s.href).filter((h) => /^https?:\/\//.test(h));

	const person: Node = {
		"@type": "Person",
		"@id": `${url}#person`,
		name,
		url,
		...(view.hero.image ? { image: abs(origin, view.hero.image) } : {}),
		...(view.biography?.trim() ? { description: view.biography.trim() } : {}),
		...(team
			? {
					memberOf: {
						"@type": "SportsTeam",
						name: team,
						sport: "Basketball",
						...(teamLink ? { "@id": `${teamLink}#team`, url: teamLink } : {}),
					},
				}
			: {}),
		affiliation: { "@id": `${origin}/#organization` },
		...(sameAs.length ? { sameAs } : {}),
	};

	return doc([
		{
			"@type": "ProfilePage",
			"@id": url,
			url,
			name: `${name} — Player Profile`,
			mainEntity: { "@id": `${url}#person` },
			breadcrumb: { "@id": `${url}#breadcrumb` },
		},
		person,
		organization(origin),
		breadcrumb(url, [
			["Home", `${origin}/`],
			["Players", `${origin}/players/`],
			[name, url],
		]),
	]);
}
