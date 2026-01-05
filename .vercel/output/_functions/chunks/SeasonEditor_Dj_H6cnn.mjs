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

function SeasonEditor({ seasonId }) {
  const [loading, setLoading] = useState(!!seasonId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    leagueId: "",
    active: true
  });
  useEffect(() => {
    fetchLeagues();
    if (seasonId) {
      fetchSeason();
    }
  }, [seasonId]);
  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (!response.ok) throw new Error("Failed to fetch leagues");
      const data = await response.json();
      setLeagues(data);
    } catch (err) {
      console.error("Error fetching leagues:", err);
    }
  };
  const fetchSeason = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (!response.ok) throw new Error("Failed to fetch season");
      const season = await response.json();
      const seasonWithLeague = season;
      setFormData({
        name: season.name,
        slug: season.slug,
        description: season.description || "",
        startDate: new Date(season.startDate).toISOString().slice(0, 10),
        endDate: new Date(season.endDate).toISOString().slice(0, 10),
        leagueId: seasonWithLeague.league?.id || season.leagueId || "",
        active: season.active
      });
    } catch (err) {
      setError(err.message || "Failed to load season");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = seasonId ? `/api/seasons/${seasonId}` : "/api/seasons";
      const method = seasonId ? "PUT" : "POST";
      const payload = {
        ...formData,
        slug: formData.slug || void 0,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        leagueId: formData.leagueId
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
        throw new Error(errorData.error || "Failed to save season");
      }
      window.location.href = "/admin/seasons";
    } catch (err) {
      setError(err.message || "Failed to save season");
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
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: seasonId ? "Edit Season" : "Create New Season" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: seasonId ? "Update season information" : "Create a new season" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/seasons", "data-astro-prefetch": true, children: [
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
          /* @__PURE__ */ jsx(CardTitle, { children: "Season Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Enter the details for this season" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "name", children: [
                "Season Name ",
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
                  placeholder: "e.g., 2024-2025"
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
                placeholder: "Season description"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "leagueId", children: [
                "League ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.leagueId,
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, leagueId: value })),
                  required: true,
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "leagueId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a league" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: leagues.map((league) => /* @__PURE__ */ jsx(SelectItem, { value: league.id, children: league.name }, league.id)) })
                  ]
                }
              )
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
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "startDate", children: [
                "Start Date ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "startDate",
                  type: "date",
                  value: formData.startDate,
                  onChange: (e) => setFormData((prev) => ({ ...prev, startDate: e.target.value })),
                  required: true,
                  disabled: saving
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "endDate", children: [
                "End Date ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "endDate",
                  type: "date",
                  value: formData.endDate,
                  onChange: (e) => setFormData((prev) => ({ ...prev, endDate: e.target.value })),
                  required: true,
                  disabled: saving
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
          seasonId ? "Update Season" : "Create Season"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/seasons", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { SeasonEditor as S };
