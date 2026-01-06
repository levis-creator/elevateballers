import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead, u as unescapeHTML, w as defineScriptVars } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_PYfl9QGE.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { K as getTeamBySlug, G as getStaffByTeam } from '../../chunks/queries_E6Jl_Myi.mjs';
import { $ as $$Spacing } from '../../chunks/Spacing_BPc02AQQ.mjs';
import { jsx } from 'react/jsx-runtime';
import { useMemo } from 'react';
import { D as DataTable } from '../../chunks/DataTable_Fi_1QZki.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const getPlayerName = (player) => {
  if (player.firstName && player.lastName) {
    return `${player.firstName} ${player.lastName}`;
  }
  return player.firstName || player.lastName || "Unknown Player";
};
const getStat = (stats, key) => {
  if (!stats || typeof stats !== "object") return 0;
  return stats[key] || 0;
};
const formatStat = (value) => {
  return value === 0 ? "-" : value.toFixed(1);
};
const formatPercent = (value) => {
  return value === 0 ? "-" : value.toFixed(1);
};
const TeamDetailsTable = ({ players }) => {
  const hasAnyStats = useMemo(() => players.some((p) => p.stats && Object.keys(p.stats).length > 0), [players]);
  const columns = useMemo(
    () => {
      const baseColumns = [
        {
          header: "Player",
          accessorFn: (row) => getPlayerName(row),
          cell: (info) => /* @__PURE__ */ jsx("a", { href: `/players/${info.row.original.id}`, className: "sp-player-name", children: info.getValue() }),
          meta: { className: "data-name" }
        },
        {
          header: "Position",
          accessorKey: "position",
          cell: (info) => info.getValue() || "-",
          meta: { className: "data-position" }
        },
        {
          header: "Height",
          accessorKey: "height",
          cell: (info) => info.getValue() || "-",
          meta: { className: "data-height" }
        },
        {
          header: "Weight",
          accessorKey: "weight",
          cell: (info) => info.getValue() || "-",
          meta: { className: "data-weight" }
        },
        {
          header: "Jersey",
          accessorKey: "jerseyNumber",
          cell: (info) => info.getValue() || "-",
          meta: { className: "data-jersey" }
        }
      ];
      if (hasAnyStats) {
        const statCols = [
          {
            header: "FG%",
            accessorFn: (row) => getStat(row.stats, "fgPercent") || getStat(row.stats, "fg"),
            cell: (info) => formatPercent(info.getValue()),
            meta: { className: "data-fg" }
          },
          {
            header: "FT%",
            accessorFn: (row) => getStat(row.stats, "ftPercent") || getStat(row.stats, "ft"),
            cell: (info) => formatPercent(info.getValue()),
            meta: { className: "data-ft" }
          },
          {
            header: "3P%",
            accessorFn: (row) => getStat(row.stats, "threePointPercent") || getStat(row.stats, "3p"),
            cell: (info) => formatPercent(info.getValue()),
            meta: { className: "data-3p" }
          },
          {
            header: "RPG",
            accessorFn: (row) => getStat(row.stats, "rpg"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-rpg" }
          },
          {
            header: "APG",
            accessorFn: (row) => getStat(row.stats, "apg"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-apg" }
          },
          {
            header: "SPG",
            accessorFn: (row) => getStat(row.stats, "spg"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-spg" }
          },
          {
            header: "BPG",
            accessorFn: (row) => getStat(row.stats, "bpg"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-bpg" }
          },
          {
            header: "PPG",
            accessorFn: (row) => getStat(row.stats, "ppg"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-ppg" }
          },
          {
            header: "EFF",
            accessorFn: (row) => getStat(row.stats, "eff"),
            cell: (info) => formatStat(info.getValue()),
            meta: { className: "data-eff" }
          }
        ];
        return [...baseColumns, ...statCols];
      }
      return baseColumns;
    },
    [hasAnyStats]
  );
  return /* @__PURE__ */ jsx("div", { className: "sp-template sp-template-player-list", children: /* @__PURE__ */ jsx(
    DataTable,
    {
      data: players,
      columns,
      tableClassName: "sp-player-list"
    }
  ) });
};

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  if (!slug) {
    return Astro2.redirect("/404", 302);
  }
  let team;
  try {
    team = await getTeamBySlug(slug);
    if (!team) {
      return Astro2.redirect("/404", 302);
    }
  } catch (error) {
    console.error("Error fetching team:", error);
    return Astro2.redirect("/404", 302);
  }
  let teamStaff = [];
  try {
    teamStaff = await getStaffByTeam(team.id);
  } catch (error) {
    console.error("Error fetching team staff:", error);
  }
  const formatStaffRole = (role) => {
    return role.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };
  const pageTitle = `${team.name} - Teams - Elevate Ballers`;
  const pageDescription = team.description || `View ${team.name} team information, players, and staff`;
  const pageUrl = `${Astro2.url.origin}/teams/${slug}`;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-j2mbp2xm": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", '\n    // Update page title\n    document.title = pageTitle;\n\n    // Update or create meta tags\n    const updateMeta = (name, content, property = false) => {\n      const attr = property ? "property" : "name";\n      let meta = document.querySelector(`meta[${attr}="${name}"]`);\n      if (!meta) {\n        meta = document.createElement("meta");\n        meta.setAttribute(attr, name);\n        document.head.appendChild(meta);\n      }\n      meta.setAttribute("content", content);\n    };\n\n    // Update canonical link\n    let canonical = document.querySelector(\'link[rel="canonical"]\');\n    if (!canonical) {\n      canonical = document.createElement("link");\n      canonical.setAttribute("rel", "canonical");\n      document.head.appendChild(canonical);\n    }\n    canonical.setAttribute("href", pageUrl);\n\n    // Set meta tags\n    updateMeta("og:locale", "en_US", true);\n    updateMeta("og:type", "website", true);\n    updateMeta("og:title", pageTitle, true);\n    updateMeta("og:description", pageDescription, true);\n    updateMeta("og:url", pageUrl, true);\n    updateMeta("og:site_name", "Elevate Ballers", true);\n    updateMeta("twitter:card", "summary_large_image");\n  })();<\/script> <script type="application/ld+json">', "<\/script> ", " ", '<div id="wrapper" data-astro-cid-j2mbp2xm> ', " ", " ", ' <div id="main" data-astro-cid-j2mbp2xm> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-j2mbp2xm></div> <div class="container" data-astro-cid-j2mbp2xm> <section class="wpb-content-wrapper" data-astro-cid-j2mbp2xm> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-j2mbp2xm> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-j2mbp2xm> <div class="vc_column-inner" data-astro-cid-j2mbp2xm> <div class="wpb_wrapper" data-astro-cid-j2mbp2xm> ', ' <!-- Team Header --> <div class="team-header" data-astro-cid-j2mbp2xm> <div class="team-header-content" data-astro-cid-j2mbp2xm> ', ' <div class="team-header-info" data-astro-cid-j2mbp2xm> <h1 class="team-title" data-astro-cid-j2mbp2xm>', "</h1> ", " </div> </div> </div> ", " <!-- Players Section --> ", " ", " ", " <!-- Staff Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-j2mbp2xm> <span class="close-left" data-astro-cid-j2mbp2xm></span> <span class="close-right" data-astro-cid-j2mbp2xm></span> </div>  <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\"nofollow\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  '], [" <script>(function(){", '\n    // Update page title\n    document.title = pageTitle;\n\n    // Update or create meta tags\n    const updateMeta = (name, content, property = false) => {\n      const attr = property ? "property" : "name";\n      let meta = document.querySelector(\\`meta[\\${attr}="\\${name}"]\\`);\n      if (!meta) {\n        meta = document.createElement("meta");\n        meta.setAttribute(attr, name);\n        document.head.appendChild(meta);\n      }\n      meta.setAttribute("content", content);\n    };\n\n    // Update canonical link\n    let canonical = document.querySelector(\'link[rel="canonical"]\');\n    if (!canonical) {\n      canonical = document.createElement("link");\n      canonical.setAttribute("rel", "canonical");\n      document.head.appendChild(canonical);\n    }\n    canonical.setAttribute("href", pageUrl);\n\n    // Set meta tags\n    updateMeta("og:locale", "en_US", true);\n    updateMeta("og:type", "website", true);\n    updateMeta("og:title", pageTitle, true);\n    updateMeta("og:description", pageDescription, true);\n    updateMeta("og:url", pageUrl, true);\n    updateMeta("og:site_name", "Elevate Ballers", true);\n    updateMeta("twitter:card", "summary_large_image");\n  })();<\/script> <script type="application/ld+json">', "<\/script> ", " ", '<div id="wrapper" data-astro-cid-j2mbp2xm> ', " ", " ", ' <div id="main" data-astro-cid-j2mbp2xm> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-j2mbp2xm></div> <div class="container" data-astro-cid-j2mbp2xm> <section class="wpb-content-wrapper" data-astro-cid-j2mbp2xm> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-j2mbp2xm> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-j2mbp2xm> <div class="vc_column-inner" data-astro-cid-j2mbp2xm> <div class="wpb_wrapper" data-astro-cid-j2mbp2xm> ', ' <!-- Team Header --> <div class="team-header" data-astro-cid-j2mbp2xm> <div class="team-header-content" data-astro-cid-j2mbp2xm> ', ' <div class="team-header-info" data-astro-cid-j2mbp2xm> <h1 class="team-title" data-astro-cid-j2mbp2xm>', "</h1> ", " </div> </div> </div> ", " <!-- Players Section --> ", " ", " ", " <!-- Staff Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-j2mbp2xm> <span class="close-left" data-astro-cid-j2mbp2xm></span> <span class="close-right" data-astro-cid-j2mbp2xm></span> </div>  <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\\\"nofollow\\\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  '])), defineScriptVars({ pageTitle, pageDescription, pageUrl }), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: pageTitle,
        isPartOf: { "@id": `${Astro2.url.origin}/#website` },
        datePublished: "2016-04-19T05:29:11+00:00",
        dateModified: (/* @__PURE__ */ new Date()).toISOString(),
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-US"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${Astro2.url.origin}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Teams",
            item: `${Astro2.url.origin}/teams`
          },
          { "@type": "ListItem", position: 3, name: team.name }
        ]
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-j2mbp2xm": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-header", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-j2mbp2xm": true }), team.logo ? renderTemplate`<div class="team-logo-large" data-astro-cid-j2mbp2xm> <img${addAttribute(team.logo, "src")}${addAttribute(`${team.name} logo`, "alt")} loading="lazy" data-astro-cid-j2mbp2xm> </div>` : renderTemplate`<div class="team-logo-large-placeholder" data-astro-cid-j2mbp2xm> <span class="team-logo-text-large" data-astro-cid-j2mbp2xm> ${team.name.charAt(0).toUpperCase()} </span> </div>`, team.name, team.description && renderTemplate`<p class="team-description-full" data-astro-cid-j2mbp2xm> ${team.description} </p>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-content", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-j2mbp2xm": true }), team.players && team.players.length > 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Players</h2> <div class="sp-template sp-template-player-list" data-astro-cid-j2mbp2xm> ${renderComponent($$result2, "TeamDetailsTable", TeamDetailsTable, { "players": team.players, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/team/components/TeamDetailsTable", "client:component-export": "TeamDetailsTable", "data-astro-cid-j2mbp2xm": true })} </div> </div>`, (!team.players || team.players.length === 0) && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Players</h2> <p class="no-data-message" data-astro-cid-j2mbp2xm>
No players available for this team.
</p> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-staff", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-j2mbp2xm": true }), teamStaff.length > 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Staff</h2> <div class="staff-grid" data-astro-cid-j2mbp2xm> ${teamStaff.map((teamStaffMember) => {
    const staff = teamStaffMember.staff;
    return renderTemplate`<div class="staff-card" data-astro-cid-j2mbp2xm> ${staff.image ? renderTemplate`<div class="staff-image" data-astro-cid-j2mbp2xm> <img${addAttribute(staff.image, "src")}${addAttribute(`${staff.firstName} ${staff.lastName}`, "alt")} loading="lazy" data-astro-cid-j2mbp2xm> </div>` : renderTemplate`<div class="staff-image-placeholder" data-astro-cid-j2mbp2xm> <span data-astro-cid-j2mbp2xm> ${staff.firstName.charAt(0)} ${staff.lastName.charAt(0)} </span> </div>`} <div class="staff-info" data-astro-cid-j2mbp2xm> <h3 class="staff-name" data-astro-cid-j2mbp2xm> ${staff.firstName} ${staff.lastName} </h3> <p class="staff-role" data-astro-cid-j2mbp2xm> ${formatStaffRole(teamStaffMember.role)} </p> ${staff.bio && renderTemplate`<p class="staff-bio" data-astro-cid-j2mbp2xm> ${staff.bio.substring(0, 150)} ${staff.bio.length > 150 ? "..." : ""} </p>`} ${staff.email && renderTemplate`<p class="staff-contact" data-astro-cid-j2mbp2xm> <i class="fa fa-envelope" aria-hidden="true" data-astro-cid-j2mbp2xm></i> <a${addAttribute(`mailto:${staff.email}`, "href")} data-astro-cid-j2mbp2xm> ${staff.email} </a> </p>`} ${staff.phone && renderTemplate`<p class="staff-contact" data-astro-cid-j2mbp2xm> <i class="fa fa-phone" aria-hidden="true" data-astro-cid-j2mbp2xm></i> <a${addAttribute(`tel:${staff.phone}`, "href")} data-astro-cid-j2mbp2xm> ${staff.phone} </a> </p>`} </div> </div>`;
  })} </div> </div>`, teamStaff.length === 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Staff</h2> <p class="no-data-message" data-astro-cid-j2mbp2xm>
No staff members assigned to this team.
</p> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-j2mbp2xm": true })) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/teams/[slug].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/teams/[slug].astro";
const $$url = "/teams/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
