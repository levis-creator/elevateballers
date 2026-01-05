import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_0fak_qL3.mjs';
import { P as PageLoader, b as $$TopBar, a as $$Header, M as MobileMenu, $ as $$Footer } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { $ as $$Spacing } from '../../chunks/Spacing_BPc02AQQ.mjs';
import { a as getCompletedMatches } from '../../chunks/queries_DUy-FH4c.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { g as getMatchStatusColor, a as getMatchStatusLabel, f as formatMatchDate, b as formatMatchTime } from '../../chunks/utils_D-DJdZHD.mjs';
import { g as getTeam1Name, a as getTeam1Logo, b as getTeam2Name, c as getTeam2Logo, d as getLeagueName$1 } from '../../chunks/league-helpers_BQcVt2so.mjs';
import { C as ContentLoader } from '../../chunks/ContentLoader_CZRVSG-V.mjs';
export { renderers } from '../../renderers.mjs';

function MatchCard({
  match,
  showLeague = true,
  showDate = true,
  showTime = true,
  compact = false,
  onClick
}) {
  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  if (compact) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: `match-card-compact ${onClick ? "clickable" : ""}`,
        onClick,
        role: onClick ? "button" : void 0,
        tabIndex: onClick ? 0 : void 0,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "match-card-header-compact", children: [
            showLeague && /* @__PURE__ */ jsx("span", { className: "match-league-compact", children: getLeagueName$1(match) }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "match-status-badge-compact",
                style: { backgroundColor: statusColor, color: "white" },
                children: statusLabel
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "match-teams-compact", children: [
            /* @__PURE__ */ jsxs("div", { className: "match-team-compact", children: [
              team1Logo && /* @__PURE__ */ jsx(
                "img",
                {
                  src: team1Logo,
                  alt: team1Name,
                  className: "team-logo-compact",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "team-name-compact", children: team1Name }),
              hasScore && /* @__PURE__ */ jsx("span", { className: "team-score-compact", children: match.team1Score })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vs-compact", children: "vs" }),
            /* @__PURE__ */ jsxs("div", { className: "match-team-compact", children: [
              team2Logo && /* @__PURE__ */ jsx(
                "img",
                {
                  src: team2Logo,
                  alt: team2Name,
                  className: "team-logo-compact",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "team-name-compact", children: team2Name }),
              hasScore && /* @__PURE__ */ jsx("span", { className: "team-score-compact", children: match.team2Score })
            ] })
          ] }),
          (showDate || showTime) && /* @__PURE__ */ jsxs("div", { className: "match-date-compact", children: [
            showDate && formatMatchDate(match.date),
            showDate && showTime && " • ",
            showTime && formatMatchTime(match.date)
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `match-card ${onClick ? "clickable" : ""}`,
      onClick,
      role: onClick ? "button" : void 0,
      tabIndex: onClick ? 0 : void 0,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "match-card-header", children: [
          showLeague && /* @__PURE__ */ jsx("span", { className: "match-league", children: getLeagueName$1(match) }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "match-status-badge",
              style: { backgroundColor: statusColor, color: "white" },
              children: statusLabel
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "match-card-teams", children: [
          /* @__PURE__ */ jsxs("div", { className: "match-team", children: [
            team1Logo && /* @__PURE__ */ jsx(
              "img",
              {
                src: team1Logo,
                alt: team1Name,
                className: "team-logo",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "team-name", children: team1Name }),
            hasScore && /* @__PURE__ */ jsx("span", { className: "team-score", children: match.team1Score })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vs", children: "vs" }),
          /* @__PURE__ */ jsxs("div", { className: "match-team", children: [
            team2Logo && /* @__PURE__ */ jsx(
              "img",
              {
                src: team2Logo,
                alt: team2Name,
                className: "team-logo",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "team-name", children: team2Name }),
            hasScore && /* @__PURE__ */ jsx("span", { className: "team-score", children: match.team2Score })
          ] })
        ] }),
        (showDate || showTime) && /* @__PURE__ */ jsx("div", { className: "match-card-footer", children: /* @__PURE__ */ jsxs("div", { className: "match-date", children: [
          showDate && formatMatchDate(match.date),
          showDate && showTime && " • ",
          showTime && formatMatchTime(match.date)
        ] }) }),
        /* @__PURE__ */ jsx("style", { children: `
        .match-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .match-card.clickable {
          cursor: pointer;
        }

        .match-card.clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .match-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .match-league {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-card-teams {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .match-team {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .team-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .team-name {
          flex: 1;
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .team-score {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs {
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .match-card-footer {
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .match-date {
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Compact variant */
        .match-card-compact {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .match-card-compact.clickable {
          cursor: pointer;
        }

        .match-card-compact.clickable:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .match-card-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .match-league-compact {
          font-size: 0.75rem;
          color: #64748b;
        }

        .match-status-badge-compact {
          display: inline-flex;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-teams-compact {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .match-team-compact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .team-logo-compact {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .team-name-compact {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .team-score-compact {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs-compact {
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .match-date-compact {
          font-size: 0.75rem;
          color: #64748b;
        }
      ` })
      ]
    }
  );
}

function MatchList({
  matches,
  showFilters = false,
  showLeague = true,
  compact = false,
  onMatchClick
}) {
  const [filteredMatches, setFilteredMatches] = useState(matches);
  const [statusFilter, setStatusFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    let filtered = [...matches];
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter.toUpperCase());
    }
    if (leagueFilter !== "all") {
      filtered = filtered.filter((m) => getLeagueName(m) === leagueFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) => m.team1Name && m.team1Name.toLowerCase().includes(term) || m.team2Name && m.team2Name.toLowerCase().includes(term) || getLeagueName(m).toLowerCase().includes(term)
      );
    }
    setFilteredMatches(filtered);
  }, [matches, statusFilter, leagueFilter, searchTerm]);
  const leagues = Array.from(new Set(matches.map((m) => getLeagueName(m)))).sort();
  if (matches.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "match-list-empty", children: /* @__PURE__ */ jsx("p", { children: "No matches found." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "match-list", children: [
    showFilters && /* @__PURE__ */ jsxs("div", { className: "match-list-filters", children: [
      /* @__PURE__ */ jsxs("div", { className: "filter-group", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "status-filter", children: "Status:" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "status-filter",
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
              /* @__PURE__ */ jsx("option", { value: "upcoming", children: "Upcoming" }),
              /* @__PURE__ */ jsx("option", { value: "live", children: "Live" }),
              /* @__PURE__ */ jsx("option", { value: "completed", children: "Completed" })
            ]
          }
        )
      ] }),
      leagues.length > 0 && /* @__PURE__ */ jsxs("div", { className: "filter-group", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "league-filter", children: "League:" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "league-filter",
            value: leagueFilter,
            onChange: (e) => setLeagueFilter(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All Leagues" }),
              leagues.map((league) => /* @__PURE__ */ jsx("option", { value: league, children: league }, league))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "filter-group", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "search-filter", children: "Search:" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "search-filter",
            type: "text",
            placeholder: "Search matches...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          }
        )
      ] })
    ] }),
    filteredMatches.length === 0 ? /* @__PURE__ */ jsx("div", { className: "match-list-empty", children: /* @__PURE__ */ jsx("p", { children: "No matches match your filters." }) }) : /* @__PURE__ */ jsx("div", { className: `match-list-grid ${compact ? "compact" : ""}`, children: filteredMatches.map((match) => /* @__PURE__ */ jsx(
      MatchCard,
      {
        match,
        showLeague,
        compact,
        onClick: onMatchClick ? () => onMatchClick(match) : void 0
      },
      match.id
    )) }),
    /* @__PURE__ */ jsx("style", { children: `
        .match-list {
          width: 100%;
        }

        .match-list-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
        }

        .filter-group select,
        .filter-group input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          color: #1e293b;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .match-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .match-list-grid.compact {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .match-list-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .match-list-grid {
            grid-template-columns: 1fr;
          }

          .match-list-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }
        }
      ` })
  ] });
}

const prerender = false;
const $$Results = createComponent(async ($$result, $$props, $$slots) => {
  let matches = [];
  let hasError = false;
  try {
    matches = await getCompletedMatches();
  } catch (error) {
    console.error("Error fetching match results:", error);
    hasError = true;
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" })} ${maybeRenderHead()}<div id="wrapper"> ${renderComponent($$result2, "TopBar", $$TopBar, {})} ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" })} <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-results-header", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;">
MATCH RESULTS
</h2> ${hasError ? renderTemplate`${renderComponent($$result2, "ContentLoader", ContentLoader, { "client:load": true, "message": "Failed to load match results. Please try again later.", "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/ContentLoader", "client:component-export": "default" })}` : renderTemplate`${renderComponent($$result2, "MatchList", MatchList, { "client:load": true, "matches": matches, "showFilters": true, "showLeague": true, "onMatchClick": ((match) => {
    window.location.href = `/matches/${match.id}`;
  }), "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/matches/components/MatchList", "client:component-export": "default" })}`} ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-results-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} </div> </div> </div> </div> </section> </div> </div> </div> ${renderComponent($$result2, "Footer", $$Footer, {})} <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> ` })} <style type="text/css">
  .sp-footer-sponsors {
    background: #f4f4f4;
    color: #363f48;
  }
  .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {
    color: #363f48;
  }

  .heading-font {
    font-size: 40px;
    line-height: 44px;
    margin-bottom: 50px;
    color: #dd3333 !important;
  }
</style>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/matches/results.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/matches/results.astro";
const $$url = "/matches/results";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Results,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
