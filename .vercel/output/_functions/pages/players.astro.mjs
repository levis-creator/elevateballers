import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_PYfl9QGE.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../chunks/PageLoader_D_5s45Mo.mjs';
import { $ as $$Spacing } from '../chunks/Spacing_BPc02AQQ.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const playerCategories = [
  {
    name: "BALLERS LEAGUE",
    players: [
      {
        id: "1",
        name: "James Mitchell",
        position: "PG",
        height: `6'2"`,
        weight: "185",
        fgPercent: 48.5,
        ftPercent: 85.2,
        threePointPercent: 38.7,
        rpg: 4.2,
        apg: 8.5,
        spg: 1.8,
        bpg: 0.3,
        ppg: 22.3,
        eff: 25.6
      },
      {
        id: "2",
        name: "Michael Johnson",
        position: "SG",
        height: `6'4"`,
        weight: "195",
        fgPercent: 45.8,
        ftPercent: 82.1,
        threePointPercent: 40.2,
        rpg: 5.1,
        apg: 3.2,
        spg: 1.5,
        bpg: 0.5,
        ppg: 19.8,
        eff: 22.4
      },
      {
        id: "3",
        name: "David Williams",
        position: "SF",
        height: `6'6"`,
        weight: "210",
        fgPercent: 47.2,
        ftPercent: 78.5,
        threePointPercent: 35.8,
        rpg: 7.3,
        apg: 4.1,
        spg: 1.2,
        bpg: 0.8,
        ppg: 18.5,
        eff: 23.1
      },
      {
        id: "4",
        name: "Robert Brown",
        position: "PF",
        height: `6'8"`,
        weight: "225",
        fgPercent: 52.3,
        ftPercent: 75.4,
        threePointPercent: 28.5,
        rpg: 9.2,
        apg: 2.8,
        spg: 0.9,
        bpg: 1.5,
        ppg: 16.7,
        eff: 24.3
      },
      {
        id: "5",
        name: "Christopher Davis",
        position: "C",
        height: `6'10"`,
        weight: "245",
        fgPercent: 55.8,
        ftPercent: 72.3,
        threePointPercent: 0,
        rpg: 11.5,
        apg: 1.5,
        spg: 0.6,
        bpg: 2.8,
        ppg: 14.9,
        eff: 26.2
      }
    ]
  },
  {
    name: "JUNIOR BALLERS",
    players: [
      {
        id: "6",
        name: "Alex Thompson",
        position: "PG",
        height: `5'10"`,
        weight: "165",
        fgPercent: 44.2,
        ftPercent: 80.5,
        threePointPercent: 36.8,
        rpg: 3.5,
        apg: 6.8,
        spg: 1.6,
        bpg: 0.2,
        ppg: 15.2,
        eff: 18.5
      },
      {
        id: "7",
        name: "Jordan Martinez",
        position: "SG",
        height: `6'0"`,
        weight: "175",
        fgPercent: 42.8,
        ftPercent: 79.2,
        threePointPercent: 38.5,
        rpg: 4.2,
        apg: 2.9,
        spg: 1.3,
        bpg: 0.4,
        ppg: 14.8,
        eff: 17.9
      },
      {
        id: "8",
        name: "Ryan Anderson",
        position: "SF",
        height: `6'2"`,
        weight: "185",
        fgPercent: 45.5,
        ftPercent: 77.8,
        threePointPercent: 33.2,
        rpg: 6.1,
        apg: 3.5,
        spg: 1.1,
        bpg: 0.6,
        ppg: 13.5,
        eff: 19.2
      },
      {
        id: "9",
        name: "Tyler Wilson",
        position: "PF",
        height: `6'4"`,
        weight: "195",
        fgPercent: 49.8,
        ftPercent: 73.5,
        threePointPercent: 25.8,
        rpg: 7.8,
        apg: 2.2,
        spg: 0.8,
        bpg: 1.2,
        ppg: 12.3,
        eff: 20.1
      },
      {
        id: "10",
        name: "Noah Garcia",
        position: "C",
        height: `6'6"`,
        weight: "210",
        fgPercent: 52.5,
        ftPercent: 70.2,
        threePointPercent: 0,
        rpg: 9.5,
        apg: 1.2,
        spg: 0.5,
        bpg: 2.1,
        ppg: 11.8,
        eff: 21.4
      }
    ]
  },
  {
    name: "SENIOR BALLERS",
    players: [
      {
        id: "11",
        name: "Marcus Taylor",
        position: "PG",
        height: `6'1"`,
        weight: "190",
        fgPercent: 46.8,
        ftPercent: 83.5,
        threePointPercent: 37.2,
        rpg: 4.8,
        apg: 7.9,
        spg: 1.7,
        bpg: 0.4,
        ppg: 20.5,
        eff: 24.8
      },
      {
        id: "12",
        name: "Kevin White",
        position: "SG",
        height: `6'3"`,
        weight: "200",
        fgPercent: 44.5,
        ftPercent: 81.8,
        threePointPercent: 39.5,
        rpg: 5.5,
        apg: 3.5,
        spg: 1.4,
        bpg: 0.6,
        ppg: 18.2,
        eff: 21.6
      },
      {
        id: "13",
        name: "Daniel Lee",
        position: "SF",
        height: `6'5"`,
        weight: "215",
        fgPercent: 48.2,
        ftPercent: 79.2,
        threePointPercent: 34.8,
        rpg: 7.8,
        apg: 4.3,
        spg: 1.3,
        bpg: 0.9,
        ppg: 17.8,
        eff: 22.9
      },
      {
        id: "14",
        name: "Brandon Harris",
        position: "PF",
        height: `6'7"`,
        weight: "230",
        fgPercent: 51.5,
        ftPercent: 76.5,
        threePointPercent: 29.2,
        rpg: 9.8,
        apg: 3.1,
        spg: 1,
        bpg: 1.8,
        ppg: 15.9,
        eff: 25.2
      },
      {
        id: "15",
        name: "Anthony Clark",
        position: "C",
        height: `6'9"`,
        weight: "250",
        fgPercent: 54.2,
        ftPercent: 74.8,
        threePointPercent: 0,
        rpg: 12.1,
        apg: 1.8,
        spg: 0.7,
        bpg: 3.2,
        ppg: 13.5,
        eff: 27.8
      }
    ]
  },
  {
    name: "WOMEN'S LEAGUE",
    players: [
      {
        id: "16",
        name: "Sarah Johnson",
        position: "PG",
        height: `5'8"`,
        weight: "145",
        fgPercent: 45.2,
        ftPercent: 86.5,
        threePointPercent: 39.8,
        rpg: 4.5,
        apg: 7.2,
        spg: 2.1,
        bpg: 0.3,
        ppg: 18.5,
        eff: 23.4
      },
      {
        id: "17",
        name: "Emily Davis",
        position: "SG",
        height: `5'10"`,
        weight: "155",
        fgPercent: 43.8,
        ftPercent: 84.2,
        threePointPercent: 41.5,
        rpg: 5.2,
        apg: 3.8,
        spg: 1.8,
        bpg: 0.5,
        ppg: 17.2,
        eff: 21.8
      },
      {
        id: "18",
        name: "Jessica Martinez",
        position: "SF",
        height: `6'0"`,
        weight: "165",
        fgPercent: 46.5,
        ftPercent: 80.5,
        threePointPercent: 36.2,
        rpg: 7.1,
        apg: 4.2,
        spg: 1.5,
        bpg: 0.8,
        ppg: 16.8,
        eff: 22.6
      },
      {
        id: "19",
        name: "Amanda Wilson",
        position: "PF",
        height: `6'2"`,
        weight: "175",
        fgPercent: 50.2,
        ftPercent: 78.5,
        threePointPercent: 30.5,
        rpg: 8.9,
        apg: 2.8,
        spg: 1.2,
        bpg: 1.5,
        ppg: 15.3,
        eff: 24.1
      },
      {
        id: "20",
        name: "Nicole Brown",
        position: "C",
        height: `6'4"`,
        weight: "185",
        fgPercent: 53.8,
        ftPercent: 75.2,
        threePointPercent: 0,
        rpg: 10.8,
        apg: 1.5,
        spg: 0.9,
        bpg: 2.5,
        ppg: 14.2,
        eff: 25.9
      }
    ]
  },
  {
    name: "VETERANS",
    players: [
      {
        id: "21",
        name: "Richard Moore",
        position: "PG",
        height: `6'0"`,
        weight: "180",
        fgPercent: 42.5,
        ftPercent: 82.5,
        threePointPercent: 35.8,
        rpg: 3.8,
        apg: 6.2,
        spg: 1.4,
        bpg: 0.2,
        ppg: 12.5,
        eff: 16.8
      },
      {
        id: "22",
        name: "Thomas Jackson",
        position: "SG",
        height: `6'2"`,
        weight: "190",
        fgPercent: 41.2,
        ftPercent: 80.8,
        threePointPercent: 37.5,
        rpg: 4.5,
        apg: 2.8,
        spg: 1.2,
        bpg: 0.4,
        ppg: 11.8,
        eff: 15.9
      }
    ]
  },
  {
    name: "COACHES",
    players: [
      {
        id: "23",
        name: "Coach Mark Thompson",
        position: "Head Coach",
        height: `6'3"`,
        weight: "200",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      },
      {
        id: "24",
        name: "Coach Lisa Rodriguez",
        position: "Assistant Coach",
        height: `5'9"`,
        weight: "150",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      }
    ]
  },
  {
    name: "STAFF",
    players: [
      {
        id: "25",
        name: "John Smith",
        position: "Manager",
        height: `5'11"`,
        weight: "175",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      },
      {
        id: "26",
        name: "Mary Johnson",
        position: "Trainer",
        height: `5'7"`,
        weight: "140",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      }
    ]
  },
  {
    name: "REFEREES",
    players: [
      {
        id: "27",
        name: "Referee Paul Adams",
        position: "Head Referee",
        height: `6'1"`,
        weight: "185",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      },
      {
        id: "28",
        name: "Referee Susan Lee",
        position: "Referee",
        height: `5'8"`,
        weight: "145",
        fgPercent: 0,
        ftPercent: 0,
        threePointPercent: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        ppg: 0,
        eff: 0
      }
    ]
  }
];

const $$Astro = createAstro();
const $$TeamPlayerTable = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$TeamPlayerTable;
  const { players } = Astro2.props;
  function formatStat(value) {
    return value === 0 ? "-" : value.toFixed(1);
  }
  function formatPercent(value) {
    return value === 0 ? "-" : value.toFixed(1);
  }
  return renderTemplate`${maybeRenderHead()}<div class="sp-template sp-template-player-list"> <div class="sp-table-wrapper"> <table class="sp-player-list sp-data-table"> <thead> <tr> <th class="data-name">Player</th> <th class="data-position">Position</th> <th class="data-height">Height</th> <th class="data-weight">Weight</th> <th class="data-fg">FG%</th> <th class="data-ft">FT%</th> <th class="data-3p">3P%</th> <th class="data-rpg">RPG</th> <th class="data-apg">APG</th> <th class="data-spg">SPG</th> <th class="data-bpg">BPG</th> <th class="data-ppg">PPG</th> <th class="data-eff">EFF</th> </tr> </thead> <tbody> ${players.length > 0 ? players.map((player) => renderTemplate`<tr> <td class="data-name"> ${player.url ? renderTemplate`<a${addAttribute(player.url, "href")} class="sp-player-name"> ${player.name} </a>` : renderTemplate`<span class="sp-player-name">${player.name}</span>`} </td> <td class="data-position">${player.position}</td> <td class="data-height">${player.height}</td> <td class="data-weight">${player.weight}</td> <td class="data-fg">${formatPercent(player.fgPercent)}</td> <td class="data-ft">${formatPercent(player.ftPercent)}</td> <td class="data-3p">${formatPercent(player.threePointPercent)}</td> <td class="data-rpg">${formatStat(player.rpg)}</td> <td class="data-apg">${formatStat(player.apg)}</td> <td class="data-spg">${formatStat(player.spg)}</td> <td class="data-bpg">${formatStat(player.bpg)}</td> <td class="data-ppg">${formatStat(player.ppg)}</td> <td class="data-eff">${formatStat(player.eff)}</td> </tr>`) : renderTemplate`<tr> <td colspan="13" class="data-name" style="text-align: center; padding: 20px;">
No players data available. Please add player data to <code>src/features/team/data/teamData.ts</code> </td> </tr>`} </tbody> </table> </div> </div>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/team/components/TeamPlayerTable.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Players = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", " ", '<div id="wrapper"> ', " ", " ", ' <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;">\nPLAYERS\n</h2> ', " ", " </div> </div> </div> </div> </section> </div> </div> ", ' <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>   <div class="rev-close-btn"> <span class="close-left"></span> <span class="close-right"></span> </div> <script>\n    window.RS_MODULES = window.RS_MODULES || {};\n    window.RS_MODULES.modules = window.RS_MODULES.modules || {};\n    window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];\n    window.RS_MODULES.defered = true;\n    window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};\n    window.RS_MODULES.type = "compiled";\n  <\/script> <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\"nofollow\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script> <style type="text/css">\n    .sp-footer-sponsors {\n      background: #f4f4f4;\n      color: #363f48;\n    }\n    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {\n      color: #363f48;\n    }\n\n    /* Smooth scroll behavior - Matching homepage */\n    html {\n      scroll-behavior: smooth;\n    }\n\n    /* Players page specific styles - Matching exact colors from elevateballers.com/players/ */\n    .sp-template-player-list {\n      margin-top: 20px;\n      margin-bottom: 20px;\n    }\n\n    /* Page title styling */\n    .wpb_wrapper h2.heading-font {\n      font-size: 40px;\n      line-height: 44px;\n      margin-bottom: 50px;\n      color: #dd3333 !important;\n    }\n\n    /* Category/League sub-heading styling */\n    .player-category-section {\n      margin-bottom: 50px;\n    }\n\n    .player-category-section:last-child {\n      margin-bottom: 0;\n    }\n\n    .wpb_wrapper h3.heading-font.category-heading {\n      font-size: 24px;\n      line-height: 28px;\n      margin-bottom: 20px;\n      margin-top: 0;\n      color: #dd3333 !important;\n      font-weight: 700;\n      text-transform: uppercase;\n    }\n\n    .sp-template-player-list .sp-table-wrapper {\n      overflow-x: auto;\n      -webkit-overflow-scrolling: touch;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table {\n      width: 100%;\n      border-collapse: separate;\n      border-spacing: 0 5px;\n    }\n\n    /* Table header - Exact match: red background #e21e22, white text */\n    .sp-template-player-list table.sp-player-list.sp-data-table thead {\n      background-color: #e21e22;\n      color: #fff;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table thead th {\n      background-color: #e21e22;\n      color: #fff;\n      padding: 13px 7px;\n      text-align: left;\n      text-transform: uppercase;\n      font-weight: normal;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th:first-child,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td:first-child {\n      padding-left: 39px;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-name {\n      text-align: left;\n      padding-left: 20px !important;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-position,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-height,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-weight,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-fg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-ft,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-3p,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-rpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-apg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-spg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-bpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-ppg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-eff {\n      text-align: center;\n    }\n\n    /* Table body - Exact match: white for even, #e8e8e8 for odd */\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody tr.odd td,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr:nth-child(odd)\n      td {\n      background-color: #e8e8e8 !important;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr.even\n      td,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr:nth-child(even)\n      td {\n      background-color: #fff;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n      background-color: #fff;\n      padding: 13px 7px;\n      text-align: left;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name {\n      text-align: left;\n      padding-left: 5px;\n      color: #535353;\n      font-weight: 700;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-position,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-height,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-weight,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-fg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-ft,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-3p,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-rpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-apg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-spg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-bpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-ppg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-eff {\n      text-align: center;\n    }\n\n    /* Links - Exact match: #595959, hover #009bdc */\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody td a {\n      color: #595959;\n      text-decoration: none;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td\n      a:hover {\n      color: #009bdc;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name\n      a {\n      color: #535353;\n      text-decoration: none;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name\n      a:hover {\n      color: #009bdc;\n    }\n\n    /* Responsive styles - Matching original */\n    @media (max-width: 991px) {\n      .sp-template-player-list .sp-table-wrapper {\n        margin: 0 -15px;\n        padding: 0 15px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table {\n        font-size: 14px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table thead th,\n      .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n        padding: 10px 5px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th:first-child,\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td:first-child {\n        padding-left: 10px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th.data-name {\n        padding-left: 10px !important;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td.data-name {\n        padding-left: 5px;\n      }\n    }\n\n    @media (max-width: 767px) {\n      .sp-template-player-list table.sp-player-list.sp-data-table {\n        font-size: 12px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table thead th,\n      .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n        padding: 8px 3px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th:first-child,\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td:first-child {\n        padding-left: 8px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th.data-name {\n        padding-left: 8px !important;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td.data-name {\n        padding-left: 5px;\n      }\n    }\n  </style> <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header").prepend($(".sp-header-sponsors"));\n    });\n  <\/script> <script>\n    (function () {\n      function maybePrefixUrlField() {\n        const value = this.value.trim();\n        if (value !== "" && value.indexOf("http") !== 0) {\n          this.value = "http://" + value;\n        }\n      }\n\n      const urlFields = document.querySelectorAll(\n        \'.mc4wp-form input[type="url"]\',\n      );\n      for (let j = 0; j < urlFields.length; j++) {\n        urlFields[j].addEventListener("blur", maybePrefixUrlField);\n      }\n    })();\n  <\/script> <style type="text/css">\n    /* Hide reCAPTCHA V3 badge */\n    .grecaptcha-badge {\n      visibility: hidden !important;\n    }\n  </style> <script>\n    const lazyloadRunObserver = () => {\n      const lazyloadBackgrounds = document.querySelectorAll(\n        `.e-con.e-parent:not(.e-lazyloaded)`,\n      );\n      const lazyloadBackgroundObserver = new IntersectionObserver(\n        (entries) => {\n          entries.forEach((entry) => {\n            if (entry.isIntersecting) {\n              let lazyloadBackground = entry.target;\n              if (lazyloadBackground) {\n                lazyloadBackground.classList.add("e-lazyloaded");\n              }\n              lazyloadBackgroundObserver.unobserve(entry.target);\n            }\n          });\n        },\n        { rootMargin: "200px 0px 200px 0px" },\n      );\n      lazyloadBackgrounds.forEach((lazyloadBackground) => {\n        lazyloadBackgroundObserver.observe(lazyloadBackground);\n      });\n    };\n    const events = ["DOMContentLoaded", "elementor/lazyload/observe"];\n    events.forEach((event) => {\n      document.addEventListener(event, lazyloadRunObserver);\n    });\n  <\/script> <script type="text/javascript" src="/js/jquery.min.js" id="jquery-core-js"><\/script> <script type="text/javascript" src="/js/jquery-migrate.min.js" id="jquery-migrate-js"><\/script>  <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script>  '], [" ", " ", '<div id="wrapper"> ', " ", " ", ' <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;">\nPLAYERS\n</h2> ', " ", " </div> </div> </div> </div> </section> </div> </div> ", ' <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>   <div class="rev-close-btn"> <span class="close-left"></span> <span class="close-right"></span> </div> <script>\n    window.RS_MODULES = window.RS_MODULES || {};\n    window.RS_MODULES.modules = window.RS_MODULES.modules || {};\n    window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];\n    window.RS_MODULES.defered = true;\n    window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};\n    window.RS_MODULES.type = "compiled";\n  <\/script> <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\\\"nofollow\\\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script> <style type="text/css">\n    .sp-footer-sponsors {\n      background: #f4f4f4;\n      color: #363f48;\n    }\n    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {\n      color: #363f48;\n    }\n\n    /* Smooth scroll behavior - Matching homepage */\n    html {\n      scroll-behavior: smooth;\n    }\n\n    /* Players page specific styles - Matching exact colors from elevateballers.com/players/ */\n    .sp-template-player-list {\n      margin-top: 20px;\n      margin-bottom: 20px;\n    }\n\n    /* Page title styling */\n    .wpb_wrapper h2.heading-font {\n      font-size: 40px;\n      line-height: 44px;\n      margin-bottom: 50px;\n      color: #dd3333 !important;\n    }\n\n    /* Category/League sub-heading styling */\n    .player-category-section {\n      margin-bottom: 50px;\n    }\n\n    .player-category-section:last-child {\n      margin-bottom: 0;\n    }\n\n    .wpb_wrapper h3.heading-font.category-heading {\n      font-size: 24px;\n      line-height: 28px;\n      margin-bottom: 20px;\n      margin-top: 0;\n      color: #dd3333 !important;\n      font-weight: 700;\n      text-transform: uppercase;\n    }\n\n    .sp-template-player-list .sp-table-wrapper {\n      overflow-x: auto;\n      -webkit-overflow-scrolling: touch;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table {\n      width: 100%;\n      border-collapse: separate;\n      border-spacing: 0 5px;\n    }\n\n    /* Table header - Exact match: red background #e21e22, white text */\n    .sp-template-player-list table.sp-player-list.sp-data-table thead {\n      background-color: #e21e22;\n      color: #fff;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table thead th {\n      background-color: #e21e22;\n      color: #fff;\n      padding: 13px 7px;\n      text-align: left;\n      text-transform: uppercase;\n      font-weight: normal;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th:first-child,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td:first-child {\n      padding-left: 39px;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-name {\n      text-align: left;\n      padding-left: 20px !important;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-position,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-height,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-weight,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-fg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-ft,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-3p,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-rpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-apg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-spg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-bpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-ppg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      thead\n      th.data-eff {\n      text-align: center;\n    }\n\n    /* Table body - Exact match: white for even, #e8e8e8 for odd */\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody tr.odd td,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr:nth-child(odd)\n      td {\n      background-color: #e8e8e8 !important;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr.even\n      td,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      tr:nth-child(even)\n      td {\n      background-color: #fff;\n    }\n\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n      background-color: #fff;\n      padding: 13px 7px;\n      text-align: left;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name {\n      text-align: left;\n      padding-left: 5px;\n      color: #535353;\n      font-weight: 700;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-position,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-height,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-weight,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-fg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-ft,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-3p,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-rpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-apg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-spg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-bpg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-ppg,\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-eff {\n      text-align: center;\n    }\n\n    /* Links - Exact match: #595959, hover #009bdc */\n    .sp-template-player-list table.sp-player-list.sp-data-table tbody td a {\n      color: #595959;\n      text-decoration: none;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td\n      a:hover {\n      color: #009bdc;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name\n      a {\n      color: #535353;\n      text-decoration: none;\n    }\n\n    .sp-template-player-list\n      table.sp-player-list.sp-data-table\n      tbody\n      td.data-name\n      a:hover {\n      color: #009bdc;\n    }\n\n    /* Responsive styles - Matching original */\n    @media (max-width: 991px) {\n      .sp-template-player-list .sp-table-wrapper {\n        margin: 0 -15px;\n        padding: 0 15px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table {\n        font-size: 14px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table thead th,\n      .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n        padding: 10px 5px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th:first-child,\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td:first-child {\n        padding-left: 10px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th.data-name {\n        padding-left: 10px !important;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td.data-name {\n        padding-left: 5px;\n      }\n    }\n\n    @media (max-width: 767px) {\n      .sp-template-player-list table.sp-player-list.sp-data-table {\n        font-size: 12px;\n      }\n\n      .sp-template-player-list table.sp-player-list.sp-data-table thead th,\n      .sp-template-player-list table.sp-player-list.sp-data-table tbody td {\n        padding: 8px 3px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th:first-child,\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td:first-child {\n        padding-left: 8px;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        thead\n        th.data-name {\n        padding-left: 8px !important;\n      }\n\n      .sp-template-player-list\n        table.sp-player-list.sp-data-table\n        tbody\n        td.data-name {\n        padding-left: 5px;\n      }\n    }\n  </style> <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header").prepend($(".sp-header-sponsors"));\n    });\n  <\/script> <script>\n    (function () {\n      function maybePrefixUrlField() {\n        const value = this.value.trim();\n        if (value !== "" && value.indexOf("http") !== 0) {\n          this.value = "http://" + value;\n        }\n      }\n\n      const urlFields = document.querySelectorAll(\n        \'.mc4wp-form input[type="url"]\',\n      );\n      for (let j = 0; j < urlFields.length; j++) {\n        urlFields[j].addEventListener("blur", maybePrefixUrlField);\n      }\n    })();\n  <\/script> <style type="text/css">\n    /* Hide reCAPTCHA V3 badge */\n    .grecaptcha-badge {\n      visibility: hidden !important;\n    }\n  </style> <script>\n    const lazyloadRunObserver = () => {\n      const lazyloadBackgrounds = document.querySelectorAll(\n        \\`.e-con.e-parent:not(.e-lazyloaded)\\`,\n      );\n      const lazyloadBackgroundObserver = new IntersectionObserver(\n        (entries) => {\n          entries.forEach((entry) => {\n            if (entry.isIntersecting) {\n              let lazyloadBackground = entry.target;\n              if (lazyloadBackground) {\n                lazyloadBackground.classList.add("e-lazyloaded");\n              }\n              lazyloadBackgroundObserver.unobserve(entry.target);\n            }\n          });\n        },\n        { rootMargin: "200px 0px 200px 0px" },\n      );\n      lazyloadBackgrounds.forEach((lazyloadBackground) => {\n        lazyloadBackgroundObserver.observe(lazyloadBackground);\n      });\n    };\n    const events = ["DOMContentLoaded", "elementor/lazyload/observe"];\n    events.forEach((event) => {\n      document.addEventListener(event, lazyloadRunObserver);\n    });\n  <\/script> <script type="text/javascript" src="/js/jquery.min.js" id="jquery-core-js"><\/script> <script type="text/javascript" src="/js/jquery-migrate.min.js" id="jquery-migrate-js"><\/script>  <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script>  '])), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, {}), renderComponent($$result2, "Header", $$Header, {}), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-players-header", "lg": "50", "md": "50", "sm": "40", "xs": "40" }), playerCategories.map((category) => renderTemplate`<div class="player-category-section"> <h3 class="heading-font category-heading"> ${category.name} </h3> ${renderComponent($$result2, "TeamPlayerTable", $$TeamPlayerTable, { "players": category.players, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/features/team/components/TeamPlayerTable.astro", "client:component-export": "default" })} </div>`), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-players-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40" }), renderComponent($$result2, "Footer", $$Footer, {})) })} <!-- wrapper -->`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/players.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/players.astro";
const $$url = "/players";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Players,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
