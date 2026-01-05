import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, u as unescapeHTML } from '../../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { c as checkAuth } from '../../../../chunks/button_DxR-TZtn.mjs';
import { g as getNewsArticleById } from '../../../../chunks/queries_E6Jl_Myi.mjs';
import { r as reverseCategoryMap } from '../../../../chunks/types_DXfYTmyI.mjs';
import { C as CommentsList } from '../../../../chunks/CommentsList_kC1h_7dG.mjs';
/* empty css                                         */
import { A as ArrowLeft } from '../../../../chunks/arrow-left_ovqvQGFL.mjs';
import { E as ExternalLink } from '../../../../chunks/external-link_Z8TUE5m1.mjs';
import { U as User } from '../../../../chunks/user_DLKEfZuB.mjs';
import { C as Calendar } from '../../../../chunks/calendar_CypXdtAa.mjs';
export { renderers } from '../../../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
async function getStaticPaths() {
  return [];
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const user = await checkAuth(Astro2.request);
  if (!user) {
    return Astro2.redirect("/admin/login", 302);
  }
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/admin/news", 302);
  }
  let article;
  try {
    article = await getNewsArticleById(id);
    if (!article) {
      return Astro2.redirect("/admin/news", 302);
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    return Astro2.redirect("/admin/news", 302);
  }
  const category = reverseCategoryMap[article.category] || article.category;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;
  const getCategoryColor = (cat) => {
    const colors = {
      "Interviews": "#667eea",
      "Championships": "#f5576c",
      "Match report": "#4facfe",
      "Analysis": "#43e97b"
    };
    return colors[cat] || "#64748b";
  };
  const categoryColor = getCategoryColor(category);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": `${article.title} - View Article`, "data-astro-cid-wxu4laef": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="article-view-container" data-astro-cid-wxu4laef> <div class="article-view-header" data-astro-cid-wxu4laef> <a href="/admin/news" class="back-link" data-astro-prefetch data-astro-cid-wxu4laef> ${renderComponent($$result2, "ArrowLeft", ArrowLeft, { "size": 18, "data-astro-cid-wxu4laef": true })} <span data-astro-cid-wxu4laef>Back to Articles</span> </a> <div class="article-actions" data-astro-cid-wxu4laef> <a${addAttribute(`/admin/news/${id}`, "href")} class="btn-primary-action" data-astro-prefetch data-astro-cid-wxu4laef> <span data-astro-cid-wxu4laef>Edit Article</span> </a> ${article.published && renderTemplate`<a${addAttribute(`/news/${article.slug}`, "href")} class="btn-secondary-action" target="_blank" rel="noopener noreferrer" data-astro-cid-wxu4laef> ${renderComponent($$result2, "ExternalLink", ExternalLink, { "size": 18, "data-astro-cid-wxu4laef": true })} <span data-astro-cid-wxu4laef>View Public</span> </a>`} </div> </div> <article class="article-content" data-astro-cid-wxu4laef> <header class="article-header" data-astro-cid-wxu4laef> <div class="article-meta" data-astro-cid-wxu4laef> <span class="category-badge"${addAttribute(`background-color: ${categoryColor}`, "style")} data-astro-cid-wxu4laef> ${category} </span> ${article.published ? renderTemplate`<span class="status-badge published" data-astro-cid-wxu4laef>Published</span>` : renderTemplate`<span class="status-badge draft" data-astro-cid-wxu4laef>Draft</span>`} </div> <h1 class="article-title" data-astro-cid-wxu4laef>${article.title}</h1> ${article.excerpt && renderTemplate`<p class="article-excerpt" data-astro-cid-wxu4laef>${article.excerpt}</p>`} <div class="article-info" data-astro-cid-wxu4laef> <div class="article-info-item" data-astro-cid-wxu4laef> ${renderComponent($$result2, "User", User, { "size": 16, "data-astro-cid-wxu4laef": true })} <span data-astro-cid-wxu4laef>${article.author.name}</span> </div> ${publishedDate && renderTemplate`<div class="article-info-item" data-astro-cid-wxu4laef> ${renderComponent($$result2, "Calendar", Calendar, { "size": 16, "data-astro-cid-wxu4laef": true })} <span data-astro-cid-wxu4laef>${publishedDate}</span> </div>`} </div> </header> ${article.image && renderTemplate`<div class="article-image" data-astro-cid-wxu4laef> <img${addAttribute(article.image, "src")}${addAttribute(article.title, "alt")} data-astro-cid-wxu4laef> </div>`} <div class="article-body" data-astro-cid-wxu4laef>${unescapeHTML(article.content)}</div> </article> <div class="comments-section-wrapper" data-astro-cid-wxu4laef> ${renderComponent($$result2, "CommentsList", CommentsList, { "client:load": true, "articleId": article.id, "showForm": true, "admin": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/comments/components/CommentsList", "client:component-export": "default", "data-astro-cid-wxu4laef": true })} </div> </div>  ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/news/view/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/news/view/[id].astro";
const $$url = "/admin/news/view/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
