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
import { U as User } from './user_DLKEfZuB.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { C as CircleX } from './circle-x_CLDofPCu.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { I as Info } from './info_F6n9v9tm.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function PlayerEditor({ playerId }) {
  const [loading, setLoading] = useState(!!playerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [teams, setTeams] = useState([]);
  const [playerApproved, setPlayerApproved] = useState(null);
  const [approving, setApproving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    image: "",
    bio: "",
    teamId: "",
    position: "",
    jerseyNumber: "",
    stats: ""
  });
  useEffect(() => {
    fetchTeams();
    if (playerId) {
      fetchPlayer();
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const teamIdFromUrl = urlParams.get("teamId");
      if (teamIdFromUrl) {
        setFormData((prev) => ({ ...prev, teamId: teamIdFromUrl }));
      }
    }
  }, [playerId]);
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };
  const fetchPlayer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error("Failed to fetch player");
      const player = await response.json();
      setFormData({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        height: player.height || "",
        weight: player.weight || "",
        image: player.image || "",
        bio: player.bio || "",
        teamId: player.teamId || player.team?.id || "",
        position: player.position || "",
        jerseyNumber: player.jerseyNumber?.toString() || "",
        stats: player.stats ? JSON.stringify(player.stats, null, 2) : ""
      });
      setPlayerApproved(player.approved ?? false);
    } catch (err) {
      setError(err.message || "Failed to load player");
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
      const url = playerId ? `/api/players/${playerId}` : "/api/players";
      const method = playerId ? "PUT" : "POST";
      let stats = null;
      if (formData.stats.trim()) {
        try {
          stats = JSON.parse(formData.stats);
        } catch {
          throw new Error("Invalid JSON in stats field");
        }
      }
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        height: formData.height.trim() || void 0,
        weight: formData.weight.trim() || void 0,
        image: formData.image.trim() || void 0,
        bio: formData.bio.trim() || void 0,
        teamId: formData.teamId || void 0,
        position: formData.position || void 0,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : void 0,
        stats
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
        throw new Error(errorData.error || "Failed to save player");
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/players";
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save player");
    } finally {
      setSaving(false);
    }
  };
  const handleApprovePlayer = async (approved) => {
    if (!playerId) return;
    setApproving(true);
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update approval status" }));
        throw new Error(errorData.error || "Failed to update approval status");
      }
      const updatedPlayer = await response.json();
      setPlayerApproved(updatedPlayer.approved);
    } catch (err) {
      alert("Error updating approval status: " + err.message);
    } finally {
      setApproving(false);
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
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold text-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(User, { className: "h-8 w-8" }),
            playerId ? "Edit Player" : "Create New Player"
          ] }),
          playerId && playerApproved !== null && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: playerApproved ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 text-sm font-medium", children: [
            /* @__PURE__ */ jsx(CircleCheckBig, { className: "h-3 w-3" }),
            "Approved"
          ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm font-medium", children: [
            /* @__PURE__ */ jsx(CircleX, { className: "h-3 w-3" }),
            "Pending Approval"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: playerId ? "Update player details and information" : "Add a new player to your organization" }),
        playerId && playerApproved !== null && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-3", children: playerApproved ? /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handleApprovePlayer(false),
            disabled: approving,
            className: "text-red-600 hover:text-red-700 hover:bg-red-50",
            children: approving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Updating..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CircleX, { className: "mr-2 h-4 w-4" }),
              "Reject Player"
            ] })
          }
        ) : /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => handleApprovePlayer(true),
            disabled: approving,
            className: "bg-green-500 hover:bg-green-600 text-white",
            children: approving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Approving..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CircleCheckBig, { className: "mr-2 h-4 w-4" }),
              "Approve Player"
            ] })
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/players", "data-astro-prefetch": true, children: [
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
        " Player saved successfully! Redirecting..."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Basic Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Enter the player's personal details" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "firstName", children: [
                "First Name ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "firstName",
                  type: "text",
                  value: formData.firstName,
                  onChange: (e) => setFormData((prev) => ({ ...prev, firstName: e.target.value })),
                  required: true,
                  disabled: saving,
                  placeholder: "John"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "lastName", children: [
                "Last Name ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "lastName",
                  type: "text",
                  value: formData.lastName,
                  onChange: (e) => setFormData((prev) => ({ ...prev, lastName: e.target.value })),
                  required: true,
                  disabled: saving,
                  placeholder: "Doe"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "height", children: "Height" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "height",
                  type: "text",
                  value: formData.height,
                  onChange: (e) => setFormData((prev) => ({ ...prev, height: e.target.value })),
                  disabled: saving,
                  placeholder: `6'2"`
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
                `Enter height in feet and inches format (e.g., 6'2" or 5'10")`
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "weight", children: "Weight" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "weight",
                  type: "text",
                  value: formData.weight,
                  onChange: (e) => setFormData((prev) => ({ ...prev, weight: e.target.value })),
                  disabled: saving,
                  placeholder: "84 kg"
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
                "Enter weight with unit (e.g., 84 kg or 185 lbs)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "image", children: "Image URL" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "image",
                type: "url",
                value: formData.image,
                onChange: (e) => setFormData((prev) => ({ ...prev, image: e.target.value })),
                disabled: saving,
                placeholder: "https://example.com/image.jpg"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "URL to the player's photo"
            ] }),
            formData.image && /* @__PURE__ */ jsx("div", { className: "mt-2 border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: formData.image,
                alt: "Preview",
                className: "w-full max-h-[300px] object-contain",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Team & Position" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Team assignment and playing position" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "teamId", children: "Team" }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.teamId || "__none",
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, teamId: value === "__none" ? "" : value })),
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "__none", children: "No team" }),
                      teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "position", children: "Position" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "position",
                  type: "text",
                  value: formData.position,
                  onChange: (e) => setFormData((prev) => ({ ...prev, position: e.target.value })),
                  disabled: saving,
                  placeholder: "e.g., Point Guard, Center"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "jerseyNumber", children: "Jersey Number" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "jerseyNumber",
                type: "number",
                value: formData.jerseyNumber,
                onChange: (e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value })),
                disabled: saving,
                placeholder: "23",
                min: "0",
                max: "99"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Biography & Stats" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Player biography and statistics" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "bio", children: "Bio" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "bio",
                rows: 6,
                value: formData.bio,
                onChange: (e) => setFormData((prev) => ({ ...prev, bio: e.target.value })),
                disabled: saving,
                placeholder: "Enter player's biography"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "stats", children: "Stats (JSON)" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "stats",
                rows: 8,
                value: formData.stats,
                onChange: (e) => setFormData((prev) => ({ ...prev, stats: e.target.value })),
                disabled: saving,
                placeholder: '{"points": 25.5, "rebounds": 8.2, "assists": 6.1}',
                className: "font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "Enter player statistics as valid JSON format"
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
          playerId ? "Update Player" : "Create Player"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/players", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { PlayerEditor as P };
