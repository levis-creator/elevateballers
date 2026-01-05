import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from './button_DxR-TZtn.mjs';
import { I as Input } from './input_wveC5Rbb.mjs';
import { L as Label } from './label_C2DF_yw8.mjs';
import { T as Textarea } from './textarea_carRDR8N.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_DX9qAu4V.mjs';
import { A as Alert, a as AlertDescription } from './alert_CgE87Iz8.mjs';
import { S as Skeleton } from './skeleton_D7y0o7ki.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from './select_CrEDKzBG.mjs';
import { B as Briefcase } from './briefcase_CXmWmrwQ.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { I as Info } from './info_F6n9v9tm.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function StaffEditor({ staffId }) {
  const [loading, setLoading] = useState(!!staffId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "COACH",
    bio: "",
    image: ""
  });
  useEffect(() => {
    if (staffId) {
      fetchStaff();
    }
  }, [staffId]);
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/${staffId}`);
      if (!response.ok) throw new Error("Failed to fetch staff");
      const staff = await response.json();
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role,
        bio: staff.bio || "",
        image: staff.image || ""
      });
    } catch (err) {
      setError(err.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const url = staffId ? `/api/staff/${staffId}` : "/api/staff";
      const method = staffId ? "PUT" : "POST";
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || void 0,
        phone: formData.phone.trim() || void 0,
        role: formData.role,
        bio: formData.bio.trim() || void 0,
        image: formData.image.trim() || void 0
      };
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save staff");
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/staff";
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" })
    ] });
  }
  const roles = ["COACH", "ASSISTANT_COACH", "MANAGER", "ASSISTANT_MANAGER", "PHYSIOTHERAPIST", "TRAINER", "ANALYST", "OTHER"];
  const getRoleLabel = (role) => {
    const labels = {
      "COACH": "Coach",
      "ASSISTANT_COACH": "Assistant Coach",
      "MANAGER": "Manager",
      "ASSISTANT_MANAGER": "Assistant Manager",
      "PHYSIOTHERAPIST": "Physiotherapist",
      "TRAINER": "Trainer",
      "ANALYST": "Analyst",
      "OTHER": "Other"
    };
    return labels[role] || role;
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Briefcase, { className: "h-8 w-8" }),
          staffId ? "Edit Staff Member" : "Create New Staff Member"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: staffId ? "Update staff member details and information" : "Add a new staff member to your organization" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/staff", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to List"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Error:" }),
        " ",
        error
      ] })
    ] }),
    success && /* @__PURE__ */ jsxs(Alert, { className: "border-green-500 bg-green-50 text-green-900", children: [
      /* @__PURE__ */ jsx(CircleCheckBig, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Success!" }),
        " Staff member saved successfully! Redirecting..."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Basic Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Enter the staff member's details" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "firstName", children: [
                "First Name ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "firstName",
                  type: "text",
                  value: formData.firstName,
                  onChange: (e) => setFormData((prev) => ({ ...prev, firstName: e.target.value })),
                  required: true,
                  disabled: saving,
                  placeholder: "John"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "lastName", children: [
                "Last Name ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "lastName",
                  type: "text",
                  value: formData.lastName,
                  onChange: (e) => setFormData((prev) => ({ ...prev, lastName: e.target.value })),
                  required: true,
                  disabled: saving,
                  placeholder: "Doe"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "role", children: [
              "Role ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.role,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, role: value })),
                required: true,
                disabled: saving,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { id: "role", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a role" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: roles.map((role) => /* @__PURE__ */ jsx(SelectItem, { value: role, children: getRoleLabel(role) }, role)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "image", children: "Image URL" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "image",
                type: "url",
                value: formData.image,
                onChange: (e) => setFormData((prev) => ({ ...prev, image: e.target.value })),
                disabled: saving,
                placeholder: "https://example.com/image.jpg"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "URL to the staff member's photo"
            ] }),
            formData.image && /* @__PURE__ */ jsx("div", { className: "mt-2 border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: formData.image,
                alt: "Preview",
                className: "w-full max-h-[300px] object-contain",
                onError: (e) => {
                  e.target.style.display = "none";
                }
              }
            ) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Contact Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Email and phone details" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                value: formData.email,
                onChange: (e) => setFormData((prev) => ({ ...prev, email: e.target.value })),
                disabled: saving,
                placeholder: "john.doe@example.com"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "phone",
                type: "tel",
                value: formData.phone,
                onChange: (e) => setFormData((prev) => ({ ...prev, phone: e.target.value })),
                disabled: saving,
                placeholder: "+1 (555) 123-4567"
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Biography" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Brief biography or description" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "bio", children: "Bio" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "bio",
              rows: 6,
              value: formData.bio,
              onChange: (e) => setFormData((prev) => ({ ...prev, bio: e.target.value })),
              disabled: saving,
              placeholder: "Enter staff member's biography"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          staffId ? "Update Staff Member" : "Create Staff Member"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/staff", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] })
  ] });
}

export { StaffEditor as S };
