import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead, u as unescapeHTML, w as defineScriptVars } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_PYfl9QGE.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../chunks/PageLoader_D_5s45Mo.mjs';
import { t as getNewsArticles } from '../chunks/queries_E6Jl_Myi.mjs';
import { r as reverseCategoryMap } from '../chunks/types_DXfYTmyI.mjs';
import { $ as $$NewsSidebar, a as $$NewsBreadcrumbs } from '../chunks/NewsBreadcrumbs_DVvGkpOM.mjs';
import { C as ContentLoader } from '../chunks/ContentLoader_CZRVSG-V.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const { category, archive, s: searchQuery } = Astro2.url.searchParams;
  let articles = [];
  let hasError = false;
  try {
    articles = await getNewsArticles();
    if (category) {
      articles = articles.filter((article) => {
        const articleCategory = reverseCategoryMap[article.category] || article.category;
        return articleCategory.toLowerCase() === category.toLowerCase();
      });
    }
    if (archive) {
      const [year, month] = archive.split("/");
      articles = articles.filter((article) => {
        if (!article.publishedAt) return false;
        const date = new Date(article.publishedAt);
        return date.getFullYear().toString() === year && String(date.getMonth() + 1).padStart(2, "0") === month;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(
        (article) => article.title.toLowerCase().includes(query) || article.excerpt?.toLowerCase().includes(query) || article.content.toLowerCase().includes(query)
      );
    }
  } catch (error) {
    console.error("Error fetching news articles:", error);
    hasError = true;
  }
  const pageTitle = "News - Elevate";
  const pageDescription = "Latest news and updates from Elevate Ballers";
  const pageUrl = `${Astro2.url.origin}/news/`;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-xzrtoo6z": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", `
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
    updateMeta('og:type', 'article', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-xzrtoo6z> ', " ", " ", ' <div id="main" data-astro-cid-xzrtoo6z> <div class="stm-default-page stm-default-page-list stm-default-page-right" data-astro-cid-xzrtoo6z> <div class="container" data-astro-cid-xzrtoo6z> <div class="row sidebar-wrapper" data-astro-cid-xzrtoo6z> <!-- Main Content --> <div class="col-md-9 col-sm-12 col-xs-12" data-astro-cid-xzrtoo6z> <div class="sidebar-margin-top clearfix" data-astro-cid-xzrtoo6z></div> <!-- Breadcrumbs and Title --> <div class="stm-small-title-box" data-astro-cid-xzrtoo6z> <div class="stm-title-box-unit title_box-96" data-astro-cid-xzrtoo6z> ', ' <div class="stm-page-title" data-astro-cid-xzrtoo6z> <div class="container" data-astro-cid-xzrtoo6z> <div class="clearfix stm-title-box-title-wrapper" data-astro-cid-xzrtoo6z> <h1 class="stm-main-title-unit" data-astro-cid-xzrtoo6z>News</h1> </div> </div> </div> </div> </div> <!-- News Articles List --> ', ' </div> <!-- Sidebar --> <div class="col-md-3 hidden-sm hidden-xs af-margin-88" data-astro-cid-xzrtoo6z> ', " </div> </div> </div> </div> </div> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-xzrtoo6z> <div class="sportspress" data-astro-cid-xzrtoo6z><div class="sp-sponsors" data-astro-cid-xzrtoo6z></div></div> </div>  '], [" <script>(function(){", `
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
    updateMeta('og:type', 'article', true);
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:site_name', 'Elevate', true);
    updateMeta('twitter:card', 'summary_large_image');
  })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-xzrtoo6z> ', " ", " ", ' <div id="main" data-astro-cid-xzrtoo6z> <div class="stm-default-page stm-default-page-list stm-default-page-right" data-astro-cid-xzrtoo6z> <div class="container" data-astro-cid-xzrtoo6z> <div class="row sidebar-wrapper" data-astro-cid-xzrtoo6z> <!-- Main Content --> <div class="col-md-9 col-sm-12 col-xs-12" data-astro-cid-xzrtoo6z> <div class="sidebar-margin-top clearfix" data-astro-cid-xzrtoo6z></div> <!-- Breadcrumbs and Title --> <div class="stm-small-title-box" data-astro-cid-xzrtoo6z> <div class="stm-title-box-unit title_box-96" data-astro-cid-xzrtoo6z> ', ' <div class="stm-page-title" data-astro-cid-xzrtoo6z> <div class="container" data-astro-cid-xzrtoo6z> <div class="clearfix stm-title-box-title-wrapper" data-astro-cid-xzrtoo6z> <h1 class="stm-main-title-unit" data-astro-cid-xzrtoo6z>News</h1> </div> </div> </div> </div> </div> <!-- News Articles List --> ', ' </div> <!-- Sidebar --> <div class="col-md-3 hidden-sm hidden-xs af-margin-88" data-astro-cid-xzrtoo6z> ', " </div> </div> </div> </div> </div> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-xzrtoo6z> <div class="sportspress" data-astro-cid-xzrtoo6z><div class="sp-sponsors" data-astro-cid-xzrtoo6z></div></div> </div>  '])), defineScriptVars({ pageTitle, pageDescription, pageUrl }), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": pageUrl,
        "url": pageUrl,
        "name": pageTitle,
        "isPartOf": { "@id": `${Astro2.url.origin}/#website` },
        "datePublished": "2016-05-03T05:04:41+00:00",
        "dateModified": "2016-05-03T05:04:41+00:00",
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": "en-US"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${Astro2.url.origin}/` },
          { "@type": "ListItem", "position": 2, "name": "News" }
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${Astro2.url.origin}/#website`,
        "url": `${Astro2.url.origin}/`,
        "name": "Elevate",
        "description": "",
        "potentialAction": [{
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${Astro2.url.origin}/?s={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }],
        "inLanguage": "en-US"
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-xzrtoo6z": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-xzrtoo6z": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-xzrtoo6z": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-xzrtoo6z": true }), renderComponent($$result2, "NewsBreadcrumbs", $$NewsBreadcrumbs, { "items": [
    { label: "Elevate", url: "/" },
    { label: "News" }
  ], "data-astro-cid-xzrtoo6z": true }), hasError ? renderTemplate`${renderComponent($$result2, "ContentLoader", ContentLoader, { "client:load": true, "message": "Failed to load news articles. Please try again later.", "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/ContentLoader", "client:component-export": "default", "data-astro-cid-xzrtoo6z": true })}` : renderTemplate`<div class="row row-3 row-sm-2" data-astro-cid-xzrtoo6z> ${articles.map((article) => {
    const articleCategory = reverseCategoryMap[article.category] || article.category;
    return renderTemplate`<div class="col-md-12" data-astro-cid-xzrtoo6z> <div${addAttribute(`stm-single-post-loop stm-single-post-loop-list post-${article.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${articleCategory.toLowerCase()}`, "class")} data-astro-cid-xzrtoo6z> ${article.image && renderTemplate`<a${addAttribute(`/news/${article.slug}`, "href")}${addAttribute(article.title, "title")} class="stm-image-link" data-astro-cid-xzrtoo6z> <div class="image" data-astro-cid-xzrtoo6z> <div class="stm-plus" data-astro-cid-xzrtoo6z></div> <img width="1170" height="650"${addAttribute(article.image, "src")} class="img-responsive wp-post-image"${addAttribute(article.title, "alt")} decoding="async" data-astro-cid-xzrtoo6z> </div> </a>`} <div class="stm-post-content-inner" data-astro-cid-xzrtoo6z> <a${addAttribute(`/news/${article.slug}`, "href")} data-astro-cid-xzrtoo6z> <div class="title heading-font" data-astro-cid-xzrtoo6z> ${article.title} </div> </a> <div class="clearfix" data-astro-cid-xzrtoo6z></div> <div class="content" data-astro-cid-xzrtoo6z> <p data-astro-cid-xzrtoo6z>${article.excerpt || article.content.substring(0, 200) + "..."}</p> </div> </div> </div> </div>`;
  })} ${articles.length === 0 && renderTemplate`<div class="col-md-12" data-astro-cid-xzrtoo6z> <div class="no-articles" data-astro-cid-xzrtoo6z> <p data-astro-cid-xzrtoo6z>No news articles found.</p> </div> </div>`} </div>`, renderComponent($$result2, "NewsSidebar", $$NewsSidebar, { "searchQuery": searchQuery || "", "showTags": true, "showInstagram": true, "data-astro-cid-xzrtoo6z": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-xzrtoo6z": true })) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/news/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/news/index.astro";
const $$url = "/news";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
