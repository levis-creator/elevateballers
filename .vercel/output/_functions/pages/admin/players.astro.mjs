import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CR5Hf1uL.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from '../../chunks/button_3jlkDYpB.mjs';
import { I as Input } from '../../chunks/input_CvRJCwEH.mjs';
import { C as Card, d as CardContent } from '../../chunks/card_BDBbvm8z.mjs';
import { S as Skeleton } from '../../chunks/skeleton_C2i3ZiV1.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, D as DropdownMenu, f as DropdownMenuTrigger, g as DropdownMenuContent, h as DropdownMenuItem } from '../../chunks/dropdown-menu_Br4JQ3Dq.mjs';
import 'clsx';
export { renderers } from '../../renderers.mjs';

function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
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
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Shield: mod.Shield,
        MapPin: mod.MapPin
      });
    });
  }, []);
  useEffect(() => {
    fetchPlayers();
  }, []);
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch players");
      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      setError(err.message || "Failed to load players");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete player");
      setError("");
      fetchPlayers();
    } catch (err) {
      setError("Error deleting player: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const getPlayerName = (player) => {
    const firstName = player.firstName || "";
    const lastName = player.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unnamed Player";
  };
  const filteredPlayers = players.filter((player) => {
    const fullName = getPlayerName(player).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || player.team?.name && player.team.name.toLowerCase().includes(searchTerm.toLowerCase()) || player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const ShieldIcon = icons.Shield;
  const MapPinIcon = icons.MapPin;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Players" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchPlayers, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 28 }) : null,
          "Players"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage player profiles and information" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/players/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Player"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "player-search", className: "sr-only", children: "Search players" }),
        SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "player-search",
            type: "text",
            placeholder: "Search players...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10",
            "aria-label": "Search players by name, team, or position"
          }
        )
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
    filteredPlayers.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm ? "No players found" : "No players yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm ? "Try a different search term" : "Create your first player to get started" })
      ] }),
      !searchTerm && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/players/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Player"
      ] }) })
    ] }) }) }) : viewMode === "table" ? (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 16 }) : null,
            "Player"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            ShieldIcon ? /* @__PURE__ */ jsx(ShieldIcon, { size: 16 }) : null,
            "Team"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            MapPinIcon ? /* @__PURE__ */ jsx(MapPinIcon, { size: 16 }) : null,
            "Position"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Jersey #" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredPlayers.map((player) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            player.image ? /* @__PURE__ */ jsx(
              "img",
              {
                src: player.image,
                alt: getPlayerName(player),
                className: "w-10 h-10 rounded-full object-cover",
                onError: (e) => {
                  e.target.src = "/images/placeholder-player.jpg";
                }
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 20, className: "text-muted-foreground" }) : null }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("strong", { className: "font-semibold text-foreground", children: getPlayerName(player) }),
              player.bio && /* @__PURE__ */ jsxs("small", { className: "text-xs text-muted-foreground line-clamp-1", children: [
                player.bio.substring(0, 50),
                "..."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: player.team?.name ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            ShieldIcon ? /* @__PURE__ */ jsx(ShieldIcon, { size: 14 }) : null,
            /* @__PURE__ */ jsx("span", { children: player.team.name })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: player.position || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: player.jerseyNumber || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/players/${player.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(player.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, player.id)) })
      ] }) })
    ) : (
      /* Grid View */
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredPlayers.map((player) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full h-64 bg-muted overflow-hidden", children: [
          player.image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: player.image,
              alt: getPlayerName(player),
              className: "w-full h-full object-cover",
              onError: (e) => {
                e.target.src = "/images/placeholder-player.jpg";
              }
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 64, className: "text-muted-foreground" }) : null }),
          player.jerseyNumber && /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg", children: player.jerseyNumber })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-foreground", children: getPlayerName(player) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4", children: [
            player.team?.name && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
              ShieldIcon ? /* @__PURE__ */ jsx(ShieldIcon, { size: 16 }) : null,
              /* @__PURE__ */ jsx("span", { children: player.team.name })
            ] }),
            player.position && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
              MapPinIcon ? /* @__PURE__ */ jsx(MapPinIcon, { size: 16 }) : null,
              /* @__PURE__ */ jsx("span", { children: player.position })
            ] })
          ] }),
          player.bio && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-3", children: [
            player.bio.substring(0, 100),
            "..."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t", children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 16 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/players/${player.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(player.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] })
      ] }, player.id)) })
    )
  ] });
}

const prerender = false;
const ssr = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Players Management - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "PlayerList", PlayerList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/PlayerList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/players/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/players/index.astro";
const $$url = "/admin/players";

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
