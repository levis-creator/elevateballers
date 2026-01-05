import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { M as MatchEditor } from '../../../chunks/MatchEditor_H7Iw1NEU.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ssr = false;
const $$New = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Create Match - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "MatchEditor", MatchEditor, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/MatchEditor", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/new.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/new.astro";
const $$url = "/admin/matches/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
