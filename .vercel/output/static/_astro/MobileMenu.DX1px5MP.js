import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as m}from"./index.Z6aMusZW.js";import{c as r}from"./react.CQc-tfl9.js";const o=r(s=>({isMobileMenuOpen:!1,toggleMobileMenu:()=>s(i=>({isMobileMenuOpen:!i.isMobileMenuOpen})),closeMobileMenu:()=>s({isMobileMenuOpen:!1}),openMobileMenu:()=>s({isMobileMenuOpen:!0})}));function p(){const{isMobileMenuOpen:s,toggleMobileMenu:i,closeMobileMenu:t}=o();return m.useEffect(()=>{const n=a=>{const l=a.target;s&&!l.closest(".stm-header-mobile")&&!l.closest(".stm-mobile-menu-unit")&&t()};return s?(document.addEventListener("click",n),document.body.style.overflow="hidden"):document.body.style.overflow="",()=>{document.removeEventListener("click",n),document.body.style.overflow=""}},[s,t]),e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"stm-header-mobile clearfix",children:[e.jsx("div",{className:"logo-main",style:{marginTop:"22px"},children:e.jsx("a",{className:"blogname",href:"/",title:"Home",children:e.jsx("h1",{children:"Elevate"})})}),e.jsx("div",{className:"stm-mobile-right",children:e.jsx("div",{className:"clearfix",children:e.jsxs("div",{className:`stm-menu-toggle ${s?"active":""}`,onClick:i,role:"button","aria-label":"Toggle mobile menu","aria-expanded":s,children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]})})}),e.jsx("div",{className:`stm-mobile-menu-unit ${s?"active":""}`,children:e.jsxs("div",{className:"inner",children:[e.jsxs("div",{className:"stm-top clearfix",children:[e.jsx("div",{className:"stm-switcher pull-left"}),e.jsx("div",{className:"stm-top-right",children:e.jsxs("div",{className:"clearfix",children:[e.jsx("div",{className:"stm-top-search"}),e.jsx("div",{className:"stm-top-socials",children:e.jsxs("ul",{className:"top-bar-socials stm-list-duty",children:[e.jsx("li",{children:e.jsx("a",{href:"https://www.facebook.com/Elevateballers",target:"_blank",rel:"noopener noreferrer",children:e.jsx("i",{className:"fa fa-facebook"})})}),e.jsx("li",{children:e.jsx("a",{href:"https://www.instagram.com/elevateballers/",target:"_blank",rel:"noopener noreferrer",children:e.jsx("i",{className:"fa fa-instagram"})})}),e.jsx("li",{children:e.jsx("a",{href:"https://www.youtube.com/@elevateballers9389/featured",target:"_blank",rel:"noopener noreferrer",children:e.jsx("i",{className:"fa fa-youtube-play"})})})]})})]})})]}),e.jsxs("ul",{className:"stm-mobile-menu-list heading-font",children:[e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-84 current_page_item menu-item-4039",children:e.jsx("a",{href:"/","aria-current":"page",onClick:t,children:e.jsx("span",{children:"Home"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-4032",children:e.jsx("a",{href:"/players/",onClick:t,children:e.jsx("span",{children:"Teams"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-4034",children:e.jsx("a",{href:"/standings/",onClick:t,children:e.jsx("span",{children:"Standings"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-4656",children:e.jsx("a",{href:"/upcoming-fixtures/",onClick:t,children:e.jsx("span",{children:"Fixtures"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-2242",children:e.jsx("a",{href:"/about-club/",title:"",onClick:t,children:e.jsx("span",{children:"About"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-4037",children:e.jsx("a",{href:"/contacts/",onClick:t,children:e.jsx("span",{children:"Contacts"})})}),e.jsx("li",{className:"menu-item menu-item-type-post_type menu-item-object-page menu-item-4747",children:e.jsx("a",{href:"/league-registration/",onClick:t,children:e.jsx("span",{children:"2026 LEAGUE REGISTRATION"})})})]})]})})]}),e.jsx("style",{children:`
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
        `})]})}export{p as default};
