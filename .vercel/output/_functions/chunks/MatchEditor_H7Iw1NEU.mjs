import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { h as getLeagueId, d as getLeagueName, c as getTeam2Logo, b as getTeam2Name, f as getTeam2Id, a as getTeam1Logo, g as getTeam1Name, e as getTeam1Id } from './league-helpers_BQcVt2so.mjs';
import { B as Button } from './button_DxR-TZtn.mjs';
import { I as Input } from './input_wveC5Rbb.mjs';
import { L as Label } from './label_C2DF_yw8.mjs';
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent, c as CardDescription } from './card_DX9qAu4V.mjs';
import { A as Alert, a as AlertDescription } from './alert_CgE87Iz8.mjs';
import { S as Skeleton } from './skeleton_D7y0o7ki.mjs';
import { B as Badge } from './badge_C5xe3ZDQ.mjs';
import { C as Checkbox } from './checkbox_cybCsVj1.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from './select_CrEDKzBG.mjs';
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from './alert-dialog_BtegjeEv.mjs';
import { U as Users } from './users_DWQa4V8L.mjs';
import { P as Plus, S as Shield } from './shield_-OkOfQK9.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { S as Shirt, A as Activity, T as Target, a as Square, C as Clock, b as Trophy, R as RefreshCw } from './trophy_Dg328O6V.mjs';
import { X } from './x_4zT85T7n.mjs';
import { T as Textarea } from './textarea_carRDR8N.mjs';
import { C as Circle } from './circle_CB1HlDW3.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Separator } from './separator_BytSnNn0.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as Calendar } from './calendar_CypXdtAa.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';

function getSeasonId(match) {
  return match.seasonId || null;
}

function MatchPlayersManager({ matchId, team1Id, team2Id, onPlayerAdded }) {
  const [players, setPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [deletePlayerId, setDeletePlayerId] = useState(null);
  const [formData, setFormData] = useState({
    playerId: "",
    teamId: "",
    started: false,
    position: "",
    jerseyNumber: "",
    minutesPlayed: ""
  });
  useEffect(() => {
    if (matchId) {
      fetchMatchPlayers();
      fetchTeams();
    }
  }, [matchId]);
  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    }
  }, [formData.teamId]);
  const fetchMatchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${matchId}/players`);
      if (!response.ok) throw new Error("Failed to fetch match players");
      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      setError(err.message || "Failed to load match players");
    } finally {
      setLoading(false);
    }
  };
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeam) {
          const defaultTeam = team1Id || team2Id || data[0].id;
          setSelectedTeam(defaultTeam);
          setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };
  const fetchPlayersForTeam = async (teamId) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailablePlayers(data);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setError("");
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
      setShowAddForm(false);
      setFormData({
        playerId: "",
        teamId: formData.teamId,
        started: false,
        position: "",
        jerseyNumber: "",
        minutesPlayed: ""
      });
      fetchMatchPlayers();
      if (onPlayerAdded) {
        onPlayerAdded();
      }
    } catch (err) {
      setError(err.message || "Failed to add player");
    }
  };
  const handleDeletePlayer = async (id) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/players/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to remove player");
      fetchMatchPlayers();
      if (onPlayerAdded) {
        onPlayerAdded();
      }
      setDeletePlayerId(null);
    } catch (err) {
      setError(err.message || "Failed to remove player");
    }
  };
  const getPlayersByTeam = (teamId) => {
    return players.filter((mp) => mp.teamId === teamId);
  };
  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || "Unknown Team";
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-xl font-heading font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" }),
        "Match Players"
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          onClick: () => setShowAddForm(!showAddForm),
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
            "Add Player"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    showAddForm && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Add Player to Match" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleAddPlayer, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "teamId", children: [
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
                  setSelectedTeam(value);
                },
                required: true,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "playerId", children: [
              "Player ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.playerId,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, playerId: value })),
                required: true,
                disabled: !formData.teamId,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "playerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a player" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: availablePlayers.map((player) => /* @__PURE__ */ jsxs(SelectItem, { value: player.id, children: [
                    player.firstName,
                    " ",
                    player.lastName,
                    player.jerseyNumber ? ` (#${player.jerseyNumber})` : ""
                  ] }, player.id)) })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "position", children: "Position" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "position",
                type: "text",
                value: formData.position,
                onChange: (e) => setFormData((prev) => ({ ...prev, position: e.target.value })),
                placeholder: "e.g., Forward"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "jerseyNumber", children: "Jersey #" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "jerseyNumber",
                type: "number",
                value: formData.jerseyNumber,
                onChange: (e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value })),
                min: "0",
                max: "99"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "minutesPlayed", children: "Minutes" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "minutesPlayed",
                type: "number",
                value: formData.minutesPlayed,
                onChange: (e) => setFormData((prev) => ({ ...prev, minutesPlayed: e.target.value })),
                min: "0",
                max: "120"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 flex items-end", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "started",
                checked: formData.started,
                onCheckedChange: (checked) => setFormData((prev) => ({ ...prev, started: checked === true }))
              }
            ),
            /* @__PURE__ */ jsx(Label, { htmlFor: "started", className: "cursor-pointer", children: "Started" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", children: "Add Player" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => setShowAddForm(false),
              children: "Cancel"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      team1Id && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: getTeamName(team1Id) }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          getPlayersByTeam(team1Id).map((mp) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 border rounded-lg",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    mp.player.firstName,
                    " ",
                    mp.player.lastName
                  ] }),
                  mp.jerseyNumber && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                    /* @__PURE__ */ jsx(Shirt, { className: "h-3 w-3" }),
                    mp.jerseyNumber
                  ] }),
                  mp.started && /* @__PURE__ */ jsx(Badge, { variant: "default", children: "Started" }),
                  mp.position && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    "(",
                    mp.position,
                    ")"
                  ] }),
                  mp.minutesPlayed !== null && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    mp.minutesPlayed,
                    "'"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "ghost",
                    onClick: () => setDeletePlayerId(mp.id),
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ]
            },
            mp.id
          )),
          getPlayersByTeam(team1Id).length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No players added" })
        ] }) })
      ] }),
      team2Id && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: getTeamName(team2Id) }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          getPlayersByTeam(team2Id).map((mp) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 border rounded-lg",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    mp.player.firstName,
                    " ",
                    mp.player.lastName
                  ] }),
                  mp.jerseyNumber && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                    /* @__PURE__ */ jsx(Shirt, { className: "h-3 w-3" }),
                    mp.jerseyNumber
                  ] }),
                  mp.started && /* @__PURE__ */ jsx(Badge, { variant: "default", children: "Started" }),
                  mp.position && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    "(",
                    mp.position,
                    ")"
                  ] }),
                  mp.minutesPlayed !== null && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                    mp.minutesPlayed,
                    "'"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "ghost",
                    onClick: () => setDeletePlayerId(mp.id),
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ]
            },
            mp.id
          )),
          getPlayersByTeam(team2Id).length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No players added" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: deletePlayerId !== null, onOpenChange: (open) => !open && setDeletePlayerId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Remove Player" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Are you sure you want to remove this player from the match? This action cannot be undone." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => deletePlayerId && handleDeletePlayer(deletePlayerId), children: "Remove" })
      ] })
    ] }) })
  ] });
}

const EVENT_TYPES = [
  { value: "TWO_POINT_MADE", label: "2-Point Made", icon: Target },
  { value: "TWO_POINT_MISSED", label: "2-Point Missed", icon: Target },
  { value: "THREE_POINT_MADE", label: "3-Point Made", icon: Target },
  { value: "THREE_POINT_MISSED", label: "3-Point Missed", icon: Target },
  { value: "FREE_THROW_MADE", label: "Free Throw Made", icon: Target },
  { value: "FREE_THROW_MISSED", label: "Free Throw Missed", icon: Target },
  { value: "ASSIST", label: "Assist", icon: Activity },
  { value: "REBOUND_OFFENSIVE", label: "Offensive Rebound", icon: Circle },
  { value: "REBOUND_DEFENSIVE", label: "Defensive Rebound", icon: Circle },
  { value: "STEAL", label: "Steal", icon: Shield },
  { value: "BLOCK", label: "Block", icon: Shield },
  { value: "TURNOVER", label: "Turnover", icon: Activity },
  { value: "FOUL_PERSONAL", label: "Personal Foul", icon: Square },
  { value: "FOUL_TECHNICAL", label: "Technical Foul", icon: Square },
  { value: "FOUL_FLAGRANT", label: "Flagrant Foul", icon: Square },
  { value: "SUBSTITUTION_IN", label: "Substitution In", icon: Users },
  { value: "SUBSTITUTION_OUT", label: "Substitution Out", icon: Users },
  { value: "TIMEOUT", label: "Timeout", icon: Clock },
  { value: "INJURY", label: "Injury", icon: Activity },
  { value: "OTHER", label: "Other", icon: Activity }
];
function MatchEventsManager({ matchId, team1Id, team2Id }) {
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [formData, setFormData] = useState({
    eventType: "TWO_POINT_MADE",
    minute: "",
    teamId: "",
    playerId: "",
    assistPlayerId: "",
    description: ""
  });
  useEffect(() => {
    if (matchId) {
      fetchMatchEvents();
      fetchTeams();
    }
  }, [matchId]);
  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    }
  }, [formData.teamId]);
  const fetchMatchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${matchId}/events`);
      if (!response.ok) throw new Error("Failed to fetch match events");
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message || "Failed to load match events");
    } finally {
      setLoading(false);
    }
  };
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !formData.teamId) {
          const defaultTeam = team1Id || team2Id || data[0].id;
          setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
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
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError("");
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
      setShowAddForm(false);
      setFormData({
        eventType: "TWO_POINT_MADE",
        minute: "",
        teamId: formData.teamId,
        playerId: "",
        assistPlayerId: "",
        description: ""
      });
      fetchMatchEvents();
    } catch (err) {
      setError(err.message || "Failed to add event");
    }
  };
  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete event");
      fetchMatchEvents();
      setDeleteEventId(null);
    } catch (err) {
      setError(err.message || "Failed to delete event");
    }
  };
  const getEventIcon = (eventType) => {
    const event = EVENT_TYPES.find((e) => e.value === eventType);
    return event?.icon || Activity;
  };
  const getEventLabel = (eventType) => {
    const event = EVENT_TYPES.find((e) => e.value === eventType);
    return event?.label || eventType;
  };
  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || "Unknown Team";
  };
  const needsPlayer = (eventType) => {
    return !["TIMEOUT"].includes(eventType);
  };
  const needsAssist = (eventType) => {
    return ["TWO_POINT_MADE", "THREE_POINT_MADE"].includes(eventType);
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-xl font-heading font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "h-5 w-5" }),
        "Match Events"
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          onClick: () => setShowAddForm(!showAddForm),
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
            "Add Event"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    showAddForm && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Add Match Event" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleAddEvent, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "eventType", children: [
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
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "eventType", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: EVENT_TYPES.map((event) => /* @__PURE__ */ jsx(SelectItem, { value: event.value, children: event.label }, event.value)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "minute", children: [
              "Minute ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "minute",
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
            /* @__PURE__ */ jsxs(Label, { htmlFor: "teamId", children: [
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
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "teamId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a team" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: team.name }, team.id)) })
                ]
              }
            )
          ] }),
          needsPlayer(formData.eventType) && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "playerId", children: "Player" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.playerId,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, playerId: value })),
                disabled: !formData.teamId,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "playerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a player" }) }),
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
          /* @__PURE__ */ jsx(Label, { htmlFor: "assistPlayerId", children: "Assist Player" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.assistPlayerId || "__none",
              onValueChange: (value) => setFormData((prev) => ({ ...prev, assistPlayerId: value === "__none" ? "" : value })),
              disabled: !formData.teamId,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "assistPlayerId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "No assist" }) }),
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
          /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "description",
              rows: 2,
              value: formData.description,
              onChange: (e) => setFormData((prev) => ({ ...prev, description: e.target.value })),
              placeholder: "Additional details about the event..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", children: "Add Event" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => setShowAddForm(false),
              children: "Cancel"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: events.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No events recorded yet" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: events.map((event) => {
      const EventIcon = getEventIcon(event.eventType);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between p-3 border rounded-lg",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(EventIcon, { className: "h-5 w-5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "font-semibold", children: [
                  getEventLabel(event.eventType),
                  " - ",
                  event.minute,
                  "'"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
                  getTeamName(event.teamId),
                  event.player && /* @__PURE__ */ jsxs(Fragment, { children: [
                    " • ",
                    event.player.firstName,
                    " ",
                    event.player.lastName
                  ] }),
                  event.assistPlayer && /* @__PURE__ */ jsxs(Fragment, { children: [
                    " (Assist: ",
                    event.assistPlayer.firstName,
                    " ",
                    event.assistPlayer.lastName,
                    ")"
                  ] }),
                  event.description && /* @__PURE__ */ jsxs(Fragment, { children: [
                    " • ",
                    event.description
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => setDeleteEventId(event.id),
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ]
        },
        event.id
      );
    }) }) }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: deleteEventId !== null, onOpenChange: (open) => !open && setDeleteEventId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete Event" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Are you sure you want to delete this event? This action cannot be undone." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => deleteEventId && handleDeleteEvent(deleteEventId), children: "Delete" })
      ] })
    ] }) })
  ] });
}

function TeamSelect({
  id,
  label,
  value,
  teams,
  loading,
  saving,
  error,
  onSelect,
  customName,
  customLogo,
  onCustomNameChange,
  onCustomLogoChange
}) {
  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === value),
    [teams, value]
  );
  const displayValue = selectedTeam ? selectedTeam.name : "";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs(Label, { htmlFor: id, children: [
      label,
      " ",
      /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
    ] }),
    /* @__PURE__ */ jsxs(
      Select,
      {
        value: value || "__custom",
        onValueChange: (val) => onSelect(val === "__custom" ? "" : val),
        disabled: saving || loading,
        children: [
          /* @__PURE__ */ jsx(SelectTrigger, { id, className: "flex items-center gap-2", children: /* @__PURE__ */ jsx(
            SelectValue,
            {
              placeholder: loading ? "Loading teams..." : teams.length > 0 ? "Select a team from database..." : "No teams available - enter custom",
              children: displayValue
            }
          ) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "__custom", children: "Custom Team" }),
            teams.length === 0 && !loading && /* @__PURE__ */ jsx(SelectItem, { value: "__empty", disabled: true, children: "No teams in database" }),
            teams.map((team) => /* @__PURE__ */ jsx(SelectItem, { value: team.id, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              team.logo && /* @__PURE__ */ jsx(
                "img",
                {
                  src: team.logo,
                  alt: team.name,
                  className: "w-5 h-5 object-contain rounded",
                  onError: (e) => {
                    e.currentTarget.style.display = "none";
                  }
                }
              ),
              /* @__PURE__ */ jsx("span", { children: team.name })
            ] }) }, team.id))
          ] })
        ]
      }
    ),
    !value && /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${id}Name`,
          type: "text",
          placeholder: `${label} Name`,
          value: customName,
          onChange: (e) => onCustomNameChange(e.target.value),
          required: !value,
          disabled: saving
        }
      ),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${id}Logo`,
          type: "url",
          placeholder: `${label} Logo URL`,
          value: customLogo,
          onChange: (e) => onCustomLogoChange(e.target.value),
          disabled: saving
        }
      )
    ] }),
    loading && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
      "Loading teams from database..."
    ] }),
    !loading && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: teams.length > 0 ? `${teams.length} team${teams.length !== 1 ? "s" : ""} available from database` : "No teams in database. You can enter a custom team name or create a team first." }),
    error && error.includes("teams") && /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400 mt-1", children: "⚠️ Unable to load teams from database. You can still enter custom team names below." })
  ] });
}

const MATCH_STATUSES = ["UPCOMING", "LIVE", "COMPLETED"];
const MATCH_STAGES = [
  "REGULAR_SEASON",
  "PRESEASON",
  "EXHIBITION",
  "PLAYOFF",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "CHAMPIONSHIP",
  "QUALIFIER",
  "OTHER"
];
const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const log = isDev ? console.log : () => {
};
const logError = isDev ? console.error : () => {
};
const logWarn = isDev ? console.warn : () => {
};
function MatchEditor({ matchId }) {
  const [loading, setLoading] = useState(!!matchId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    teams: "",
    leagues: "",
    match: "",
    save: ""
  });
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const [formData, setFormData] = useState({
    team1Id: "",
    team1Name: "",
    team1Logo: "",
    team2Id: "",
    team2Name: "",
    team2Logo: "",
    leagueId: "",
    league: "",
    seasonId: "",
    date: "",
    team1Score: "",
    team2Score: "",
    status: "UPCOMING",
    stage: ""
  });
  const fetchSeasons = useCallback(async (leagueId) => {
    try {
      setSeasonsLoading(true);
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        setSeasons(data);
      }
    } catch (err) {
      logError("Failed to fetch seasons:", err);
    } finally {
      setSeasonsLoading(false);
    }
  }, []);
  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    try {
      setLoading(true);
      setErrors((prev) => ({ ...prev, match: "" }));
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error("Failed to fetch match");
      const match = await response.json();
      const leagueId = getLeagueId(match) || "";
      const seasonId = getSeasonId(match) || "";
      setFormData({
        team1Id: getTeam1Id(match) || "",
        team1Name: getTeam1Name(match),
        team1Logo: getTeam1Logo(match) || "",
        team2Id: getTeam2Id(match) || "",
        team2Name: getTeam2Name(match),
        team2Logo: getTeam2Logo(match) || "",
        leagueId,
        league: getLeagueName(match),
        seasonId,
        date: new Date(match.date).toISOString().slice(0, 16),
        team1Score: match.team1Score?.toString() || "",
        team2Score: match.team2Score?.toString() || "",
        status: match.status,
        stage: match.stage || ""
      });
      if (leagueId) {
        fetchSeasons(leagueId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load match";
      setErrors((prev) => ({ ...prev, match: message }));
    } finally {
      setLoading(false);
    }
  }, [matchId, fetchSeasons]);
  const fetchLeagues = useCallback(async () => {
    try {
      setLeaguesLoading(true);
      setErrors((prev) => ({ ...prev, leagues: "" }));
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const data = await response.json();
        setLeagues(data);
      } else {
        setErrors((prev) => ({
          ...prev,
          leagues: `Failed to load leagues (${response.status})`
        }));
      }
    } catch (err) {
      logError("Failed to fetch leagues:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrors((prev) => ({
        ...prev,
        leagues: `Failed to load leagues: ${message}`
      }));
    } finally {
      setLeaguesLoading(false);
    }
  }, []);
  const fetchTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      setErrors((prev) => ({ ...prev, teams: "" }));
      log("[Client] Fetching teams from /api/teams...");
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => {
        logWarn("[Client] Request timeout - aborting...");
        controller.abort();
      }, 8e3);
      let response;
      try {
        response = await fetch("/api/teams", {
          signal: controller.signal,
          method: "GET",
          headers: {
            "Accept": "application/json"
          },
          cache: "no-cache"
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          logError("[Client] Request timeout");
          setErrors((prev) => ({
            ...prev,
            teams: "Request timeout: The server is taking too long to respond. You can still enter custom team names."
          }));
          setTeams([]);
          setTeamsLoading(false);
          return;
        }
        throw fetchError;
      }
      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        logError("[Client] API request failed:", response.status, errorData);
        setErrors((prev) => ({
          ...prev,
          teams: errorData.error || `Failed to load teams (${response.status})`
        }));
        setTeams([]);
        setTeamsLoading(false);
        return;
      }
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        logError("[Client] Failed to parse JSON response:", parseError);
        setErrors((prev) => ({
          ...prev,
          teams: "Failed to parse server response. Check console for details."
        }));
        setTeams([]);
        setTeamsLoading(false);
        return;
      }
      if (Array.isArray(data)) {
        setTeams(data);
        log(`[Client] Successfully loaded ${data.length} teams from database`);
        if (data.length === 0) {
          logWarn("[Client] No teams found in database");
        }
      } else if (data && typeof data === "object" && "error" in data) {
        const errorData = data;
        logError("[Client] API returned error:", errorData.error);
        setErrors((prev) => ({
          ...prev,
          teams: `Failed to load teams: ${errorData.error}`
        }));
        setTeams([]);
      } else {
        logError("[Client] Unexpected response format:", data);
        setErrors((prev) => ({
          ...prev,
          teams: "Failed to load teams: Unexpected response format"
        }));
        setTeams([]);
      }
    } catch (err) {
      logError("[Client] Exception in fetchTeams:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrors((prev) => ({
        ...prev,
        teams: `Failed to load teams: ${message}. You can still enter custom team names.`
      }));
      setTeams([]);
    } finally {
      setTeamsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);
  useEffect(() => {
    fetchTeams();
    fetchLeagues();
    if (matchId) {
      fetchMatch();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [matchId, fetchTeams, fetchLeagues, fetchMatch]);
  useEffect(() => {
    if (formData.leagueId) {
      fetchSeasons(formData.leagueId);
    } else {
      setSeasons([]);
      setFormData((prev) => ({ ...prev, seasonId: "" }));
    }
  }, [formData.leagueId, fetchSeasons]);
  const team1Options = useMemo(() => {
    if (!formData.team2Id) return teams;
    return teams.filter((team) => team.id !== formData.team2Id);
  }, [teams, formData.team2Id]);
  const team2Options = useMemo(() => {
    if (!formData.team1Id) return teams;
    return teams.filter((team) => team.id !== formData.team1Id);
  }, [teams, formData.team1Id]);
  const validateForm = () => {
    const errors2 = [];
    if (!formData.team1Id && !formData.team1Name?.trim()) {
      errors2.push("Team 1 is required");
    }
    if (!formData.team2Id && !formData.team2Name?.trim()) {
      errors2.push("Team 2 is required");
    }
    if (!formData.leagueId && !formData.league?.trim()) {
      errors2.push("League is required");
    }
    if (!formData.date) {
      errors2.push("Date & Time is required");
    } else {
      const matchDate = new Date(formData.date);
      const now = /* @__PURE__ */ new Date();
      if (matchDate < now && formData.status === "UPCOMING") {
        errors2.push("Upcoming matches must be scheduled in the future");
      }
    }
    if (formData.team1Score) {
      const score = Number.parseInt(formData.team1Score, 10);
      if (isNaN(score) || score < 0 || score > 999) {
        errors2.push("Team 1 score must be between 0 and 999");
      }
    }
    if (formData.team2Score) {
      const score = Number.parseInt(formData.team2Score, 10);
      if (isNaN(score) || score < 0 || score > 999) {
        errors2.push("Team 2 score must be between 0 and 999");
      }
    }
    if (formData.team1Logo && !formData.team1Id) {
      try {
        new URL(formData.team1Logo);
      } catch {
        errors2.push("Team 1 logo must be a valid URL");
      }
    }
    if (formData.team2Logo && !formData.team2Id) {
      try {
        new URL(formData.team2Logo);
      } catch {
        errors2.push("Team 2 logo must be a valid URL");
      }
    }
    return errors2;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({ teams: "", leagues: "", match: "", save: "" });
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(". "));
      }
      const url = matchId ? `/api/matches/${matchId}` : "/api/matches";
      const method = matchId ? "PUT" : "POST";
      const payload = {
        date: formData.date,
        status: formData.status,
        stage: formData.stage || null,
        team1Score: formData.team1Score ? Number.parseInt(formData.team1Score, 10) : null,
        team2Score: formData.team2Score ? Number.parseInt(formData.team2Score, 10) : null
      };
      if (formData.leagueId) {
        payload.leagueId = formData.leagueId;
      } else {
        payload.league = formData.league;
      }
      if (formData.seasonId) {
        payload.seasonId = formData.seasonId;
      }
      if (formData.team1Id) {
        payload.team1Id = formData.team1Id;
      } else {
        payload.team1Name = formData.team1Name;
        payload.team1Logo = formData.team1Logo || "";
      }
      if (formData.team2Id) {
        payload.team2Id = formData.team2Id;
      } else {
        payload.team2Name = formData.team2Name;
        payload.team2Logo = formData.team2Logo || "";
      }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save match");
      }
      window.location.href = "/admin/matches";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save match";
      setErrors((prev) => ({ ...prev, save: message }));
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
          /* @__PURE__ */ jsx(Trophy, { className: "h-8 w-8" }),
          matchId ? "Edit Match" : "Create New Match"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: matchId ? "Update match details and information" : "Create a new match fixture" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/matches", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to List"
      ] }) })
    ] }),
    (errors.teams || errors.leagues || errors.match || errors.save) && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        errors.save || errors.match || errors.leagues || errors.teams,
        errors.teams && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm", children: [
          /* @__PURE__ */ jsx("p", { children: "Please check:" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside mt-1 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Database connection is active" }),
            /* @__PURE__ */ jsx("li", { children: "Teams exist in the database" }),
            /* @__PURE__ */ jsx("li", { children: "Check browser console for detailed error logs" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Teams" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "Select teams or enter custom team information" })
          ] }),
          !teamsLoading && (teams.length === 0 || errors.teams) && /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: fetchTeams,
              disabled: teamsLoading,
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
                "Retry"
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            TeamSelect,
            {
              id: "team1Id",
              label: "Team 1",
              value: formData.team1Id,
              teams: team1Options,
              loading: teamsLoading,
              saving,
              error: errors.teams,
              onSelect: (value) => {
                const selectedTeam = teams.find((t) => t.id === value);
                setFormData((prev) => ({
                  ...prev,
                  team1Id: value,
                  team1Name: selectedTeam ? selectedTeam.name : prev.team1Name,
                  team1Logo: selectedTeam ? selectedTeam.logo || "" : prev.team1Logo,
                  // Clear team2 if it's the same team
                  ...prev.team2Id === value ? { team2Id: "", team2Name: "", team2Logo: "" } : {}
                }));
              },
              customName: formData.team1Name,
              customLogo: formData.team1Logo,
              onCustomNameChange: (name) => setFormData((prev) => ({ ...prev, team1Name: name })),
              onCustomLogoChange: (logo) => setFormData((prev) => ({ ...prev, team1Logo: logo }))
            }
          ),
          /* @__PURE__ */ jsx(
            TeamSelect,
            {
              id: "team2Id",
              label: "Team 2",
              value: formData.team2Id,
              teams: team2Options,
              loading: teamsLoading,
              saving,
              error: errors.teams,
              onSelect: (value) => {
                const selectedTeam = teams.find((t) => t.id === value);
                setFormData((prev) => ({
                  ...prev,
                  team2Id: value,
                  team2Name: selectedTeam ? selectedTeam.name : prev.team2Name,
                  team2Logo: selectedTeam ? selectedTeam.logo || "" : prev.team2Logo,
                  // Clear team1 if it's the same team
                  ...prev.team1Id === value ? { team1Id: "", team1Name: "", team1Logo: "" } : {}
                }));
              },
              customName: formData.team2Name,
              customLogo: formData.team2Logo,
              onCustomNameChange: (name) => setFormData((prev) => ({ ...prev, team2Name: name })),
              onCustomLogoChange: (logo) => setFormData((prev) => ({ ...prev, team2Logo: logo }))
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Match Details" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Date, league, season, and stage" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "date", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "inline h-4 w-4 mr-2" }),
                "Date & Time ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "date",
                  type: "datetime-local",
                  value: formData.date,
                  onChange: (e) => setFormData((prev) => ({ ...prev, date: e.target.value })),
                  required: true,
                  disabled: saving
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "leagueId", children: [
                /* @__PURE__ */ jsx(Trophy, { className: "inline h-4 w-4 mr-2" }),
                "League ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.leagueId || "__custom",
                  onValueChange: (value) => {
                    setFormData((prev) => ({
                      ...prev,
                      leagueId: value === "__custom" ? "" : value,
                      league: "",
                      seasonId: ""
                      // Reset season when league changes
                    }));
                  },
                  required: true,
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "leagueId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a league or enter custom..." }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "__custom", children: "Custom League" }),
                      leagues.map((league) => /* @__PURE__ */ jsx(SelectItem, { value: league.id, children: league.name }, league.id))
                    ] })
                  ]
                }
              ),
              !formData.leagueId && /* @__PURE__ */ jsx(
                Input,
                {
                  id: "league",
                  type: "text",
                  placeholder: "League Name",
                  value: formData.league,
                  onChange: (e) => setFormData((prev) => ({ ...prev, league: e.target.value })),
                  required: !formData.leagueId,
                  disabled: saving,
                  className: "mt-2"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "seasonId", children: "Season" }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.seasonId || "__none",
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, seasonId: value === "__none" ? "" : value })),
                  disabled: saving || !formData.leagueId,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "seasonId", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: formData.leagueId ? "Select a season" : "Select a league first" }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "__none", children: "No Season" }),
                      seasons.map((season) => /* @__PURE__ */ jsx(SelectItem, { value: season.id, children: season.name }, season.id))
                    ] })
                  ]
                }
              ),
              !formData.leagueId && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Select a league first to choose a season" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "stage", children: "Match Stage" }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.stage || "__none",
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, stage: (value === "__none" ? "" : value) || "" })),
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "stage", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select stage (optional)" }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "__none", children: "Regular Match" }),
                      MATCH_STAGES.map((stage) => /* @__PURE__ */ jsx(SelectItem, { value: stage, children: stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) }, stage))
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Select the stage or round of the match" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Scores & Status" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Match scores and current status" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "team1Score", children: "Team 1 Score" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "team1Score",
                type: "number",
                value: formData.team1Score,
                onChange: (e) => setFormData((prev) => ({ ...prev, team1Score: e.target.value })),
                min: "0",
                disabled: saving,
                placeholder: "0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "team2Score", children: "Team 2 Score" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "team2Score",
                type: "number",
                value: formData.team2Score,
                onChange: (e) => setFormData((prev) => ({ ...prev, team2Score: e.target.value })),
                min: "0",
                disabled: saving,
                placeholder: "0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "status", children: "Status" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, status: value })),
                disabled: saving,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "status", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: MATCH_STATUSES.map((status) => /* @__PURE__ */ jsx(SelectItem, { value: status, children: status }, status)) })
                ]
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          matchId ? "Update Match" : "Create Match"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/matches", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] }),
    matchId && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Separator, { className: "my-6" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx(
          MatchPlayersManager,
          {
            matchId,
            team1Id: formData.team1Id || null,
            team2Id: formData.team2Id || null
          }
        ),
        /* @__PURE__ */ jsx(Separator, { className: "my-6" }),
        /* @__PURE__ */ jsx(
          MatchEventsManager,
          {
            matchId,
            team1Id: formData.team1Id || null,
            team2Id: formData.team2Id || null
          }
        )
      ] })
    ] })
  ] });
}

export { MatchEditor as M };
