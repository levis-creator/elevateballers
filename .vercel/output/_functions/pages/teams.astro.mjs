import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead, u as unescapeHTML, w as defineScriptVars } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_0fak_qL3.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../chunks/PageLoader_D_5s45Mo.mjs';
import { I as getTeams } from '../chunks/queries_E6Jl_Myi.mjs';
import { $ as $$Spacing } from '../chunks/Spacing_BPc02AQQ.mjs';
import { C as ContentLoader } from '../chunks/ContentLoader_CZRVSG-V.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$Teams = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Teams;
  let teams = [];
  let hasError = false;
  try {
    teams = await getTeams();
  } catch (error) {
    console.error("Error fetching teams:", error);
    hasError = true;
  }
  const pageTitle = "Teams - Elevate Ballers";
  const pageDescription = "View all teams in the Elevate Ballers league";
  const pageUrl = `${Astro2.url.origin}/teams/`;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-gpev5nox": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", `
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
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-gpev5nox> ', " ", " ", ' <div id="main" data-astro-cid-gpev5nox> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-gpev5nox></div> <div class="container" data-astro-cid-gpev5nox> <section class="wpb-content-wrapper" data-astro-cid-gpev5nox> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-gpev5nox> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-gpev5nox> <div class="vc_column-inner" data-astro-cid-gpev5nox> <div class="wpb_wrapper" data-astro-cid-gpev5nox> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;" data-astro-cid-gpev5nox>\nTEAMS\n</h2> ', " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-gpev5nox> <div class="sportspress" data-astro-cid-gpev5nox><div class="sp-sponsors" data-astro-cid-gpev5nox></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-gpev5nox> <span class="close-left" data-astro-cid-gpev5nox></span> <span class="close-right" data-astro-cid-gpev5nox></span> </div>  <script type="speculationrules">
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
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-gpev5nox> <div class="sportspress" data-astro-cid-gpev5nox><div class="sp-sponsors" data-astro-cid-gpev5nox></div></div> </div>  <script type="text/javascript">
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
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-gpev5nox> ', " ", " ", ' <div id="main" data-astro-cid-gpev5nox> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-gpev5nox></div> <div class="container" data-astro-cid-gpev5nox> <section class="wpb-content-wrapper" data-astro-cid-gpev5nox> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-gpev5nox> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-gpev5nox> <div class="vc_column-inner" data-astro-cid-gpev5nox> <div class="wpb_wrapper" data-astro-cid-gpev5nox> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 50px; color: #dd3333;" data-astro-cid-gpev5nox>\nTEAMS\n</h2> ', " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-gpev5nox> <div class="sportspress" data-astro-cid-gpev5nox><div class="sp-sponsors" data-astro-cid-gpev5nox></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-gpev5nox> <span class="close-left" data-astro-cid-gpev5nox></span> <span class="close-right" data-astro-cid-gpev5nox></span> </div>  <script type="speculationrules">
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
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-gpev5nox> <div class="sportspress" data-astro-cid-gpev5nox><div class="sp-sponsors" data-astro-cid-gpev5nox></div></div> </div>  <script type="text/javascript">
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
          { "@type": "ListItem", "position": 2, "name": "Teams" }
        ]
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-gpev5nox": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-gpev5nox": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-gpev5nox": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-gpev5nox": true }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-teams-header", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-gpev5nox": true }), hasError ? renderTemplate`${renderComponent($$result2, "ContentLoader", ContentLoader, { "client:load": true, "message": "Failed to load teams. Please try again later.", "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/ContentLoader", "client:component-export": "default", "data-astro-cid-gpev5nox": true })}` : teams.length === 0 ? renderTemplate`<div class="no-teams-message" data-astro-cid-gpev5nox> <p data-astro-cid-gpev5nox>No teams available at this time.</p> </div>` : renderTemplate`<div class="teams-grid" data-astro-cid-gpev5nox> ${teams.map((team) => renderTemplate`<div class="team-card" data-astro-cid-gpev5nox> <a${addAttribute(`/teams/${team.slug}`, "href")} class="team-card-link" data-astro-cid-gpev5nox> ${team.logo ? renderTemplate`<div class="team-logo" data-astro-cid-gpev5nox> <img${addAttribute(team.logo, "src")}${addAttribute(`${team.name} logo`, "alt")} loading="lazy" data-astro-cid-gpev5nox> </div>` : renderTemplate`<div class="team-logo-placeholder" data-astro-cid-gpev5nox> <span class="team-logo-text" data-astro-cid-gpev5nox>${team.name.charAt(0).toUpperCase()}</span> </div>`} <div class="team-info" data-astro-cid-gpev5nox> <h3 class="team-name" data-astro-cid-gpev5nox>${team.name}</h3> ${team.description && renderTemplate`<p class="team-description" data-astro-cid-gpev5nox>${team.description.substring(0, 150)}${team.description.length > 150 ? "..." : ""}</p>`} <div class="team-stats" data-astro-cid-gpev5nox> <span class="team-player-count" data-astro-cid-gpev5nox> <i class="fa fa-users" aria-hidden="true" data-astro-cid-gpev5nox></i> ${team._count.players} ${team._count.players === 1 ? "Player" : "Players"} </span> </div> </div> </a> </div>`)} </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-teams-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-gpev5nox": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-gpev5nox": true })) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/teams.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/teams.astro";
const $$url = "/teams";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Teams,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
