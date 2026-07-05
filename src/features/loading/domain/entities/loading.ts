/**
 * v2 loading-UI domain. One `SkeletonVariant` per page-type layout, so a route
 * can request the placeholder that mirrors its real structure (no layout jump
 * when data arrives). See `LoadingSkeleton.astro` for the dispatcher.
 */
export type SkeletonVariant =
	| "card-grid" // A — Players / Teams / News grid
	| "table" // B — Standings / Leaders / Box score
	| "podium" // C — Standings / Leaders top-3
	| "date-list" // D — Fixtures / Results
	| "article" // E — News detail
	| "scoreboard" // F — Match header
	| "detail-hero"; // G — Team / Player detail

/** Which skeleton to show for each public route family. */
export const ROUTE_SKELETON: Record<string, SkeletonVariant> = {
	players: "card-grid",
	teams: "card-grid",
	news: "card-grid",
	standings: "table",
	leaders: "podium",
	fixtures: "date-list",
	results: "date-list",
	article: "article",
	match: "scoreboard",
	player: "detail-hero",
	team: "detail-hero",
};

/** Rotating status lines shown under the boot splash. */
export const STATUS_LINES: string[] = [
	"Tipping off…",
	"Loading standings",
	"Fetching fixtures",
	"Warming up the court",
	"Almost there",
];

/** Line widths for multi-row text skeletons (article body etc.). */
export const SKEL_TEXT_WIDTHS: string[] = ["100%", "96%", "90%", "98%", "72%", "88%"];
