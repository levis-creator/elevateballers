import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { T as TeamEditor } from '../../../chunks/TeamEditor_QMIp8qeu.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ssr = false;
const $$New = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Create Team - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "TeamEditor", TeamEditor, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/TeamEditor", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/new.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/new.astro";
const $$url = "/admin/teams/new";

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
