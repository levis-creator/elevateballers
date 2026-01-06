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
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, D as DropdownMenu, f as DropdownMenuTrigger, g as DropdownMenuContent, h as DropdownMenuItem } from '../../chunks/dropdown-menu_CcCSlo_C.mjs';
export { renderers } from '../../renderers.mjs';

function StaffList() {
  const [staff, setStaff] = useState([]);
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
        Briefcase: mod.Briefcase,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Mail: mod.Mail,
        Phone: mod.Phone
      });
    });
  }, []);
  useEffect(() => {
    fetchStaff();
  }, []);
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setStaff(data);
    } catch (err) {
      setError(err.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this staff member?\n\nThis action cannot be undone. Team assignments will be removed."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete staff");
      setError("");
      fetchStaff();
    } catch (err) {
      setError("Error deleting staff: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const getRoleColor = (role) => {
    const colors = {
      "COACH": "bg-primary",
      "ASSISTANT_COACH": "bg-blue-500",
      "MANAGER": "bg-red-500",
      "ASSISTANT_MANAGER": "bg-green-500",
      "PHYSIOTHERAPIST": "bg-pink-500",
      "TRAINER": "bg-yellow-500",
      "ANALYST": "bg-cyan-500",
      "OTHER": "bg-slate-500"
    };
    return colors[role] || "bg-slate-500";
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
  const filteredStaff = staff.filter(
    (member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()) || member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase()) || member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const BriefcaseIcon = icons.Briefcase;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const MailIcon = icons.Mail;
  const PhoneIcon = icons.Phone;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Staff" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchStaff, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          BriefcaseIcon ? /* @__PURE__ */ jsx(BriefcaseIcon, { size: 28 }) : null,
          "Staff Members"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage coaches, managers, and team staff" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/staff/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Staff"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "staff-search", className: "sr-only", children: "Search staff" }),
        SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "staff-search",
            type: "text",
            placeholder: "Search staff...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10",
            "aria-label": "Search staff by name, email, phone, or role"
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
    filteredStaff.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : BriefcaseIcon ? /* @__PURE__ */ jsx(BriefcaseIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm ? "No staff found" : "No staff yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm ? "Try a different search term" : "Create your first staff member to get started" })
      ] }),
      !searchTerm && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/staff/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Staff"
      ] }) })
    ] }) }) }) : viewMode === "table" ? (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 16 }) : null,
            "Name"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            BriefcaseIcon ? /* @__PURE__ */ jsx(BriefcaseIcon, { size: 16 }) : null,
            "Role"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            MailIcon ? /* @__PURE__ */ jsx(MailIcon, { size: 16 }) : null,
            "Email"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            PhoneIcon ? /* @__PURE__ */ jsx(PhoneIcon, { size: 16 }) : null,
            "Phone"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredStaff.map((member) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            member.image ? /* @__PURE__ */ jsx(
              "img",
              {
                src: member.image,
                alt: `${member.firstName} ${member.lastName}`,
                className: "w-10 h-10 rounded-full object-cover",
                onError: (e) => {
                  e.target.src = "/images/placeholder-staff.jpg";
                }
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 20, className: "text-muted-foreground" }) : null }),
            /* @__PURE__ */ jsxs("strong", { className: "font-semibold text-foreground", children: [
              member.firstName,
              " ",
              member.lastName
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn("text-white border-0", getRoleColor(member.role)),
              children: getRoleLabel(member.role)
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { children: member.email ? /* @__PURE__ */ jsx("a", { href: `mailto:${member.email}`, className: "text-primary hover:underline", children: member.email }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: member.phone ? /* @__PURE__ */ jsx("a", { href: `tel:${member.phone}`, className: "text-primary hover:underline", children: member.phone }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/staff/${member.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(member.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, member.id)) })
      ] }) })
    ) : (
      /* Grid View */
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredStaff.map((member) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
        /* @__PURE__ */ jsx("div", { className: "relative w-full h-64 bg-muted overflow-hidden", children: member.image ? /* @__PURE__ */ jsx(
          "img",
          {
            src: member.image,
            alt: `${member.firstName} ${member.lastName}`,
            className: "w-full h-full object-cover",
            onError: (e) => {
              e.target.src = "/images/placeholder-staff.jpg";
            }
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 64, className: "text-muted-foreground" }) : null }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xl font-semibold mb-2 text-foreground", children: [
            member.firstName,
            " ",
            member.lastName
          ] }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn("mb-4 text-white border-0", getRoleColor(member.role)),
              children: getRoleLabel(member.role)
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4 text-sm", children: [
            member.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
              MailIcon ? /* @__PURE__ */ jsx(MailIcon, { size: 16 }) : null,
              /* @__PURE__ */ jsx("a", { href: `mailto:${member.email}`, className: "hover:underline", children: member.email })
            ] }),
            member.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
              PhoneIcon ? /* @__PURE__ */ jsx(PhoneIcon, { size: 16 }) : null,
              /* @__PURE__ */ jsx("a", { href: `tel:${member.phone}`, className: "hover:underline", children: member.phone })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t", children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 16 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/staff/${member.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(member.id),
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
      ] }, member.id)) })
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Staff Management - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "StaffList", StaffList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/StaffList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/staff/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/staff/index.astro";
const $$url = "/admin/staff";

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
