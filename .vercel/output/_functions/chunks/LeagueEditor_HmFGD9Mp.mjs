import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from './button_3jlkDYpB.mjs';
import { I as Input } from './input_CvRJCwEH.mjs';
import { L as Label } from './label_D6wxqIUX.mjs';
import { T as Textarea } from './textarea_BFwVsse-.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from './alert_BybTPb4q.mjs';
import { S as Skeleton } from './skeleton_C2i3ZiV1.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from './select_bSb7V2co.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function LeagueEditor({ leagueId }) {
  const [loading, setLoading] = useState(!!leagueId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    active: true
  });
  useEffect(() => {
    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);
  const fetchLeague = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error("Failed to fetch league");
      const league = await response.json();
      setFormData({
        name: league.name,
        slug: league.slug,
        description: league.description || "",
        logo: league.logo || "",
        active: league.active
      });
    } catch (err) {
      setError(err.message || "Failed to load league");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = leagueId ? `/api/leagues/${leagueId}` : "/api/leagues";
      const method = leagueId ? "PUT" : "POST";
      const payload = {
        name: formData.name,
        slug: formData.slug || void 0,
        description: formData.description || void 0,
        logo: formData.logo || void 0,
        active: formData.active
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
        throw new Error(errorData.error || "Failed to save league");
      }
      window.location.href = "/admin/leagues";
    } catch (err) {
      setError(err.message || "Failed to save league");
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
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: leagueId ? "Edit League" : "Create New League" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: leagueId ? "Update league information" : "Create a new league" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/leagues", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to List"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "League Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Enter the details for this league" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "name", children: [
                "League Name ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "name",
                  type: "text",
                  value: formData.name,
                  onChange: (e) => setFormData((prev) => ({ ...prev, name: e.target.value })),
                  required: true,
                  disabled: saving,
                  placeholder: "League name"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "slug", children: "Slug" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "slug",
                  type: "text",
                  value: formData.slug,
                  onChange: (e) => setFormData((prev) => ({ ...prev, slug: e.target.value })),
                  placeholder: "Auto-generated from name",
                  disabled: saving
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Leave empty to auto-generate from name" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: "Description" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "description",
                rows: 4,
                value: formData.description,
                onChange: (e) => setFormData((prev) => ({ ...prev, description: e.target.value })),
                disabled: saving,
                placeholder: "League description"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "logo", children: "Logo URL" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "logo",
                  type: "url",
                  value: formData.logo,
                  onChange: (e) => setFormData((prev) => ({ ...prev, logo: e.target.value })),
                  disabled: saving,
                  placeholder: "https://example.com/logo.png"
                }
              ),
              formData.logo && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: formData.logo,
                  alt: "Logo preview",
                  className: "h-16 w-16 object-contain border rounded",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "active", children: "Status" }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.active ? "true" : "false",
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, active: value === "true" })),
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "active", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "true", children: "Active" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "false", children: "Inactive" })
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          leagueId ? "Update League" : "Create League"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/leagues", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { LeagueEditor as L };
