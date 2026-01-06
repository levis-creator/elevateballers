import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_PYfl9QGE.mjs';
import { P as PageLoader, b as $$TopBar, a as $$Header, M as MobileMenu, $ as $$Footer } from '../chunks/PageLoader_D_5s45Mo.mjs';
import { $ as $$Spacing } from '../chunks/Spacing_BPc02AQQ.mjs';
import { jsx } from 'react/jsx-runtime';
import 'react';
import { createTheme, DoubleEliminationBracket, Match, SVGViewer, SingleEliminationBracket } from '@g-loot/react-tournament-brackets';
export { renderers } from '../renderers.mjs';

const customTheme = createTheme({
  textColor: { main: "#363f48", onSecondary: "#ffffff", secondary: "#777777" },
  matchBackground: { won: "#ffffff", lost: "#f8f9fa" },
  score: {
    background: { won: "#e21e22", lost: "#64748b" },
    text: { won: "#ffffff", lost: "#ffffff" }
  },
  border: { color: "#e2e8f0", highlightedColor: "#e21e22" },
  roundHeader: { backgroundColor: "#e21e22", fontColor: "#ffffff" },
  connectorColor: "#cbd5e1",
  connectorColorHighlighted: "#e21e22",
  svgBackground: "#ffffff"
});
const TournamentBracket = ({
  matches,
  isDoubleElimination = false
}) => {
  if (isDoubleElimination) {
    return /* @__PURE__ */ jsx("div", { className: "sp-tournament-bracket sp-tournament-bracket-double", children: /* @__PURE__ */ jsx(
      DoubleEliminationBracket,
      {
        matches,
        theme: customTheme,
        options: {
          style: {
            roundHeader: { backgroundColor: "#e21e22" }
          }
        },
        renderMatchComponent: Match,
        svgWrapper: ({ children, ...props }) => /* @__PURE__ */ jsx(SVGViewer, { width: 1e3, height: 600, ...props, children })
      }
    ) });
  }
  return /* @__PURE__ */ jsx("div", { className: "sp-tournament-bracket sp-tournament-bracket-single", children: /* @__PURE__ */ jsx(
    SingleEliminationBracket,
    {
      matches,
      theme: customTheme,
      options: {
        style: {
          roundHeader: { backgroundColor: "#e21e22" }
        }
      },
      renderMatchComponent: Match,
      svgWrapper: ({ children, ...props }) => /* @__PURE__ */ jsx(SVGViewer, { width: 1e3, height: 600, ...props, children })
    }
  ) });
};

const $$Tournaments = createComponent(($$result, $$props, $$slots) => {
  const mockMatches = [
    {
      id: "1",
      nextMatchId: null,
      // Final
      tournamentRoundText: "Final",
      startTime: "2024-06-15",
      state: "DONE",
      participants: [
        {
          id: "team-1",
          resultText: "85",
          isWinner: true,
          status: null,
          name: "Lakers",
          logo: "/images/lakers.png"
        },
        {
          id: "team-2",
          resultText: "82",
          isWinner: false,
          status: null,
          name: "Warriors",
          logo: "/images/warriors.png"
        }
      ]
    },
    {
      id: "2",
      nextMatchId: "1",
      tournamentRoundText: "Semi-Final",
      startTime: "2024-06-10",
      state: "DONE",
      participants: [
        {
          id: "team-1",
          resultText: "90",
          isWinner: true,
          status: null,
          name: "Lakers"
        },
        {
          id: "team-3",
          resultText: "88",
          isWinner: false,
          status: null,
          name: "Celtics"
        }
      ]
    },
    {
      id: "3",
      nextMatchId: "1",
      tournamentRoundText: "Semi-Final",
      startTime: "2024-06-11",
      state: "DONE",
      participants: [
        {
          id: "team-2",
          resultText: "95",
          isWinner: true,
          status: null,
          name: "Warriors"
        },
        {
          id: "team-4",
          resultText: "80",
          isWinner: false,
          status: null,
          name: "Bulls"
        }
      ]
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" })} ${maybeRenderHead()}<div id="wrapper"> ${renderComponent($$result2, "TopBar", $$TopBar, {})} ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" })} <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-tournaments-header", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;">
TOURNAMENT BRACKET
</h2> <div class="bracket-container" style="background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow-x: auto;"> ${renderComponent($$result2, "TournamentBracket", TournamentBracket, { "matches": mockMatches, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/tournaments/components/TournamentBracket", "client:component-export": "default" })} </div> ${renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-tournaments-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40" })} </div> </div> </div> </div> </section> </div> </div> ${renderComponent($$result2, "Footer", $$Footer, {})} <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div> ` })} <style type="text/css">
    .sp-footer-sponsors {
        background: #f4f4f4;
        color: #363f48;
    }

    .heading-font {
        font-size: 40px;
        line-height: 44px;
        margin-bottom: 50px;
        color: #dd3333 !important;
        text-transform: uppercase;
    }

    .bracket-container {
        min-height: 500px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }
</style>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/tournaments.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/tournaments.astro";
const $$url = "/tournaments";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tournaments,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
