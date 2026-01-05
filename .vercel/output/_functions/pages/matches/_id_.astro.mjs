import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_0fak_qL3.mjs';
import { P as PageLoader, b as $$TopBar, a as $$Header, M as MobileMenu, $ as $$Footer } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { $ as $$Spacing } from '../../chunks/Spacing_BPc02AQQ.mjs';
import { o as getMatchById } from '../../chunks/queries_E6Jl_Myi.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { g as getMatchStatusColor, a as getMatchStatusLabel, c as getRelativeTimeDescription, d as formatMatchDateTime } from '../../chunks/utils_D-DJdZHD.mjs';
import { g as getTeam1Name, a as getTeam1Logo, b as getTeam2Name, c as getTeam2Logo, d as getLeagueName } from '../../chunks/league-helpers_BQcVt2so.mjs';
import { C as ContentLoader } from '../../chunks/ContentLoader_CZRVSG-V.mjs';
export { renderers } from '../../renderers.mjs';

function MatchDetail({ match }) {
  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const relativeTime = getRelativeTimeDescription(match.date);
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  return /* @__PURE__ */ jsxs("div", { className: "match-detail", children: [
    /* @__PURE__ */ jsxs("div", { className: "match-detail-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "match-detail-meta", children: [
        /* @__PURE__ */ jsx("span", { className: "match-league", children: getLeagueName(match) }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "match-status-badge",
            style: { backgroundColor: statusColor, color: "white" },
            children: statusLabel
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "match-detail-date", children: [
        /* @__PURE__ */ jsx("span", { className: "date-label", children: "Match Date" }),
        /* @__PURE__ */ jsx("span", { className: "date-value", children: formatMatchDateTime(match.date) }),
        /* @__PURE__ */ jsxs("span", { className: "date-relative", children: [
          "(",
          relativeTime,
          ")"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "match-detail-teams", children: [
      /* @__PURE__ */ jsxs("div", { className: "match-team-detail", children: [
        team1Logo && /* @__PURE__ */ jsx(
          "img",
          {
            src: team1Logo,
            alt: team1Name,
            className: "team-logo-large",
            onError: (e) => {
              e.target.style.display = "none";
            }
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "team-name-large", children: team1Name }),
        hasScore && /* @__PURE__ */ jsx("div", { className: "team-score-large", children: match.team1Score })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "match-vs", children: [
        /* @__PURE__ */ jsx("span", { className: "vs-text", children: "VS" }),
        hasScore && /* @__PURE__ */ jsx("span", { className: "score-separator", children: "-" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "match-team-detail", children: [
        team2Logo && /* @__PURE__ */ jsx(
          "img",
          {
            src: team2Logo,
            alt: team2Name,
            className: "team-logo-large",
            onError: (e) => {
              e.target.style.display = "none";
            }
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "team-name-large", children: team2Name }),
        hasScore && /* @__PURE__ */ jsx("div", { className: "team-score-large", children: match.team2Score })
      ] })
    ] }),
    !hasScore && match.status === "UPCOMING" && /* @__PURE__ */ jsx("div", { className: "match-detail-upcoming", children: /* @__PURE__ */ jsxs("p", { children: [
      "Match scheduled for ",
      formatMatchDateTime(match.date)
    ] }) }),
    /* @__PURE__ */ jsx("style", { children: `
        .match-detail {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .match-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .match-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .match-league {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .match-detail-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .date-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .date-relative {
          font-size: 0.875rem;
          color: #64748b;
        }

        .match-detail-teams {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .match-team-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .team-logo-large {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .team-name-large {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          margin: 0;
        }

        .team-score-large {
          font-size: 3rem;
          font-weight: 800;
          color: #1e293b;
        }

        .match-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .vs-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .score-separator {
          font-size: 2rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .match-detail-upcoming {
          text-align: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .match-detail {
            padding: 1.5rem;
          }

          .match-detail-header {
            flex-direction: column;
            gap: 1rem;
          }

          .match-detail-date {
            align-items: flex-start;
          }

          .match-detail-teams {
            flex-direction: column;
            gap: 1.5rem;
          }

          .team-logo-large {
            width: 80px;
            height: 80px;
          }

          .team-name-large {
            font-size: 1.25rem;
          }

          .team-score-large {
            font-size: 2rem;
          }
        }
      ` })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/matches");
  }
  let match = null;
  let hasError = false;
  try {
    match = await getMatchById(id);
    if (!match) {
      return Astro2.redirect("/matches");
    }
  } catch (error) {
    console.error("Error fetching match:", error);
    hasError = true;
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" })} ${maybeRenderHead()}<div id="wrapper"> ${renderComponent($$result2, "TopBar", $$TopBar, {})} ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" })} <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-match-header", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} ${hasError ? renderTemplate`${renderComponent($$result2, "ContentLoader", ContentLoader, { "client:load": true, "message": "Failed to load match details. Please try again later.", "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/ContentLoader", "client:component-export": "default" })}` : match ? renderTemplate`<div style="max-width: 800px; margin: 0 auto;"> ${renderComponent($$result2, "MatchDetail", MatchDetail, { "client:load": true, "match": match, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/matches/components/MatchDetail", "client:component-export": "default" })} </div>` : null} <div style="text-align: center; margin-top: 2rem;"> <a href="/upcoming-fixtures" class="btn btn-primary" data-astro-prefetch>
View All Fixtures
</a> <a href="/matches/results" class="btn btn-secondary" data-astro-prefetch style="margin-left: 1rem;">
View Results
</a> </div> ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-match-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} </div> </div> </div> </div> </section> </div> </div> </div> ${renderComponent($$result2, "Footer", $$Footer, {})} <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> ` })} <style type="text/css">
  .sp-footer-sponsors {
    background: #f4f4f4;
    color: #363f48;
  }
  .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {
    color: #363f48;
  }

  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #dd3333;
    color: white;
  }

  .btn-primary:hover {
    background-color: #c02929;
  }

  .btn-secondary {
    background-color: #64748b;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #475569;
  }
</style>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/matches/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/matches/[id].astro";
const $$url = "/matches/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
