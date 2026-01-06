import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead, u as unescapeHTML, w as defineScriptVars } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_PYfl9QGE.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { y as getPlayerById } from '../../chunks/queries_E6Jl_Myi.mjs';
import { $ as $$Spacing } from '../../chunks/Spacing_BPc02AQQ.mjs';
/* empty css                                   */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/404", 302);
  }
  let player;
  try {
    player = await getPlayerById(id);
    if (!player) {
      return Astro2.redirect("/404", 302);
    }
  } catch (error) {
    console.error("Error fetching player:", error);
    return Astro2.redirect("/404", 302);
  }
  const getPlayerName = () => {
    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player.firstName || player.lastName || "Unknown Player";
  };
  const playerName = getPlayerName();
  const getStat = (stats2, key) => {
    if (!stats2 || typeof stats2 !== "object") return 0;
    return stats2[key] || 0;
  };
  const formatStat = (value) => {
    return value === 0 ? "-" : value.toFixed(1);
  };
  const formatPercent = (value) => {
    return value === 0 ? "-" : value.toFixed(1);
  };
  const stats = player.stats || {};
  const pageTitle = `${playerName} - Players - Elevate Ballers`;
  const pageDescription = player.bio || `View ${playerName}'s profile, statistics, and information`;
  const pageUrl = `${Astro2.url.origin}/players/${id}`;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-urx2krqq": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", `
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
    updateMeta('og:type', 'profile', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate Ballers', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-urx2krqq> ', " ", " ", ' <div id="main" data-astro-cid-urx2krqq> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-urx2krqq></div> <div class="container" data-astro-cid-urx2krqq> <section class="wpb-content-wrapper" data-astro-cid-urx2krqq> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-urx2krqq> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-urx2krqq> <div class="vc_column-inner" data-astro-cid-urx2krqq> <div class="wpb_wrapper" data-astro-cid-urx2krqq> ', ' <!-- Player Header --> <div class="player-header" data-astro-cid-urx2krqq> <div class="player-header-content" data-astro-cid-urx2krqq> ', ' <div class="player-header-info" data-astro-cid-urx2krqq> <h1 class="player-title" data-astro-cid-urx2krqq>', "</h1> ", ' <div class="player-details" data-astro-cid-urx2krqq> ', " ", " ", " ", " </div> </div> </div> </div> ", " <!-- Bio Section --> ", " ", " <!-- Statistics Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-urx2krqq> <div class="sportspress" data-astro-cid-urx2krqq><div class="sp-sponsors" data-astro-cid-urx2krqq></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-urx2krqq> <span class="close-left" data-astro-cid-urx2krqq></span> <span class="close-right" data-astro-cid-urx2krqq></span> </div>  <script type="speculationrules">
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
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-urx2krqq> <div class="sportspress" data-astro-cid-urx2krqq><div class="sp-sponsors" data-astro-cid-urx2krqq></div></div> </div>  <script type="text/javascript">
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
    updateMeta('og:type', 'profile', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate Ballers', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-urx2krqq> ', " ", " ", ' <div id="main" data-astro-cid-urx2krqq> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;" data-astro-cid-urx2krqq></div> <div class="container" data-astro-cid-urx2krqq> <section class="wpb-content-wrapper" data-astro-cid-urx2krqq> <div class="vc_row wpb_row vc_row-fluid" data-astro-cid-urx2krqq> <div class="wpb_column vc_column_container vc_col-sm-12" data-astro-cid-urx2krqq> <div class="vc_column-inner" data-astro-cid-urx2krqq> <div class="wpb_wrapper" data-astro-cid-urx2krqq> ', ' <!-- Player Header --> <div class="player-header" data-astro-cid-urx2krqq> <div class="player-header-content" data-astro-cid-urx2krqq> ', ' <div class="player-header-info" data-astro-cid-urx2krqq> <h1 class="player-title" data-astro-cid-urx2krqq>', "</h1> ", ' <div class="player-details" data-astro-cid-urx2krqq> ', " ", " ", " ", " </div> </div> </div> </div> ", " <!-- Bio Section --> ", " ", " <!-- Statistics Section --> ", " ", " ", " </div> </div> </div> </div> </section> </div> </div> </div> ", ` <div class="sp-footer-sponsors" data-astro-cid-urx2krqq> <div class="sportspress" data-astro-cid-urx2krqq><div class="sp-sponsors" data-astro-cid-urx2krqq></div></div> </div>  <div class="rev-close-btn" aria-hidden="true" data-astro-cid-urx2krqq> <span class="close-left" data-astro-cid-urx2krqq></span> <span class="close-right" data-astro-cid-urx2krqq></span> </div>  <script type="speculationrules">
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
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true" data-astro-cid-urx2krqq> <div class="sportspress" data-astro-cid-urx2krqq><div class="sp-sponsors" data-astro-cid-urx2krqq></div></div> </div>  <script type="text/javascript">
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
          { "@type": "ListItem", "position": 2, "name": "Players", "item": `${Astro2.url.origin}/players` },
          { "@type": "ListItem", "position": 3, "name": playerName }
        ]
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-urx2krqq": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-urx2krqq": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-urx2krqq": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-urx2krqq": true }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-player-header", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-urx2krqq": true }), player.image ? renderTemplate`<div class="player-image-large" data-astro-cid-urx2krqq> <img${addAttribute(player.image, "src")}${addAttribute(playerName, "alt")} loading="lazy" data-astro-cid-urx2krqq> </div>` : renderTemplate`<div class="player-image-large-placeholder" data-astro-cid-urx2krqq> <span class="player-image-text-large" data-astro-cid-urx2krqq> ${player.firstName?.charAt(0) || ""}${player.lastName?.charAt(0) || ""} </span> </div>`, playerName, player.team && renderTemplate`<p class="player-team" data-astro-cid-urx2krqq> <a${addAttribute(`/teams/${player.team.slug}`, "href")} class="team-link" data-astro-cid-urx2krqq> ${player.team.name} </a> </p>`, player.position && renderTemplate`<span class="player-detail-item" data-astro-cid-urx2krqq> <i class="fa fa-map-marker" aria-hidden="true" data-astro-cid-urx2krqq></i>
Position: <strong data-astro-cid-urx2krqq>${player.position}</strong> </span>`, player.jerseyNumber && renderTemplate`<span class="player-detail-item" data-astro-cid-urx2krqq> <i class="fa fa-tag" aria-hidden="true" data-astro-cid-urx2krqq></i>
Jersey: <strong data-astro-cid-urx2krqq>#${player.jerseyNumber}</strong> </span>`, player.height && renderTemplate`<span class="player-detail-item" data-astro-cid-urx2krqq> <i class="fa fa-arrows-v" aria-hidden="true" data-astro-cid-urx2krqq></i>
Height: <strong data-astro-cid-urx2krqq>${player.height}</strong> </span>`, player.weight && renderTemplate`<span class="player-detail-item" data-astro-cid-urx2krqq> <i class="fa fa-balance-scale" aria-hidden="true" data-astro-cid-urx2krqq></i>
Weight: <strong data-astro-cid-urx2krqq>${player.weight}</strong> </span>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-player-content", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-urx2krqq": true }), player.bio && renderTemplate`<div class="player-section" data-astro-cid-urx2krqq> <h2 class="section-title" data-astro-cid-urx2krqq>About</h2> <div class="player-bio" data-astro-cid-urx2krqq> <p data-astro-cid-urx2krqq>${player.bio}</p> </div> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-player-stats", "lg": "40", "md": "40", "sm": "30", "xs": "30", "data-astro-cid-urx2krqq": true }), Object.keys(stats).length > 0 && renderTemplate`<div class="player-section" data-astro-cid-urx2krqq> <h2 class="section-title" data-astro-cid-urx2krqq>Statistics</h2> <div class="player-stats-grid" data-astro-cid-urx2krqq> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Field Goal %</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatPercent(getStat(stats, "fgPercent") || getStat(stats, "fg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Free Throw %</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatPercent(getStat(stats, "ftPercent") || getStat(stats, "ft"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>3-Point %</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatPercent(getStat(stats, "threePointPercent") || getStat(stats, "3p"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Rebounds Per Game</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "rpg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Assists Per Game</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "apg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Steals Per Game</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "spg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Blocks Per Game</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "bpg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Points Per Game</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "ppg"))}</div> </div> <div class="stat-card" data-astro-cid-urx2krqq> <div class="stat-label" data-astro-cid-urx2krqq>Efficiency</div> <div class="stat-value" data-astro-cid-urx2krqq>${formatStat(getStat(stats, "eff"))}</div> </div> </div> </div>`, Object.keys(stats).length === 0 && renderTemplate`<div class="player-section" data-astro-cid-urx2krqq> <h2 class="section-title" data-astro-cid-urx2krqq>Statistics</h2> <p class="no-data-message" data-astro-cid-urx2krqq>No statistics available for this player.</p> </div>`, renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-player-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40", "data-astro-cid-urx2krqq": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-urx2krqq": true })) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/players/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/players/[id].astro";
const $$url = "/players/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
