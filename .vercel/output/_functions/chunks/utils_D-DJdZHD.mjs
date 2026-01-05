function formatMatchDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatMatchTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
function formatMatchDateTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
function getMatchStatusColor(status) {
  const colors = {
    UPCOMING: "#64748b",
    // slate-500
    LIVE: "#ef4444",
    // red-500
    COMPLETED: "#10b981"
    // green-500
  };
  return colors[status] || "#64748b";
}
function getMatchStatusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
function getRelativeTimeDescription(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else if (diffDays > 1) {
    return `in ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}

export { getMatchStatusLabel as a, formatMatchTime as b, getRelativeTimeDescription as c, formatMatchDateTime as d, formatMatchDate as f, getMatchStatusColor as g };
