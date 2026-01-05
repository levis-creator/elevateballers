import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from './button_3jlkDYpB.mjs';
import { I as Input } from './input_CvRJCwEH.mjs';
import { L as Label } from './label_D6wxqIUX.mjs';
import { T as Textarea } from './textarea_BFwVsse-.mjs';
import { C as Checkbox } from './checkbox_C7bd-LNY.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from './alert_BybTPb4q.mjs';
import { S as Skeleton } from './skeleton_C2i3ZiV1.mjs';
import './separator_BhKCbN7J.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function PageContentEditor({ pageId }) {
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    published: true
  });
  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);
  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) throw new Error("Failed to fetch page");
      const page = await response.json();
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle || "",
        metaDescription: page.metaDescription || "",
        published: page.published
      });
    } catch (err) {
      setError(err.message || "Failed to load page");
    } finally {
      setLoading(false);
    }
  };
  const handleSlugChange = (slug) => {
    const newSlug = slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setFormData((prev2) => ({ ...prev2, slug: newSlug }));
  };
  const handleTitleChange = (title) => {
    setFormData((prev2) => ({ ...prev2, title }));
    if (!prev.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setFormData((prev2) => ({ ...prev2, slug }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const url = pageId ? `/api/pages/${pageId}` : "/api/pages";
      const method = pageId ? "PUT" : "POST";
      const payload = {
        ...formData,
        metaTitle: formData.metaTitle || void 0,
        metaDescription: formData.metaDescription || void 0
      };
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save page");
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/pages";
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: pageId ? "Edit Page" : "Create New Page" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: pageId ? "Update page content and settings" : "Create a new static page" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/pages", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to List"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    success && /* @__PURE__ */ jsxs(Alert, { className: "border-green-500 bg-green-50 text-green-900", children: [
      /* @__PURE__ */ jsx(CircleCheckBig, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "Page saved successfully! Redirecting..." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Basic Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Page title, slug, and content" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "title", children: [
              "Title ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "title",
                type: "text",
                value: formData.title,
                onChange: (e) => handleTitleChange(e.target.value),
                required: true,
                disabled: saving,
                placeholder: "Page Title"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "slug", children: [
              "Slug (URL) ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "slug",
                type: "text",
                value: formData.slug,
                onChange: (e) => handleSlugChange(e.target.value),
                required: true,
                disabled: saving || !!pageId,
                placeholder: "page-url-slug"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "URL-friendly identifier. Auto-generated from title if left empty. Cannot be changed after creation." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "content", children: [
              "Content ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "content",
                rows: 15,
                value: formData.content,
                onChange: (e) => setFormData((prev2) => ({ ...prev2, content: e.target.value })),
                required: true,
                disabled: saving,
                placeholder: "Page content (HTML supported)",
                className: "font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Full page content. HTML is supported." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "SEO & Metadata" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Search engine optimization settings" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "metaTitle", children: "Meta Title" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "metaTitle",
                type: "text",
                value: formData.metaTitle,
                onChange: (e) => setFormData((prev2) => ({ ...prev2, metaTitle: e.target.value })),
                disabled: saving,
                placeholder: "SEO title (optional)"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Used for search engines. If empty, page title will be used." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "metaDescription", children: "Meta Description" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "metaDescription",
                rows: 3,
                value: formData.metaDescription,
                onChange: (e) => setFormData((prev2) => ({ ...prev2, metaDescription: e.target.value })),
                disabled: saving,
                placeholder: "SEO description (optional)"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Brief description for search engines (150-160 characters recommended)." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Publishing" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Control page visibility" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              id: "published",
              checked: formData.published,
              onCheckedChange: (checked) => setFormData((prev2) => ({ ...prev2, published: checked })),
              disabled: saving
            }
          ),
          /* @__PURE__ */ jsx(
            Label,
            {
              htmlFor: "published",
              className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Publish this page" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal", children: "Make it visible on the website" })
              ] })
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          pageId ? "Update Page" : "Create Page"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/pages", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { PageContentEditor as P };
