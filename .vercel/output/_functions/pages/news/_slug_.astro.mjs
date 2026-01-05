import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, u as unescapeHTML, h as addAttribute, m as maybeRenderHead, w as defineScriptVars } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_0fak_qL3.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../../chunks/PageLoader_D_5s45Mo.mjs';
import { J as getNewsArticleBySlug } from '../../chunks/queries_vvMOn9ut.mjs';
import { r as reverseCategoryMap } from '../../chunks/types_DXfYTmyI.mjs';
import { C as CommentsList } from '../../chunks/CommentsList_kC1h_7dG.mjs';
import { p as prisma } from '../../chunks/prisma_sB1uhqJV.mjs';
import { $ as $$NewsSidebar, a as $$NewsBreadcrumbs } from '../../chunks/NewsBreadcrumbs_CeB1vn0z.mjs';
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
  let article;
  try {
    article = await getNewsArticleBySlug(slug);
    if (!article || !article.published) {
      return Astro2.redirect("/404", 302);
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    return Astro2.redirect("/404", 302);
  }
  const category = reverseCategoryMap[article.category] || article.category;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;
  const modifiedDate = article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedDate ? new Date(article.publishedAt).toISOString() : null;
  let commentCount = 0;
  try {
    if (prisma.comment) {
      commentCount = await prisma.comment.count({
        where: {
          articleId: article.id,
          approved: true
        }
      });
    }
  } catch (error) {
    console.error("Error fetching comment count:", error);
  }
  const pageTitle = `${article.title} - Elevate`;
  const pageDescription = article.excerpt || article.title;
  const pageUrl = `${Astro2.url.origin}/news/${slug}`;
  const pageImage = article.image || `${Astro2.url.origin}/images/Elevate_Icon-200x200.png`;
  const publishedTime = article.publishedAt ? new Date(article.publishedAt).toISOString() : null;
  const modifiedTime = modifiedDate;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-vcwz2lde": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" <script>(function(){", `
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
      if (publishedTime) updateMeta('article:published_time', publishedTime, true);
      if (modifiedTime) updateMeta('article:modified_time', modifiedTime, true);
      updateMeta('og:image', pageImage, true);
      updateMeta('author', authorName);
      updateMeta('twitter:card', 'summary_large_image');
      updateMeta('twitter:label1', 'Written by');
      updateMeta('twitter:data1', authorName);
      updateMeta('twitter:label2', 'Est. reading time');
      updateMeta('twitter:data2', '3 minutes');
    })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-vcwz2lde> ', " ", " ", ' <main id="main" role="main" data-astro-cid-vcwz2lde> <!--SINGLE POST--> <div', "", ' data-astro-cid-vcwz2lde> <div class="stm-single-post stm-default-page" data-astro-cid-vcwz2lde> <div class="container" data-astro-cid-vcwz2lde> <div class="row stm-format-" data-astro-cid-vcwz2lde> <!-- Main Content --> <div class="col-md-9 col-sm-12 col-xs-12" data-astro-cid-vcwz2lde> <div class="sidebar-margin-top clearfix" data-astro-cid-vcwz2lde></div> <!-- Breadcrumbs --> <div class="stm-small-title-box" data-astro-cid-vcwz2lde> <div class="stm-title-box-unit" data-astro-cid-vcwz2lde> ', ' <!-- Page Title --> <div class="stm-page-title" data-astro-cid-vcwz2lde> <div class="container" data-astro-cid-vcwz2lde> <div class="clearfix stm-title-box-title-wrapper" data-astro-cid-vcwz2lde> <h1 class="stm-main-title-unit" data-astro-cid-vcwz2lde>', "</h1> </div> </div> </div> </div> </div> <!-- Post Thumbnail --> ", ' <!-- Post Meta --> <div class="stm-single-post-meta clearfix normal_font" data-astro-cid-vcwz2lde> <div class="stm-meta-left-part" data-astro-cid-vcwz2lde> ', ' <div class="stm-author" data-astro-cid-vcwz2lde> <i class="fa fa-user" data-astro-cid-vcwz2lde></i> ', ' </div> </div> <div class="stm-comments-num" data-astro-cid-vcwz2lde> <a href="#comments" class="stm-post-comments" data-astro-cid-vcwz2lde> <i class="fa fa-commenting" data-astro-cid-vcwz2lde></i> ', ' </a> </div> </div> <!-- Post Content --> <div class="post-content" data-astro-cid-vcwz2lde> <div class="article-body" data-astro-cid-vcwz2lde>', '</div> <div class="clearfix" data-astro-cid-vcwz2lde></div> </div> <!-- Post Meta Bottom --> <div class="stm-post-meta-bottom normal_font clearfix" data-astro-cid-vcwz2lde> <div class="stm_post_tags" data-astro-cid-vcwz2lde></div> </div> <!-- Comments --> <div class="stm_post_comments" data-astro-cid-vcwz2lde> ', ' </div> </div> <!-- Sidebar --> <div class="col-md-3 hidden-sm hidden-xs af-margin-88" data-astro-cid-vcwz2lde> ', " </div> </div> </div> </div> </div> </main> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-vcwz2lde> <div class="sportspress" data-astro-cid-vcwz2lde><div class="sp-sponsors" data-astro-cid-vcwz2lde></div></div> </div>  '], [" <script>(function(){", `
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
      if (publishedTime) updateMeta('article:published_time', publishedTime, true);
      if (modifiedTime) updateMeta('article:modified_time', modifiedTime, true);
      updateMeta('og:image', pageImage, true);
      updateMeta('author', authorName);
      updateMeta('twitter:card', 'summary_large_image');
      updateMeta('twitter:label1', 'Written by');
      updateMeta('twitter:data1', authorName);
      updateMeta('twitter:label2', 'Est. reading time');
      updateMeta('twitter:data2', '3 minutes');
    })();<\/script> <script type="application/ld+json">`, "<\/script> ", " ", '<div id="wrapper" data-astro-cid-vcwz2lde> ', " ", " ", ' <main id="main" role="main" data-astro-cid-vcwz2lde> <!--SINGLE POST--> <div', "", ' data-astro-cid-vcwz2lde> <div class="stm-single-post stm-default-page" data-astro-cid-vcwz2lde> <div class="container" data-astro-cid-vcwz2lde> <div class="row stm-format-" data-astro-cid-vcwz2lde> <!-- Main Content --> <div class="col-md-9 col-sm-12 col-xs-12" data-astro-cid-vcwz2lde> <div class="sidebar-margin-top clearfix" data-astro-cid-vcwz2lde></div> <!-- Breadcrumbs --> <div class="stm-small-title-box" data-astro-cid-vcwz2lde> <div class="stm-title-box-unit" data-astro-cid-vcwz2lde> ', ' <!-- Page Title --> <div class="stm-page-title" data-astro-cid-vcwz2lde> <div class="container" data-astro-cid-vcwz2lde> <div class="clearfix stm-title-box-title-wrapper" data-astro-cid-vcwz2lde> <h1 class="stm-main-title-unit" data-astro-cid-vcwz2lde>', "</h1> </div> </div> </div> </div> </div> <!-- Post Thumbnail --> ", ' <!-- Post Meta --> <div class="stm-single-post-meta clearfix normal_font" data-astro-cid-vcwz2lde> <div class="stm-meta-left-part" data-astro-cid-vcwz2lde> ', ' <div class="stm-author" data-astro-cid-vcwz2lde> <i class="fa fa-user" data-astro-cid-vcwz2lde></i> ', ' </div> </div> <div class="stm-comments-num" data-astro-cid-vcwz2lde> <a href="#comments" class="stm-post-comments" data-astro-cid-vcwz2lde> <i class="fa fa-commenting" data-astro-cid-vcwz2lde></i> ', ' </a> </div> </div> <!-- Post Content --> <div class="post-content" data-astro-cid-vcwz2lde> <div class="article-body" data-astro-cid-vcwz2lde>', '</div> <div class="clearfix" data-astro-cid-vcwz2lde></div> </div> <!-- Post Meta Bottom --> <div class="stm-post-meta-bottom normal_font clearfix" data-astro-cid-vcwz2lde> <div class="stm_post_tags" data-astro-cid-vcwz2lde></div> </div> <!-- Comments --> <div class="stm_post_comments" data-astro-cid-vcwz2lde> ', ' </div> </div> <!-- Sidebar --> <div class="col-md-3 hidden-sm hidden-xs af-margin-88" data-astro-cid-vcwz2lde> ', " </div> </div> </div> </div> </div> </main> </div> ", ' <div class="sp-footer-sponsors" data-astro-cid-vcwz2lde> <div class="sportspress" data-astro-cid-vcwz2lde><div class="sp-sponsors" data-astro-cid-vcwz2lde></div></div> </div>  '])), defineScriptVars({ pageTitle, pageDescription, pageUrl, pageImage, publishedTime, modifiedTime, authorName: article.author.name, articleTitle: article.title }), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        "url": pageUrl,
        "name": pageTitle,
        "isPartOf": { "@id": `${Astro2.url.origin}/#website` },
        "primaryImageOfPage": { "@id": `${pageUrl}#primaryimage` },
        "image": { "@id": `${pageUrl}#primaryimage` },
        "thumbnailUrl": pageImage,
        ...publishedTime && { "datePublished": publishedTime },
        ...modifiedTime && { "dateModified": modifiedTime },
        "author": {
          "@id": `${Astro2.url.origin}/#/schema/person/${article.author.id}`,
          "name": article.author.name
        },
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": "en-US",
        "potentialAction": [{ "@type": "ReadAction", "target": [pageUrl] }]
      },
      {
        "@type": "ImageObject",
        "inLanguage": "en-US",
        "@id": `${pageUrl}#primaryimage`,
        "url": pageImage,
        "contentUrl": pageImage,
        ...article.image && { "width": 2560, "height": 1707 }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${Astro2.url.origin}/` },
          { "@type": "ListItem", "position": 2, "name": "News", "item": `${Astro2.url.origin}/news/` },
          { "@type": "ListItem", "position": 3, "name": article.title }
        ]
      }
    ]
  })), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default", "data-astro-cid-vcwz2lde": true }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, { "data-astro-cid-vcwz2lde": true }), renderComponent($$result2, "Header", $$Header, { "data-astro-cid-vcwz2lde": true }), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default", "data-astro-cid-vcwz2lde": true }), addAttribute(`post-${article.id}`, "id"), addAttribute(`post-${article.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${article.category.toLowerCase()}`, "class"), renderComponent($$result2, "NewsBreadcrumbs", $$NewsBreadcrumbs, { "items": [
    { label: "Elevate", url: "/" },
    { label: "News", url: "/news/" },
    { label: category, url: `/news?category=${category}` },
    { label: article.title }
  ], "data-astro-cid-vcwz2lde": true }), article.title, article.image && renderTemplate`<div class="post-thumbnail" data-astro-cid-vcwz2lde> <img fetchpriority="high" width="1170" height="650"${addAttribute(article.image, "src")} class="img-responsive wp-post-image"${addAttribute(article.title, "alt")} decoding="async" data-astro-cid-vcwz2lde> </div>`, publishedDate && renderTemplate`<div class="stm-date" data-astro-cid-vcwz2lde> <i class="fa fa-calendar-o" data-astro-cid-vcwz2lde></i> ${publishedDate} </div>`, article.author.name, commentCount > 0 && renderTemplate`<span data-astro-cid-vcwz2lde>${commentCount}</span>`, unescapeHTML(article.content), renderComponent($$result2, "CommentsList", CommentsList, { "client:load": true, "articleId": article.id, "showForm": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/comments/components/CommentsList", "client:component-export": "default", "data-astro-cid-vcwz2lde": true }), renderComponent($$result2, "NewsSidebar", $$NewsSidebar, { "searchQuery": "", "showTags": false, "showInstagram": false, "data-astro-cid-vcwz2lde": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-vcwz2lde": true })) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/news/[slug].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/news/[slug].astro";
const $$url = "/news/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
