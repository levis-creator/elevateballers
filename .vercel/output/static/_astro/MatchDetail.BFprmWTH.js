import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{g,a as x,c as h,d as o}from"./utils.zbVxhzWj.js";import{d as p,c as f,a as u,g as b}from"./team-helpers.vPMKc0Vn.js";import{a as j}from"./league-helpers.1oObcXhs.js";function z({match:a}){const c=g(a.status),n=x(a.status),t=a.team1Score!==null&&a.team2Score!==null,d=h(a.date),l=p(a),r=f(a),i=u(a),m=b(a);return e.jsxs("div",{className:"match-detail",children:[e.jsxs("div",{className:"match-detail-header",children:[e.jsxs("div",{className:"match-detail-meta",children:[e.jsx("span",{className:"match-league",children:j(a)}),e.jsx("span",{className:"match-status-badge",style:{backgroundColor:c,color:"white"},children:n})]}),e.jsxs("div",{className:"match-detail-date",children:[e.jsx("span",{className:"date-label",children:"Match Date"}),e.jsx("span",{className:"date-value",children:o(a.date)}),e.jsxs("span",{className:"date-relative",children:["(",d,")"]})]})]}),e.jsxs("div",{className:"match-detail-teams",children:[e.jsxs("div",{className:"match-team-detail",children:[r&&e.jsx("img",{src:r,alt:l,className:"team-logo-large",onError:s=>{s.target.style.display="none"}}),e.jsx("h3",{className:"team-name-large",children:l}),t&&e.jsx("div",{className:"team-score-large",children:a.team1Score})]}),e.jsxs("div",{className:"match-vs",children:[e.jsx("span",{className:"vs-text",children:"VS"}),t&&e.jsx("span",{className:"score-separator",children:"-"})]}),e.jsxs("div",{className:"match-team-detail",children:[m&&e.jsx("img",{src:m,alt:i,className:"team-logo-large",onError:s=>{s.target.style.display="none"}}),e.jsx("h3",{className:"team-name-large",children:i}),t&&e.jsx("div",{className:"team-score-large",children:a.team2Score})]})]}),!t&&a.status==="UPCOMING"&&e.jsx("div",{className:"match-detail-upcoming",children:e.jsxs("p",{children:["Match scheduled for ",o(a.date)]})}),e.jsx("style",{children:`
        .match-detail {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .match-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .match-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .match-league {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .match-detail-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .date-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .date-relative {
          font-size: 0.875rem;
          color: #64748b;
        }

        .match-detail-teams {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .match-team-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .team-logo-large {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .team-name-large {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          margin: 0;
        }

        .team-score-large {
          font-size: 3rem;
          font-weight: 800;
          color: #1e293b;
        }

        .match-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .vs-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .score-separator {
          font-size: 2rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .match-detail-upcoming {
          text-align: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .match-detail {
            padding: 1.5rem;
          }

          .match-detail-header {
            flex-direction: column;
            gap: 1rem;
          }

          .match-detail-date {
            align-items: flex-start;
          }

          .match-detail-teams {
            flex-direction: column;
            gap: 1.5rem;
          }

          .team-logo-large {
            width: 80px;
            height: 80px;
          }

          .team-name-large {
            font-size: 1.25rem;
          }

          .team-score-large {
            font-size: 2rem;
          }
        }
      `})]})}export{z as default};
