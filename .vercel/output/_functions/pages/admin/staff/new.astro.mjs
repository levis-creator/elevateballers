import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_D0bLXC3H.mjs';
import { S as StaffEditor } from '../../../chunks/StaffEditor_CQAtrT8A.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ssr = false;
const $$New = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Create Staff Member - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "StaffEditor", StaffEditor, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/StaffEditor", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/staff/new.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/staff/new.astro";
const $$url = "/admin/staff/new";

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
