import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_C6oIy3vZ.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, a as cn } from '../../chunks/button_DxR-TZtn.mjs';
import { I as Input } from '../../chunks/input_wveC5Rbb.mjs';
import { C as Card, d as CardContent } from '../../chunks/card_DX9qAu4V.mjs';
import { S as Skeleton } from '../../chunks/skeleton_D7y0o7ki.mjs';
import { B as Badge } from '../../chunks/badge_C5xe3ZDQ.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/dropdown-menu_CcCSlo_C.mjs';
export { renderers } from '../../renderers.mjs';

function MediaGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
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
        Images: mod.Images,
        Image: mod.Image,
        Video: mod.Video,
        Music: mod.Music,
        AlertCircle: mod.AlertCircle,
        ExternalLink: mod.ExternalLink,
        RefreshCw: mod.RefreshCw
      });
    });
  }, []);
  useEffect(() => {
    fetchMedia();
  }, [filterType]);
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const type = filterType === "all" ? void 0 : filterType.toUpperCase();
      const response = await fetch(`/api/media${type ? `?type=${type}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch media");
      const data = await response.json();
      setMediaItems(data);
    } catch (err) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this media item?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete media");
      setError("");
      fetchMedia();
    } catch (err) {
      setError("Error deleting media: " + err.message);
      setTimeout(() => setError(""), 5e3);
    }
  };
  const getMediaTypeColor = (type) => {
    const colors = {
      IMAGE: "bg-primary",
      VIDEO: "bg-red-500",
      AUDIO: "bg-green-500"
    };
    return colors[type] || "bg-slate-500";
  };
  const getMediaIcon = (type) => {
    if (type === "IMAGE") return icons.Image;
    if (type === "VIDEO") return icons.Video;
    if (type === "AUDIO") return icons.Music;
    return null;
  };
  const filteredMedia = mediaItems.filter(
    (item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const ImagesIcon = icons.Images;
  const ImageIcon = icons.Image;
  const VideoIcon = icons.Video;
  const MusicIcon = icons.Music;
  const ExternalLinkIcon = icons.ExternalLink;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }, i)) });
  }
  if (error) {
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 24, className: "text-destructive" }) : null,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2", children: "Error Loading Media" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: fetchMedia, variant: "default", children: [
        RefreshCwIcon ? /* @__PURE__ */ jsx(RefreshCwIcon, { size: 18, className: "mr-2" }) : null,
        "Try Again"
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: "Media Gallery" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage images, videos, and audio files" })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/media/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Add Media"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-stretch md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "media-search", className: "sr-only", children: "Search media" }),
        SearchIcon ? /* @__PURE__ */ jsx(SearchIcon, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }) : null,
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "media-search",
            type: "text",
            placeholder: "Search media...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10",
            "aria-label": "Search media by title or tags"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-background p-1 rounded-lg border", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: filterType === "all" ? "default" : "ghost",
            size: "sm",
            onClick: () => setFilterType("all"),
            "aria-label": "Show all media",
            "aria-pressed": filterType === "all",
            children: "All"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: filterType === "image" ? "default" : "ghost",
            size: "sm",
            onClick: () => setFilterType("image"),
            "aria-label": "Filter images",
            "aria-pressed": filterType === "image",
            children: [
              ImageIcon ? /* @__PURE__ */ jsx(ImageIcon, { size: 16, className: "mr-2" }) : null,
              "Images"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: filterType === "video" ? "default" : "ghost",
            size: "sm",
            onClick: () => setFilterType("video"),
            "aria-label": "Filter videos",
            "aria-pressed": filterType === "video",
            children: [
              VideoIcon ? /* @__PURE__ */ jsx(VideoIcon, { size: 16, className: "mr-2" }) : null,
              "Videos"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: filterType === "audio" ? "default" : "ghost",
            size: "sm",
            onClick: () => setFilterType("audio"),
            "aria-label": "Filter audio",
            "aria-pressed": filterType === "audio",
            children: [
              MusicIcon ? /* @__PURE__ */ jsx(MusicIcon, { size: 16, className: "mr-2" }) : null,
              "Audio"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-background p-1 rounded-lg border", children: [
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
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: viewMode === "list" ? "default" : "ghost",
            size: "icon",
            onClick: () => setViewMode("list"),
            title: "List View",
            "aria-label": "Switch to list view",
            "aria-pressed": viewMode === "list",
            children: ListIcon ? /* @__PURE__ */ jsx(ListIcon, { size: 16 }) : null
          }
        )
      ] })
    ] }),
    filteredMedia.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: ImagesIcon ? /* @__PURE__ */ jsx(ImagesIcon, { size: 64 }) : null }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: searchTerm || filterType !== "all" ? "No media found" : "No media yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchTerm || filterType !== "all" ? "Try adjusting your search or filters" : "Add your first media item to get started" })
      ] }),
      !searchTerm && filterType === "all" && /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/media/new", "data-astro-prefetch": true, children: [
        PlusIcon ? /* @__PURE__ */ jsx(PlusIcon, { size: 18, className: "mr-2" }) : null,
        "Add Media"
      ] }) })
    ] }) }) }) : viewMode === "grid" ? (
      /* Grid View */
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: filteredMedia.map((item) => {
        const MediaIcon = getMediaIcon(item.type);
        return /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full h-48 bg-muted overflow-hidden", children: [
            item.type === "IMAGE" ? /* @__PURE__ */ jsx(
              "img",
              {
                src: item.url,
                alt: item.title,
                className: "w-full h-full object-cover",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ) : /* @__PURE__ */ jsx("div", { className: cn("w-full h-full flex items-center justify-center", getMediaTypeColor(item.type), "bg-opacity-20"), children: MediaIcon ? /* @__PURE__ */ jsx(MediaIcon, { size: 48, className: "text-primary" }) : null }),
            /* @__PURE__ */ jsxs(
              Badge,
              {
                variant: "outline",
                className: cn(
                  "absolute top-2 right-2 text-white border-0 flex items-center gap-1.5 uppercase text-xs font-semibold",
                  getMediaTypeColor(item.type)
                ),
                children: [
                  MediaIcon ? /* @__PURE__ */ jsx(MediaIcon, { size: 14 }) : null,
                  item.type
                ]
              }
            ),
            item.thumbnail && item.type !== "IMAGE" && /* @__PURE__ */ jsx(
              "img",
              {
                src: item.thumbnail,
                alt: item.title,
                className: "absolute inset-0 w-full h-full object-cover opacity-30"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2 text-foreground line-clamp-2", children: item.title }),
            item.tags && item.tags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mb-3", children: [
              item.tags.slice(0, 3).map((tag, idx) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, idx)),
              item.tags.length > 3 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                "+",
                item.tags.length - 3
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-3 border-t", children: [
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, children: /* @__PURE__ */ jsx("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", title: "View", children: ExternalLinkIcon ? /* @__PURE__ */ jsx(ExternalLinkIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, children: /* @__PURE__ */ jsx("a", { href: `/admin/media/${item.id}`, "data-astro-prefetch": true, title: "Edit", children: EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "h-8 w-8 text-destructive hover:text-destructive",
                  onClick: () => handleDelete(item.id),
                  title: "Delete",
                  children: Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16 }) : null
                }
              )
            ] })
          ] })
        ] }, item.id);
      }) })
    ) : (
      /* List View */
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Preview" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Title" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Type" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Tags" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredMedia.map((item) => {
          const MediaIcon = getMediaIcon(item.type);
          return /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-lg overflow-hidden bg-muted", children: item.type === "IMAGE" ? /* @__PURE__ */ jsx("img", { src: item.url, alt: item.title, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: cn("w-full h-full flex items-center justify-center", getMediaTypeColor(item.type), "bg-opacity-20"), children: MediaIcon ? /* @__PURE__ */ jsx(MediaIcon, { size: 24, className: "text-primary" }) : null }) }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("strong", { className: "font-semibold text-foreground", children: item.title }),
              /* @__PURE__ */ jsx("small", { className: "text-xs text-muted-foreground font-mono", children: item.url })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
              Badge,
              {
                variant: "outline",
                className: cn(
                  "text-white border-0 flex items-center gap-1.5 uppercase text-xs font-semibold w-fit",
                  getMediaTypeColor(item.type)
                ),
                children: [
                  MediaIcon ? /* @__PURE__ */ jsx(MediaIcon, { size: 14 }) : null,
                  item.type
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(TableCell, { children: item.tags && item.tags.length > 0 ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: item.tags.slice(0, 3).map((tag, idx) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, idx)) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", asChild: true, children: /* @__PURE__ */ jsx("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", title: "View media", children: ExternalLinkIcon ? /* @__PURE__ */ jsx(ExternalLinkIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", asChild: true, children: /* @__PURE__ */ jsx("a", { href: `/admin/media/${item.id}`, "data-astro-prefetch": true, title: "Edit media", children: EditIcon ? /* @__PURE__ */ jsx(EditIcon, { size: 16 }) : null }) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "h-9 w-9 text-destructive hover:text-destructive",
                  onClick: () => handleDelete(item.id),
                  title: "Delete media",
                  children: Trash2Icon ? /* @__PURE__ */ jsx(Trash2Icon, { size: 16 }) : null
                }
              )
            ] }) })
          ] }, item.id);
        }) })
      ] }) })
    )
  ] });
}

const prerender = false;
const ssr = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Media Management - Admin" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "MediaGallery", MediaGallery, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/MediaGallery", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/media/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/media/index.astro";
const $$url = "/admin/media";

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
