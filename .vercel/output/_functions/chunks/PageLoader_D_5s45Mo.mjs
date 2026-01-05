import { e as createComponent, m as maybeRenderHead, r as renderTemplate, f as createAstro, h as addAttribute, v as renderScript } from './astro/server_c8H0H61q.mjs';
import 'piccolore';
import 'clsx';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

const $$TopBar = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="stm-top-bar" style="background-color:#dd3333 !important;"> <div class="container"> <div class="row"> <div class="col-md-6 col-sm-6"> <div class="stm-top-bar_left"> <div class="stm-top-switcher-holder"></div> </div> </div> <div class="col-md-6 col-sm-6"> <div class="clearfix"> <div class="stm-top-bar_right"> <div class="clearfix"> <div class="stm-top-profile-holder"> <div class="stm-profile-wrapp"> <div class="stm-profile-img icon-mg-icon-ball"></div> <a class="normal_font" href="/admin/login">Log In</a> </div> </div> <div class="stm-top-socials-holder"> <ul class="top-bar-socials stm-list-duty"> <li> <a href="https://www.facebook.com/Elevateballers" target="_blank"> <i class="fa fa-facebook"></i> </a> </li> <li> <a href="https://www.instagram.com/elevateballers/" target="_blank"> <i class="fa fa-instagram"></i> </a> </li> <li> <a href="https://www.youtube.com/@elevateballers9389/featured" target="_blank"> <i class="fa fa-youtube-play"></i> </a> </li> </ul> </div> </div> </div> </div> </div> </div> </div> </div>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/TopBar.astro", void 0);

const $$Astro = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Header;
  const {
    backgroundImage = "/images/Elevate_Patreon_Banner.png",
    showBackground = true
  } = Astro2.props;
  const menuItems = [
    { id: "menu-item-4039", href: "/", label: "Home", isHome: true },
    { id: "menu-item-4032", href: "/teams/", label: "Teams" },
    { id: "menu-item-4034", href: "/standings/", label: "Standings" },
    { id: "menu-item-4656", href: "/upcoming-fixtures/", label: "Fixtures" },
    { id: "menu-item-2242", href: "/about-club/", label: "About", title: "" },
    { id: "menu-item-4037", href: "/contacts/", label: "Contacts" },
    { id: "menu-item-4747", href: "/league-registration/", label: "2026 LEAGUE REGISTRATION" }
  ];
  const currentPath = Astro2.url.pathname;
  const isHomepage = currentPath === "/" || currentPath === "";
  function isActive(href, isHome = false) {
    if (isHome) {
      return isHomepage;
    }
    return currentPath === href || currentPath.startsWith(href);
  }
  function getMenuItemClasses(item, isActive2) {
    const baseClasses = "menu-item menu-item-type-post_type menu-item-object-page";
    const homeClass = item.isHome ? "menu-item-home" : "";
    const activeClass = isActive2 ? "current-menu-item page_item current_page_item" : "";
    return `${baseClasses} ${homeClass} ${item.id} ${activeClass}`.trim();
  }
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(`stm-header ${isHomepage ? "stm-transparent-header" : "stm-non-transparent-header"} stm-header-static stm-header-first`, "class")}> <div class="stm-header-inner"> ${showBackground && renderTemplate`<div class="stm-header-background"${addAttribute(`background-image: url('${backgroundImage}')`, "style")}></div>`} <div class="container stm-header-container"> <!--Logo --> <div class="logo-main" style="margin-top: 22px;"> <a class="blogname" href="/" title="Home"> <h1>Elevate</h1> </a> </div> <div class="stm-main-menu"> <div class="stm-main-menu-unit stm-search-enabled" style="margin-top: 0px;"> <ul class="header-menu stm-list-duty heading-font clearfix"> ${menuItems.map((item) => {
    const active = isActive(item.href, item.isHome);
    return renderTemplate`<li${addAttribute(item.id, "id")}${addAttribute(getMenuItemClasses(item, active), "class")}> <a${addAttribute(item.href, "href")}${addAttribute(item.title || item.label, "title")}${addAttribute(active ? "page" : void 0, "aria-current")}> <span>${item.label}</span> </a> </li>`;
  })} </ul> <div class="stm-header-search heading-font"> <form method="get" action="/"> <div class="search-wrapper"> <input placeholder="Search" type="text" class="search-input" value="" name="s"> </div> <button type="submit" class="search-submit"> <i class="fa fa-search"></i> </button> </form> </div> </div> </div> </div> </div> <!--MOBILE HEADER--> <div class="stm-header-mobile clearfix"> <div class="logo-main" style="margin-top: 22px;"> <a class="blogname" href="/" title="Home"> <h1>Elevate</h1> </a> </div> <div class="stm-mobile-right"> <div class="clearfix"> <div class="stm-menu-toggle"> <span></span> <span></span> <span></span> </div> </div> </div> <div class="stm-mobile-menu-unit"> <div class="inner"> <div class="stm-top clearfix"> <div class="stm-switcher pull-left"></div> <div class="stm-top-right"> <div class="clearfix"> <div class="stm-top-search"></div> <div class="stm-top-socials"> <ul class="top-bar-socials stm-list-duty"> <li> <a href="https://www.facebook.com/Elevateballers" target="_blank"> <i class="fa fa-facebook"></i> </a> </li> <li> <a href="https://www.instagram.com/elevateballers/" target="_blank"> <i class="fa fa-instagram"></i> </a> </li> <li> <a href="https://www.youtube.com/@elevateballers9389/featured" target="_blank"> <i class="fa fa-youtube-play"></i> </a> </li> </ul> </div> </div> </div> </div> <ul class="stm-mobile-menu-list heading-font"> ${menuItems.map((item) => {
    const active = isActive(item.href, item.isHome);
    return renderTemplate`<li${addAttribute(getMenuItemClasses(item, active), "class")}> <a${addAttribute(item.href, "href")}${addAttribute(item.title || item.label, "title")}${addAttribute(active ? "page" : void 0, "aria-current")}> <span>${item.label}</span> </a> </li>`;
  })} </ul> </div> </div> </div> </div> ${renderScript($$result, "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/Header.astro", void 0);

const useLayoutStore = create((set) => ({
  // Mobile menu state
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openMobileMenu: () => set({ isMobileMenuOpen: true })
}));

function MobileMenu() {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useLayoutStore();
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (isMobileMenuOpen && !target.closest(".stm-header-mobile") && !target.closest(".stm-mobile-menu-unit")) {
        closeMobileMenu();
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, closeMobileMenu]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "stm-header-mobile clearfix", children: [
      /* @__PURE__ */ jsx("div", { className: "logo-main", style: { marginTop: "22px" }, children: /* @__PURE__ */ jsx("a", { className: "blogname", href: "/", title: "Home", children: /* @__PURE__ */ jsx("h1", { children: "Elevate" }) }) }),
      /* @__PURE__ */ jsx("div", { className: "stm-mobile-right", children: /* @__PURE__ */ jsx("div", { className: "clearfix", children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `stm-menu-toggle ${isMobileMenuOpen ? "active" : ""}`,
          onClick: toggleMobileMenu,
          role: "button",
          "aria-label": "Toggle mobile menu",
          "aria-expanded": isMobileMenuOpen,
          children: [
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {})
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx("div", { className: `stm-mobile-menu-unit ${isMobileMenuOpen ? "active" : ""}`, children: /* @__PURE__ */ jsxs("div", { className: "inner", children: [
        /* @__PURE__ */ jsxs("div", { className: "stm-top clearfix", children: [
          /* @__PURE__ */ jsx("div", { className: "stm-switcher pull-left" }),
          /* @__PURE__ */ jsx("div", { className: "stm-top-right", children: /* @__PURE__ */ jsxs("div", { className: "clearfix", children: [
            /* @__PURE__ */ jsx("div", { className: "stm-top-search" }),
            /* @__PURE__ */ jsx("div", { className: "stm-top-socials", children: /* @__PURE__ */ jsxs("ul", { className: "top-bar-socials stm-list-duty", children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "https://www.facebook.com/Elevateballers", target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx("i", { className: "fa fa-facebook" }) }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "https://www.instagram.com/elevateballers/", target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx("i", { className: "fa fa-instagram" }) }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "https://www.youtube.com/@elevateballers9389/featured", target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx("i", { className: "fa fa-youtube-play" }) }) })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "stm-mobile-menu-list heading-font", children: [
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-84 current_page_item menu-item-4039", children: /* @__PURE__ */ jsx("a", { href: "/", "aria-current": "page", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "Home" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-4032", children: /* @__PURE__ */ jsx("a", { href: "/players/", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "Teams" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-4034", children: /* @__PURE__ */ jsx("a", { href: "/standings/", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "Standings" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-4656", children: /* @__PURE__ */ jsx("a", { href: "/upcoming-fixtures/", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "Fixtures" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-2242", children: /* @__PURE__ */ jsx("a", { href: "/about-club/", title: "", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "About" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-4037", children: /* @__PURE__ */ jsx("a", { href: "/contacts/", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "Contacts" }) }) }),
          /* @__PURE__ */ jsx("li", { className: "menu-item menu-item-type-post_type menu-item-object-page menu-item-4747", children: /* @__PURE__ */ jsx("a", { href: "/league-registration/", onClick: closeMobileMenu, children: /* @__PURE__ */ jsx("span", { children: "2026 LEAGUE REGISTRATION" }) }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
          .stm-menu-toggle {
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .stm-menu-toggle span {
            width: 25px;
            height: 3px;
            background-color: #fff;
            transition: all 0.3s ease;
          }
          .stm-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
          }
          .stm-menu-toggle.active span:nth-child(2) {
            opacity: 0;
          }
          .stm-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
          }
          .stm-mobile-menu-unit {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          }
          .stm-mobile-menu-unit.active {
            max-height: 1000px;
          }
        ` })
  ] });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", `<div class="stm-footer" style="background: url() no-repeat center; background-size: cover; background-color: #222;"> <div id="stm-footer-top"> <div id="footer-main"> <div class="footer-widgets-wrapper less_4"> <div class="container"> <div class="widgets stm-cols-3 clearfix"> <aside id="contacts-3" class="widget widget_contacts"> <div class="widget-wrapper"> <div class="footer-logo-wrapp"> <img src="/images/Elevate_Icon.png" alt="Elevate Ballers Logo"> </div> <table class="stm-list-duty normal_font fs_two_contacts"> <tbody> <tr> <td class="widget_contacts_address" colspan="2"> <div class="icon"><i class="fa fa-map-marker"></i></div> <div class="text">Pepo Lane, off Dagoretti Road</div> </td> </tr> <tr> <td class="widget_contacts_phone"> <div class="icon"><i class="fa fa-phone"></i></div> <div class="text">0703913923</div> </td> <td class="widget_contacts_fax"> <div class="icon"><i class="fa fa-fax"></i></div> <div class="text">0729259496</div> </td> </tr> <tr> <td class="widget_contacts_mail"> <div class="icon"><i class="fa fa-envelope"></i></div> <div class="text"> <a href="mailto:ballers@elevateballers.com">ballers@elevateballers.com</a> </div> </td> <td class="widget_contacts_schedule"> <div class="icon"><i class="fa fa-clock-o"></i></div> <div class="text">Sat-Sun 8am - 6pm</div> </td> </tr> </tbody> </table> </div> </aside> <aside id="mc4wp_form_widget-2" class="widget widget_mc4wp_form_widget"> <div class="widget-wrapper"> <div class="widget-title"> <h6>SIGN UP FOR EMAIL ALERTS</h6> </div> <script>
                  (function() {
                    window.mc4wp = window.mc4wp || {
                      listeners: [],
                      forms: {
                        on: function(evt, cb) {
                          window.mc4wp.listeners.push({
                            event: evt,
                            callback: cb
                          });
                        }
                      }
                    };
                  })();
                <\/script> <!-- Mailchimp for WordPress v4.9.11 --> <form id="mc4wp-form-1" class="mc4wp-form mc4wp-form-545" method="post" data-id="545" data-name="Subscribe"> <div class="mc4wp-form-fields"> <p> <label>Select topics and stay current with our latest news.</label> </p> <p></p> <div class="subscribe-wrapp"> <input type="email" name="EMAIL" placeholder="E-mail address" required=""> <span class="button btn-md"> <input type="submit" value="Submit"> </span> </div> <p></p> </div> <label style="display: none !important;">
Leave this field empty if you're human:
<input type="text" name="_mc4wp_honeypot" value="" tabindex="-1" autocomplete="off"> </label> <input type="hidden" name="_mc4wp_timestamp"`, '> <input type="hidden" name="_mc4wp_form_id" value="545"> <input type="hidden" name="_mc4wp_form_element_id" value="mc4wp-form-1"> <div class="mc4wp-response"></div> </form> <!-- / Mailchimp for WordPress Plugin --> </div> </aside> <aside id="block-9" class="widget widget_block widget_media_image"> <div class="widget-wrapper"></div> </aside> </div> </div> </div> </div> </div> <div id="stm-footer-bottom"> <div class="container"> <div class="clearfix"> <div class="footer-bottom-left"> <div class="footer-bottom-left-text">\nCopyright \xA9 2024 <a target="_blank" href="https://anthonynjenga.co.ke/">Elevate Ballers</a> </div> </div> <div class="footer-bottom-right"> <div class="clearfix"> <div class="footer-bottom-right-text">\nAll Rights Reserved\n</div> <div class="footer-bottom-right-navs"> <div class="footer-socials-unit"> <div class="h6 footer-socials-title">Follow Us:</div> <ul class="footer-bottom-socials stm-list-duty"> <li class="stm-social-facebook"> <a href="https://www.facebook.com/Elevateballers" target="_blank" rel="noopener noreferrer"> <i class="fa fa-facebook"></i> </a> </li> <li class="stm-social-twitter"> <a href="https://twitter.com/elevateballers/" target="_blank" rel="noopener noreferrer"> <i class="fa fa-twitter"></i> </a> </li> <li class="stm-social-instagram"> <a href="https://www.instagram.com/elevateballers/" target="_blank" rel="noopener noreferrer"> <i class="fa fa-instagram"></i> </a> </li> <li class="stm-social-youtube-play"> <a href="https://www.youtube.com/@elevateballers9389/featured" target="_blank" rel="noopener noreferrer"> <i class="fa fa-youtube-play"></i> </a> </li> </ul> </div> </div> </div> </div> </div> </div> </div> </div>'])), maybeRenderHead(), addAttribute(Math.floor(Date.now() / 1e3), "value"));
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/Footer.astro", void 0);

function PageLoader() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleLoad = () => {
      setLoading(false);
    };
    if (document.readyState === "complete") {
      setLoading(false);
    } else {
      window.addEventListener("load", handleLoad);
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3e3);
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(timeout);
      };
    }
  }, []);
  if (!loading) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      id: "page-loader",
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.3s ease-out"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #dd3333",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "p",
            {
              style: {
                fontFamily: "Rubik, sans-serif",
                fontSize: "16px",
                color: "#363f48",
                margin: 0
              },
              children: "Loading..."
            }
          )
        ] }),
        /* @__PURE__ */ jsx("style", { children: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` })
      ]
    }
  );
}

export { $$Footer as $, MobileMenu as M, PageLoader as P, $$Header as a, $$TopBar as b };
