import React from "react";

export function EmptyState({ label, note, action, index, style }) {
  return (
    <div style={{
      border: "var(--border-w-rule) dashed var(--border-field)",
      borderRadius: "var(--radius-panel)",
      padding: "var(--space-5)",
      display: "grid", gap: "var(--space-2)", justifyItems: "start",
      ...style,
    }}>
      {index && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)" }}>{index}</span>
      )}
      <p style={{
        fontFamily: "var(--font-display)", fontSize: "var(--size-4)",
        lineHeight: "var(--lh-snug)", color: "var(--text-body)", maxWidth: "var(--measure-narrow)",
      }}>{label}</p>
      {note && <p style={{ fontSize: "var(--size-2)", color: "var(--text-quiet)", maxWidth: "var(--measure-narrow)", lineHeight: "var(--lh-snug)" }}>{note}</p>}
      {action && <div style={{ paddingTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
}
