import { useEffect } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';

/**
 * MobileMenu component
 * Mobile navigation menu with toggle functionality using Zustand state
 */
export default function MobileMenu() {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useLayoutStore();

  // Close menu when clicking outside (optional enhancement)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.stm-header-mobile') && !target.closest('.stm-mobile-menu-unit')) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <>
      {/* Mobile Header */}
      <div className="stm-header-mobile clearfix">
        <div className="logo-main" style={{ marginTop: '22px' }}>
          <a className="blogname" href="/" title="Home">
            <h1>Elevate</h1>
          </a>
        </div>
        <div className="stm-mobile-right">
          <div className="clearfix">
            <div 
              className={`stm-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
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

        {/* Mobile Menu */}
        <div className={`stm-mobile-menu-unit ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="inner">
            <div className="stm-top clearfix">
              <div className="stm-switcher pull-left"></div>
              <div className="stm-top-right">
                <div className="clearfix">
                  <div className="stm-top-search"></div>
                  <div className="stm-top-socials">
                    <ul className="top-bar-socials stm-list-duty">
                      <li>
                        <a href="https://www.facebook.com/Elevateballers" target="_blank" rel="noopener noreferrer">
                          <i className="fa fa-facebook"></i>
                        </a>
                      </li>
                      <li>
                        <a href="https://www.instagram.com/elevateballers/" target="_blank" rel="noopener noreferrer">
                          <i className="fa fa-instagram"></i>
                        </a>
                      </li>
                      <li>
                        <a href="https://www.youtube.com/@elevateballers9389/featured" target="_blank" rel="noopener noreferrer">
                          <i className="fa fa-youtube-play"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <ul className="stm-mobile-menu-list heading-font">
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-84 current_page_item menu-item-4039">
                <a href="/" aria-current="page" onClick={closeMobileMenu}>
                  <span>Home</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-4032">
                <a href="/players/" onClick={closeMobileMenu}>
                  <span>Teams</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-4034">
                <a href="/standings/" onClick={closeMobileMenu}>
                  <span>Standings</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-4656">
                <a href="/upcoming-fixtures/" onClick={closeMobileMenu}>
                  <span>Fixtures</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-2242">
                <a href="/about-club/" title="" onClick={closeMobileMenu}>
                  <span>About</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-4037">
                <a href="/contacts/" onClick={closeMobileMenu}>
                  <span>Contacts</span>
                </a>
              </li>
              <li className="menu-item menu-item-type-post_type menu-item-object-page menu-item-4747">
                <a href="/league-registration/" onClick={closeMobileMenu}>
                  <span>2026 LEAGUE REGISTRATION</span>
                </a>
              </li>
            </ul>
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
          .stm-mobile-menu-unit {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          }
          .stm-mobile-menu-unit.active {
            max-height: 1000px;
          }
        `}
      </style>
    </>
  );
}

