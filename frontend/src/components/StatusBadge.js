const STATUS_STYLES = {
  PENDING:     { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af", label: "In Progress" },
  REVIEW:      { bg: "#ede9fe", color: "#5b21b6", label: "Under Review" },
  COMPLETED:   { bg: "#dcfce7", color: "#166534", label: "Completed" },
  CANCELLED:   { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  DRAFT:       { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  PUBLISHED:   { bg: "#dcfce7", color: "#166534", label: "Published" },
  ACTIVE:      { bg: "#dcfce7", color: "#166534", label: "Active" },
  INACTIVE:    { bg: "#f1f5f9", color: "#475569", label: "Inactive" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: "#f1f5f9", color: "#475569", label: status };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
