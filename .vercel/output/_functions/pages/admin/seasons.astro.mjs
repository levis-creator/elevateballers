import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CR5Hf1uL.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, c as checkAuth } from '../../chunks/button_3jlkDYpB.mjs';
import { I as Input } from '../../chunks/input_CvRJCwEH.mjs';
import { C as Card, d as CardContent } from '../../chunks/card_BDBbvm8z.mjs';
import { S as Skeleton } from '../../chunks/skeleton_C2i3ZiV1.mjs';
import { B as Badge } from '../../chunks/badge_C1Qr2QXB.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, D as DropdownMenu, f as DropdownMenuTrigger, g as DropdownMenuContent, h as DropdownMenuItem } from '../../chunks/dropdown-menu_Br4JQ3Dq.mjs';
export { renderers } from '../../renderers.mjs';

function SeasonList() {
  const [seasons, setSeasons] = useState([]);
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
        CalendarRange: mod.CalendarRange,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        CheckCircle: mod.CheckCircle,
        XCircle: mod.XCircle
      });
    });
  }, []);
  useEffect(() => {
    fetchSeasons();
  }, []);
  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/seasons");
      if (!response.ok) throw new Error("Failed to fetch seasons");
      const data = await response.json();
      setSeasons(data);
    } catch (err) {
      setError(err.message || "Failed to load seasons");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this season?\n\nThis action cannot be undone. Leagues and matches associated with this season will have their season reference removed."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/seasons/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete season");
      setError("");
      fetchSeasons();
    } catch (err) {
      setError("Error deleting season: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const filteredSeasons = seasons.filter(
    (season) => season.name.toLowerCase().includes(searchTerm.toLowerCase()) || season.description && season.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CalendarRangeIcon = icons.CalendarRange;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const CheckCircleIcon = icons.CheckCircle;
  const XCircleIcon = icons.XCircle;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Seasons" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchSeasons, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          CalendarRangeIcon ? /* @__PURE__ */ jsx(CalendarRangeIcon, { size: 28 }) : null,
          "Seasons"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage seasons and tournaments" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/seasons/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Season"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "season-search", className: "sr-only", children: "Search seasons" }),
      SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "season-search",
          type: "text",
          placeholder: "Search seasons...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-10",
          "aria-label": "Search seasons by name or description"
        }
      )
    ] }) }),
    filteredSeasons.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : CalendarRangeIcon ? /* @__PURE__ */ jsx(CalendarRangeIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm ? "No seasons found" : "No seasons yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm ? "Try a different search term" : "Create your first season to get started" })
      ] }),
      !searchTerm && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/seasons/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Season"
      ] }) })
    ] }) }) }) : (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CalendarRangeIcon ? /* @__PURE__ */ jsx(CalendarRangeIcon, { size: 16 }) : null,
            "Season"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CalendarRangeIcon ? /* @__PURE__ */ jsx(CalendarRangeIcon, { size: 16 }) : null,
            "Period"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "League" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Matches" }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CheckCircleIcon ? /* @__PURE__ */ jsx(CheckCircleIcon, { size: 16 }) : null,
            "Status"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredSeasons.map((season) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx("strong", { className: "font-semibold text-foreground", children: season.name }),
            season.description && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground line-clamp-1", children: [
              season.description.substring(0, 100),
              season.description.length > 100 ? "..." : ""
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 text-sm", children: [
            /* @__PURE__ */ jsx("span", { children: formatDate(season.startDate) }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "to" }),
            /* @__PURE__ */ jsx("span", { children: formatDate(season.endDate) })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: season.league ? /* @__PURE__ */ jsx("span", { className: "text-sm", children: season.league.name }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: "Not set" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: "text-sm", children: season._count.matches }) }),
          /* @__PURE__ */ jsx(TableCell, { children: season.active ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-green-500 text-white border-0 flex items-center gap-1.5 w-fit", children: [
            CheckCircleIcon ? /* @__PURE__ */ jsx(CheckCircleIcon, { size: 14 }) : null,
            "Active"
          ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-slate-500 text-white border-0 flex items-center gap-1.5 w-fit", children: [
            XCircleIcon ? /* @__PURE__ */ jsx(XCircleIcon, { size: 14 }) : null,
            "Inactive"
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/seasons/${season.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(season.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, season.id)) })
      ] }) })
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Seasons Management - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "SeasonList", SeasonList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/SeasonList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/seasons/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/seasons/index.astro";
const $$url = "/admin/seasons";

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
