import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { M as MessageCircle, T as Trash2 } from './trash-2_Da9JrHfL.mjs';
import { C as CircleCheckBig } from './circle-check-big_DAQePOmR.mjs';
import { C as CircleX } from './circle-x_CLDofPCu.mjs';
import { a as ChevronUp, C as ChevronDown } from './chevron-up_DdPZ9N4g.mjs';

function CommentForm({ articleId, parentId, parentAuthorName, onSubmitted, onCancel }) {
  const [formData, setFormData] = useState({
    content: "",
    authorName: "",
    authorEmail: "",
    authorUrl: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: formData.content.trim(),
          authorName: formData.authorName.trim() || void 0,
          authorEmail: formData.authorEmail.trim() || void 0,
          authorUrl: formData.authorUrl.trim() || void 0,
          articleId,
          parentId: parentId || void 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit comment");
      }
      setFormData({
        content: "",
        authorName: "",
        authorEmail: "",
        authorUrl: ""
      });
      setSuccess(true);
      if (onSubmitted) {
        setTimeout(() => {
          onSubmitted();
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError(err instanceof Error ? err.message : "Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  if (success) {
    return /* @__PURE__ */ jsx("div", { style: {
      padding: "1rem 1.25rem",
      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      color: "#065f46",
      borderRadius: "8px",
      marginBottom: "1rem",
      border: "1px solid #6ee7b7"
    }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, fontWeight: "500" }, children: "Thank you! Your comment has been posted." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { style: {
    background: parentId ? "#f9fafb" : "transparent",
    borderRadius: "12px",
    padding: parentId ? "1.25rem" : "0",
    border: parentId ? "1px solid #e5e7eb" : "none",
    marginTop: parentId ? "1rem" : "0"
  }, children: [
    parentId && /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #e5e7eb"
    }, children: [
      /* @__PURE__ */ jsxs("h3", { style: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "600",
        color: "#111827"
      }, children: [
        "Reply to ",
        /* @__PURE__ */ jsx("span", { style: { color: "#4f46e5" }, children: parentAuthorName || "comment" })
      ] }),
      onCancel && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.preventDefault();
            onCancel();
          },
          style: {
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "14px",
            padding: "0.375rem 0.75rem",
            borderRadius: "6px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            transition: "all 0.2s"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.color = "#374151";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#6b7280";
          },
          children: "Cancel"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
      error && /* @__PURE__ */ jsx("div", { style: {
        padding: "0.875rem 1rem",
        background: "#fef2f2",
        color: "#991b1b",
        borderRadius: "8px",
        marginBottom: "1rem",
        border: "1px solid #fecaca",
        fontSize: "14px"
      }, children: error }),
      /* @__PURE__ */ jsx("div", { style: { marginBottom: "1rem" }, children: /* @__PURE__ */ jsx(
        "textarea",
        {
          placeholder: "Write your comment...",
          name: "content",
          id: "comment-content",
          value: formData.content,
          onChange: handleChange,
          required: true,
          rows: 4,
          "aria-required": "true",
          style: {
            width: "100%",
            padding: "0.875rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: "inherit",
            lineHeight: "1.5",
            resize: "vertical",
            transition: "all 0.2s",
            boxSizing: "border-box"
          },
          onFocus: (e) => {
            e.currentTarget.style.borderColor = "#4f46e5";
            e.currentTarget.style.outline = "none";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
          },
          onBlur: (e) => {
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.boxShadow = "none";
          }
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1rem"
      }, children: [
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
          "input",
          {
            placeholder: "Name (optional)",
            name: "authorName",
            type: "text",
            id: "comment-name",
            value: formData.authorName,
            onChange: handleChange,
            "aria-required": "false",
            style: {
              width: "100%",
              padding: "0.75rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "all 0.2s",
              boxSizing: "border-box"
            },
            onFocus: (e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.outline = "none";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
            },
            onBlur: (e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "none";
            }
          }
        ) }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
          "input",
          {
            placeholder: "Email (optional)",
            name: "authorEmail",
            type: "email",
            id: "comment-email",
            value: formData.authorEmail,
            onChange: handleChange,
            "aria-required": "false",
            style: {
              width: "100%",
              padding: "0.75rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "all 0.2s",
              boxSizing: "border-box"
            },
            onFocus: (e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.outline = "none";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
            },
            onBlur: (e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "none";
            }
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: "0.75rem" }, children: [
        parentId && onCancel && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              onCancel();
            },
            style: {
              padding: "0.75rem 1.5rem",
              background: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#d1d5db";
            },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: submitting,
            style: {
              padding: "0.75rem 1.5rem",
              background: submitting ? "#9ca3af" : "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            },
            onMouseEnter: (e) => {
              if (!submitting) {
                e.currentTarget.style.background = "#4338ca";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.4)";
              }
            },
            onMouseLeave: (e) => {
              if (!submitting) {
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            },
            children: submitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin", style: { width: "16px", height: "16px" }, viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Posting..."
            ] }) : "Post Comment"
          }
        )
      ] })
    ] })
  ] });
}

function CommentItem({ comment, onReply, replyToId, depth = 0, admin = false, onUpdated, articleId, maxDepth = 4 }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReplying = replyToId === comment.id;
  const canReply = depth < maxDepth;
  const [isUpdating, setIsUpdating] = useState(false);
  const formatDate = (date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const authorName = comment.user?.name || comment.authorName || "Anonymous";
  const authorEmail = comment.user?.email || comment.authorEmail;
  const handleApprove = async () => {
    if (!admin || isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "approve" })
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error("Failed to approve comment");
      }
    } catch (err) {
      console.error("Error approving comment:", err);
      alert("Failed to approve comment");
    } finally {
      setIsUpdating(false);
    }
  };
  const handleReject = async () => {
    if (!admin || isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject" })
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error("Failed to reject comment");
      }
    } catch (err) {
      console.error("Error rejecting comment:", err);
      alert("Failed to reject comment");
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDelete = async () => {
    if (!admin || isUpdating) return;
    if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error("Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    } finally {
      setIsUpdating(false);
    }
  };
  const getAvatarUrl = () => {
    if (authorEmail) {
      return `https://secure.gravatar.com/avatar/${authorEmail.toLowerCase().trim()}?s=48&d=mp&r=g`;
    }
    return `https://secure.gravatar.com/avatar/?s=48&d=mp&r=g`;
  };
  return /* @__PURE__ */ jsxs(
    "article",
    {
      id: `div-comment-${comment.id}`,
      className: "comment-item",
      style: {
        marginBottom: depth > 0 ? "1rem" : "1.5rem",
        marginLeft: depth > 0 ? "2rem" : "0",
        paddingLeft: depth > 0 ? "1rem" : "0",
        borderLeft: depth > 0 ? "2px solid #e5e7eb" : "none",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsx("div", { style: { flexShrink: 0 }, children: /* @__PURE__ */ jsx(
            "img",
            {
              alt: authorName,
              src: getAvatarUrl(),
              className: "comment-avatar",
              height: "48",
              width: "48",
              decoding: "async",
              style: {
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                objectFit: "cover",
                border: "2px solid #f3f4f6"
              }
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsx("strong", { style: {
                fontSize: "15px",
                fontWeight: "600",
                color: "#111827",
                lineHeight: "1.4"
              }, children: authorName }),
              comment.user && /* @__PURE__ */ jsx("span", { style: {
                fontSize: "12px",
                color: "#10b981",
                fontWeight: "500",
                padding: "0.125rem 0.375rem",
                background: "#d1fae5",
                borderRadius: "4px"
              }, children: "Verified" }),
              /* @__PURE__ */ jsx("time", { style: {
                fontSize: "13px",
                color: "#6b7280",
                fontWeight: "400"
              }, children: formatDate(comment.createdAt) })
            ] }),
            /* @__PURE__ */ jsx("div", { style: {
              marginBottom: "0.75rem",
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#374151",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }, children: comment.content }),
            /* @__PURE__ */ jsxs("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap"
            }, children: [
              onReply && canReply && /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.preventDefault();
                    if (isReplying) {
                      onReply(null, "");
                    } else {
                      onReply(comment.id, authorName);
                    }
                  },
                  className: "comment-reply-button",
                  style: {
                    background: "transparent",
                    backgroundColor: "transparent",
                    border: "none",
                    color: isReplying ? "#ef4444" : "#4f46e5",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "0.25rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    transition: "color 0.2s"
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.color = isReplying ? "#dc2626" : "#4338ca";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.color = isReplying ? "#ef4444" : "#4f46e5";
                  },
                  children: [
                    /* @__PURE__ */ jsx(MessageCircle, { size: 16 }),
                    isReplying ? "Cancel" : "Reply"
                  ]
                }
              ),
              admin && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [
                !comment.approved && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleApprove,
                    disabled: isUpdating,
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.75rem",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      opacity: isUpdating ? 0.6 : 1,
                      transition: "all 0.2s"
                    },
                    onMouseEnter: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#059669";
                    },
                    onMouseLeave: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#10b981";
                    },
                    children: [
                      /* @__PURE__ */ jsx(CircleCheckBig, { size: 14 }),
                      "Approve"
                    ]
                  }
                ),
                comment.approved && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleReject,
                    disabled: isUpdating,
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.75rem",
                      background: "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      opacity: isUpdating ? 0.6 : 1,
                      transition: "all 0.2s"
                    },
                    onMouseEnter: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#d97706";
                    },
                    onMouseLeave: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#f59e0b";
                    },
                    children: [
                      /* @__PURE__ */ jsx(CircleX, { size: 14 }),
                      "Unapprove"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleDelete,
                    disabled: isUpdating,
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.75rem",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      opacity: isUpdating ? 0.6 : 1,
                      transition: "all 0.2s"
                    },
                    onMouseEnter: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#dc2626";
                    },
                    onMouseLeave: (e) => {
                      if (!isUpdating) e.currentTarget.style.background = "#ef4444";
                    },
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        hasReplies && /* @__PURE__ */ jsxs("div", { style: { marginTop: "1rem" }, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setShowReplies(!showReplies),
              className: "view-replies-button",
              style: {
                background: "transparent",
                backgroundColor: "transparent",
                border: "none",
                color: "#4f46e5",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "color 0.2s"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.color = "#4338ca";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = "#4f46e5";
              },
              children: [
                showReplies ? /* @__PURE__ */ jsx(ChevronUp, { size: 16 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 16 }),
                /* @__PURE__ */ jsxs("span", { children: [
                  showReplies ? "Hide" : "View",
                  " ",
                  comment.replies?.length,
                  " ",
                  comment.replies?.length === 1 ? "reply" : "replies"
                ] })
              ]
            }
          ),
          showReplies && /* @__PURE__ */ jsx("ul", { className: "comment-replies", style: {
            listStyle: "none",
            padding: 0,
            margin: "1rem 0 0 0"
          }, children: comment.replies?.map((reply) => /* @__PURE__ */ jsxs("li", { id: `comment-${reply.id}`, children: [
            /* @__PURE__ */ jsx(
              CommentItem,
              {
                comment: reply,
                onReply,
                replyToId,
                depth: depth + 1,
                admin,
                onUpdated,
                articleId,
                maxDepth
              }
            ),
            replyToId === reply.id && onReply && articleId && /* @__PURE__ */ jsx("div", { style: { marginTop: "1rem", marginLeft: "2rem" }, children: /* @__PURE__ */ jsx(
              CommentForm,
              {
                articleId,
                parentId: replyToId,
                parentAuthorName: reply.user?.name || reply.authorName || "comment",
                onSubmitted: () => {
                  if (onUpdated) onUpdated();
                },
                onCancel: () => {
                  onReply(null, "");
                }
              }
            ) })
          ] }, reply.id)) })
        ] })
      ]
    }
  );
}

function CommentsList({ articleId, showForm = true, admin = false }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  const [replyToAuthor, setReplyToAuthor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        setError(null);
        const url = admin ? `/api/comments?articleId=${articleId}&admin=true` : `/api/comments?articleId=${articleId}`;
        const response = await fetch(url, {
          credentials: "include"
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch comments:", response.status, errorText);
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError(err instanceof Error ? err.message : "Failed to load comments");
        setComments([]);
      } finally {
        setLoading(false);
      }
    }
    if (articleId) {
      fetchComments();
    } else {
      console.warn("No articleId provided to CommentsList");
      setLoading(false);
    }
  }, [articleId, refreshKey, admin]);
  const handleReply = (parentId, authorName) => {
    if (parentId === null) {
      setReplyToId(null);
      setReplyToAuthor(null);
    } else {
      if (replyToId === parentId) {
        setReplyToId(null);
        setReplyToAuthor(null);
      } else {
        setReplyToId(parentId);
        setReplyToAuthor(authorName);
      }
    }
  };
  const handleCommentSubmitted = () => {
    setReplyToId(null);
    setReplyToAuthor(null);
    setRefreshKey((prev) => prev + 1);
  };
  const handleCommentUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { padding: "3rem 0", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "inline-block" }, children: /* @__PURE__ */ jsxs("svg", { className: "animate-spin", style: { width: "32px", height: "32px", color: "#4f46e5" }, viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }),
        /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
      ] }) }),
      /* @__PURE__ */ jsx("p", { style: { marginTop: "1rem", color: "#6b7280", fontSize: "15px" }, children: "Loading comments..." })
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { style: {
      padding: "2rem",
      background: "#fef2f2",
      borderRadius: "12px",
      border: "1px solid #fecaca"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "#ef4444", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("h3", { style: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#991b1b" }, children: "Error loading comments" })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, color: "#b91c1c", fontSize: "14px" }, children: error })
    ] });
  }
  const totalComments = comments.reduce((count, comment) => {
    const countReplies = (replies) => {
      if (!replies || replies.length === 0) return 0;
      return replies.length + replies.reduce((sum, reply) => sum + countReplies(reply.replies), 0);
    };
    return count + 1 + countReplies(comment.replies);
  }, 0);
  return /* @__PURE__ */ jsxs("section", { className: "comments-section", style: { padding: "2rem 0" }, children: [
    /* @__PURE__ */ jsx("div", { style: { marginBottom: "2rem" }, children: /* @__PURE__ */ jsxs("h2", { style: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#111827",
      marginBottom: "0.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    }, children: [
      /* @__PURE__ */ jsx("span", { children: "Comments" }),
      comments.length > 0 && /* @__PURE__ */ jsx("span", { style: {
        fontSize: "16px",
        fontWeight: "500",
        color: "#6b7280",
        background: "#f3f4f6",
        padding: "0.25rem 0.75rem",
        borderRadius: "12px"
      }, children: totalComments }),
      admin && /* @__PURE__ */ jsx("span", { style: {
        fontSize: "14px",
        fontWeight: "400",
        color: "#6b7280"
      }, children: "(including unapproved)" })
    ] }) }),
    showForm && !replyToId && /* @__PURE__ */ jsx("div", { style: { marginBottom: "2.5rem" }, children: /* @__PURE__ */ jsx(
      CommentForm,
      {
        articleId,
        parentId: null,
        onSubmitted: handleCommentSubmitted,
        onCancel: void 0
      }
    ) }),
    comments.length === 0 ? /* @__PURE__ */ jsxs("div", { style: {
      padding: "3rem 2rem",
      textAlign: "center",
      background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
      borderRadius: "12px",
      border: "2px dashed #e5e7eb"
    }, children: [
      /* @__PURE__ */ jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", style: { margin: "0 auto 1rem", color: "#9ca3af" }, children: /* @__PURE__ */ jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
      /* @__PURE__ */ jsx("p", { style: {
        color: "#374151",
        fontSize: "16px",
        fontWeight: "500",
        margin: "0 0 0.5rem 0"
      }, children: admin ? "No comments yet" : "No comments yet. Be the first to comment!" }),
      !admin && /* @__PURE__ */ jsx("p", { style: {
        color: "#6b7280",
        fontSize: "14px",
        margin: 0
      }, children: "Start the conversation by sharing your thoughts below." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "comments-list", children: comments.map((comment) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx(
        CommentItem,
        {
          comment,
          onReply: handleReply,
          replyToId,
          admin,
          onUpdated: handleCommentUpdated,
          articleId
        }
      ),
      replyToId === comment.id && /* @__PURE__ */ jsx("div", { style: { marginTop: "1rem", marginLeft: "3rem" }, children: /* @__PURE__ */ jsx(
        CommentForm,
        {
          articleId,
          parentId: replyToId,
          parentAuthorName: replyToAuthor,
          onSubmitted: handleCommentSubmitted,
          onCancel: () => {
            setReplyToId(null);
            setReplyToAuthor(null);
          }
        }
      ) })
    ] }, comment.id)) })
  ] });
}

export { CommentsList as C };
