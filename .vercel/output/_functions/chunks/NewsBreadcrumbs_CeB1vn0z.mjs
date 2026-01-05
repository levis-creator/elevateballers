import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent, x as Fragment } from './astro/server_c8H0H61q.mjs';
import 'piccolore';
import 'clsx';
import { t as getNewsArticles } from './queries_vvMOn9ut.mjs';
import { r as reverseCategoryMap } from './types_DXfYTmyI.mjs';
/* empty css                          */

const $$Astro$1 = createAstro();
const $$NewsSidebar = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$NewsSidebar;
  const { searchQuery = "", showTags = false, showInstagram = false } = Astro2.props;
  const allArticles = await getNewsArticles();
  const categoryCounts = allArticles.reduce((acc, art) => {
    const cat = reverseCategoryMap[art.category] || art.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const archives = allArticles.reduce((acc, art) => {
    if (!art.publishedAt) return acc;
    const date = new Date(art.publishedAt);
    const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!acc[key]) {
      acc[key] = { label, count: 0, url: `/news?archive=${key}` };
    }
    acc[key].count++;
    return acc;
  }, {});
  const archivesList = Object.entries(archives).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
  const latestNews = allArticles.slice(0, 3);
  const tags = Array.from(new Set(
    allArticles.flatMap((art) => {
      const cat = reverseCategoryMap[art.category] || art.category;
      return [cat.toLowerCase()];
    })
  ));
  return renderTemplate`<!-- Search Widget -->${maybeRenderHead()}<aside id="search-5" class="widget widget-default widget_search" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>search</h4> </div> <form method="get" action="/news/" data-astro-cid-72balves> <div class="search-wrapper" data-astro-cid-72balves> <input placeholder="Search" type="text" class="search-input"${addAttribute(searchQuery, "value")} name="s" data-astro-cid-72balves> </div> <button type="submit" class="search-submit" data-astro-cid-72balves> <i class="fa fa-search" data-astro-cid-72balves></i> </button> </form> </aside> <!-- Categories Widget --> <aside id="categories-2" class="widget widget-default widget_categories" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>Categories</h4> </div> <ul data-astro-cid-72balves> ${Object.entries(categoryCounts).map(([cat, count]) => renderTemplate`<li class="cat-item" data-astro-cid-72balves> <a${addAttribute(`/news?category=${cat}`, "href")} data-astro-cid-72balves> <span data-astro-cid-72balves>${cat}</span> </a> </li>`)} </ul> </aside> <!-- Archives Widget --> <aside id="archives-2" class="widget widget-default widget_archive" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>Archives</h4> </div> <ul data-astro-cid-72balves> ${archivesList.map(([key, archive]) => renderTemplate`<li data-astro-cid-72balves> <a${addAttribute(archive.url, "href")} data-astro-cid-72balves>${archive.label}</a> </li>`)} </ul> </aside> ${showTags && renderTemplate`<!-- Tags Widget -->
  <aside id="tag_cloud-2" class="widget widget-default widget_tag_cloud" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>Tags</h4> </div> <div class="tagcloud" data-astro-cid-72balves> ${tags.map((tag, index) => renderTemplate`<a${addAttribute(`/news?category=${tag}`, "href")}${addAttribute(`tag-cloud-link tag-link-${index + 1} tag-link-position-${index + 1}`, "class")} style="font-size: 8pt;" data-astro-cid-72balves> ${tag} </a>`)} </div> </aside>`} <!-- Latest News Widget --> <aside id="stm_recent_posts-2" class="widget widget-default widget_stm_recent_posts" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>Latest news</h4> </div> ${latestNews.map((news) => {
    const newsDate = news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : null;
    return renderTemplate`<div class="widget_media clearfix" data-astro-cid-72balves> <a${addAttribute(`/news/${news.slug}`, "href")} data-astro-cid-72balves> ${news.image && renderTemplate`<div class="image" data-astro-cid-72balves> <img width="150" height="150"${addAttribute(news.image, "src")} class="img-responsive wp-post-image"${addAttribute(news.title, "alt")} decoding="async" data-astro-cid-72balves> </div>`} <div class="stm-post-content" data-astro-cid-72balves> ${newsDate && renderTemplate`<div class="date normal_font" data-astro-cid-72balves>${newsDate}</div>`} <span class="h5" data-astro-cid-72balves>${news.title}</span> </div> </a> </div>`;
  })} </aside> ${showInstagram && renderTemplate`<!-- Instagram Widget -->
  <aside id="text-3" class="widget widget-default widget_text" data-astro-cid-72balves> <div class="widget-title" data-astro-cid-72balves> <h4 data-astro-cid-72balves>Instagram</h4> </div> <div class="textwidget" data-astro-cid-72balves> <!-- Instagram feed can be added here --> </div> </aside>`} `;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/news/components/NewsSidebar.astro", void 0);

const $$Astro = createAstro();
const $$NewsBreadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$NewsBreadcrumbs;
  const { items } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="stm-breadcrumbs-unit normal_font" data-astro-cid-yl5dypnd> <div class="container" data-astro-cid-yl5dypnd> <div class="navxtBreads" data-astro-cid-yl5dypnd> ${items.map((item, index) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-yl5dypnd": true }, { "default": ($$result2) => renderTemplate`${index > 0 && renderTemplate`<span data-astro-cid-yl5dypnd> &gt; </span>`}${item.url ? renderTemplate`<span data-astro-cid-yl5dypnd> <a${addAttribute(item.url, "href")}${addAttribute(index === items.length - 1 ? "current-item" : "", "class")} data-astro-cid-yl5dypnd> <span data-astro-cid-yl5dypnd>${item.label}</span> </a> </span>` : renderTemplate`<span class="post post-post current-item" data-astro-cid-yl5dypnd>${item.label}</span>`}` })}`)} </div> </div> </div> `;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/news/components/NewsBreadcrumbs.astro", void 0);

export { $$NewsSidebar as $, $$NewsBreadcrumbs as a };
