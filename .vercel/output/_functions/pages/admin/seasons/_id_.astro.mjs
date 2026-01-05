import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { S as SeasonEditor } from '../../../chunks/SeasonEditor_CE7AGri0.mjs';
import { c as checkAuth } from '../../../chunks/button_DxR-TZtn.mjs';
export { renderers } from '../../../renderers.mjs';

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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Edit Season - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "SeasonEditor", SeasonEditor, { "seasonId": id, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/SeasonEditor", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/seasons/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/seasons/[id].astro";
const $$url = "/admin/seasons/[id]";

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
