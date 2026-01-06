import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_PYfl9QGE.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../chunks/PageLoader_D_5s45Mo.mjs';
import { $ as $$Spacing } from '../chunks/Spacing_BPc02AQQ.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

function LeagueRegistrationForm() {
  const [activeTab, setActiveTab] = useState("team");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    coachName: "",
    contactEmail: "",
    contactPhone: "",
    leagueId: "",
    additionalInfo: ""
  });
  const [playerFormData, setPlayerFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    jerseyNumber: "",
    height: "",
    weight: "",
    teamName: "",
    additionalInfo: ""
  });
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const response = await fetch("/api/leagues?active=true");
        if (response.ok) {
          const data = await response.json();
          setLeagues(data);
        }
      } catch (err) {
        console.error("Error fetching leagues:", err);
      } finally {
        setLeaguesLoading(false);
      }
    };
    fetchLeagues();
  }, []);
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/registration/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: teamFormData.name.trim(),
          coachName: teamFormData.coachName.trim(),
          contactEmail: teamFormData.contactEmail.trim(),
          contactPhone: teamFormData.contactPhone.trim(),
          leagueId: teamFormData.leagueId || void 0,
          additionalInfo: teamFormData.additionalInfo.trim() || void 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit team registration");
      }
      setTeamFormData({
        name: "",
        coachName: "",
        contactEmail: "",
        contactPhone: "",
        leagueId: "",
        additionalInfo: ""
      });
      setSuccess("Team and coach registration submitted successfully! We will contact you soon.");
    } catch (err) {
      console.error("Error submitting team registration:", err);
      setError(err instanceof Error ? err.message : "Failed to submit team registration");
    } finally {
      setSubmitting(false);
    }
  };
  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/registration/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: playerFormData.firstName.trim(),
          lastName: playerFormData.lastName.trim(),
          email: playerFormData.email.trim(),
          phone: playerFormData.phone.trim(),
          position: playerFormData.position || void 0,
          jerseyNumber: playerFormData.jerseyNumber ? parseInt(playerFormData.jerseyNumber) : void 0,
          height: playerFormData.height.trim() || void 0,
          weight: playerFormData.weight.trim() || void 0,
          teamName: playerFormData.teamName.trim() || void 0,
          additionalInfo: playerFormData.additionalInfo.trim() || void 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit player registration");
      }
      setPlayerFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        jerseyNumber: "",
        height: "",
        weight: "",
        teamName: "",
        additionalInfo: ""
      });
      setSuccess("Player registration submitted successfully! We will contact you soon.");
    } catch (err) {
      console.error("Error submitting player registration:", err);
      setError(err instanceof Error ? err.message : "Failed to submit player registration");
    } finally {
      setSubmitting(false);
    }
  };
  const handleTeamChange = (e) => {
    const { name, value } = e.target;
    setTeamFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handlePlayerChange = (e) => {
    const { name, value } = e.target;
    setPlayerFormData((prev) => ({ ...prev, [name]: value }));
  };
  return /* @__PURE__ */ jsxs("div", { style: { maxWidth: "800px", margin: "0 auto" }, children: [
    /* @__PURE__ */ jsx("style", { children: `
        .registration-form button.button {
          background-color: #dd3333 !important;
        }
        .registration-form button.button:disabled {
          background-color: #999 !important;
          opacity: 0.5 !important;
        }
        .registration-form button.button:hover:not(:disabled) {
          background-color: #c02929 !important;
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      gap: "10px",
      marginBottom: "30px",
      borderBottom: "2px solid #e5e7eb"
    }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setActiveTab("team");
            setError(null);
            setSuccess(null);
          },
          style: {
            padding: "12px 24px",
            background: activeTab === "team" ? "#dd3333" : "transparent",
            color: activeTab === "team" ? "#fff" : "#363f48",
            border: "none",
            borderBottom: activeTab === "team" ? "3px solid #dd3333" : "3px solid transparent",
            cursor: "pointer",
            fontFamily: "Teko, sans-serif",
            fontSize: "18px",
            textTransform: "uppercase",
            fontWeight: activeTab === "team" ? "600" : "400",
            transition: "all 0.3s ease"
          },
          children: "Team Registration"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setActiveTab("player");
            setError(null);
            setSuccess(null);
          },
          style: {
            padding: "12px 24px",
            background: activeTab === "player" ? "#dd3333" : "transparent",
            color: activeTab === "player" ? "#fff" : "#363f48",
            border: "none",
            borderBottom: activeTab === "player" ? "3px solid #dd3333" : "3px solid transparent",
            cursor: "pointer",
            fontFamily: "Teko, sans-serif",
            fontSize: "18px",
            textTransform: "uppercase",
            fontWeight: activeTab === "player" ? "600" : "400",
            transition: "all 0.3s ease"
          },
          children: "Player Registration"
        }
      )
    ] }),
    success && /* @__PURE__ */ jsx("div", { style: {
      padding: "1rem 1.25rem",
      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      color: "#065f46",
      borderRadius: "8px",
      marginBottom: "1.5rem",
      border: "1px solid #6ee7b7"
    }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, fontWeight: "500" }, children: success })
    ] }) }),
    error && /* @__PURE__ */ jsx("div", { style: {
      padding: "1rem 1.25rem",
      background: "#fee2e2",
      color: "#991b1b",
      borderRadius: "8px",
      marginBottom: "1.5rem",
      border: "1px solid #fecaca"
    }, children: /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: error }) }),
    activeTab === "team" && /* @__PURE__ */ jsxs("form", { onSubmit: handleTeamSubmit, className: "registration-form", children: [
      /* @__PURE__ */ jsx("h3", { className: "heading-font", style: { color: "#dd3333", marginBottom: "20px", fontSize: "24px", textAlign: "center" }, children: "Team Registration Form" }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
          "Team Name ",
          /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "name",
            value: teamFormData.name,
            onChange: handleTeamChange,
            placeholder: "Enter team name",
            required: true,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
          "Coach Name ",
          /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "coachName",
            value: teamFormData.coachName,
            onChange: handleTeamChange,
            placeholder: "Enter coach name",
            required: true,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
          "Contact Email ",
          /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            name: "contactEmail",
            value: teamFormData.contactEmail,
            onChange: handleTeamChange,
            placeholder: "Enter contact email",
            required: true,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
          "Contact Phone ",
          /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            name: "contactPhone",
            value: teamFormData.contactPhone,
            onChange: handleTeamChange,
            placeholder: "Enter contact phone",
            required: true,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "League" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            name: "leagueId",
            value: teamFormData.leagueId,
            onChange: handleTeamChange,
            disabled: leaguesLoading,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" },
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Select League" }),
              leagues.map((league) => /* @__PURE__ */ jsx("option", { value: league.id, children: league.name }, league.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Additional Information" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            name: "additionalInfo",
            value: teamFormData.additionalInfo,
            onChange: handleTeamChange,
            placeholder: "Any additional information about your team",
            rows: 5,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px", resize: "vertical" }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "center", marginTop: "30px" }, children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: submitting,
          className: "button btn-primary btn-lg",
          style: {
            backgroundColor: submitting ? "#999" : "#dd3333",
            color: "#fff",
            border: "none",
            padding: "15px 40px",
            fontFamily: "Teko",
            fontSize: "18px",
            textTransform: "uppercase",
            cursor: submitting ? "not-allowed" : "pointer",
            borderRadius: "3px",
            opacity: submitting ? 0.5 : 1
          },
          children: submitting ? "Submitting..." : "Submit Registration"
        }
      ) })
    ] }),
    activeTab === "player" && /* @__PURE__ */ jsxs("form", { onSubmit: handlePlayerSubmit, className: "registration-form", children: [
      /* @__PURE__ */ jsx("h3", { className: "heading-font", style: { color: "#dd3333", marginBottom: "20px", fontSize: "24px", textAlign: "center" }, children: "Player Registration Form" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
            "First Name ",
            /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "firstName",
              value: playerFormData.firstName,
              onChange: handlePlayerChange,
              placeholder: "Enter first name",
              required: true,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
            "Last Name ",
            /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "lastName",
              value: playerFormData.lastName,
              onChange: handlePlayerChange,
              placeholder: "Enter last name",
              required: true,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
            "Email ",
            /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              value: playerFormData.email,
              onChange: handlePlayerChange,
              placeholder: "Enter email",
              required: true,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: [
            "Phone ",
            /* @__PURE__ */ jsx("span", { style: { color: "#dd3333" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              name: "phone",
              value: playerFormData.phone,
              onChange: handlePlayerChange,
              placeholder: "Enter phone",
              required: true,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Position" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              name: "position",
              value: playerFormData.position,
              onChange: handlePlayerChange,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" },
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Position" }),
                /* @__PURE__ */ jsx("option", { value: "Point Guard", children: "Point Guard" }),
                /* @__PURE__ */ jsx("option", { value: "Shooting Guard", children: "Shooting Guard" }),
                /* @__PURE__ */ jsx("option", { value: "Small Forward", children: "Small Forward" }),
                /* @__PURE__ */ jsx("option", { value: "Power Forward", children: "Power Forward" }),
                /* @__PURE__ */ jsx("option", { value: "Center", children: "Center" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Jersey Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              name: "jerseyNumber",
              value: playerFormData.jerseyNumber,
              onChange: handlePlayerChange,
              placeholder: "e.g., 23",
              min: "0",
              max: "99",
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Team Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "teamName",
              value: playerFormData.teamName,
              onChange: handlePlayerChange,
              placeholder: "Enter team name (if applicable)",
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Height" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "height",
              value: playerFormData.height,
              onChange: handlePlayerChange,
              placeholder: `e.g., 6'2"`,
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Weight" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "weight",
              value: playerFormData.weight,
              onChange: handlePlayerChange,
              placeholder: "e.g., 180 lbs",
              style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px" }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "8px", color: "#363f48", fontWeight: "600" }, children: "Additional Information" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            name: "additionalInfo",
            value: playerFormData.additionalInfo,
            onChange: handlePlayerChange,
            placeholder: "Any additional information about yourself",
            rows: 5,
            style: { width: "100%", padding: "12px", border: "1px solid #d8d8d8", borderRadius: "3px", fontFamily: "Rubik", fontSize: "14px", resize: "vertical" }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "center", marginTop: "30px" }, children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: submitting,
          className: "button btn-primary btn-lg",
          style: {
            backgroundColor: submitting ? "#999" : "#dd3333",
            color: "#fff",
            border: "2px solid #dd3333",
            padding: "15px 40px",
            fontFamily: "Teko",
            fontSize: "18px",
            textTransform: "uppercase",
            cursor: submitting ? "not-allowed" : "pointer",
            borderRadius: "3px",
            opacity: submitting ? 0.5 : 1
          },
          children: submitting ? "Submitting..." : "Submit Registration"
        }
      ) })
    ] })
  ] });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const prerender = false;
const $$LeagueRegistration = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", " ", '<div id="wrapper"> ', " ", " ", ' <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 30px; color: #dd3333;">\n2026 LEAGUE REGISTRATION\n</h2> <div class="registration-content" style="max-width: 800px; margin: 0 auto;"> <div class="normal_font" style="line-height: 1.8; color: #363f48; margin-bottom: 40px; text-align: center;"> <p style="margin-bottom: 20px; font-size: 16px;">\nRegister your team or yourself as a player for the 2026\n                        Elevate Ballers League season.\n</p> </div> <div class="registration-form-wrapper"> ', " </div> </div> ", " </div> </div> </div> </div> </section> </div> </div> ", ' <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>   <div class="rev-close-btn"> <span class="close-left"></span> <span class="close-right"></span> </div> <script>\n    window.RS_MODULES = window.RS_MODULES || {};\n    window.RS_MODULES.modules = window.RS_MODULES.modules || {};\n    window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];\n    window.RS_MODULES.defered = true;\n    window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};\n    window.RS_MODULES.type = "compiled";\n  <\/script> <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\"nofollow\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script> <style type="text/css">\n    .sp-footer-sponsors {\n      background: #f4f4f4;\n      color: #363f48;\n    }\n    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {\n      color: #363f48;\n    }\n\n    /* Smooth scroll behavior - Matching homepage */\n    html {\n      scroll-behavior: smooth;\n    }\n\n    /* Make footer static so it scrolls with the page */\n    .stm-footer {\n      position: static !important;\n    }\n\n    /* Remove extra padding since footer is no longer fixed */\n    #main {\n      padding-bottom: 0;\n    }\n\n    /* Registration page specific styles */\n    .wpb_wrapper h2.heading-font {\n      font-size: 40px;\n      line-height: 44px;\n      margin-bottom: 30px;\n      color: #dd3333 !important;\n    }\n\n    .registration-form input:focus,\n    .registration-form textarea:focus,\n    .registration-form select:focus {\n      border-color: #dd3333;\n      outline: none;\n    }\n\n    .registration-form button:hover {\n      background-color: #c02929 !important;\n      transition: background-color 0.3s ease;\n    }\n\n    .registration-form label {\n      font-family: Rubik;\n    }\n\n    /* Responsive styles for form grid layouts */\n    @media (max-width: 767px) {\n      .registration-form [style*="grid-template-columns"] {\n        grid-template-columns: 1fr !important;\n      }\n\n      #main {\n        padding-bottom: 0;\n      }\n    }\n  </style> <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header").prepend($(".sp-header-sponsors"));\n    });\n  <\/script> <script>\n    (function () {\n      function maybePrefixUrlField() {\n        const value = this.value.trim();\n        if (value !== "" && value.indexOf("http") !== 0) {\n          this.value = "http://" + value;\n        }\n      }\n\n      const urlFields = document.querySelectorAll(\n        \'.mc4wp-form input[type="url"]\',\n      );\n      for (let j = 0; j < urlFields.length; j++) {\n        urlFields[j].addEventListener("blur", maybePrefixUrlField);\n      }\n    })();\n  <\/script> <style type="text/css">\n    /* Hide reCAPTCHA V3 badge */\n    .grecaptcha-badge {\n      visibility: hidden !important;\n    }\n  </style> <script>\n    const lazyloadRunObserver = () => {\n      const lazyloadBackgrounds = document.querySelectorAll(\n        `.e-con.e-parent:not(.e-lazyloaded)`,\n      );\n      const lazyloadBackgroundObserver = new IntersectionObserver(\n        (entries) => {\n          entries.forEach((entry) => {\n            if (entry.isIntersecting) {\n              let lazyloadBackground = entry.target;\n              if (lazyloadBackground) {\n                lazyloadBackground.classList.add("e-lazyloaded");\n              }\n              lazyloadBackgroundObserver.unobserve(entry.target);\n            }\n          });\n        },\n        { rootMargin: "200px 0px 200px 0px" },\n      );\n      lazyloadBackgrounds.forEach((lazyloadBackground) => {\n        lazyloadBackgroundObserver.observe(lazyloadBackground);\n      });\n    };\n    const events = ["DOMContentLoaded", "elementor/lazyload/observe"];\n    events.forEach((event) => {\n      document.addEventListener(event, lazyloadRunObserver);\n    });\n  <\/script>  <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script> <script type="text/javascript">\n    (function () {\n      var c = document.body.className;\n      c = c.replace(/woocommerce-no-js/, "woocommerce-js");\n      document.body.className = c;\n    })();\n  <\/script>  <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header-loaded").prepend($(".sp-league-menu"));\n    });\n  <\/script> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header-loaded").prepend($(".sp-header-scoreboard"));\n    });\n  <\/script> '], [" ", " ", '<div id="wrapper"> ', " ", " ", ' <div id="main"> <div class="stm-title-box-unit transparent-header_on title_box-357" style="padding-top: 0; padding-bottom: 0px;"></div> <div class="container"> <section class="wpb-content-wrapper"> <div class="vc_row wpb_row vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-12"> <div class="vc_column-inner"> <div class="wpb_wrapper"> ', ' <h2 class="heading-font" style="text-align: center; margin-bottom: 30px; color: #dd3333;">\n2026 LEAGUE REGISTRATION\n</h2> <div class="registration-content" style="max-width: 800px; margin: 0 auto;"> <div class="normal_font" style="line-height: 1.8; color: #363f48; margin-bottom: 40px; text-align: center;"> <p style="margin-bottom: 20px; font-size: 16px;">\nRegister your team or yourself as a player for the 2026\n                        Elevate Ballers League season.\n</p> </div> <div class="registration-form-wrapper"> ', " </div> </div> ", " </div> </div> </div> </div> </section> </div> </div> ", ' <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>   <div class="rev-close-btn"> <span class="close-left"></span> <span class="close-right"></span> </div> <script>\n    window.RS_MODULES = window.RS_MODULES || {};\n    window.RS_MODULES.modules = window.RS_MODULES.modules || {};\n    window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];\n    window.RS_MODULES.defered = true;\n    window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};\n    window.RS_MODULES.type = "compiled";\n  <\/script> <script type="speculationrules">\n    {\n      "prefetch": [\n        {\n          "source": "document",\n          "where": {\n            "and": [\n              { "href_matches": "/*" },\n              {\n                "not": {\n                  "href_matches": [\n                    "/wp-*.php",\n                    "/wp-admin/*",\n                    "/wp-content/uploads/*",\n                    "/wp-content/*",\n                    "/wp-content/plugins/*",\n                    "/wp-content/themes/elevate/*",\n                    "/*\\\\\\\\?(.+)"\n                  ]\n                }\n              },\n              { "not": { "selector_matches": "a[rel~=\\\\"nofollow\\\\"]" } },\n              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }\n            ]\n          },\n          "eagerness": "conservative"\n        }\n      ]\n    }\n  <\/script> <style type="text/css">\n    .sp-footer-sponsors {\n      background: #f4f4f4;\n      color: #363f48;\n    }\n    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {\n      color: #363f48;\n    }\n\n    /* Smooth scroll behavior - Matching homepage */\n    html {\n      scroll-behavior: smooth;\n    }\n\n    /* Make footer static so it scrolls with the page */\n    .stm-footer {\n      position: static !important;\n    }\n\n    /* Remove extra padding since footer is no longer fixed */\n    #main {\n      padding-bottom: 0;\n    }\n\n    /* Registration page specific styles */\n    .wpb_wrapper h2.heading-font {\n      font-size: 40px;\n      line-height: 44px;\n      margin-bottom: 30px;\n      color: #dd3333 !important;\n    }\n\n    .registration-form input:focus,\n    .registration-form textarea:focus,\n    .registration-form select:focus {\n      border-color: #dd3333;\n      outline: none;\n    }\n\n    .registration-form button:hover {\n      background-color: #c02929 !important;\n      transition: background-color 0.3s ease;\n    }\n\n    .registration-form label {\n      font-family: Rubik;\n    }\n\n    /* Responsive styles for form grid layouts */\n    @media (max-width: 767px) {\n      .registration-form [style*="grid-template-columns"] {\n        grid-template-columns: 1fr !important;\n      }\n\n      #main {\n        padding-bottom: 0;\n      }\n    }\n  </style> <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header").prepend($(".sp-header-sponsors"));\n    });\n  <\/script> <script>\n    (function () {\n      function maybePrefixUrlField() {\n        const value = this.value.trim();\n        if (value !== "" && value.indexOf("http") !== 0) {\n          this.value = "http://" + value;\n        }\n      }\n\n      const urlFields = document.querySelectorAll(\n        \'.mc4wp-form input[type="url"]\',\n      );\n      for (let j = 0; j < urlFields.length; j++) {\n        urlFields[j].addEventListener("blur", maybePrefixUrlField);\n      }\n    })();\n  <\/script> <style type="text/css">\n    /* Hide reCAPTCHA V3 badge */\n    .grecaptcha-badge {\n      visibility: hidden !important;\n    }\n  </style> <script>\n    const lazyloadRunObserver = () => {\n      const lazyloadBackgrounds = document.querySelectorAll(\n        \\`.e-con.e-parent:not(.e-lazyloaded)\\`,\n      );\n      const lazyloadBackgroundObserver = new IntersectionObserver(\n        (entries) => {\n          entries.forEach((entry) => {\n            if (entry.isIntersecting) {\n              let lazyloadBackground = entry.target;\n              if (lazyloadBackground) {\n                lazyloadBackground.classList.add("e-lazyloaded");\n              }\n              lazyloadBackgroundObserver.unobserve(entry.target);\n            }\n          });\n        },\n        { rootMargin: "200px 0px 200px 0px" },\n      );\n      lazyloadBackgrounds.forEach((lazyloadBackground) => {\n        lazyloadBackgroundObserver.observe(lazyloadBackground);\n      });\n    };\n    const events = ["DOMContentLoaded", "elementor/lazyload/observe"];\n    events.forEach((event) => {\n      document.addEventListener(event, lazyloadRunObserver);\n    });\n  <\/script>  <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script> <script type="text/javascript">\n    (function () {\n      var c = document.body.className;\n      c = c.replace(/woocommerce-no-js/, "woocommerce-js");\n      document.body.className = c;\n    })();\n  <\/script>  <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header-loaded").prepend($(".sp-league-menu"));\n    });\n  <\/script> <script type="text/javascript">\n    jQuery(document).ready(function ($) {\n      $(".sp-header-loaded").prepend($(".sp-header-scoreboard"));\n    });\n  <\/script> '])), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" }), maybeRenderHead(), renderComponent($$result2, "TopBar", $$TopBar, {}), renderComponent($$result2, "Header", $$Header, {}), renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-registration-header", "lg": "50", "md": "50", "sm": "40", "xs": "40" }), renderComponent($$result2, "LeagueRegistrationForm", LeagueRegistrationForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/registration/components/LeagueRegistrationForm", "client:component-export": "default" }), renderComponent($$result2, "Spacing", $$Spacing, { "id": "stm-spacing-registration-footer", "lg": "50", "md": "50", "sm": "40", "xs": "40" }), renderComponent($$result2, "Footer", $$Footer, {})) })} <!-- wrapper -->`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/league-registration.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/league-registration.astro";
const $$url = "/league-registration";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$LeagueRegistration,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
