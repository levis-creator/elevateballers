import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as x}from"./index.Z6aMusZW.js";import{g as y,a as w,f as j,b as N}from"./utils.zbVxhzWj.js";import{d as S,c as L,a as z,g as C}from"./team-helpers.vPMKc0Vn.js";import{a as v}from"./league-helpers.1oObcXhs.js";function F({match:a,showLeague:f=!0,showDate:i=!0,showTime:l=!0,compact:u=!1,onClick:s}){const b=y(a.status),m=w(a.status),d=a.team1Score!==null&&a.team2Score!==null,c=S(a),p=L(a),o=z(a),h=C(a);return u?e.jsxs("div",{className:`match-card-compact ${s?"clickable":""}`,onClick:s,role:s?"button":void 0,tabIndex:s?0:void 0,children:[e.jsxs("div",{className:"match-card-header-compact",children:[f&&e.jsx("span",{className:"match-league-compact",children:v(a)}),e.jsx("span",{className:"match-status-badge-compact",style:{backgroundColor:b,color:"white"},children:m})]}),e.jsxs("div",{className:"match-teams-compact",children:[e.jsxs("div",{className:"match-team-compact",children:[p&&e.jsx("img",{src:p,alt:c,className:"team-logo-compact",onError:r=>{r.target.style.display="none"}}),e.jsx("span",{className:"team-name-compact",children:c}),d&&e.jsx("span",{className:"team-score-compact",children:a.team1Score})]}),e.jsx("span",{className:"vs-compact",children:"vs"}),e.jsxs("div",{className:"match-team-compact",children:[h&&e.jsx("img",{src:h,alt:o,className:"team-logo-compact",onError:r=>{r.target.style.display="none"}}),e.jsx("span",{className:"team-name-compact",children:o}),d&&e.jsx("span",{className:"team-score-compact",children:a.team2Score})]})]}),(i||l)&&e.jsxs("div",{className:"match-date-compact",children:[i&&j(a.date),i&&l&&" • ",l&&N(a.date)]})]}):e.jsxs("div",{className:`match-card ${s?"clickable":""}`,onClick:s,role:s?"button":void 0,tabIndex:s?0:void 0,children:[e.jsxs("div",{className:"match-card-header",children:[f&&e.jsx("span",{className:"match-league",children:v(a)}),e.jsx("span",{className:"match-status-badge",style:{backgroundColor:b,color:"white"},children:m})]}),e.jsxs("div",{className:"match-card-teams",children:[e.jsxs("div",{className:"match-team",children:[p&&e.jsx("img",{src:p,alt:c,className:"team-logo",onError:r=>{r.target.style.display="none"}}),e.jsx("span",{className:"team-name",children:c}),d&&e.jsx("span",{className:"team-score",children:a.team1Score})]}),e.jsx("span",{className:"vs",children:"vs"}),e.jsxs("div",{className:"match-team",children:[h&&e.jsx("img",{src:h,alt:o,className:"team-logo",onError:r=>{r.target.style.display="none"}}),e.jsx("span",{className:"team-name",children:o}),d&&e.jsx("span",{className:"team-score",children:a.team2Score})]})]}),(i||l)&&e.jsx("div",{className:"match-card-footer",children:e.jsxs("div",{className:"match-date",children:[i&&j(a.date),i&&l&&" • ",l&&N(a.date)]})}),e.jsx("style",{children:`
        .match-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .match-card.clickable {
          cursor: pointer;
        }

        .match-card.clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .match-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .match-league {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-card-teams {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .match-team {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .team-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .team-name {
          flex: 1;
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .team-score {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs {
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .match-card-footer {
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .match-date {
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Compact variant */
        .match-card-compact {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .match-card-compact.clickable {
          cursor: pointer;
        }

        .match-card-compact.clickable:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .match-card-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .match-league-compact {
          font-size: 0.75rem;
          color: #64748b;
        }

        .match-status-badge-compact {
          display: inline-flex;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-teams-compact {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .match-team-compact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .team-logo-compact {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .team-name-compact {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .team-score-compact {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs-compact {
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .match-date-compact {
          font-size: 0.75rem;
          color: #64748b;
        }
      `})]})}function I({matches:a,showFilters:f=!1,showLeague:i=!0,compact:l=!1,onMatchClick:u}){const[s,b]=x.useState(a),[m,d]=x.useState("all"),[c,p]=x.useState("all"),[o,h]=x.useState("");x.useEffect(()=>{let t=[...a];if(m!=="all"&&(t=t.filter(n=>n.status===m.toUpperCase())),c!=="all"&&(t=t.filter(n=>getLeagueName(n)===c)),o){const n=o.toLowerCase();t=t.filter(g=>g.team1Name&&g.team1Name.toLowerCase().includes(n)||g.team2Name&&g.team2Name.toLowerCase().includes(n)||getLeagueName(g).toLowerCase().includes(n))}b(t)},[a,m,c,o]);const r=Array.from(new Set(a.map(t=>getLeagueName(t)))).sort();return a.length===0?e.jsx("div",{className:"match-list-empty",children:e.jsx("p",{children:"No matches found."})}):e.jsxs("div",{className:"match-list",children:[f&&e.jsxs("div",{className:"match-list-filters",children:[e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"status-filter",children:"Status:"}),e.jsxs("select",{id:"status-filter",value:m,onChange:t=>d(t.target.value),children:[e.jsx("option",{value:"all",children:"All"}),e.jsx("option",{value:"upcoming",children:"Upcoming"}),e.jsx("option",{value:"live",children:"Live"}),e.jsx("option",{value:"completed",children:"Completed"})]})]}),r.length>0&&e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"league-filter",children:"League:"}),e.jsxs("select",{id:"league-filter",value:c,onChange:t=>p(t.target.value),children:[e.jsx("option",{value:"all",children:"All Leagues"}),r.map(t=>e.jsx("option",{value:t,children:t},t))]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"search-filter",children:"Search:"}),e.jsx("input",{id:"search-filter",type:"text",placeholder:"Search matches...",value:o,onChange:t=>h(t.target.value)})]})]}),s.length===0?e.jsx("div",{className:"match-list-empty",children:e.jsx("p",{children:"No matches match your filters."})}):e.jsx("div",{className:`match-list-grid ${l?"compact":""}`,children:s.map(t=>e.jsx(F,{match:t,showLeague:i,compact:l,onClick:u?()=>u(t):void 0},t.id))}),e.jsx("style",{children:`
        .match-list {
          width: 100%;
        }

        .match-list-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
        }

        .filter-group select,
        .filter-group input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          color: #1e293b;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .match-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .match-list-grid.compact {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .match-list-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .match-list-grid {
            grid-template-columns: 1fr;
          }

          .match-list-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }
        }
      `})]})}export{I as default};
