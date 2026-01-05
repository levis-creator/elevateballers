import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, h as addAttribute, x as Fragment, m as maybeRenderHead, u as unescapeHTML, w as defineScriptVars } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_0fak_qL3.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { K as getTeamBySlug, G as getStaffByTeam } from '../../chunks/queries_vvMOn9ut.mjs';
import { $ as $$Spacing } from '../../chunks/Spacing_BPc02AQQ.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

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
  const formatStaffRole = (role) => {
    return role.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };
  const pageTitle = `${team.name} - Teams - Elevate Ballers`;
  const pageDescription = team.description || `View ${team.name} team information, players, and staff`;
  const pageUrl = `${Astro2.url.origin}/teams/${slug}`;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-j2mbp2xm": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", `
    // Update page title
    document.title = pageTitle;
    
    // Update or create meta tags
    const updateMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(\`meta[\${attr}="\${name}"]\`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);
    
    // Set meta tags
    updateMeta('og:locale', 'en_US', true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate Ballers', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-j2mbp2xm> ', " ", " ", ' <div id="main" data-astro-cid-j2mbp2xm> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-j2mbp2xm></div> <div class="container" data-astro-cid-j2mbp2xm> <section class="wpb-content-wrapper" data-astro-cid-j2mbp2xm> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-j2mbp2xm> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-j2mbp2xm> <div class="vc_column-inner" data-astro-cid-j2mbp2xm> <div class="wpb_wrapper" data-astro-cid-j2mbp2xm> ', ' <!-- Team Header --> <div class="team-header" data-astro-cid-j2mbp2xm> <div class="team-header-content" data-astro-cid-j2mbp2xm> ', ' <div class="team-header-info" data-astro-cid-j2mbp2xm> <h1 class="team-title" data-astro-cid-j2mbp2xm>', "</h1> ", " </div> </div> </div> ", " <!-- Players Section --> ", " ", " ", " <!-- Staff Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-j2mbp2xm> <span class="close-left" data-astro-cid-j2mbp2xm></span> <span class="close-right" data-astro-cid-j2mbp2xm></span> </div>  <script type="speculationrules">
    {
      "prefetch": [
        {
          "source": "document",
          "where": {
            "and": [
              { "href_matches": "/*" },
              {
                "not": {
                  "href_matches": [
                    "/wp-*.php",
                    "/wp-admin/*",
                    "/wp-content/uploads/*",
                    "/wp-content/*",
                    "/wp-content/plugins/*",
                    "/wp-content/themes/elevate/*",
                    "/*\\\\?(.+)"
                  ]
                }
              },
              { "not": { "selector_matches": "a[rel~=\\"nofollow\\"]" } },
              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }
            ]
          },
          "eagerness": "conservative"
        }
      ]
    }
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header");
          var sponsors = $(".sp-header-sponsors");
          if (header.length && sponsors.length) {
            header.prepend(sponsors);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var menu = $(".sp-league-menu");
          if (header.length && menu.length) {
            header.prepend(menu);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var scoreboard = $(".sp-header-scoreboard");
          if (header.length && scoreboard.length) {
            header.prepend(scoreboard);
          }
        });
      }
    })();
  <\/script>  `], [" <script>(function(){", `
    // Update page title
    document.title = pageTitle;
    
    // Update or create meta tags
    const updateMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(\\\`meta[\\\${attr}="\\\${name}"]\\\`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);
    
    // Set meta tags
    updateMeta('og:locale', 'en_US', true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate Ballers', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-j2mbp2xm> ', " ", " ", ' <div id="main" data-astro-cid-j2mbp2xm> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-j2mbp2xm></div> <div class="container" data-astro-cid-j2mbp2xm> <section class="wpb-content-wrapper" data-astro-cid-j2mbp2xm> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-j2mbp2xm> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-j2mbp2xm> <div class="vc_column-inner" data-astro-cid-j2mbp2xm> <div class="wpb_wrapper" data-astro-cid-j2mbp2xm> ', ' <!-- Team Header --> <div class="team-header" data-astro-cid-j2mbp2xm> <div class="team-header-content" data-astro-cid-j2mbp2xm> ', ' <div class="team-header-info" data-astro-cid-j2mbp2xm> <h1 class="team-title" data-astro-cid-j2mbp2xm>', "</h1> ", " </div> </div> </div> ", " <!-- Players Section --> ", " ", " ", " <!-- Staff Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-j2mbp2xm> <span class="close-left" data-astro-cid-j2mbp2xm></span> <span class="close-right" data-astro-cid-j2mbp2xm></span> </div>  <script type="speculationrules">
    {
      "prefetch": [
        {
          "source": "document",
          "where": {
            "and": [
              { "href_matches": "/*" },
              {
                "not": {
                  "href_matches": [
                    "/wp-*.php",
                    "/wp-admin/*",
                    "/wp-content/uploads/*",
                    "/wp-content/*",
                    "/wp-content/plugins/*",
                    "/wp-content/themes/elevate/*",
                    "/*\\\\\\\\?(.+)"
                  ]
                }
              },
              { "not": { "selector_matches": "a[rel~=\\\\"nofollow\\\\"]" } },
              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }
            ]
          },
          "eagerness": "conservative"
        }
      ]
    }
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-j2mbp2xm> <div class="sportspress" data-astro-cid-j2mbp2xm><div class="sp-sponsors" data-astro-cid-j2mbp2xm></div></div> </div>  <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header");
          var sponsors = $(".sp-header-sponsors");
          if (header.length && sponsors.length) {
            header.prepend(sponsors);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var menu = $(".sp-league-menu");
          if (header.length && menu.length) {
            header.prepend(menu);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var scoreboard = $(".sp-header-scoreboard");
          if (header.length && scoreboard.length) {
            header.prepend(scoreboard);
          }
        });
      }
    })();
  <\/script>  `])), defineScriptVars({ pageTitle, pageDescription, pageUrl }), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        "url": pageUrl,
        "name": pageTitle,
        "isPartOf": { "@id": `${Astro2.url.origin}/#website` },
        "datePublished": "2016-04-19T05:29:11+00:00",
        "dateModified": (/* @__PURE__ */ new Date()).toISOString(),
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": "en-US"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${Astro2.url.origin}/` },
          { "@type": "ListItem", "position": 2, "name": "Teams", "item": `${Astro2.url.origin}/teams` },
          { "@type": "ListItem", "position": 3, "name": team.name }
        ]
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-j2mbp2xm": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-header", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-j2mbp2xm": true }), team.logo ? renderTemplate`<div class="team-logo-large" data-astro-cid-j2mbp2xm> <img${addAttribute(team.logo, "src")}${addAttribute(`${team.name} logo`, "alt")} loading="lazy" data-astro-cid-j2mbp2xm> </div>` : renderTemplate`<div class="team-logo-large-placeholder" data-astro-cid-j2mbp2xm> <span class="team-logo-text-large" data-astro-cid-j2mbp2xm>${team.name.charAt(0).toUpperCase()}</span> </div>`, team.name, team.description && renderTemplate`<p class="team-description-full" data-astro-cid-j2mbp2xm>${team.description}</p>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-content", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-j2mbp2xm": true }), team.players && team.players.length > 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Players</h2> <div class="sp-template sp-template-player-list" data-astro-cid-j2mbp2xm> <div class="sp-table-wrapper" data-astro-cid-j2mbp2xm> <table class="sp-player-list sp-data-table" data-astro-cid-j2mbp2xm> <thead data-astro-cid-j2mbp2xm> <tr data-astro-cid-j2mbp2xm> <th class="data-name" data-astro-cid-j2mbp2xm>Player</th> <th class="data-position" data-astro-cid-j2mbp2xm>Position</th> <th class="data-height" data-astro-cid-j2mbp2xm>Height</th> <th class="data-weight" data-astro-cid-j2mbp2xm>Weight</th> <th class="data-jersey" data-astro-cid-j2mbp2xm>Jersey</th> ${team.players.some((p) => p.stats) && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-j2mbp2xm": true }, { "default": async ($$result3) => renderTemplate` <th class="data-fg" data-astro-cid-j2mbp2xm>FG%</th> <th class="data-ft" data-astro-cid-j2mbp2xm>FT%</th> <th class="data-3p" data-astro-cid-j2mbp2xm>3P%</th> <th class="data-rpg" data-astro-cid-j2mbp2xm>RPG</th> <th class="data-apg" data-astro-cid-j2mbp2xm>APG</th> <th class="data-spg" data-astro-cid-j2mbp2xm>SPG</th> <th class="data-bpg" data-astro-cid-j2mbp2xm>BPG</th> <th class="data-ppg" data-astro-cid-j2mbp2xm>PPG</th> <th class="data-eff" data-astro-cid-j2mbp2xm>EFF</th> ` })}`} </tr> </thead> <tbody data-astro-cid-j2mbp2xm> ${team.players.map((player, index) => {
    const stats = player.stats || {};
    const hasStats = Object.keys(stats).length > 0;
    return renderTemplate`<tr${addAttribute(index % 2 === 0 ? "even" : "odd", "class")} data-astro-cid-j2mbp2xm> <td class="data-name" data-astro-cid-j2mbp2xm> <a${addAttribute(`/players/${player.id}`, "href")} class="sp-player-name" data-astro-cid-j2mbp2xm> ${getPlayerName(player)} </a> </td> <td class="data-position" data-astro-cid-j2mbp2xm>${player.position || "-"}</td> <td class="data-height" data-astro-cid-j2mbp2xm>${player.height || "-"}</td> <td class="data-weight" data-astro-cid-j2mbp2xm>${player.weight || "-"}</td> <td class="data-jersey" data-astro-cid-j2mbp2xm>${player.jerseyNumber || "-"}</td> ${hasStats && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-j2mbp2xm": true }, { "default": async ($$result3) => renderTemplate` <td class="data-fg" data-astro-cid-j2mbp2xm>${formatPercent(getStat(stats, "fgPercent") || getStat(stats, "fg"))}</td> <td class="data-ft" data-astro-cid-j2mbp2xm>${formatPercent(getStat(stats, "ftPercent") || getStat(stats, "ft"))}</td> <td class="data-3p" data-astro-cid-j2mbp2xm>${formatPercent(getStat(stats, "threePointPercent") || getStat(stats, "3p"))}</td> <td class="data-rpg" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "rpg"))}</td> <td class="data-apg" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "apg"))}</td> <td class="data-spg" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "spg"))}</td> <td class="data-bpg" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "bpg"))}</td> <td class="data-ppg" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "ppg"))}</td> <td class="data-eff" data-astro-cid-j2mbp2xm>${formatStat(getStat(stats, "eff"))}</td> ` })}`} </tr>`;
  })} </tbody> </table> </div> </div> </div>`, (!team.players || team.players.length === 0) && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Players</h2> <p class="no-data-message" data-astro-cid-j2mbp2xm>No players available for this team.</p> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-staff", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-j2mbp2xm": true }), teamStaff.length > 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Staff</h2> <div class="staff-grid" data-astro-cid-j2mbp2xm> ${teamStaff.map((teamStaffMember) => {
    const staff = teamStaffMember.staff;
    return renderTemplate`<div class="staff-card" data-astro-cid-j2mbp2xm> ${staff.image ? renderTemplate`<div class="staff-image" data-astro-cid-j2mbp2xm> <img${addAttribute(staff.image, "src")}${addAttribute(`${staff.firstName} ${staff.lastName}`, "alt")} loading="lazy" data-astro-cid-j2mbp2xm> </div>` : renderTemplate`<div class="staff-image-placeholder" data-astro-cid-j2mbp2xm> <span data-astro-cid-j2mbp2xm>${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}</span> </div>`} <div class="staff-info" data-astro-cid-j2mbp2xm> <h3 class="staff-name" data-astro-cid-j2mbp2xm>${staff.firstName} ${staff.lastName}</h3> <p class="staff-role" data-astro-cid-j2mbp2xm>${formatStaffRole(teamStaffMember.role)}</p> ${staff.bio && renderTemplate`<p class="staff-bio" data-astro-cid-j2mbp2xm>${staff.bio.substring(0, 150)}${staff.bio.length > 150 ? "..." : ""}</p>`} ${staff.email && renderTemplate`<p class="staff-contact" data-astro-cid-j2mbp2xm> <i class="fa fa-envelope" aria-hidden="true" data-astro-cid-j2mbp2xm></i> <a${addAttribute(`mailto:${staff.email}`, "href")} data-astro-cid-j2mbp2xm>${staff.email}</a> </p>`} ${staff.phone && renderTemplate`<p class="staff-contact" data-astro-cid-j2mbp2xm> <i class="fa fa-phone" aria-hidden="true" data-astro-cid-j2mbp2xm></i> <a${addAttribute(`tel:${staff.phone}`, "href")} data-astro-cid-j2mbp2xm>${staff.phone}</a> </p>`} </div> </div>`;
  })} </div> </div>`, teamStaff.length === 0 && renderTemplate`<div class="team-section" data-astro-cid-j2mbp2xm> <h2 class="section-title" data-astro-cid-j2mbp2xm>Staff</h2> <p class="no-data-message" data-astro-cid-j2mbp2xm>No staff members assigned to this team.</p> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-team-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-j2mbp2xm": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-j2mbp2xm": true })) })}`;
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
