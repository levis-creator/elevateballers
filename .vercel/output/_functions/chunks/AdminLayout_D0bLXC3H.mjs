import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, q as renderSlot } from './astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from './Layout_PYfl9QGE.mjs';
import { B as Button, a as cn, c as checkAuth } from './button_DxR-TZtn.mjs';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
/* empty css                         */

function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [icons, setIcons] = useState({});
  useEffect(() => {
    import('./lucide-react_BrJqsWyl.mjs').then((mod) => {
      setIcons({
        LayoutDashboard: mod.LayoutDashboard,
        Newspaper: mod.Newspaper,
        Calendar: mod.Calendar,
        Users: mod.Users,
        Shield: mod.Shield,
        Briefcase: mod.Briefcase,
        Images: mod.Images,
        FileText: mod.FileText,
        Settings: mod.Settings,
        ExternalLink: mod.ExternalLink,
        LogOut: mod.LogOut,
        Basketball: mod.Basketball,
        Trophy: mod.Trophy,
        CalendarRange: mod.CalendarRange,
        Menu: mod.Menu,
        X: mod.X
      });
    });
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const handleClickOutside = (e) => {
      if (isMobile) {
        const target = e.target;
        if (!target.closest(".admin-sidebar") && !target.closest(".mobile-menu-toggle")) {
          setIsOpen(false);
        }
      }
    };
    const handleRouteChange = () => {
      if (isMobile) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [isMobile]);
  const navItems = [
    { href: "/admin", icon: icons.LayoutDashboard, label: "Dashboard" },
    { href: "/admin/news", icon: icons.Newspaper, label: "News Articles" },
    { href: "/admin/matches", icon: icons.Calendar, label: "Matches" },
    { href: "/admin/leagues", icon: icons.Trophy, label: "Leagues" },
    { href: "/admin/seasons", icon: icons.CalendarRange, label: "Seasons" },
    { href: "/admin/teams", icon: icons.Shield, label: "Teams" },
    { href: "/admin/players", icon: icons.Users, label: "Players" },
    { href: "/admin/staff", icon: icons.Briefcase, label: "Staff" }
    // { href: '/admin/media', icon: icons.Images, label: 'Media' },
    // { href: '/admin/pages', icon: icons.FileText, label: 'Pages' },
    // { href: '/admin/settings', icon: icons.Settings, label: 'Settings' },
  ];
  const BasketballIcon = icons.Basketball;
  const ExternalLinkIcon = icons.ExternalLink;
  const LogOutIcon = icons.LogOut;
  const MenuIcon = icons.Menu;
  const XIcon = icons.X;
  const [activePath, setActivePath] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
  }, []);
  const getActiveClass = (href) => {
    if (!activePath) return false;
    if (href === "/admin" && activePath === "/admin") return true;
    if (href !== "/admin" && activePath.startsWith(href)) return true;
    return false;
  };
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (response.ok) {
        window.location.href = "/admin/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/admin/login";
    }
  };
  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: cn(
          "fixed top-4 left-4 z-[1001]",
          "bg-[#1e293b] text-white hover:bg-[#1e293b]/90",
          "md:hidden",
          "shadow-lg"
        ),
        onClick: () => setIsOpen(!isOpen),
        "aria-label": "Toggle menu",
        "aria-expanded": isOpen,
        children: isOpen && XIcon ? /* @__PURE__ */ jsx(XIcon, { size: 24 }) : MenuIcon ? /* @__PURE__ */ jsx(MenuIcon, { size: 24 }) : "☰"
      }
    ),
    isOpen && isMobile && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/50 z-[999] md:hidden",
        onClick: () => setIsOpen(false),
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: cn(
          "admin-sidebar",
          "fixed left-0 top-0 h-screen w-[260px]",
          "bg-[#1e293b]",
          "flex flex-col",
          "z-[1000] shadow-lg",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        ),
        children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-white/10", children: /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/admin",
              className: "flex items-center !text-white no-underline hover:opacity-90 transition-opacity",
              "data-astro-prefetch": true,
              children: [
                BasketballIcon ? /* @__PURE__ */ jsx(BasketballIcon, { size: 24, className: "!text-primary mr-2" }) : /* @__PURE__ */ jsx("span", { className: "w-6 h-6 mr-2" }),
                /* @__PURE__ */ jsx("span", { className: "text-xl font-bold !text-white", children: "Elevate CMS" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto py-4", "aria-label": "Main navigation", children: navItems.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveClass(item.href);
            return /* @__PURE__ */ jsxs(
              "a",
              {
                href: item.href,
                className: cn(
                  "flex items-center px-6 py-3.5 !text-white no-underline",
                  "transition-all duration-200",
                  "border-l-[3px] border-transparent",
                  "hover:bg-white/10 hover:border-primary",
                  isActive && "bg-primary/15 border-primary font-semibold",
                  "text-[0.95rem] font-medium"
                ),
                ...isActive && { "aria-current": "page" },
                "aria-label": item.label,
                "data-astro-prefetch": true,
                onClick: handleNavClick,
                children: [
                  Icon ? /* @__PURE__ */ jsx(Icon, { size: 20, className: "mr-3 flex-shrink-0 !text-white", "aria-hidden": "true" }) : /* @__PURE__ */ jsx("span", { className: "w-5 h-5 mr-3 flex-shrink-0", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsx("span", { className: "!text-white", children: item.label })
                ]
              },
              item.href
            );
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10", children: [
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: "/",
                className: cn(
                  "flex items-center px-6 py-3.5 !text-white no-underline",
                  "transition-all duration-200",
                  "border-l-[3px] border-transparent",
                  "hover:bg-white/10 hover:border-primary",
                  "text-[0.95rem] font-medium"
                ),
                onClick: handleNavClick,
                children: [
                  ExternalLinkIcon ? /* @__PURE__ */ jsx(ExternalLinkIcon, { size: 20, className: "mr-3 flex-shrink-0 !text-white" }) : /* @__PURE__ */ jsx("span", { className: "w-5 h-5 mr-3 flex-shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "!text-white", children: "View Site" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleLogout,
                "aria-label": "Logout from admin panel",
                className: cn(
                  "flex items-center px-6 py-3.5 !text-white w-full text-left",
                  "transition-all duration-200",
                  "border-l-[3px] border-transparent",
                  "hover:bg-red-500/20 hover:border-red-500",
                  "text-[0.95rem] font-medium",
                  "bg-transparent border-0 cursor-pointer"
                ),
                children: [
                  LogOutIcon ? /* @__PURE__ */ jsx(LogOutIcon, { size: 20, className: "mr-3 flex-shrink-0 !text-white", "aria-hidden": "true" }) : /* @__PURE__ */ jsx("span", { className: "w-5 h-5 mr-3 flex-shrink-0", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsx("span", { className: "!text-white", children: "Logout" })
                ]
              }
            )
          ] })
        ]
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$AdminLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminLayout;
  const { title = "Admin - Elevate Ballers CMS" } = Astro2.props;
  const user = await checkAuth(Astro2.request);
  if (!user) {
    return Astro2.redirect("/admin/login", 302);
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen bg-[#f9fafb] relative w-full font-sans"> <!-- Sidebar Navigation --> ${renderComponent($$result2, "AdminSidebar", AdminSidebar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/AdminSidebar", "client:component-export": "default" })} <!-- Main Content Area --> <main class="flex-1 ml-[260px] min-h-screen w-[calc(100%-260px)] md:ml-[260px] md:w-[calc(100%-260px)] max-md:ml-0 max-md:w-full"> <div class="p-8 max-w-[1400px] mx-auto w-full max-md:p-4 max-[480px]:p-3 admin-page scroll-smooth"> ${renderSlot($$result2, $$slots["default"])} </div> </main> </div>  ` })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/cms/components/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
