import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../../chunks/AdminLayout_D0bLXC3H.mjs';
import { B as Button, c as checkAuth } from '../../../../chunks/button_DxR-TZtn.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from '../../../../chunks/card_DX9qAu4V.mjs';
import { B as Badge } from '../../../../chunks/badge_C5xe3ZDQ.mjs';
import { A as Alert, a as AlertDescription } from '../../../../chunks/alert_CgE87Iz8.mjs';
import { S as Skeleton } from '../../../../chunks/skeleton_D7y0o7ki.mjs';
import { L as Label } from '../../../../chunks/label_C2DF_yw8.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../../../chunks/select_CrEDKzBG.mjs';
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../../../chunks/dialog_6FGgIDl3.mjs';
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from '../../../../chunks/alert-dialog_BtegjeEv.mjs';
import { C as CircleAlert } from '../../../../chunks/circle-alert_Kho7_Jh4.mjs';
import { A as ArrowLeft } from '../../../../chunks/arrow-left_ovqvQGFL.mjs';
import { S as SquarePen, M as Mail, P as Phone } from '../../../../chunks/square-pen_CfJM31VF.mjs';
import { S as Shield, P as Plus } from '../../../../chunks/shield_-OkOfQK9.mjs';
import { C as CircleCheckBig } from '../../../../chunks/circle-check-big_DAQePOmR.mjs';
import { C as CircleX } from '../../../../chunks/circle-x_CLDofPCu.mjs';
import { F as FileText } from '../../../../chunks/file-text_DQck3AYe.mjs';
import { L as LoaderCircle } from '../../../../chunks/loader-circle_BjGGmr2X.mjs';
import { U as Users } from '../../../../chunks/users_DWQa4V8L.mjs';
import { U as User } from '../../../../chunks/user_DLKEfZuB.mjs';
import { B as Briefcase } from '../../../../chunks/briefcase_CXmWmrwQ.mjs';
import { X } from '../../../../chunks/x_4zT85T7n.mjs';
import { I as Info } from '../../../../chunks/info_F6n9v9tm.mjs';
export { renderers } from '../../../../renderers.mjs';

function TeamView({ teamId }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRole, setSelectedRole] = useState("COACH");
  const [addStaffError, setAddStaffError] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [removeStaffId, setRemoveStaffId] = useState(null);
  const [approving, setApproving] = useState(false);
  useEffect(() => {
    fetchTeam();
  }, [teamId]);
  useEffect(() => {
    if (team) {
      fetchTeamStaff();
      fetchAvailableStaff();
    }
  }, [team?.id]);
  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team");
      }
      const data = await response.json();
      setTeam(data);
      setPlayers(data.players || []);
    } catch (err) {
      setError(err.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (window.location.hash === "#staff") {
      setTimeout(() => {
        const staffSection = document.querySelector("#staff");
        if (staffSection) {
          staffSection.scrollIntoView({ behavior: "smooth", block: "start" });
          setShowAddStaffModal(true);
        }
      }, 100);
    }
  }, []);
  const fetchTeamStaff = async () => {
    if (!team) return;
    try {
      setLoadingStaff(true);
      const response = await fetch(`/api/teams/${team.id}/staff`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (err) {
      console.error("Error fetching team staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };
  const fetchAvailableStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setAvailableStaff(data);
      }
    } catch (err) {
      console.error("Error fetching available staff:", err);
    }
  };
  const handleAddStaff = async () => {
    if (!team) return;
    if (!selectedStaffId || !selectedRole) {
      setAddStaffError("Please select a staff member and role");
      return;
    }
    setAddingStaff(true);
    setAddStaffError("");
    try {
      const response = await fetch(`/api/teams/${team.id}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          staffId: selectedStaffId,
          role: selectedRole
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to add staff" }));
        throw new Error(errorData.error || "Failed to add staff");
      }
      setShowAddStaffModal(false);
      setSelectedStaffId("");
      setSelectedRole("COACH");
      setAddStaffError("");
      fetchTeamStaff();
    } catch (err) {
      console.error("Error adding staff:", err);
      setAddStaffError(err.message || "Failed to add staff. Please try again.");
    } finally {
      setAddingStaff(false);
    }
  };
  const handleRemoveStaff = async (teamStaffId) => {
    if (!team) return;
    try {
      const response = await fetch(`/api/teams/${team.id}/staff?teamStaffId=${teamStaffId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to remove staff");
      fetchTeamStaff();
      setRemoveStaffId(null);
    } catch (err) {
      alert("Error removing staff: " + err.message);
    }
  };
  const handleApproveTeam = async (approved) => {
    if (!team) return;
    setApproving(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update approval status" }));
        throw new Error(errorData.error || "Failed to update approval status");
      }
      const updatedTeam = await response.json();
      setTeam({ ...team, approved: updatedTeam.approved });
    } catch (err) {
      alert("Error updating approval status: " + err.message);
    } finally {
      setApproving(false);
    }
  };
  const getRoleLabel = (role) => {
    const labels = {
      "COACH": "Coach",
      "ASSISTANT_COACH": "Assistant Coach",
      "MANAGER": "Manager",
      "ASSISTANT_MANAGER": "Assistant Manager",
      "PHYSIOTHERAPIST": "Physiotherapist",
      "TRAINER": "Trainer",
      "ANALYST": "Analyst",
      "OTHER": "Other"
    };
    return labels[role] || role;
  };
  const getRoleColor = (role) => {
    const colors = {
      "COACH": "#667eea",
      "ASSISTANT_COACH": "#4facfe",
      "MANAGER": "#f5576c",
      "ASSISTANT_MANAGER": "#43e97b",
      "PHYSIOTHERAPIST": "#fa709a",
      "TRAINER": "#fee140",
      "ANALYST": "#30cfd0",
      "OTHER": "#64748b"
    };
    return colors[role] || "#64748b";
  };
  const unassignedStaff = availableStaff.filter(
    (s) => !staff.some((ts) => ts.staffId === s.id)
  );
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
    ] });
  }
  if (error || !team) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto p-6", children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error || "Team not found" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, className: "mb-2", children: /* @__PURE__ */ jsxs("a", { href: "/admin/teams", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          "Back to Teams"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold text-foreground", children: "Team Details" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/teams/${team.id}`, "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(SquarePen, { className: "mr-2 h-4 w-4" }),
        "Edit Team"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: team.logo ? /* @__PURE__ */ jsx(
        "img",
        {
          src: team.logo,
          alt: team.name,
          className: "w-32 h-32 rounded-xl object-cover border-4 border-border"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "w-32 h-32 rounded-xl bg-muted flex items-center justify-center border-4 border-border", children: /* @__PURE__ */ jsx(Shield, { className: "h-12 w-12 text-muted-foreground" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-heading font-bold text-foreground", children: team.name }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: team.approved ? /* @__PURE__ */ jsxs(Badge, { className: "bg-green-500 text-white", children: [
            /* @__PURE__ */ jsx(CircleCheckBig, { className: "h-3 w-3 mr-1" }),
            "Approved"
          ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
            /* @__PURE__ */ jsx(CircleX, { className: "h-3 w-3 mr-1" }),
            "Pending Approval"
          ] }) })
        ] }),
        team.description && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-4", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: team.description })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-4 pt-4 border-t", children: team.approved ? /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handleApproveTeam(false),
            disabled: approving,
            className: "text-red-600 hover:text-red-700 hover:bg-red-50",
            children: approving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Updating..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CircleX, { className: "mr-2 h-4 w-4" }),
              "Reject Team"
            ] })
          }
        ) : /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => handleApproveTeam(true),
            disabled: approving,
            className: "bg-green-500 hover:bg-green-600 text-white",
            children: approving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Approving..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CircleCheckBig, { className: "mr-2 h-4 w-4" }),
              "Approve Team"
            ] })
          }
        ) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Users, { className: "h-6 w-6" }),
            "Players (",
            players.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Players currently on this team" })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/players/new?teamId=${team.id}`, "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Add Player"
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: players.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 border-2 border-dashed rounded-lg", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-16 w-16 mx-auto mb-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "No players yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Add players to this team to get started" }),
        /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/players/new?teamId=${team.id}`, "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Add First Player"
        ] }) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: players.map((player) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
        player.image ? /* @__PURE__ */ jsx("div", { className: "w-full h-48 overflow-hidden bg-muted", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: player.image,
            alt: player.firstName || player.lastName ? `${player.firstName || ""} ${player.lastName || ""}`.trim() : "Unnamed Player",
            className: "w-full h-full object-cover"
          }
        ) }) : /* @__PURE__ */ jsx("div", { className: "w-full h-48 bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-12 w-12 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg mb-2", children: player.firstName || player.lastName ? `${player.firstName || ""} ${player.lastName || ""}`.trim() : "Unnamed Player" }),
          (player.height || player.weight) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-2", children: [
            player.height && /* @__PURE__ */ jsx("span", { children: player.height }),
            player.height && player.weight && /* @__PURE__ */ jsx("span", { children: "•" }),
            player.weight && /* @__PURE__ */ jsx("span", { children: player.weight })
          ] }),
          player.position && /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: player.position }) }),
          player.jerseyNumber && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground font-semibold mb-2", children: [
            "#",
            player.jerseyNumber
          ] }),
          player.bio && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-3 mb-4", children: player.bio.length > 100 ? `${player.bio.substring(0, 100)}...` : player.bio }),
          /* @__PURE__ */ jsx("div", { className: "pt-4 border-t", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, className: "w-full", children: /* @__PURE__ */ jsxs("a", { href: `/admin/players/${player.id}`, "data-astro-prefetch": true, children: [
            /* @__PURE__ */ jsx(SquarePen, { className: "mr-2 h-4 w-4" }),
            "Edit"
          ] }) }) })
        ] })
      ] }, player.id)) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { id: "staff", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Briefcase, { className: "h-6 w-6" }),
            "Staff (",
            staff.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Coaches, managers, and team staff" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => setShowAddStaffModal(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Add Staff"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: loadingStaff ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
      ] }) : staff.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 border-2 border-dashed rounded-lg", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "h-16 w-16 mx-auto mb-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "No staff assigned" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Add staff members to this team to get started" }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => setShowAddStaffModal(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Add First Staff Member"
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: staff.map((teamStaff) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
        teamStaff.staff.image ? /* @__PURE__ */ jsx("div", { className: "w-full h-48 overflow-hidden bg-muted", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: teamStaff.staff.image,
            alt: `${teamStaff.staff.firstName} ${teamStaff.staff.lastName}`,
            className: "w-full h-full object-cover"
          }
        ) }) : /* @__PURE__ */ jsx("div", { className: "w-full h-48 bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-12 w-12 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg mb-2", children: [
            teamStaff.staff.firstName,
            " ",
            teamStaff.staff.lastName
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx(
            Badge,
            {
              style: { backgroundColor: getRoleColor(teamStaff.role) },
              className: "text-white",
              children: getRoleLabel(teamStaff.role)
            }
          ) }),
          (teamStaff.staff.email || teamStaff.staff.phone) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 text-sm text-muted-foreground mb-2", children: [
            teamStaff.staff.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("a", { href: `mailto:${teamStaff.staff.email}`, className: "hover:text-primary", children: teamStaff.staff.email })
            ] }),
            teamStaff.staff.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("a", { href: `tel:${teamStaff.staff.phone}`, className: "hover:text-primary", children: teamStaff.staff.phone })
            ] })
          ] }),
          teamStaff.staff.bio && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-3 mb-4", children: teamStaff.staff.bio.length > 100 ? `${teamStaff.staff.bio.substring(0, 100)}...` : teamStaff.staff.bio }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, className: "flex-1", children: /* @__PURE__ */ jsxs("a", { href: `/admin/staff/${teamStaff.staff.id}`, "data-astro-prefetch": true, children: [
              /* @__PURE__ */ jsx(SquarePen, { className: "mr-2 h-4 w-4" }),
              "Edit"
            ] }) }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "flex-1 text-destructive hover:text-destructive",
                onClick: () => setRemoveStaffId(teamStaff.id),
                children: [
                  /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
                  "Remove"
                ]
              }
            )
          ] })
        ] })
      ] }, teamStaff.id)) }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showAddStaffModal, onOpenChange: setShowAddStaffModal, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Add Staff to Team" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Select a staff member and their role for this team." })
      ] }),
      addStaffError && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxs(AlertDescription, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Error:" }),
          " ",
          addStaffError
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "staff-select", children: [
            "Staff Member ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: selectedStaffId,
              onValueChange: (value) => {
                setSelectedStaffId(value);
                setAddStaffError("");
              },
              disabled: addingStaff,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "staff-select", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a staff member" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: unassignedStaff.map((s) => /* @__PURE__ */ jsxs(SelectItem, { value: s.id, children: [
                  s.firstName,
                  " ",
                  s.lastName,
                  " - ",
                  getRoleLabel(s.role)
                ] }, s.id)) })
              ]
            }
          ),
          unassignedStaff.length === 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
            "No available staff members. ",
            /* @__PURE__ */ jsx("a", { href: "/admin/staff/new", className: "text-primary hover:underline", children: "Create a new staff member" }),
            " first."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "role-select", children: [
            "Role for this Team ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: selectedRole,
              onValueChange: (value) => {
                setSelectedRole(value);
                setAddStaffError("");
              },
              disabled: addingStaff,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "role-select", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "COACH", children: "Coach" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "ASSISTANT_COACH", children: "Assistant Coach" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "MANAGER", children: "Manager" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "ASSISTANT_MANAGER", children: "Assistant Manager" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "PHYSIOTHERAPIST", children: "Physiotherapist" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "TRAINER", children: "Trainer" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "ANALYST", children: "Analyst" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "OTHER", children: "Other" })
                ] })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              setShowAddStaffModal(false);
              setAddStaffError("");
              setSelectedStaffId("");
              setSelectedRole("COACH");
            },
            disabled: addingStaff,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleAddStaff,
            disabled: !selectedStaffId || !selectedRole || addingStaff,
            children: addingStaff ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Adding..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
              "Add Staff"
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: removeStaffId !== null, onOpenChange: (open) => !open && setRemoveStaffId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Remove Staff Member" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Are you sure you want to remove this staff member from the team? This action cannot be undone." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: () => removeStaffId && handleRemoveStaff(removeStaffId),
            className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            children: "Remove"
          }
        )
      ] })
    ] }) })
  ] });
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
    return Astro2.redirect("/admin/teams", 302);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "View Team - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "TeamView", TeamView, { "teamId": id, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/TeamView", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/view/[id].astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/view/[id].astro";
const $$url = "/admin/teams/view/[id]";

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
