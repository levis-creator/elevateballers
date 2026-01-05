import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button } from './button_3jlkDYpB.mjs';
import { I as Input } from './input_CvRJCwEH.mjs';
import { L as Label } from './label_D6wxqIUX.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from './alert_BybTPb4q.mjs';
import { S as Skeleton } from './skeleton_C2i3ZiV1.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from './select_bSb7V2co.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';

function MediaEditor({ mediaId }) {
  const [loading, setLoading] = useState(!!mediaId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    type: "IMAGE",
    thumbnail: "",
    tags: ""
  });
  useEffect(() => {
    if (mediaId) {
      fetchMedia();
    }
  }, [mediaId]);
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/media/${mediaId}`);
      if (!response.ok) throw new Error("Failed to fetch media");
      const media = await response.json();
      setFormData({
        title: media.title,
        url: media.url,
        type: media.type,
        thumbnail: media.thumbnail || "",
        tags: media.tags ? media.tags.join(", ") : ""
      });
    } catch (err) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = mediaId ? `/api/media/${mediaId}` : "/api/media";
      const method = mediaId ? "PUT" : "POST";
      const tags = formData.tags ? formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0) : [];
      const payload = {
        ...formData,
        tags,
        thumbnail: formData.thumbnail || void 0
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
        throw new Error(errorData.error || "Failed to save media");
      }
      window.location.href = "/admin/media";
    } catch (err) {
      setError(err.message || "Failed to save media");
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
  const types = ["IMAGE", "VIDEO", "AUDIO"];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground", children: mediaId ? "Edit Media" : "Add New Media" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: mediaId ? "Update media information" : "Add a new media item to the gallery" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/media", "data-astro-prefetch": true, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Back to Gallery"
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Media Information" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Enter the details for this media item" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "title", children: [
            "Title ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "title",
              type: "text",
              value: formData.title,
              onChange: (e) => setFormData((prev) => ({ ...prev, title: e.target.value })),
              required: true,
              disabled: saving,
              placeholder: "Media title"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "type", children: [
            "Type ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.type,
              onValueChange: (value) => setFormData((prev) => ({ ...prev, type: value })),
              disabled: saving,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "type", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select media type" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: types.map((type) => /* @__PURE__ */ jsx(SelectItem, { value: type, children: type }, type)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "url", children: [
            "URL ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "url",
              type: "url",
              value: formData.url,
              onChange: (e) => setFormData((prev) => ({ ...prev, url: e.target.value })),
              required: true,
              disabled: saving,
              placeholder: "https://example.com/image.jpg"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Full URL to the media file (image, video, or audio)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "thumbnail", children: "Thumbnail URL" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "thumbnail",
              type: "url",
              value: formData.thumbnail,
              onChange: (e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value })),
              disabled: saving,
              placeholder: "https://example.com/thumbnail.jpg"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Optional thumbnail URL (useful for videos and audio)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "tags", children: "Tags" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "tags",
              type: "text",
              value: formData.tags,
              onChange: (e) => setFormData((prev) => ({ ...prev, tags: e.target.value })),
              disabled: saving,
              placeholder: "tag1, tag2, tag3"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Comma-separated tags for organizing media" })
        ] }),
        formData.url && formData.type === "IMAGE" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Preview" }),
          /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: formData.url,
              alt: "Preview",
              className: "w-full max-h-[300px] object-contain",
              onError: (e) => {
                e.target.style.display = "none";
              }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? "Saving..." : mediaId ? "Update Media" : "Add Media" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/admin/media", "data-astro-prefetch": true, children: "Cancel" }) })
        ] })
      ] }) })
    ] })
  ] });
}

export { MediaEditor as M };
