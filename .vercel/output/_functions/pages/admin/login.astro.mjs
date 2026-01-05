import { e as createComponent, f as createAstro, l as renderHead, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, c as checkAuth } from '../../chunks/button_3jlkDYpB.mjs';
import { I as Input } from '../../chunks/input_CvRJCwEH.mjs';
import { L as Label } from '../../chunks/label_D6wxqIUX.mjs';
import { C as Card, a as CardHeader, d as CardContent } from '../../chunks/card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_BybTPb4q.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

function LoginForm() {
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        Basketball: mod.Basketball,
        Mail: mod.Mail,
        Lock: mod.Lock,
        ArrowRight: mod.ArrowRight,
        ArrowLeft: mod.ArrowLeft,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2
      });
    });
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }
      window.location.href = "/admin";
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const BasketballIcon = icons.Basketball;
  const MailIcon = icons.Mail;
  const LockIcon = icons.Lock;
  const ArrowRightIcon = icons.ArrowRight;
  const ArrowLeftIcon = icons.ArrowLeft;
  const AlertCircleIcon = icons.AlertCircle;
  const Loader2Icon = icons.Loader2;
  return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "text-center space-y-4 pb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg", children: BasketballIcon ? /* @__PURE__ */ jsx(BasketballIcon, { size: 40 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-heading font-semibold mb-2 text-foreground tracking-wide", children: "ELEVATE BALLERS" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Admin Login" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { className: "h-4 w-4" }) : null,
        /* @__PURE__ */ jsx(AlertDescription, { children: error })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", className: "text-sm font-semibold", children: "Email Address" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            MailIcon ? /* @__PURE__ */ jsx(MailIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }) : null,
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "email",
                id: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                required: true,
                disabled: loading,
                placeholder: "admin@elevateballers.com",
                autoComplete: "email",
                className: "pl-10"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", className: "text-sm font-semibold", children: "Password" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            LockIcon ? /* @__PURE__ */ jsx(LockIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }) : null,
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "password",
                id: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                required: true,
                disabled: loading,
                placeholder: "Enter your password",
                autoComplete: "current-password",
                className: "pl-10"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full uppercase tracking-wide",
            disabled: loading,
            size: "lg",
            children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              Loader2Icon ? /* @__PURE__ */ jsx(Loader2Icon, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
              "Signing in..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Sign In",
              ArrowRightIcon ? /* @__PURE__ */ jsx(ArrowRightIcon, { className: "ml-2 h-4 w-4" }) : null
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-6 border-t text-center", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/",
          className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors",
          children: [
            ArrowLeftIcon ? /* @__PURE__ */ jsx(ArrowLeftIcon, { className: "h-4 w-4" }) : null,
            /* @__PURE__ */ jsx("span", { children: "Back to website" })
          ]
        }
      ) })
    ] })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  try {
    const user = await checkAuth(Astro2.request);
    if (user) {
      return Astro2.redirect("/admin", 302);
    }
  } catch (error) {
  }
  return renderTemplate`<html lang="en" data-astro-cid-rf56lckb> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Login - Elevate Ballers CMS</title><!-- Website Fonts --><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Rubik:regular,bold|Teko:regular,700,300,400,500,600"><link rel="stylesheet" href="/css/fontawesome.min.css"><link rel="stylesheet" href="/css/bootstrap.min.css"><!-- Favicon --><link rel="icon" href="/images/Elevate_Icon-32x32.png" sizes="32x32">${renderHead()}</head> <body data-astro-cid-rf56lckb> <div class="login-wrapper" data-astro-cid-rf56lckb> ${renderComponent($$result, "LoginForm", LoginForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/LoginForm", "client:component-export": "default", "data-astro-cid-rf56lckb": true })} </div> </body></html>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/login.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
