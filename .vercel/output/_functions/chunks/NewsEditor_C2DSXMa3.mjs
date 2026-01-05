import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useRef } from 'react';
import { r as reverseCategoryMap } from './types_DXfYTmyI.mjs';
import { g as generateSlug } from './utils_AjT2vheH.mjs';
import { B as Button } from './button_3jlkDYpB.mjs';
import { I as Input } from './input_CvRJCwEH.mjs';
import { L as Label } from './label_D6wxqIUX.mjs';
import { T as Textarea } from './textarea_BFwVsse-.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_BDBbvm8z.mjs';
import { A as Alert, a as AlertDescription } from './alert_BybTPb4q.mjs';
import { S as Skeleton } from './skeleton_C2i3ZiV1.mjs';
import { C as Checkbox } from './checkbox_C7bd-LNY.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from './select_bSb7V2co.mjs';
import { F as FileText } from './file-text_DQck3AYe.mjs';
import { A as ArrowLeft } from './arrow-left_ovqvQGFL.mjs';
import { C as CircleAlert } from './circle-alert_Kho7_Jh4.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { I as Info } from './info_F6n9v9tm.mjs';
import { L as LoaderCircle } from './loader-circle_BjGGmr2X.mjs';
import { S as Save } from './save_BEwJIi9L.mjs';
import { X } from './x_4zT85T7n.mjs';

function RichTextEditor({
  content,
  onChange,
  disabled
}) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (typeof window === "undefined" || quillRef.current) return;
    const initQuill = async () => {
      if (!editorRef.current) {
        requestAnimationFrame(initQuill);
        return;
      }
      if (quillRef.current) return;
      try {
        const Quill = (await import('quill')).default;
        await Promise.resolve({                   });
        await import('./quill-embeds_D3GrB77F.mjs');
        await import('./quill-horizontal-rule_DVFGSCm0.mjs');
        const { YouTubeVideo, VimeoVideo } = await import('./quill-embeds_D3GrB77F.mjs');
        const { HorizontalRule } = await import('./quill-horizontal-rule_DVFGSCm0.mjs');
        Quill.register(YouTubeVideo, true);
        Quill.register(VimeoVideo, true);
        Quill.register(HorizontalRule, true);
        if (typeof window !== "undefined" && false) ;
        const { setupCustomToolbarIcons } = await import('./quill-toolbar-icons_BsxVqFI7.mjs');
        await setupCustomToolbarIcons();
        const { VideoEmbedHandler } = await import('./quill-embeds_D3GrB77F.mjs');
        const { TableModule } = await import('./quill-table_D2rjnKZn.mjs');
        const { HorizontalRuleHandler } = await import('./quill-horizontal-rule_DVFGSCm0.mjs');
        if (!editorRef.current) {
          console.error("Editor ref lost during Quill import");
          setIsLoading(false);
          return;
        }
        const quill = new Quill(editorRef.current, {
          theme: "snow",
          modules: {
            toolbar: {
              container: [
                // Row 1: Paragraph/Heading and basic formatting (WordPress-style)
                [{ "header": [1, 2, 3, 4, 5, 6, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ "list": "ordered" }, { "list": "bullet" }],
                [{ "align": [] }],
                ["blockquote", "code-block"],
                ["link"],
                // Row 2: Media embeds
                ["image", "youtube", "vimeo"],
                // Row 3: Advanced formatting
                ["table", "horizontal-rule"],
                [{ "indent": "-1" }, { "indent": "+1" }],
                [{ "script": "sub" }, { "script": "super" }],
                [{ "size": ["small", false, "large", "huge"] }],
                // Row 4: Colors and utilities
                [{ "color": [] }, { "background": [] }],
                ["clean"],
                ["undo", "redo"]
              ],
              handlers: {
                // Handlers will be attached by VideoEmbedHandler, TableModule, and HorizontalRuleHandler
                youtube: function() {
                },
                vimeo: function() {
                },
                table: function() {
                },
                "horizontal-rule": function() {
                }
              }
            },
            // Enable keyboard shortcuts (undo/redo)
            keyboard: {
              bindings: {
                undo: {
                  key: "z",
                  shortKey: true,
                  handler: function() {
                    this.quill.history.undo();
                  }
                },
                redo: {
                  key: "z",
                  shortKey: true,
                  shiftKey: true,
                  handler: function() {
                    this.quill.history.redo();
                  }
                }
              }
            },
            // Enable history for undo/redo
            history: {
              delay: 1e3,
              maxStack: 100,
              userOnly: true
            }
          },
          placeholder: "Write your article content here..."
        });
        quillRef.current = quill;
        setTimeout(() => {
          const toolbar = quill.getModule("toolbar");
          if (toolbar && toolbar.container) {
            const buttons = toolbar.container.querySelectorAll("button");
            buttons.forEach((button) => {
              const className = button.className;
              if (className.includes("ql-youtube") && !button.querySelector("svg")) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <path d="m10 15 5-3-5-3z"/>
                  </svg>
                `;
              } else if (className.includes("ql-vimeo") && !button.querySelector("svg")) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                `;
              } else if (className.includes("ql-table") && !button.querySelector("svg")) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v18"/>
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M3 15h18"/>
                  </svg>
                `;
              } else if (className.includes("ql-horizontal-rule") && !button.querySelector("svg")) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/>
                  </svg>
                `;
              }
            });
          }
        }, 100);
        new VideoEmbedHandler(quill, {});
        new TableModule(quill, {});
        new HorizontalRuleHandler(quill);
        setIsLoading(false);
        if (content) {
          isUpdatingRef.current = true;
          quill.root.innerHTML = content;
          isUpdatingRef.current = false;
        }
        quill.on("text-change", () => {
          if (!isUpdatingRef.current) {
            const html = quill.root.innerHTML;
            onChangeRef.current(html);
          }
        });
      } catch (error) {
        console.error("Failed to load Quill:", error);
        setIsLoading(false);
      }
    };
    requestAnimationFrame(initQuill);
    return () => {
      if (quillRef.current) {
        quillRef.current.off("text-change");
      }
    };
  }, []);
  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = content || "";
      isUpdatingRef.current = false;
    }
  }, [content]);
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);
  return /* @__PURE__ */ jsxs("div", { className: "rich-text-editor-wrapper", style: { position: "relative" }, children: [
    isLoading && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "rich-text-editor-loading",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 10
        },
        children: [
          /* @__PURE__ */ jsx(LoaderCircle, { size: 24, className: "spinning" }),
          /* @__PURE__ */ jsx("span", { style: { marginLeft: "0.5rem" }, children: "Loading editor..." })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { ref: editorRef, className: "quill-editor" })
  ] });
}
function NewsEditor({ articleId }) {
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "Interviews",
    image: "",
    published: false,
    feature: false,
    publishedAt: ""
  });
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);
  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/news/${articleId}`);
      if (!response.ok) throw new Error("Failed to fetch article");
      const article = await response.json();
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt || "",
        category: reverseCategoryMap[article.category],
        image: article.image || "",
        published: article.published,
        feature: article.feature || false,
        publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().split("T")[0] : ""
      });
    } catch (err) {
      setError(err.message || "Failed to load article");
    } finally {
      setLoading(false);
    }
  };
  const handleTitleChange = (title) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!formData.content.trim() || formData.content === "<p></p>") {
        setError("Content is required");
        setSaving(false);
        return;
      }
      const url = articleId ? `/api/news/${articleId}` : "/api/news";
      const method = articleId ? "PUT" : "POST";
      const payload = {
        ...formData,
        publishedAt: formData.publishedAt || void 0
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
        throw new Error(errorData.error || "Failed to save article");
      }
      const result = await response.json();
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/news";
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save article");
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
  const categories = ["Interviews", "Championships", "Match report", "Analysis"];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-8 w-8" }),
          articleId ? "Edit Article" : "Create New Article"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: articleId ? "Update article details and content" : "Add a new news article to your site" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/news", "data-astro-prefetch": true, children: [
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
        " Article saved successfully! Redirecting..."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Basic Information" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Article title, slug, category, and featured image" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
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
                onChange: (e) => handleTitleChange(e.target.value),
                required: true,
                disabled: saving,
                placeholder: "Enter article title"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "slug", children: "Slug (URL)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "slug",
                type: "text",
                value: formData.slug,
                onChange: (e) => setFormData((prev) => ({ ...prev, slug: e.target.value })),
                disabled: saving,
                placeholder: "article-url-slug"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "Auto-generated from title if left empty"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { htmlFor: "category", children: [
                "Category ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: formData.category,
                  onValueChange: (value) => setFormData((prev) => ({
                    ...prev,
                    category: value
                  })),
                  required: true,
                  disabled: saving,
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { id: "category", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a category" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: categories.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat, children: cat }, cat)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "image", children: "Featured Image URL" }),
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
              )
            ] })
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
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Content" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Article excerpt and main content" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "excerpt", children: "Excerpt" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "excerpt",
                rows: 3,
                value: formData.excerpt,
                onChange: (e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value })),
                disabled: saving,
                placeholder: "Brief summary of the article (optional)"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This will be displayed in article listings and previews" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "content", children: [
              "Content ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rich-text-editor-wrapper", children: /* @__PURE__ */ jsx(
              RichTextEditor,
              {
                content: formData.content,
                onChange: (html) => setFormData((prev) => ({ ...prev, content: html })),
                disabled: saving
              }
            ) }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
              "WordPress-like editor: Format text, embed YouTube/Vimeo videos, insert tables, add horizontal lines, and more. Use keyboard shortcuts (Ctrl+Z for undo, Ctrl+Shift+Z for redo)."
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Publishing" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Control article visibility and featured status" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-3 space-y-0 rounded-md border p-4", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "published",
                checked: formData.published,
                onCheckedChange: (checked) => setFormData((prev) => ({ ...prev, published: checked === true })),
                disabled: saving
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 leading-none", children: [
              /* @__PURE__ */ jsx(
                Label,
                {
                  htmlFor: "published",
                  className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  children: "Publish this article"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Make it visible on the website" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-3 space-y-0 rounded-md border p-4", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "feature",
                checked: formData.feature,
                onCheckedChange: (checked) => setFormData((prev) => ({ ...prev, feature: checked === true })),
                disabled: saving
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 leading-none", children: [
              /* @__PURE__ */ jsx(
                Label,
                {
                  htmlFor: "feature",
                  className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  children: "Feature this article"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Highlight this article as featured content" })
            ] })
          ] }),
          formData.published && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "publishedAt", children: "Published Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "publishedAt",
                type: "date",
                value: formData.publishedAt,
                onChange: (e) => setFormData((prev) => ({ ...prev, publishedAt: e.target.value })),
                disabled: saving
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          articleId ? "Update Article" : "Create Article"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/admin/news", "data-astro-prefetch": true, children: [
          /* @__PURE__ */ jsx(X, { className: "mr-2 h-4 w-4" }),
          "Cancel"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        /* Quill editor wrapper styles */
        .rich-text-editor-wrapper {
          border: 1px solid hsl(var(--input));
          border-radius: calc(var(--radius) - 2px);
          overflow: hidden;
          background: hsl(var(--background));
        }

        .rich-text-editor-wrapper:focus-within {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }

        .quill-editor {
          min-height: 400px;
        }

        /* Quill editor styles */
        .quill-editor .ql-container {
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .quill-editor .ql-editor {
          min-height: 400px;
        }

        .quill-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* Video embeds in editor */
        .quill-editor .ql-editor .ql-video-embed {
          margin: 1.5rem 0;
        }

        .quill-editor .ql-editor .video-embed-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          max-width: 100%;
          border-radius: 8px;
          background: #000;
        }

        .quill-editor .ql-editor .video-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Table styles in editor */
        .quill-editor .ql-editor table.ql-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          border: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-editor table.ql-table td,
        .quill-editor .ql-editor table.ql-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          min-width: 100px;
        }

        .quill-editor .ql-editor table.ql-table th {
          background: hsl(var(--muted));
          font-weight: 600;
        }

        /* Horizontal rule styles in editor */
        .quill-editor .ql-editor hr.ql-horizontal-rule,
        .quill-editor .ql-editor .ql-horizontal-rule {
          margin: 2rem 0;
          border: none;
          border-top: 2px solid hsl(var(--border));
          background: none;
        }

        .quill-editor .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.5);
          padding: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        /* Toolbar button groups */
        .quill-editor .ql-toolbar .ql-formats {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-right: 0.5rem;
          padding-right: 0.5rem;
          border-right: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-toolbar .ql-formats:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }

        /* Better button styling */
        .quill-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .quill-editor .ql-toolbar button:hover {
          background: hsl(var(--accent));
        }

        .quill-editor .ql-toolbar button.ql-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }

        .quill-editor .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }

        .quill-editor .ql-container {
          border: none;
        }

        .quill-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .quill-editor .ql-toolbar {
            flex-wrap: wrap;
            padding: 0.5rem;
            gap: 0.125rem;
          }

          .quill-editor .ql-toolbar .ql-formats {
            margin-right: 0.25rem;
            padding-right: 0.25rem;
            border-right: 1px solid hsl(var(--border));
          }

          .quill-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
          }

          .rich-text-editor-wrapper {
            border-radius: 6px;
          }
        }

        @media (max-width: 480px) {
          .quill-editor .ql-editor {
            min-height: 300px;
            font-size: 0.9rem;
          }
        }
      ` })
  ] });
}

export { NewsEditor as N };
