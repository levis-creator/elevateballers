import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from './button_3jlkDYpB.mjs';
import { I as Input } from './input_CvRJCwEH.mjs';
import { L as Label } from './label_D6wxqIUX.mjs';
import { T as Textarea } from './textarea_BFwVsse-.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from './alert_BybTPb4q.mjs';
import { S as Skeleton } from './skeleton_C2i3ZiV1.mjs';
import { U as Users } from './users_DWQa4V8L.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { I as Info } from './info_F6n9v9tm.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function TeamEditor({ teamId }) {
  const [loading, setLoading] = useState(!!teamId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    description: ""
  });
  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) throw new Error("Failed to fetch team");
      const team = await response.json();
      setFormData({
        name: team.name,
        logo: team.logo || "",
        description: team.description || ""
      });
    } catch (err) {
      setError(err.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const url = teamId ? `/api/teams/${teamId}` : "/api/teams";
      const method = teamId ? "PUT" : "POST";
      const payload = {
        name: formData.name.trim(),
        logo: formData.logo.trim() || void 0,
        description: formData.description.trim() || void 0
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
        throw new Error(errorData.error || "Failed to save team");
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/teams";
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save team");
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
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Users, { className: "h-8 w-8" }),
          teamId ? "Edit Team" : "Create New Team"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: teamId ? "Update team details and information" : "Add a new team to your site" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/teams", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to List"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Error:" }),
        " ",
        error
      ] })
    ] }),
    success && /* @__PURE__ */ jsxs(Alert, { className: "border-green-500 bg-green-50 text-green-900", children: [
      /* @__PURE__ */ jsx(CircleCheckBig, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Success!" }),
        " Team saved successfully! Redirecting..."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Basic Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Enter the team's details" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "name", children: [
              "Team Name ",
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
                placeholder: "Enter team name"
              }
            )
          ] }),
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
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "URL to the team's logo image"
            ] }),
            formData.logo && /* @__PURE__ */ jsx("div", { className: "mt-2 border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: formData.logo,
                alt: "Preview",
                className: "w-full max-h-[300px] object-contain",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ) })
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
                placeholder: "Enter team description"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Brief description of the team" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          teamId ? "Update Team" : "Create Team"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/teams", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { TeamEditor as T };
