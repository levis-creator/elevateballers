/**
 * Shared active/inactive styles for the filter/tab pills used by LatestNews,
 * StatsSection (League Leaders) and FeaturedMedia. Applied via Alpine `:style`.
 * font-family is inherited from the page (font-body), so it's omitted here.
 */
export const TAB_ACTIVE =
	"background:#e4002b;color:#fff;border:1px solid #e4002b;font-weight:700;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;padding:9px 15px;border-radius:6px;cursor:pointer;";

export const TAB_INACTIVE =
	"background:#fff;color:#6f665c;border:1px solid rgba(0,0,0,0.15);font-weight:600;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;padding:9px 15px;border-radius:6px;cursor:pointer;";
