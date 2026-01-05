import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { r as reverseCategoryMap } from '../../chunks/types_DXfYTmyI.mjs';
import { B as Button, c as checkAuth } from '../../chunks/button_DxR-TZtn.mjs';
import { I as Input } from '../../chunks/input_wveC5Rbb.mjs';
import { C as Card, d as CardContent } from '../../chunks/card_DX9qAu4V.mjs';
import { B as Badge } from '../../chunks/badge_C5xe3ZDQ.mjs';
import { S as Skeleton } from '../../chunks/skeleton_D7y0o7ki.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, D as DropdownMenu, f as DropdownMenuTrigger, g as DropdownMenuContent, h as DropdownMenuItem } from '../../chunks/dropdown-menu_CcCSlo_C.mjs';
import 'clsx';
export { renderers } from '../../renderers.mjs';

function NewsList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [commentCounts, setCommentCounts] = useState({});
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
        CheckCircle: mod.CheckCircle,
        Clock: mod.Clock,
        AlertCircle: mod.AlertCircle,
        Newspaper: mod.Newspaper,
        User: mod.User,
        Calendar: mod.Calendar,
        Eye: mod.Eye,
        Tag: mod.Tag,
        FileText: mod.FileText,
        Image: mod.Image,
        Globe: mod.Globe,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        MessageSquare: mod.MessageSquare
      });
    });
  }, []);
  useEffect(() => {
    fetchArticles();
  }, []);
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/news?admin=true");
      if (!response.ok) throw new Error("Failed to fetch articles");
      const data = await response.json();
      setArticles(data);
      const counts = {};
      await Promise.all(
        data.map(async (article) => {
          try {
            const commentsResponse = await fetch(`/api/comments?articleId=${article.id}&admin=true`);
            if (commentsResponse.ok) {
              const comments = await commentsResponse.json();
              const countAllComments = (commentsArray) => {
                if (!Array.isArray(commentsArray)) return 0;
                return commentsArray.reduce((total, comment) => {
                  const replyCount = comment.replies ? countAllComments(comment.replies) : 0;
                  return total + 1 + replyCount;
                }, 0);
              };
              counts[article.id] = countAllComments(comments);
            } else {
              counts[article.id] = 0;
            }
          } catch {
            counts[article.id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    } catch (err) {
      setError(err.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this article?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete article");
      setError("");
      fetchArticles();
    } catch (err) {
      setError("Error deleting article: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const formatDate = (date) => {
    if (!date) return "Not published";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const filteredArticles = articles.filter(
    (article) => article.title.toLowerCase().includes(searchTerm.toLowerCase()) || article.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getCategoryColor = (category) => {
    const colors = {
      "Interviews": "#667eea",
      "Championships": "#f5576c",
      "Match report": "#4facfe",
      "Analysis": "#43e97b"
    };
    return colors[category] || "#64748b";
  };
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CheckCircleIcon = icons.CheckCircle;
  const ClockIcon = icons.Clock;
  const AlertCircleIcon = icons.AlertCircle;
  const NewspaperIcon = icons.Newspaper;
  const UserIcon = icons.User;
  const CalendarIcon = icons.Calendar;
  const EyeIcon = icons.Eye;
  const TagIcon = icons.Tag;
  const FileTextIcon = icons.FileText;
  const ImageIcon = icons.Image;
  const GlobeIcon = icons.Globe;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const MessageSquareIcon = icons.MessageSquare;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Articles" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchArticles, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          NewspaperIcon ? /* @__PURE__ */ jsx(NewspaperIcon, { size: 28 }) : null,
          "News Articles"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your news articles and blog posts" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/news/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Article"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "article-search", className: "sr-only", children: "Search articles" }),
        SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "article-search",
            type: "text",
            placeholder: "Search articles...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10",
            "aria-label": "Search articles by title or slug"
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
    filteredArticles.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: searchTerm ? SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 64 }) : null : NewspaperIcon ? /* @__PURE__ */ jsx(NewspaperIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm ? "No articles found" : "No articles yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm ? "Try a different search term" : "Create your first news article to get started" })
      ] }),
      !searchTerm && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/news/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Create Article"
      ] }) })
    ] }) }) }) : viewMode === "table" ? (
      /* Table View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            FileTextIcon ? /* @__PURE__ */ jsx(FileTextIcon, { size: 16 }) : null,
            "Article"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            TagIcon ? /* @__PURE__ */ jsx(TagIcon, { size: 16 }) : null,
            "Category"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 16 }) : null,
            "Author"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CheckCircleIcon ? /* @__PURE__ */ jsx(CheckCircleIcon, { size: 16 }) : null,
            "Status"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 16 }) : null,
            "Published"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            MessageSquareIcon ? /* @__PURE__ */ jsx(MessageSquareIcon, { size: 16 }) : null,
            "Comments"
          ] }) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredArticles.map((article) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              article.image && ImageIcon ? /* @__PURE__ */ jsx(ImageIcon, { size: 14, className: "text-muted-foreground flex-shrink-0" }) : null,
              /* @__PURE__ */ jsx("strong", { className: "font-semibold text-foreground", children: article.title })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-mono flex items-center gap-1", children: [
              GlobeIcon ? /* @__PURE__ */ jsx(GlobeIcon, { size: 12 }) : null,
              "/",
              article.slug
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
            Badge,
            {
              style: {
                backgroundColor: getCategoryColor(reverseCategoryMap[article.category]),
                color: "white"
              },
              className: "text-xs uppercase",
              children: [
                TagIcon ? /* @__PURE__ */ jsx(TagIcon, { size: 12, className: "mr-1" }) : null,
                reverseCategoryMap[article.category]
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 16 }) : null,
            /* @__PURE__ */ jsx("span", { children: article.author.name })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: article.published ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-green-50 text-green-700 border-green-200", children: [
            CheckCircleIcon ? /* @__PURE__ */ jsx(CheckCircleIcon, { size: 14, className: "mr-1" }) : null,
            "Published"
          ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200", children: [
            ClockIcon ? /* @__PURE__ */ jsx(ClockIcon, { size: 14, className: "mr-1" }) : null,
            "Draft"
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 14 }) : null,
            /* @__PURE__ */ jsx("span", { children: formatDate(article.publishedAt) })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            MessageSquareIcon ? /* @__PURE__ */ jsx(MessageSquareIcon, { size: 14 }) : null,
            /* @__PURE__ */ jsx("span", { children: commentCounts[article.id] ?? 0 })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 18 }) : null }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/news/view/${article.id}`, "data-astro-prefetch": true, children: [
                EyeIcon ? /* @__PURE__ */ jsx(EyeIcon, { size: 16, className: "mr-2" }) : null,
                "View"
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/news/${article.id}`, "data-astro-prefetch": true, children: [
                EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                "Edit"
              ] }) }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => handleDelete(article.id),
                  className: "text-destructive focus:text-destructive",
                  children: [
                    Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16, className: "mr-2" }) : null,
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, article.id)) })
      ] }) })
    ) : (
      /* Grid View */
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredArticles.map((article) => /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
        article.image && /* @__PURE__ */ jsx("div", { className: "w-full h-48 overflow-hidden bg-muted", children: /* @__PURE__ */ jsx("img", { src: article.image, alt: article.title, className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
            /* @__PURE__ */ jsxs(
              Badge,
              {
                style: {
                  backgroundColor: getCategoryColor(reverseCategoryMap[article.category]),
                  color: "white"
                },
                className: "text-xs uppercase",
                children: [
                  TagIcon ? /* @__PURE__ */ jsx(TagIcon, { size: 12, className: "mr-1" }) : null,
                  reverseCategoryMap[article.category]
                ]
              }
            ),
            article.published ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-green-50 text-green-700 border-green-200", children: [
              CheckCircleIcon ? /* @__PURE__ */ jsx(CheckCircleIcon, { size: 14, className: "mr-1" }) : null,
              "Published"
            ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200", children: [
              ClockIcon ? /* @__PURE__ */ jsx(ClockIcon, { size: 14, className: "mr-1" }) : null,
              "Draft"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold mb-2 text-foreground flex items-center gap-2", children: [
            article.image && ImageIcon ? /* @__PURE__ */ jsx(ImageIcon, { size: 16, className: "text-muted-foreground" }) : null,
            article.title
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-3", children: article.excerpt || article.content.substring(0, 100) + "..." }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                UserIcon ? /* @__PURE__ */ jsx(UserIcon, { size: 14 }) : null,
                article.author.name
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                CalendarIcon ? /* @__PURE__ */ jsx(CalendarIcon, { size: 14 }) : null,
                formatDate(article.publishedAt)
              ] })
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: MoreVerticalIcon ? /* @__PURE__ */ jsx(MoreVerticalIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/news/view/${article.id}`, "data-astro-prefetch": true, children: [
                  EyeIcon ? /* @__PURE__ */ jsx(EyeIcon, { size: 16, className: "mr-2" }) : null,
                  "View"
                ] }) }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: `/admin/news/${article.id}`, "data-astro-prefetch": true, children: [
                  EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16, className: "mr-2" }) : null,
                  "Edit"
                ] }) }),
                /* @__PURE__ */ jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => handleDelete(article.id),
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
        ] })
      ] }, article.id)) })
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "News Management - Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "NewsList", NewsList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/NewsList", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/news/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/news/index.astro";
const $$url = "/admin/news";

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
