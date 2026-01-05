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
export { renderers } from '../../renderers.mjs';

function TeamList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        Shield: mod.Shield,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        FileText: mod.FileText,
        Eye: mod.Eye,
        Briefcase: mod.Briefcase
      });
    });
  }, []);
  useEffect(() => {
    fetchTeams();
  }, []);
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team?\n\nThis action cannot be undone. Players associated with this team will have their team reference removed."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete team");
      setError("");
      fetchTeams();
    } catch (err) {
      setError("Error deleting team: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const filteredTeams = teams.filter(
    (team) => team.name.toLowerCase().includes(searchTerm.toLowerCase()) || team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const ShieldIcon = icons.Shield;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const FileTextIcon = icons.FileText;
  const EyeIcon = icons.Eye;
  const BriefcaseIcon = icons.Briefcase;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Teams" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchTeams, variant: "default", children: [
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
          "Teams"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage teams and their information" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/teams/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Team"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "team-search", className: "sr-only", children: "Search teams" }),
      SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "team-search",
          type: "text",
          placeholder: "Search teams...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-10",
          "aria-label": "Search teams by name or description"
        }
      )
    ] }) }),
    filteredTeams.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm ? "No teams found" : "No teams yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm ? "Try a different search term" : "Create your first team to get started" })
      ] }),
      !searchTerm && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/teams/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Team"
      ] }) })
    ] }) }) }) : (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            ShieldIcon ? /* @__PURE__ */ jsx(ShieldIcon, { size: 16 }) : null,
            "Team"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 16 }) : null,
            "Players"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            FileTextIcon ? /* @__PURE__ */ jsx(FileTextIcon, { size: 16 }) : null,
            "Description"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredTeams.map((team) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            team.logo ? /* @__PURE__ */ jsx(
              "img",
              {
                src: team.logo,
                alt: team.name,
                className: "w-12 h-12 rounded-lg object-cover border-2 border-border",
                onError: (e) => {
                  e.target.src = "/images/placeholder-team.jpg";
                }
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-muted flex items-center justify-center border-2 border-border", children: ShieldIcon ? /* @__PURE__ */ jsx(ShieldIcon, { size: 24, className: "text-muted-foreground" }) : null }),
            /* @__PURE__ */ jsx("strong", { className: "font-semibold text-foreground", children: team.name })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            UsersIcon ? /* @__PURE__ */ jsx(UsersIcon, { size: 14 }) : null,
            /* @__PURE__ */ jsx("span", { children: team._count?.players || 0 })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: team.description ? /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground line-clamp-2", children: team.description.length > 100 ? `${team.description.substring(0, 100)}...` : team.description }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/teams/view/${team.id}`, "data-astro-prefetch": true, children: [
                EyeIcon ? /* @__PURE__ */ jsx(EyeIcon, { size: 16, className: "mr-2" }) : null,
                "View"
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/teams/${team.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/teams/view/${team.id}#staff`, "data-astro-prefetch": true, children: [
                BriefcaseIcon ? /* @__PURE__ */ jsx(BriefcaseIcon, { size: 16, className: "mr-2" }) : null,
                "Add Staff"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(team.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, team.id)) })
      ] }) })
    )
  ] });
}

const prerender = false;
const ssr = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Teams Management - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "TeamList", TeamList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/TeamList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/teams/index.astro";
const $$url = "/admin/teams";

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
