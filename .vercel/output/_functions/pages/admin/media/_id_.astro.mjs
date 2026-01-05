import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { M as MediaEditor } from '../../../chunks/MediaEditor_CrISbhjm.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
async function getStaticPaths() {
  return [];
}
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Edit Media - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "MediaEditor", MediaEditor, { "mediaId": id, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/MediaEditor", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/media/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/media/[id].astro";
const $$url = "/admin/media/[id]";

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
