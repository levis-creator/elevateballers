import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CR5Hf1uL.mjs';
import { B as Button, c as checkAuth } from '../../chunks/button_3jlkDYpB.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent, e as CardFooter } from '../../chunks/card_BDBbvm8z.mjs';
import { I as Input } from '../../chunks/input_CvRJCwEH.mjs';
import { L as Label } from '../../chunks/label_D6wxqIUX.mjs';
import { T as Textarea } from '../../chunks/textarea_BFwVsse-.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_bSb7V2co.mjs';
import { C as CircleCheckBig } from '../../chunks/circle-check-big_DAQePOmR.mjs';
import { C as CircleAlert } from '../../chunks/circle-alert_Kho7_Jh4.mjs';
import { I as Info } from '../../chunks/info_F6n9v9tm.mjs';
export { renderers } from '../../renderers.mjs';

function UITest() {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [selectValue, setSelectValue] = useState("");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 p-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2", children: "shadcn/ui Components Test" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "This page tests all core shadcn/ui components to ensure they work correctly with the admin portal design system." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Buttons" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Test all button variants and sizes" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsx(Button, { variant: "default", children: "Default Button" }),
          /* @__PURE__ */ jsx(Button, { variant: "secondary", children: "Secondary Button" }),
          /* @__PURE__ */ jsx(Button, { variant: "destructive", children: "Destructive Button" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Outline Button" }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", children: "Ghost Button" }),
          /* @__PURE__ */ jsx(Button, { variant: "link", children: "Link Button" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", children: "Small" }),
          /* @__PURE__ */ jsx(Button, { size: "default", children: "Default" }),
          /* @__PURE__ */ jsx(Button, { size: "lg", children: "Large" }),
          /* @__PURE__ */ jsx(Button, { size: "icon", children: /* @__PURE__ */ jsx(CircleCheckBig, {}) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsx(Button, { disabled: true, children: "Disabled" }),
          /* @__PURE__ */ jsx(Button, { variant: "default", disabled: true, children: "Disabled Default" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Form Inputs" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Test input, textarea, label, and select components" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "test-input", children: "Text Input" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "test-input",
              placeholder: "Enter text here...",
              value: inputValue,
              onChange: (e) => setInputValue(e.target.value)
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Value: ",
            inputValue || "(empty)"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "test-textarea", children: "Textarea" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "test-textarea",
              placeholder: "Enter multiple lines here...",
              value: textareaValue,
              onChange: (e) => setTextareaValue(e.target.value),
              rows: 4
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Value: ",
            textareaValue || "(empty)"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "test-select", children: "Select" }),
          /* @__PURE__ */ jsxs(Select, { value: selectValue, onValueChange: setSelectValue, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { id: "test-select", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select an option" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "option1", children: "Option 1" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "option2", children: "Option 2" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "option3", children: "Option 3" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Selected: ",
            selectValue || "(none)"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "disabled-input", children: "Disabled Input" }),
          /* @__PURE__ */ jsx(Input, { id: "disabled-input", placeholder: "Disabled input", disabled: true })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Card Components" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Test card structure and variants" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Card Title" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "Card description text" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { children: "This is the card content area." }) }),
          /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "Action" }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Another Card" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "With different content" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { children: "More card content here." }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Color Verification" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Verify that colors match the admin design system" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-md bg-primary" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Primary Color" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Should be #dd3333 (red)" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-md bg-destructive" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Destructive Color" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Should be #ef4444 (error red)" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-md bg-secondary" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Secondary Color" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Should be #f3f4f6 (gray-100)" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Font Verification" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Verify that fonts match the admin design system" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-heading font-semibold mb-2", children: "Heading Font (Teko)" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This heading should use Teko font" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-sans mb-2", children: "Body Font (Rubik)" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground font-sans", children: "This paragraph should use Rubik font for body text." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Status Indicators" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Test icons and status displays" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-primary", children: [
          /* @__PURE__ */ jsx(CircleCheckBig, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { children: "Success" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-destructive", children: [
          /* @__PURE__ */ jsx(CircleAlert, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { children: "Error" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Info, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { children: "Info" })
        ] })
      ] }) })
    ] })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
const $$TestUi = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$TestUi;
  const user = await checkAuth(Astro2.request);
  if (!user) {
    return Astro2.redirect("/admin/login", 302);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "UI Components Test - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "UITest", UITest, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/UITest", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/test-ui.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/test-ui.astro";
const $$url = "/admin/test-ui";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TestUi,
  file: $$file,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
