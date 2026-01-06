import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_D0bLXC3H.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, a as cn, c as checkAuth } from '../../chunks/button_DxR-TZtn.mjs';
import { I as Input } from '../../chunks/input_wveC5Rbb.mjs';
import { C as Card, d as CardContent } from '../../chunks/card_DX9qAu4V.mjs';
import { S as Skeleton } from '../../chunks/skeleton_D7y0o7ki.mjs';
import { B as Badge } from '../../chunks/badge_C5xe3ZDQ.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_CrEDKzBG.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, D as DropdownMenu, f as DropdownMenuTrigger, g as DropdownMenuContent, h as DropdownMenuItem } from '../../chunks/dropdown-menu_CcCSlo_C.mjs';
import { g as getTeam1Name, b as getTeam2Name, d as getLeagueName, a as getTeam1Logo, c as getTeam2Logo } from '../../chunks/league-helpers_BQcVt2so.mjs';
export { renderers } from '../../renderers.mjs';

function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Calendar: mod.Calendar,
        AlertCircle: mod.AlertCircle,
        Clock: mod.Clock,
        CheckCircle: mod.CheckCircle,
        Play: mod.Play,
        MoreVertical: mod.MoreVertical,
        Trophy: mod.Trophy,
        Users: mod.Users,
        RefreshCw: mod.RefreshCw,
        Eye: mod.Eye
      });
    });
  }, []);
  useEffect(() => {
    fetchMatches();
  }, []);
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/matches");
      if (!response.ok) throw new Error("Failed to fetch matches");
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this match?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete match");
      setError("");
      fetchMatches();
    } catch (err) {
      setError("Error deleting match: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getStatusColor = (status) => {
    const colors = {
      UPCOMING: "bg-slate-500",
      LIVE: "bg-red-500",
      COMPLETED: "bg-green-500"
    };
    return colors[status] || "bg-slate-500";
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "UPCOMING":
        return icons.Clock || null;
      case "LIVE":
        return icons.Play || null;
      case "COMPLETED":
        return icons.CheckCircle || null;
      default:
        return icons.Clock || null;
    }
  };
  const filteredMatches = matches.filter((match) => {
    const team1Name = getTeam1Name(match);
    const team2Name = getTeam2Name(match);
    const leagueName = getLeagueName(match);
    const matchesSearch = team1Name.toLowerCase().includes(searchTerm.toLowerCase()) || team2Name.toLowerCase().includes(searchTerm.toLowerCase()) || leagueName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || match.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CalendarIcon = icons.Calendar;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const TrophyIcon = icons.Trophy;
  const UsersIcon = icons.Users;
  const EyeIcon = icons.Eye;
  const MoreVerticalIcon = icons.MoreVertical;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Matches" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchMatches, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          TrophyIcon ? /* @__PURE__ */ jsx(TrophyIcon, { size: 28 }) : null,
          "Matches"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage match fixtures and results" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/matches/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Match"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "match-search", className: "sr-only", children: "Search matches" }),
        SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "match-search",
            type: "text",
            placeholder: "Search matches...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10",
            "aria-label": "Search matches by teams or league"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by status" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Status" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "upcoming", children: "Upcoming" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "live", children: "Live" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-background p-1 rounded-lg border", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: viewMode === "table" ? "default" : "ghost",
            size: "icon",
            onClick: () => setViewMode("table"),
            title: "Table View",
            "aria-label": "Switch to table view",
            "aria-pressed": viewMode === "table",
            children: ListIcon ? /* @__PURE__ */ jsx(ListIcon, { size: 16 }) : null
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: viewMode === "grid" ? "default" : "ghost",
            size: "icon",
            onClick: () => setViewMode("grid"),
            title: "Grid View",
            "aria-label": "Switch to grid view",
            "aria-pressed": viewMode === "grid",
            children: GridIcon ? /* @__PURE__ */ jsx(GridIcon, { size: 16 }) : null
          }
        )
      ] })
    ] }),
    filteredMatches.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm || statusFilter !== "all" ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : TrophyIcon ? /* @__PURE__ */ jsx(TrophyIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm || statusFilter !== "all" ? "No matches found" : "No matches yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm || statusFilter !== "all" ? "Try adjusting your search or filters" : "Create your first match to get started" })
      ] }),
      !searchTerm && statusFilter === "all" && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/matches/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Match"
      ] }) })
    ] }) }) }) : viewMode === "table" ? (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 16 }) : null,
            "Teams"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            TrophyIcon ? /* @__PURE__ */ jsx(TrophyIcon, { size: 16 }) : null,
            "League"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            icons.CheckCircle ? /* @__PURE__ */ jsx(icons.CheckCircle, { size: 16 }) : null,
            "Status"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 16 }) : null,
            "Date & Time"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Score" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredMatches.map((match) => {
          const StatusIcon = getStatusIcon(match.status);
          const hasScore = match.team1Score !== null && match.team2Score !== null;
          const team1Name = getTeam1Name(match);
          const team1Logo = getTeam1Logo(match);
          const team2Name = getTeam2Name(match);
          const team2Logo = getTeam2Logo(match);
          return /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                team1Logo && /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: team1Logo,
                    alt: team1Name,
                    className: "w-6 h-6 object-contain",
                    onError: (e) => {
                      e.target.style.display = "none";
                    }
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: team1Name })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground px-2", children: "vs" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                team2Logo && /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: team2Logo,
                    alt: team2Name,
                    className: "w-6 h-6 object-contain",
                    onError: (e) => {
                      e.target.style.display = "none";
                    }
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: team2Name })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: getLeagueName(match) }) }),
            /* @__PURE__ */ jsx(TableCell, { children: StatusIcon && /* @__PURE__ */ jsxs(
              Badge,
              {
                variant: "outline",
                className: cn(
                  "flex items-center gap-1.5 uppercase text-xs font-semibold",
                  getStatusColor(match.status),
                  "text-white border-0"
                ),
                children: [
                  /* @__PURE__ */ jsx(StatusIcon, { size: 14 }),
                  match.status
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
              CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 14 }) : null,
              /* @__PURE__ */ jsx("span", { children: formatDate(match.date) })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: hasScore ? /* @__PURE__ */ jsxs("span", { className: "font-bold text-foreground", children: [
              match.team1Score,
              " - ",
              match.team2Score
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "TBD" }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/matches/view/${match.id}`, "data-astro-prefetch": true, children: [
                  EyeIcon ? /* @__PURE__ */ jsx(EyeIcon, { size: 16, className: "mr-2" }) : null,
                  "View Details"
                ] }) }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/matches/${match.id}`, "data-astro-prefetch": true, children: [
                  EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                  "Edit"
                ] }) }),
                /* @__PURE__ */ jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => handleDelete(match.id),
                    className: "text-destructive focus:text-destructive",
                    children: [
                      Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                      "Delete"
                    ]
                  }
                )
              ] })
            ] }) })
          ] }, match.id);
        }) })
      ] }) })
    ) : (
      /* Grid View */
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredMatches.map((match) => {
        const StatusIcon = getStatusIcon(match.status);
        const hasScore = match.team1Score !== null && match.team2Score !== null;
        const team1Name = getTeam1Name(match);
        const team1Logo = getTeam1Logo(match);
        const team2Name = getTeam2Name(match);
        const team2Logo = getTeam2Logo(match);
        return /* @__PURE__ */ jsx(Card, { className: "hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 pb-4 border-b", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: getLeagueName(match) }),
            StatusIcon && /* @__PURE__ */ jsxs(
              Badge,
              {
                variant: "outline",
                className: cn(
                  "flex items-center gap-1.5 uppercase text-xs font-semibold",
                  getStatusColor(match.status),
                  "text-white border-0"
                ),
                children: [
                  /* @__PURE__ */ jsx(StatusIcon, { size: 14 }),
                  match.status
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              team1Logo && /* @__PURE__ */ jsx(
                "img",
                {
                  src: team1Logo,
                  alt: team1Name,
                  className: "w-10 h-10 object-contain",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "flex-1 font-semibold", children: team1Name }),
              hasScore && /* @__PURE__ */ jsx("span", { className: "text-xl font-bold", children: match.team1Score })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground font-medium", children: "vs" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              team2Logo && /* @__PURE__ */ jsx(
                "img",
                {
                  src: team2Logo,
                  alt: team2Name,
                  className: "w-10 h-10 object-contain",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "flex-1 font-semibold", children: team2Name }),
              hasScore && /* @__PURE__ */ jsx("span", { className: "text-xl font-bold", children: match.team2Score })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
              CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 16 }) : null,
              /* @__PURE__ */ jsx("span", { children: formatDate(match.date) })
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/matches/view/${match.id}`, "data-astro-prefetch": true, children: [
                  EyeIcon ? /* @__PURE__ */ jsx(EyeIcon, { size: 16, className: "mr-2" }) : null,
                  "View Details"
                ] }) }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/matches/${match.id}`, "data-astro-prefetch": true, children: [
                  EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                  "Edit"
                ] }) }),
                /* @__PURE__ */ jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => handleDelete(match.id),
                    className: "text-destructive focus:text-destructive",
                    children: [
                      Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                      "Delete"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }) }, match.id);
      }) })
    )
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const ssr = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = await checkAuth(Astro2.request);
  if (!user) {
    return Astro2.redirect("/admin/login", 302);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Matches Management - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "MatchList", MatchList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/MatchList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/matches/index.astro";
const $$url = "/admin/matches";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  ssr,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
