import { useEffect, useState } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';

/**
 * Header component - Main header with logo, navigation menu, and search
 */
interface Props {
  backgroundImage?: string;
  showBackground?: boolean;
  currentPath?: string;
}

interface MenuItem {
  id: string;
  href: string;
  label: string;
  isHome?: boolean;
  title?: string;
}

const menuItems: MenuItem[] = [
  { id: "menu-item-4039", href: "/", label: "Home", isHome: true },
  { id: "menu-item-4032", href: "/teams/", label: "Teams" },
  { id: "menu-item-4034", href: "/standings/", label: "Standings" },
  { id: "menu-item-4656", href: "/upcoming-fixtures/", label: "Fixtures" },
  { id: "menu-item-results", href: "/matches/results/", label: "Results" },
  { id: "menu-item-2242", href: "/about-club/", label: "About", title: "" },
  { id: "menu-item-4037", href: "/contacts/", label: "Contacts" },
  {
    id: "menu-item-4747",
    href: "/league-registration/",
    label: "2026 LEAGUE REGISTRATION",
  },
];

export default function Header({
  backgroundImage = "/images/Elevate_Patreon_Banner.png",
  showBackground = true,
  currentPath = "/",
}: Props) {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useLayoutStore();
  const [pathname, setPathname] = useState(currentPath);

  // Update pathname on client side
  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  // Check if we're on the homepage
  const isHomepage = pathname === "/" || pathname === "";

  // Helper function to check if a menu item is active
  const isActive = (href: string, isHome: boolean = false): boolean => {
    if (isHome) {
      return isHomepage;
    }
    return pathname === href || pathname.startsWith(href);
  };

  // Helper function to get menu item classes
  const getMenuItemClasses = (item: MenuItem, active: boolean): string => {
    const baseClasses = "menu-item menu-item-type-post_type menu-item-object-page";
    const homeClass = item.isHome ? "menu-item-home" : "";
    const activeClass = active ? "current-menu-item page_item current_page_item" : "";
    return `${baseClasses} ${homeClass} ${item.id} ${activeClass}`.trim();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isMobileMenuOpen &&
        !target.closest(".stm-header-mobile") &&
        !target.closest(".stm-mobile-menu-unit")
      ) {
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

  return (
    <>
      <div
        className={`stm-header ${isHomepage ? "stm-transparent-header" : "stm-non-transparent-header"} stm-header-static stm-header-first`}
      >
        <div className="stm-header-inner">
          {showBackground && (
            <div
              className="stm-header-background"
              style={{ backgroundImage: `url('${backgroundImage}')` }}
            />
          )}
          <div className="container stm-header-container">

            <div className="stm-main-menu">
              <div
                className="stm-main-menu-unit stm-search-enabled"
                style={{ marginTop: "0px" }}
              >
                <ul className="header-menu stm-list-duty heading-font clearfix">
                  {menuItems.map((item) => {
                    const active = isActive(item.href, item.isHome);
                    return (
                      <li
                        key={item.id}
                        id={item.id}
                        className={getMenuItemClasses(item, active)}
                      >
                        <a
                          href={item.href}
                          title={item.title || item.label}
                          aria-current={active ? "page" : undefined}
                        >
                          <span>{item.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <div className="stm-header-search heading-font">
                  <form method="get" action="/">
                    <div className="search-wrapper">
                      <input
                        placeholder="Search"
                        type="text"
                        className="search-input"
                        defaultValue=""
                        name="s"
                      />
                    </div>
                    <button type="submit" className="search-submit">
                      <i className="fa fa-search"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="stm-header-mobile clearfix">

          <div className="stm-mobile-right">
            <div className="clearfix">
              <div
                className={`stm-menu-toggle ${isMobileMenuOpen ? "active" : ""}`}
                onClick={toggleMobileMenu}
                role="button"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div
            className={`stm-mobile-menu-unit ${isMobileMenuOpen ? "active" : ""}`}
            style={{
              maxHeight: isMobileMenuOpen ? '1000px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease'
            }}
          >
            <div className="inner">
              <div className="stm-top clearfix">
                <div className="stm-switcher pull-left"></div>
                <div className="stm-top-right">
                  <div className="clearfix">
                    <div className="stm-top-search"></div>
                    <div className="stm-top-socials">
                      <ul className="top-bar-socials stm-list-duty">
                        <li>
                          <a
                            href="https://www.facebook.com/Elevateballers"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa fa-facebook"></i>
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://www.instagram.com/elevateballers/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa fa-instagram"></i>
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://www.youtube.com/@elevateballers9389/featured"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa fa-youtube-play"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="stm-mobile-menu-list heading-font">
                {menuItems.map((item) => {
                  const active = isActive(item.href, item.isHome);
                  return (
                    <li
                      key={item.id}
                      className={getMenuItemClasses(item, active)}
                    >
                      <a
                        href={item.href}
                        title={item.title || item.label}
                        aria-current={active ? "page" : undefined}
                        onClick={closeMobileMenu}
                      >
                        <span>{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
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
        `}
      </style>
    </>
  );
}


