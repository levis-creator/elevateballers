/**
 * Builds the JSON-LD schema.org @graph for the v2 home page.
 *
 * Restores v1's site-wide graph (SportsOrganization / WebSite / WebPage /
 * BreadcrumbList / logo) and adds SportsEvent + NewsArticle derived from the
 * real HomeData. Demo/fallback rows (no ISO date) are excluded so we never emit
 * fake events/articles.
 */
import type { HomeData } from "@/features/home/domain/entities/home-v2";

const PAGE_NAME = "Elevate Ballers - Kenya's Premier Basketball League & Championships";
const SITE_DESCRIPTION =
	"Elevate Ballers is Kenya's premier basketball league hosting championships in Nairobi. Follow live standings, rising stars, and match results from our basketball community.";
const ORG_DESCRIPTION =
	"Premier basketball league providing high-quality competition, player development, and community engagement.";

const abs = (origin: string, url: string) => (url.startsWith("http") ? url : `${origin}${url}`);

export function buildHomeJsonLd(origin: string, home: HomeData) {
	const orgRef = { "@id": `${origin}/#organization` };
	const graph: Record<string, unknown>[] = [
		{
			"@type": "WebSite",
			"@id": `${origin}/#website`,
			url: `${origin}/`,
			name: "Elevate Ballers",
			description: SITE_DESCRIPTION,
			inLanguage: "en-US",
			publisher: orgRef,
		},
		{
			"@type": "WebPage",
			"@id": `${origin}/`,
			url: `${origin}/`,
			name: PAGE_NAME,
			isPartOf: { "@id": `${origin}/#website` },
			about: orgRef,
			primaryImageOfPage: { "@id": `${origin}/#logo` },
			description: SITE_DESCRIPTION,
			breadcrumb: { "@id": `${origin}/#breadcrumb` },
			inLanguage: "en-US",
		},
		{
			"@type": "BreadcrumbList",
			"@id": `${origin}/#breadcrumb`,
			itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` }],
		},
		{
			"@type": "ImageObject",
			"@id": `${origin}/#logo`,
			url: `${origin}/images/Elevate_Icon-200x200.png`,
			contentUrl: `${origin}/images/Elevate_Icon-200x200.png`,
			width: 200,
			height: 200,
			caption: "Elevate Ballers",
			inLanguage: "en-US",
		},
		{
			"@type": "SportsOrganization",
			"@id": `${origin}/#organization`,
			name: "Elevate Ballers",
			url: `${origin}/`,
			sport: "Basketball",
			description: ORG_DESCRIPTION,
			logo: { "@id": `${origin}/#logo` },
			address: {
				"@type": "PostalAddress",
				streetAddress: "Pepo Lane, off Dagoretti Road",
				addressLocality: "Nairobi",
				addressCountry: "KE",
			},
			contactPoint: {
				"@type": "ContactPoint",
				telephone: "+254703913923",
				email: "ballers@elevateballers.com",
				contactType: "customer support",
			},
		},
	];

	// Real upcoming matches → SportsEvent
	for (const m of home.upcoming) {
		if (!m.startDate) continue;
		graph.push({
			"@type": "SportsEvent",
			name: `${m.home} vs ${m.away}`,
			startDate: m.startDate,
			eventStatus: "https://schema.org/EventScheduled",
			eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
			sport: "Basketball",
			...(m.venue ? { location: { "@type": "Place", name: m.venue } } : {}),
			competitor: [
				{ "@type": "SportsTeam", name: m.home },
				{ "@type": "SportsTeam", name: m.away },
			],
			organizer: orgRef,
		});
	}

	// Real news → NewsArticle
	for (const n of home.news) {
		if (!n.datePublished) continue;
		graph.push({
			"@type": "NewsArticle",
			headline: n.title,
			url: abs(origin, n.url),
			datePublished: n.datePublished,
			articleSection: n.cat,
			...(n.excerpt ? { description: n.excerpt } : {}),
			...(n.image ? { image: abs(origin, n.image) } : {}),
			author: orgRef,
			publisher: orgRef,
		});
	}

	return { "@context": "https://schema.org", "@graph": graph };
}
