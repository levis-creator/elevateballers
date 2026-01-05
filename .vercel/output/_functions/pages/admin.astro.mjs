import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../chunks/AdminLayout_C6oIy3vZ.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from '../chunks/card_DX9qAu4V.mjs';
import { S as Skeleton } from '../chunks/skeleton_D7y0o7ki.mjs';
import { a as cn, c as checkAuth } from '../chunks/button_DxR-TZtn.mjs';
export { renderers } from '../renderers.mjs';

function Dashboard() {
  const [stats, setStats] = useState({
    newsCount: 0,
    matchesCount: 0,
    playersCount: 0,
    mediaCount: 0,
    pagesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('../chunks/lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        Newspaper: mod.Newspaper,
        Calendar: mod.Calendar,
        Users: mod.Users,
        Images: mod.Images,
        FileText: mod.FileText,
        Plus: mod.Plus,
        FolderOpen: mod.FolderOpen,
        Bolt: mod.Bolt,
        ChevronRight: mod.ChevronRight,
        AlertCircle: mod.AlertCircle,
        Bell: mod.Bell,
        UserPlus: mod.UserPlus,
        Link: mod.Link
      });
    });
  }, []);
  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await fetch("/api/notifications?unread=true&limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId, read: true })
      });
      if (response.ok) {
        setNotifications(
          (prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };
  const approveTeam = async (teamId, notificationId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true })
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error2 = await response.json();
        alert("Error approving team: " + (error2.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error approving team:", err);
      alert("Error approving team: " + err.message);
    }
  };
  const rejectTeam = async (teamId, notificationId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false })
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error2 = await response.json();
        alert("Error rejecting team: " + (error2.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error rejecting team:", err);
      alert("Error rejecting team: " + err.message);
    }
  };
  const approvePlayer = async (playerId, notificationId) => {
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true })
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error2 = await response.json();
        alert("Error approving player: " + (error2.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error approving player:", err);
      alert("Error approving player: " + err.message);
    }
  };
  const rejectPlayer = async (playerId, notificationId) => {
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false })
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error2 = await response.json();
        alert("Error rejecting player: " + (error2.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error rejecting player:", err);
      alert("Error rejecting player: " + err.message);
    }
  };
  const fetchStats = async () => {
    try {
      setLoading(true);
      const [newsRes, matchesRes, playersRes, mediaRes, pagesRes] = await Promise.all([
        fetch("/api/news?admin=true"),
        fetch("/api/matches"),
        fetch("/api/players"),
        fetch("/api/media"),
        fetch("/api/pages?admin=true")
      ]);
      const [news, matches, players, media, pages] = await Promise.all([
        newsRes.json(),
        matchesRes.json(),
        playersRes.json(),
        mediaRes.json(),
        pagesRes.json()
      ]);
      setStats({
        newsCount: news.length || 0,
        matchesCount: matches.length || 0,
        playersCount: players.length || 0,
        mediaCount: media.length || 0,
        pagesCount: pages.length || 0
      });
    } catch (err) {
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-14 w-14 rounded-xl mb-4" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-20 mb-2" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32" })
    ] }) }, i)) });
  }
  if (error) {
    const AlertCircleIcon = icons.AlertCircle;
    return /* @__PURE__ */ jsx(Card, { className: "border-destructive", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-destructive", children: [
      AlertCircleIcon ? /* @__PURE__ */ jsx(AlertCircleIcon, { size: 20 }) : null,
      /* @__PURE__ */ jsx("span", { children: error })
    ] }) }) });
  }
  const statCards = [
    {
      title: "News Articles",
      count: stats.newsCount,
      icon: icons.Newspaper,
      link: "/admin/news",
      color: "#667eea"
    },
    {
      title: "Matches",
      count: stats.matchesCount,
      icon: icons.Calendar,
      link: "/admin/matches",
      color: "#f5576c"
    },
    {
      title: "Players",
      count: stats.playersCount,
      icon: icons.Users,
      link: "/admin/players",
      color: "#4facfe"
    },
    {
      title: "Media Items",
      count: stats.mediaCount,
      icon: icons.Images,
      link: "/admin/media",
      color: "#fa709a"
    }
  ];
  const quickActions = [
    { icon: icons.Plus, label: "Create News Article", link: "/admin/news/new", color: "#667eea" },
    { icon: icons.Plus, label: "Create Match", link: "/admin/matches/new", color: "#f5576c" },
    { icon: icons.Plus, label: "Add Player", link: "/admin/players/new", color: "#4facfe" },
    { icon: icons.Plus, label: "Add Media", link: "/admin/media/new", color: "#fa709a" },
    { icon: icons.Plus, label: "Create Page", link: "/admin/pages/new", color: "#10b981" }
  ];
  const ChevronRightIcon = icons.ChevronRight;
  const BoltIcon = icons.Bolt;
  const FolderOpenIcon = icons.FolderOpen;
  const NewspaperIcon = icons.Newspaper;
  const CalendarIcon = icons.Calendar;
  const UsersIcon = icons.Users;
  const ImagesIcon = icons.Images;
  const FileTextIcon = icons.FileText;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: "Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Welcome back! Here's an overview of your content." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "sr-only", children: [
      /* @__PURE__ */ jsx("h2", { children: "Content Statistics" }),
      /* @__PURE__ */ jsxs("ul", { children: [
        /* @__PURE__ */ jsxs("li", { children: [
          "News Articles: ",
          stats.newsCount
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Matches: ",
          stats.matchesCount
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Players: ",
          stats.playersCount
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Media Items: ",
          stats.mediaCount
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Pages: ",
          stats.pagesCount
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: statCards.map((card) => {
      const Icon = card.icon;
      return /* @__PURE__ */ jsx(
        "a",
        {
          href: card.link,
          className: "block no-underline",
          "data-astro-prefetch": true,
          children: /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-1 group", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity",
                style: { backgroundColor: card.color }
              }
            ),
            /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0",
                  style: { color: card.color },
                  children: Icon ? /* @__PURE__ */ jsx(Icon, { size: 24 }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-6 h-6" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-foreground mb-1 leading-none", children: card.count }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground font-medium", children: card.title })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-muted-foreground group-hover:text-foreground transition-colors", children: ChevronRightIcon ? /* @__PURE__ */ jsx(ChevronRightIcon, { size: 18, className: "group-hover:translate-x-1 transition-transform" }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-4 h-4" }) })
            ] }) })
          ] })
        },
        card.title
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-4 border-b", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-xl", children: [
            BoltIcon ? /* @__PURE__ */ jsx(BoltIcon, { size: 20 }) : null,
            "Quick Actions"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Create new content quickly" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: quickActions.map((action) => {
          const ActionIcon = action.icon;
          return /* @__PURE__ */ jsxs(
            "a",
            {
              href: action.link,
              className: cn(
                "flex items-center gap-4 p-4 rounded-lg",
                "border border-border bg-background",
                "transition-all hover:bg-accent hover:border-accent-foreground/20",
                "hover:translate-x-1 no-underline text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              ),
              "data-astro-prefetch": true,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    style: { color: action.color },
                    children: ActionIcon ? /* @__PURE__ */ jsx(ActionIcon, { size: 20 }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-5 h-5" })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: action.label }),
                ChevronRightIcon ? /* @__PURE__ */ jsx(ChevronRightIcon, { size: 16, className: "text-muted-foreground" }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-4 h-4" })
              ]
            },
            action.label
          );
        }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-4 border-b", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-xl", children: [
            FolderOpenIcon ? /* @__PURE__ */ jsx(FolderOpenIcon, { size: 20 }) : null,
            "Content Management"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Manage all your content" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
          {
            icon: NewspaperIcon,
            title: "News Articles",
            description: "Manage news and blog posts",
            link: "/admin/news",
            color: "#667eea"
          },
          {
            icon: CalendarIcon,
            title: "Matches",
            description: "Manage fixtures and results",
            link: "/admin/matches",
            color: "#f5576c"
          },
          {
            icon: UsersIcon,
            title: "Players",
            description: "Manage player profiles",
            link: "/admin/players",
            color: "#4facfe"
          },
          {
            icon: ImagesIcon,
            title: "Media",
            description: "Manage images, videos, and audio",
            link: "/admin/media",
            color: "#fa709a"
          },
          {
            icon: FileTextIcon,
            title: "Pages",
            description: "Manage static page content",
            link: "/admin/pages",
            color: "#10b981"
          }
        ].map((item) => {
          const ItemIcon = item.icon;
          return /* @__PURE__ */ jsxs(
            "a",
            {
              href: item.link,
              className: cn(
                "flex items-center gap-4 p-5 rounded-lg",
                "border border-border bg-background",
                "transition-all hover:bg-accent hover:border-accent-foreground/20",
                "hover:translate-x-1 no-underline text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              ),
              "data-astro-prefetch": true,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white",
                    style: { backgroundColor: item.color },
                    children: ItemIcon ? /* @__PURE__ */ jsx(ItemIcon, { size: 20 }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-5 h-5" })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-1", children: item.title }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: item.description })
                ] }),
                ChevronRightIcon ? /* @__PURE__ */ jsx(ChevronRightIcon, { size: 16, className: "text-muted-foreground flex-shrink-0" }) : /* @__PURE__ */ jsx(Skeleton, { className: "w-4 h-4" })
              ]
            },
            item.title
          );
        }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-4 border-b", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-xl", children: [
          icons.Bell ? /* @__PURE__ */ jsx(icons.Bell, { size: 20 }) : null,
          "Recent Registrations"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "New team and player registrations" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: notificationsLoading ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 p-4 rounded-lg border border-border", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "w-10 h-10 rounded-lg" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-3/4 mb-2" }),
          /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-1/2" })
        ] })
      ] }, i)) }) : notifications.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "No new registrations" }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: notifications.map((notification) => {
        const getIcon = () => {
          if (notification.type === "TEAM_REGISTERED") {
            return icons.Users || null;
          } else if (notification.type === "PLAYER_REGISTERED") {
            return icons.UserPlus || null;
          } else {
            return icons.Link || null;
          }
        };
        const getColor = () => {
          if (notification.type === "TEAM_REGISTERED") {
            return "#667eea";
          } else if (notification.type === "PLAYER_REGISTERED") {
            return "#4facfe";
          } else {
            return "#10b981";
          }
        };
        const NotificationIcon = getIcon();
        const color = getColor();
        const date = new Date(notification.createdAt);
        const timeAgo = formatTimeAgo(date);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex items-start gap-4 p-4 rounded-lg border transition-all",
              notification.read ? "border-border bg-background opacity-60" : "border-primary/20 bg-primary/5"
            ),
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white",
                  style: { backgroundColor: color },
                  children: NotificationIcon ? /* @__PURE__ */ jsx(NotificationIcon, { size: 20 }) : null
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground mb-1", children: notification.message }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-2", children: [
                  /* @__PURE__ */ jsx("span", { children: timeAgo }),
                  notification.team && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("span", { children: "•" }),
                    /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: `/admin/teams/view/${notification.team.id}`,
                        className: "text-primary hover:underline",
                        onClick: () => markAsRead(notification.id),
                        children: "View Team"
                      }
                    )
                  ] }),
                  notification.player && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("span", { children: "•" }),
                    /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: `/admin/players/edit/${notification.player.id}`,
                        className: "text-primary hover:underline",
                        onClick: () => markAsRead(notification.id),
                        children: "View Player"
                      }
                    )
                  ] })
                ] }),
                !notification.read && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
                  notification.type === "TEAM_REGISTERED" && notification.team && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => approveTeam(notification.team.id, notification.id),
                        className: "px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors",
                        title: "Approve team registration",
                        children: "Approve"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => rejectTeam(notification.team.id, notification.id),
                        className: "px-3 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors",
                        title: "Reject team registration",
                        children: "Reject"
                      }
                    )
                  ] }),
                  notification.type === "PLAYER_REGISTERED" && notification.player && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => approvePlayer(notification.player.id, notification.id),
                        className: "px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors",
                        title: "Approve player registration",
                        children: "Approve"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => rejectPlayer(notification.player.id, notification.id),
                        className: "px-3 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors",
                        title: "Reject player registration",
                        children: "Reject"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => markAsRead(notification.id),
                      className: "px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                      title: "Dismiss notification",
                      children: "Dismiss"
                    }
                  )
                ] })
              ] })
            ]
          },
          notification.id
        );
      }) }) })
    ] })
  ] });
}
function formatTimeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1e3);
  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
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
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "CMS Dashboard" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Dashboard", Dashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/Dashboard", "client:component-export": "default" })} ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/admin/index.astro";
const $$url = "/admin";

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
