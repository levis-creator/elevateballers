import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../../chunks/AdminLayout_D0bLXC3H.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, c as checkAuth } from '../../../../chunks/button_DxR-TZtn.mjs';
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from '../../../../chunks/card_DX9qAu4V.mjs';
import { B as Badge } from '../../../../chunks/badge_C5xe3ZDQ.mjs';
import { A as Alert, a as AlertDescription } from '../../../../chunks/alert_CgE87Iz8.mjs';
import { S as Skeleton } from '../../../../chunks/skeleton_D7y0o7ki.mjs';
import { I as Input } from '../../../../chunks/input_wveC5Rbb.mjs';
import { L as Label } from '../../../../chunks/label_C2DF_yw8.mjs';
import { T as Textarea } from '../../../../chunks/textarea_carRDR8N.mjs';
import { C as Checkbox } from '../../../../chunks/checkbox_cybCsVj1.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../../../chunks/select_CrEDKzBG.mjs';
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../../../chunks/dialog_6FGgIDl3.mjs';
import { g as getTeam1Name, a as getTeam1Logo, b as getTeam2Name, c as getTeam2Logo, d as getLeagueName, e as getTeam1Id, f as getTeam2Id } from '../../../../chunks/league-helpers_BQcVt2so.mjs';
export { renderers } from '../../../../renderers.mjs';

function AddNewPlayerModal({
  team1Id,
  team2Id,
  isOpen,
  onClose,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    image: "",
    bio: "",
    teamId: "",
    position: "",
    jerseyNumber: ""
  });
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2
      });
    });
  }, []);
  useEffect(() => {
    if (isOpen) {
      fetchMatchTeams();
      setFormData({
        firstName: "",
        lastName: "",
        height: "",
        weight: "",
        image: "",
        bio: "",
        teamId: "",
        position: "",
        jerseyNumber: ""
      });
      setError("");
    }
  }, [isOpen, team1Id, team2Id]);
  const fetchMatchTeams = async () => {
    try {
      if (team1Id || team2Id) {
        const teamPromises = [];
        if (team1Id) {
          teamPromises.push(fetch(`/api/teams/${team1Id}`).then((res) => res.ok ? res.json() : null));
        }
        if (team2Id) {
          teamPromises.push(fetch(`/api/teams/${team2Id}`).then((res) => res.ok ? res.json() : null));
        }
        const fetchedTeams = await Promise.all(teamPromises);
        const validTeams = fetchedTeams.filter((team) => team !== null);
        setTeams(validTeams);
        if (validTeams.length > 0) {
          setFormData((prev) => ({ ...prev, teamId: validTeams[0].id }));
        }
      } else {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const allTeams = await response.json();
          setTeams(allTeams);
          if (allTeams.length > 0) {
            setFormData((prev) => ({ ...prev, teamId: allTeams[0].id }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error("First name and last name are required");
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
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : void 0
      };
      console.log("Creating player with data:", payload);
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Include cookies for authentication
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create player:", errorData);
        throw new Error(errorData.error || "Failed to create player");
      }
      const newPlayer = await response.json();
      console.log("Player created successfully:", newPlayer);
      onSuccess(newPlayer);
    } catch (err) {
      setError(err.message || "Failed to create player");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: (open) => {
    if (!open) {
      onClose();
    }
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add New Player" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Create a new player to add to this match." })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      icons.AlertCircle ? /* @__PURE__ */ jsx(icons.AlertCircle, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "new-player-firstName", children: [
            "First Name ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "new-player-firstName",
              type: "text",
              value: formData.firstName,
              onChange: (e) => setFormData((prev) => ({ ...prev, firstName: e.target.value })),
              required: true,
              placeholder: "John"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "new-player-lastName", children: [
            "Last Name ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "new-player-lastName",
              type: "text",
              value: formData.lastName,
              onChange: (e) => setFormData((prev) => ({ ...prev, lastName: e.target.value })),
              required: true,
              placeholder: "Doe"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-height", children: "Height" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "new-player-height",
              type: "text",
              value: formData.height,
              onChange: (e) => setFormData((prev) => ({ ...prev, height: e.target.value })),
              placeholder: `6'2"`
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-weight", children: "Weight" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "new-player-weight",
              type: "text",
              value: formData.weight,
              onChange: (e) => setFormData((prev) => ({ ...prev, weight: e.target.value })),
              placeholder: "84 kg"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-image", children: "Image URL" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "new-player-image",
            type: "url",
            value: formData.image,
            onChange: (e) => setFormData((prev) => ({ ...prev, image: e.target.value })),
            placeholder: "https://example.com/image.jpg"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-bio", children: "Bio" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "new-player-bio",
            value: formData.bio,
            onChange: (e) => setFormData((prev) => ({ ...prev, bio: e.target.value })),
            placeholder: "Player biography...",
            rows: 3
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-teamId", children: "Team" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.teamId || void 0,
              onValueChange: (value) => setFormData((prev) => ({ ...prev, teamId: value })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "new-player-teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-position", children: "Position" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.position || void 0,
              onValueChange: (value) => setFormData((prev) => ({ ...prev, position: value })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "new-player-position", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select position" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "PG", children: "Point Guard (PG)" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "SG", children: "Shooting Guard (SG)" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "SF", children: "Small Forward (SF)" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "PF", children: "Power Forward (PF)" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "C", children: "Center (C)" })
                ] })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "new-player-jerseyNumber", children: "Jersey #" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "new-player-jerseyNumber",
            type: "number",
            value: formData.jerseyNumber,
            onChange: (e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value })),
            min: "0",
            max: "99",
            placeholder: "23"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: loading, children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          icons.Loader2 ? /* @__PURE__ */ jsx(icons.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
          "Creating..."
        ] }) : "Create Player" })
      ] })
    ] })
  ] }) });
}

const EVENT_TYPE_LABELS = {
  TWO_POINT_MADE: "2-Point Made",
  TWO_POINT_MISSED: "2-Point Missed",
  THREE_POINT_MADE: "3-Point Made",
  THREE_POINT_MISSED: "3-Point Missed",
  FREE_THROW_MADE: "Free Throw Made",
  FREE_THROW_MISSED: "Free Throw Missed",
  ASSIST: "Assist",
  REBOUND_OFFENSIVE: "Offensive Rebound",
  REBOUND_DEFENSIVE: "Defensive Rebound",
  STEAL: "Steal",
  BLOCK: "Block",
  TURNOVER: "Turnover",
  FOUL_PERSONAL: "Personal Foul",
  FOUL_TECHNICAL: "Technical Foul",
  FOUL_FLAGRANT: "Flagrant Foul",
  SUBSTITUTION_IN: "Sub In",
  SUBSTITUTION_OUT: "Sub Out",
  TIMEOUT: "Timeout",
  INJURY: "Injury",
  OTHER: "Other"
};
function AddMatchEventModal({ matchId, team1Id, team2Id, isOpen, onClose, onSuccess }) {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    eventType: "TWO_POINT_MADE",
    minute: "",
    teamId: "",
    playerId: "",
    assistPlayerId: "",
    description: ""
  });
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Activity: mod.Activity,
        Goal: mod.Goal,
        Square: mod.Square,
        Users: mod.Users,
        Clock: mod.Clock
      });
    });
  }, []);
  useEffect(() => {
    fetchMatchTeams();
  }, [team1Id, team2Id]);
  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    } else {
      setPlayers([]);
    }
  }, [formData.teamId]);
  const fetchMatchTeams = async () => {
    try {
      const teamPromises = [];
      if (team1Id) {
        teamPromises.push(fetch(`/api/teams/${team1Id}`).then((res) => res.ok ? res.json() : null));
      }
      if (team2Id) {
        teamPromises.push(fetch(`/api/teams/${team2Id}`).then((res) => res.ok ? res.json() : null));
      }
      const fetchedTeams = await Promise.all(teamPromises);
      const validTeams = fetchedTeams.filter((team) => team !== null);
      setTeams(validTeams);
      if (validTeams.length > 0) {
        const defaultTeam = team1Id || team2Id || validTeams[0].id;
        setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
      }
    } catch (err) {
      console.error("Failed to fetch match teams:", err);
    }
  };
  const fetchPlayersForTeam = async (teamId) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };
  const needsPlayer = (eventType) => {
    return !["TIMEOUT"].includes(eventType);
  };
  const needsAssist = (eventType) => {
    return ["TWO_POINT_MADE", "THREE_POINT_MADE"].includes(eventType);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          minute: parseInt(formData.minute),
          playerId: formData.playerId || void 0,
          assistPlayerId: formData.assistPlayerId || void 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add event");
      }
      onSuccess();
      setFormData({
        eventType: "TWO_POINT_MADE",
        minute: "",
        teamId: formData.teamId,
        playerId: "",
        assistPlayerId: "",
        description: ""
      });
    } catch (err) {
      setError(err.message || "Failed to add event");
    } finally {
      setLoading(false);
    }
  };
  const EVENT_TYPES = [
    { value: "TWO_POINT_MADE", label: "2-Point Made" },
    { value: "TWO_POINT_MISSED", label: "2-Point Missed" },
    { value: "THREE_POINT_MADE", label: "3-Point Made" },
    { value: "THREE_POINT_MISSED", label: "3-Point Missed" },
    { value: "FREE_THROW_MADE", label: "Free Throw Made" },
    { value: "FREE_THROW_MISSED", label: "Free Throw Missed" },
    { value: "ASSIST", label: "Assist" },
    { value: "REBOUND_OFFENSIVE", label: "Offensive Rebound" },
    { value: "REBOUND_DEFENSIVE", label: "Defensive Rebound" },
    { value: "STEAL", label: "Steal" },
    { value: "BLOCK", label: "Block" },
    { value: "TURNOVER", label: "Turnover" },
    { value: "FOUL_PERSONAL", label: "Personal Foul" },
    { value: "FOUL_TECHNICAL", label: "Technical Foul" },
    { value: "FOUL_FLAGRANT", label: "Flagrant Foul" },
    { value: "SUBSTITUTION_IN", label: "Substitution In" },
    { value: "SUBSTITUTION_OUT", label: "Substitution Out" },
    { value: "TIMEOUT", label: "Timeout" },
    { value: "INJURY", label: "Injury" },
    { value: "OTHER", label: "Other" }
  ];
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: (open) => {
    if (!open) {
      onClose();
    }
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add Match Event" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Record an event that occurred during this match (goal, card, substitution, etc.)." })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      icons.AlertCircle ? /* @__PURE__ */ jsx(icons.AlertCircle, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "modal-eventType", children: [
            "Event Type ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.eventType,
              onValueChange: (value) => setFormData((prev) => ({
                ...prev,
                eventType: value,
                assistPlayerId: ""
              })),
              required: true,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-eventType", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: EVENT_TYPES.map((event) => /* @__PURE__ */ jsx(SelectItem, { value: event.value, children: event.label }, event.value)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "modal-minute", children: [
            icons.Clock ? /* @__PURE__ */ jsx(icons.Clock, { className: "inline h-4 w-4 mr-2" }) : null,
            "Minute ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "modal-minute",
              type: "number",
              value: formData.minute,
              onChange: (e) => setFormData((prev) => ({ ...prev, minute: e.target.value })),
              required: true,
              min: "0",
              max: "120",
              placeholder: "23"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "modal-teamId", children: [
            "Team ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.teamId,
              onValueChange: (value) => {
                setFormData((prev) => ({
                  ...prev,
                  teamId: value,
                  playerId: "",
                  assistPlayerId: ""
                }));
              },
              required: true,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id)) })
              ]
            }
          )
        ] }),
        needsPlayer(formData.eventType) && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "modal-playerId", children: "Player" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.playerId,
              onValueChange: (value) => setFormData((prev) => ({ ...prev, playerId: value })),
              disabled: !formData.teamId,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-playerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a player" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: players.map((player) => /* @__PURE__ */ jsxs(SelectItem, { value: player.id, children: [
                  player.firstName,
                  " ",
                  player.lastName
                ] }, player.id)) })
              ]
            }
          )
        ] })
      ] }),
      needsAssist(formData.eventType) && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "modal-assistPlayerId", children: "Assist Player" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.assistPlayerId || "__none",
            onValueChange: (value) => setFormData((prev) => ({ ...prev, assistPlayerId: value === "__none" ? "" : value })),
            disabled: !formData.teamId,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-assistPlayerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "No assist" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "__none", children: "No assist" }),
                players.map((player) => /* @__PURE__ */ jsxs(SelectItem, { value: player.id, children: [
                  player.firstName,
                  " ",
                  player.lastName
                ] }, player.id))
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "modal-description", children: "Description" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "modal-description",
            rows: 2,
            value: formData.description,
            onChange: (e) => setFormData((prev) => ({ ...prev, description: e.target.value })),
            placeholder: "Additional details about the event..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: loading, children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          icons.Loader2 ? /* @__PURE__ */ jsx(icons.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
          "Adding..."
        ] }) : "Add Event" })
      ] })
    ] })
  ] }) });
}
function AddPlayerModal({ matchId, team1Id, team2Id, existingMatchPlayers = [], isOpen, onClose, onSuccess }) {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddNewPlayerModal, setShowAddNewPlayerModal] = useState(false);
  const [formData, setFormData] = useState({
    playerId: "",
    teamId: "",
    started: false,
    position: "",
    jerseyNumber: "",
    minutesPlayed: ""
  });
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Plus: mod.Plus
      });
    });
  }, []);
  useEffect(() => {
    fetchMatchTeams();
  }, [team1Id, team2Id]);
  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    } else {
      setAvailablePlayers([]);
    }
  }, [formData.teamId, existingMatchPlayers]);
  const fetchMatchTeams = async () => {
    try {
      const teamPromises = [];
      if (team1Id) {
        teamPromises.push(fetch(`/api/teams/${team1Id}`).then((res) => res.ok ? res.json() : null));
      }
      if (team2Id) {
        teamPromises.push(fetch(`/api/teams/${team2Id}`).then((res) => res.ok ? res.json() : null));
      }
      const fetchedTeams = await Promise.all(teamPromises);
      const validTeams = fetchedTeams.filter((team) => team !== null);
      setTeams(validTeams);
      if (validTeams.length > 0) {
        const defaultTeam = team1Id || team2Id || validTeams[0].id;
        setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
      }
    } catch (err) {
      console.error("Failed to fetch match teams:", err);
    }
  };
  const fetchPlayersForTeam = async (teamId) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        const existingPlayerIds = new Set(
          existingMatchPlayers.map((mp) => {
            return mp.playerId || mp.player?.id;
          }).filter((id) => Boolean(id))
        );
        const filteredPlayers = data.filter((player) => !existingPlayerIds.has(player.id));
        setAvailablePlayers(filteredPlayers);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : void 0,
          minutesPlayed: formData.minutesPlayed ? parseInt(formData.minutesPlayed) : void 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add player");
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to add player");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Dialog, { open: isOpen, onOpenChange: (open) => {
    if (!open) {
      onClose();
    }
  }, children: [
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Add Player to Match" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Select a team and player to add to this match." })
      ] }),
      error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        icons.AlertCircle ? /* @__PURE__ */ jsx(icons.AlertCircle, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: error })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "modal-teamId", children: [
            "Team ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.teamId,
              onValueChange: (value) => {
                setFormData((prev) => ({
                  ...prev,
                  teamId: value,
                  playerId: ""
                }));
              },
              required: true,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "modal-playerId", children: [
              "Player ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setShowAddNewPlayerModal(true),
                disabled: !formData.teamId,
                children: [
                  icons.Plus ? /* @__PURE__ */ jsx(icons.Plus, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
                  "Add New Player"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.playerId,
              onValueChange: (value) => setFormData((prev) => ({ ...prev, playerId: value })),
              required: true,
              disabled: !formData.teamId,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-playerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a player" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: availablePlayers.map((player) => /* @__PURE__ */ jsxs(SelectItem, { value: player.id, children: [
                  player.firstName,
                  " ",
                  player.lastName,
                  player.jerseyNumber ? ` (#${player.jerseyNumber})` : ""
                ] }, player.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "modal-position", children: "Position" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.position || void 0,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, position: value })),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "modal-position", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select position (optional)" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "PG", children: "Point Guard (PG)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "SG", children: "Shooting Guard (SG)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "SF", children: "Small Forward (SF)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "PF", children: "Power Forward (PF)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "C", children: "Center (C)" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "modal-jerseyNumber", children: "Jersey #" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "modal-jerseyNumber",
                type: "number",
                value: formData.jerseyNumber,
                onChange: (e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value })),
                min: "0",
                max: "99"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "modal-minutesPlayed", children: "Minutes" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "modal-minutesPlayed",
                type: "number",
                value: formData.minutesPlayed,
                onChange: (e) => setFormData((prev) => ({ ...prev, minutesPlayed: e.target.value })),
                min: "0",
                max: "120"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              id: "modal-started",
              checked: formData.started,
              onCheckedChange: (checked) => setFormData((prev) => ({ ...prev, started: checked === true }))
            }
          ),
          /* @__PURE__ */ jsx(Label, { htmlFor: "modal-started", className: "cursor-pointer", children: "Started" })
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: loading, children: "Cancel" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            icons.Loader2 ? /* @__PURE__ */ jsx(icons.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
            "Adding..."
          ] }) : "Add Player" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      AddNewPlayerModal,
      {
        team1Id,
        team2Id,
        isOpen: showAddNewPlayerModal,
        onClose: () => setShowAddNewPlayerModal(false),
        onSuccess: async (newPlayer) => {
          setShowAddNewPlayerModal(false);
          if (formData.teamId) {
            await fetchPlayersForTeam(formData.teamId);
            setFormData((prev) => ({ ...prev, playerId: newPlayer.id }));
          }
        }
      }
    )
  ] });
}
function MatchDetailView({ matchId, initialMatch }) {
  const [match, setMatch] = useState(
    initialMatch ? { ...initialMatch, matchPlayers: [], events: [] } : null
  );
  const [loading, setLoading] = useState(!initialMatch);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        Calendar: mod.Calendar,
        Clock: mod.Clock,
        Trophy: mod.Trophy,
        Users: mod.Users,
        Activity: mod.Activity,
        Goal: mod.Goal,
        Card: mod.Square,
        Edit: mod.Edit,
        ArrowLeft: mod.ArrowLeft,
        Plus: mod.Plus,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Shirt: mod.Shirt
      });
    });
  }, []);
  useEffect(() => {
    if (matchId) {
      fetchMatch();
    } else {
      setError("Match ID is required");
      setLoading(false);
    }
  }, [matchId]);
  const fetchMatch = async () => {
    if (!matchId) {
      setError("Match ID is required");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch match" }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.id) {
        throw new Error("Invalid match data received");
      }
      const matchData = {
        ...data,
        matchPlayers: data.matchPlayers || [],
        events: data.events || []
      };
      setMatch(matchData);
      setLoading(false);
      setLoadingDetails(true);
      fetchMatchDetails().finally(() => setLoadingDetails(false));
    } catch (err) {
      setError(err.message || "Failed to load match");
      setLoading(false);
    }
  };
  const refreshMatchPlayers = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/players`);
      if (response.ok) {
        const players = await response.json();
        setMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            matchPlayers: players || []
          };
        });
      }
    } catch (err) {
      console.error("Failed to refresh match players:", err);
    }
  };
  const fetchMatchDetails = async () => {
    try {
      const [playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/players`).catch(() => ({ ok: false })),
        fetch(`/api/matches/${matchId}/events`).catch(() => ({ ok: false }))
      ]);
      const players = playersRes.ok && playersRes instanceof Response ? await playersRes.json() : [];
      const events = eventsRes.ok && eventsRes instanceof Response ? await eventsRes.json() : [];
      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matchPlayers: players || [],
          events: events || []
        };
      });
    } catch (err) {
      console.warn("Failed to fetch match details:", err);
    }
  };
  const getPlayersByTeam = (teamId) => {
    if (!match?.matchPlayers) return [];
    return match.matchPlayers.filter((mp) => mp.teamId === teamId);
  };
  const getEventsByTeam = (teamId) => {
    if (!match?.events) return [];
    return match.events.filter((e) => e.teamId === teamId);
  };
  const getStatusVariant = (status) => {
    if (status === "LIVE") return "destructive";
    if (status === "COMPLETED") return "default";
    return "secondary";
  };
  if (loading || !match && !error) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
    ] });
  }
  if (error || !match) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto p-6", children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      icons.AlertCircle ? /* @__PURE__ */ jsx(icons.AlertCircle, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error || "Match not found" })
    ] }) });
  }
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  const leagueName = getLeagueName(match);
  const team1Id = getTeam1Id(match);
  const team2Id = getTeam2Id(match);
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, className: "mb-2", children: /* @__PURE__ */ jsxs("a", { href: "/admin/matches", "data-astro-prefetch": true, children: [
          icons.ArrowLeft ? /* @__PURE__ */ jsx(icons.ArrowLeft, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
          "Back to Matches"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold text-foreground", children: "Match Details" })
      ] }),
      match && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/matches/${matchId}`, "data-astro-prefetch": true, children: [
        icons.Edit ? /* @__PURE__ */ jsx(icons.Edit, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
        "Edit Match"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      icons.AlertCircle ? /* @__PURE__ */ jsx(icons.AlertCircle, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    loadingDetails && /* @__PURE__ */ jsxs(Alert, { children: [
      icons.Loader2 ? /* @__PURE__ */ jsx(icons.Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "Loading players and events..." })
    ] }),
    match && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center", children: [
          team1Logo && /* @__PURE__ */ jsx(
            "img",
            {
              src: team1Logo,
              alt: team1Name,
              className: "w-24 h-24 mx-auto mb-4 object-contain"
            }
          ),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-heading font-semibold mb-2", children: team1Name }),
          match.team1Score !== null && match.team1Score !== void 0 && /* @__PURE__ */ jsx("div", { className: "text-5xl font-bold", children: match.team1Score })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-shrink-0 text-center min-w-[200px]", children: [
          /* @__PURE__ */ jsx(Badge, { variant: getStatusVariant(match.status), className: "mb-4", children: match.status }),
          match.date && /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              icons.Calendar ? /* @__PURE__ */ jsx(icons.Calendar, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
              new Date(match.date).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
              })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              icons.Clock ? /* @__PURE__ */ jsx(icons.Clock, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
              new Date(match.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            ] }),
            leagueName && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              icons.Trophy ? /* @__PURE__ */ jsx(icons.Trophy, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "h-4 w-4" }),
              leagueName
            ] }),
            match.season && /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-85", children: [
              "Season: ",
              match.season.name
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center", children: [
          team2Logo && /* @__PURE__ */ jsx(
            "img",
            {
              src: team2Logo,
              alt: team2Name,
              className: "w-24 h-24 mx-auto mb-4 object-contain"
            }
          ),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-heading font-semibold mb-2", children: team2Name }),
          match.team2Score !== null && match.team2Score !== void 0 && /* @__PURE__ */ jsx("div", { className: "text-5xl font-bold", children: match.team2Score })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            icons.Users ? /* @__PURE__ */ jsx(icons.Users, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx("span", { className: "h-6 w-6" }),
            "Match Players",
            match.matchPlayers && match.matchPlayers.length > 0 && /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [
              "(",
              match.matchPlayers.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => setShowAddPlayerModal(true), children: [
            icons.Plus ? /* @__PURE__ */ jsx(icons.Plus, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
            "Add Player"
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: match.matchPlayers && match.matchPlayers.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          team1Id && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4 pb-2 border-b", children: team1Name }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: getPlayersByTeam(team1Id).map((mp) => /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    mp.player.firstName,
                    " ",
                    mp.player.lastName
                  ] }),
                  mp.jerseyNumber && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                    icons.Shirt ? /* @__PURE__ */ jsx(icons.Shirt, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx("span", { className: "h-3 w-3" }),
                    mp.jerseyNumber
                  ] }),
                  mp.started && /* @__PURE__ */ jsx(Badge, { variant: "default", children: "Started" }),
                  mp.position && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: mp.position }),
                  mp.minutesPlayed !== null && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    mp.minutesPlayed,
                    "'"
                  ] })
                ] })
              },
              mp.id
            )) })
          ] }),
          team2Id && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4 pb-2 border-b", children: team2Name }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: getPlayersByTeam(team2Id).map((mp) => /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    mp.player.firstName,
                    " ",
                    mp.player.lastName
                  ] }),
                  mp.jerseyNumber && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                    icons.Shirt ? /* @__PURE__ */ jsx(icons.Shirt, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx("span", { className: "h-3 w-3" }),
                    mp.jerseyNumber
                  ] }),
                  mp.started && /* @__PURE__ */ jsx(Badge, { variant: "default", children: "Started" }),
                  mp.position && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: mp.position }),
                  mp.minutesPlayed !== null && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    mp.minutesPlayed,
                    "'"
                  ] })
                ] })
              },
              mp.id
            )) })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
          icons.Users ? /* @__PURE__ */ jsx(icons.Users, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground" }) : /* @__PURE__ */ jsx("span", { className: "h-12 w-12 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No players added to this match yet" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx("span", { className: "h-6 w-6" }),
            "Match Events",
            match.events && match.events.length > 0 && /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [
              "(",
              match.events.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => setShowAddEventModal(true), children: [
            icons.Plus ? /* @__PURE__ */ jsx(icons.Plus, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4" }),
            "Add Event"
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: match.events && match.events.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          team1Id && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4 pb-2 border-b", children: team1Name }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: getEventsByTeam(team1Id).map((event) => {
              const getEventColor = () => {
                if (["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE"].includes(event.eventType)) {
                  return "border-green-500 bg-green-50";
                }
                if (["TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED"].includes(event.eventType)) {
                  return "border-orange-500 bg-orange-50";
                }
                if (event.eventType === "FOUL_PERSONAL") return "border-yellow-500 bg-yellow-50";
                if (event.eventType === "FOUL_TECHNICAL") return "border-orange-500 bg-orange-50";
                if (event.eventType === "FOUL_FLAGRANT") return "border-red-500 bg-red-50";
                if (event.eventType === "TURNOVER") return "border-red-500 bg-red-50";
                if (["ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE"].includes(event.eventType)) {
                  return "border-blue-500 bg-blue-50";
                }
                return "border-gray-500 bg-gray-50";
              };
              return /* @__PURE__ */ jsx(
                "div",
                {
                  className: `p-4 border-l-4 rounded-r-lg ${getEventColor()}`,
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    ["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED"].includes(event.eventType) && (icons.Goal ? /* @__PURE__ */ jsx(icons.Goal, { className: "h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    ["FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT"].includes(event.eventType) && (icons.Card ? /* @__PURE__ */ jsx(icons.Card, { className: "h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    ["ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    !["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED", "FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT", "ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: "font-semibold mb-1", children: [
                        EVENT_TYPE_LABELS[event.eventType] || event.eventType,
                        " - ",
                        event.minute,
                        "'"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [
                        event.player && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("strong", { children: [
                          event.player.firstName,
                          " ",
                          event.player.lastName
                        ] }) }),
                        event.assistPlayer && /* @__PURE__ */ jsxs("div", { children: [
                          "Assist: ",
                          event.assistPlayer.firstName,
                          " ",
                          event.assistPlayer.lastName
                        ] }),
                        event.description && /* @__PURE__ */ jsx("div", { className: "italic", children: event.description })
                      ] })
                    ] })
                  ] })
                },
                event.id
              );
            }) })
          ] }),
          team2Id && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4 pb-2 border-b", children: team2Name }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: getEventsByTeam(team2Id).map((event) => {
              const getEventColor = () => {
                if (["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE"].includes(event.eventType)) {
                  return "border-green-500 bg-green-50";
                }
                if (["TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED"].includes(event.eventType)) {
                  return "border-orange-500 bg-orange-50";
                }
                if (event.eventType === "FOUL_PERSONAL") return "border-yellow-500 bg-yellow-50";
                if (event.eventType === "FOUL_TECHNICAL") return "border-orange-500 bg-orange-50";
                if (event.eventType === "FOUL_FLAGRANT") return "border-red-500 bg-red-50";
                if (event.eventType === "TURNOVER") return "border-red-500 bg-red-50";
                if (["ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE"].includes(event.eventType)) {
                  return "border-blue-500 bg-blue-50";
                }
                return "border-gray-500 bg-gray-50";
              };
              return /* @__PURE__ */ jsx(
                "div",
                {
                  className: `p-4 border-l-4 rounded-r-lg ${getEventColor()}`,
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    ["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED"].includes(event.eventType) && (icons.Goal ? /* @__PURE__ */ jsx(icons.Goal, { className: "h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    ["FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT"].includes(event.eventType) && (icons.Card ? /* @__PURE__ */ jsx(icons.Card, { className: "h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    ["ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    !["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED", "FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT", "ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 flex-shrink-0 mt-0.5" })),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: "font-semibold mb-1", children: [
                        EVENT_TYPE_LABELS[event.eventType] || event.eventType,
                        " - ",
                        event.minute,
                        "'"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [
                        event.player && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("strong", { children: [
                          event.player.firstName,
                          " ",
                          event.player.lastName
                        ] }) }),
                        event.assistPlayer && /* @__PURE__ */ jsxs("div", { children: [
                          "Assist: ",
                          event.assistPlayer.firstName,
                          " ",
                          event.assistPlayer.lastName
                        ] }),
                        event.description && /* @__PURE__ */ jsx("div", { className: "italic", children: event.description })
                      ] })
                    ] })
                  ] })
                },
                event.id
              );
            }) })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
          icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground" }) : /* @__PURE__ */ jsx("span", { className: "h-12 w-12 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No events recorded for this match yet" })
        ] }) })
      ] }),
      match.events && match.events.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          icons.Clock ? /* @__PURE__ */ jsx(icons.Clock, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx("span", { className: "h-6 w-6" }),
          "Match Timeline"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: match.events.sort((a, b) => a.minute - b.minute).map((event, index) => /* @__PURE__ */ jsxs("div", { className: "relative pl-12 pb-6", children: [
          index < match.events.length - 1 && /* @__PURE__ */ jsx("div", { className: "absolute left-6 top-8 bottom-0 w-0.5 bg-border" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center font-bold text-sm z-10", children: [
            event.minute,
            "'"
          ] }),
          /* @__PURE__ */ jsx(Card, { className: "ml-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              ["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED"].includes(event.eventType) && (icons.Goal ? /* @__PURE__ */ jsx(icons.Goal, { className: "h-5 w-5 text-green-600" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5" })),
              ["FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT"].includes(event.eventType) && (icons.Card ? /* @__PURE__ */ jsx(icons.Card, { className: "h-5 w-5 text-yellow-600" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5" })),
              ["ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-blue-600" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5" })),
              !["TWO_POINT_MADE", "THREE_POINT_MADE", "FREE_THROW_MADE", "TWO_POINT_MISSED", "THREE_POINT_MISSED", "FREE_THROW_MISSED", "FOUL_PERSONAL", "FOUL_TECHNICAL", "FOUL_FLAGRANT", "ASSIST", "STEAL", "BLOCK", "REBOUND_OFFENSIVE", "REBOUND_DEFENSIVE", "TURNOVER"].includes(event.eventType) && (icons.Activity ? /* @__PURE__ */ jsx(icons.Activity, { className: "h-5 w-5 text-gray-600" }) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5" })),
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: EVENT_TYPE_LABELS[event.eventType] || event.eventType }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: getTeamName(event.teamId) })
            ] }),
            event.player && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("strong", { children: [
              event.player.firstName,
              " ",
              event.player.lastName
            ] }) }),
            event.assistPlayer && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
              "Assist: ",
              event.assistPlayer.firstName,
              " ",
              event.assistPlayer.lastName
            ] }),
            event.description && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic mt-2", children: event.description })
          ] }) })
        ] }, event.id)) }) })
      ] })
    ] }),
    match && /* @__PURE__ */ jsx(
      AddPlayerModal,
      {
        matchId,
        team1Id,
        team2Id,
        existingMatchPlayers: match.matchPlayers || [],
        isOpen: showAddPlayerModal,
        onClose: () => setShowAddPlayerModal(false),
        onSuccess: () => {
          setShowAddPlayerModal(false);
          refreshMatchPlayers();
          fetchMatchDetails();
        }
      }
    ),
    match && /* @__PURE__ */ jsx(
      AddMatchEventModal,
      {
        matchId,
        team1Id,
        team2Id,
        isOpen: showAddEventModal,
        onClose: () => setShowAddEventModal(false),
        onSuccess: () => {
          setShowAddEventModal(false);
          fetchMatchDetails();
        }
      }
    )
  ] });
  function getTeamName(teamId) {
    if (team1Id === teamId) return team1Name;
    if (team2Id === teamId) return team2Name;
    return "Unknown Team";
  }
}

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
async function getStaticPaths() {
  return [];
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const user = await checkAuth(Astro2.request);
  if (!user) {
    return Astro2.redirect("/admin/login", 302);
  }
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/admin/matches", 302);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Match Details - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "MatchDetailView", MatchDetailView, { "matchId": id, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/MatchDetailView", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/view/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/view/[id].astro";
const $$url = "/admin/matches/view/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
