import React from "react";

export function Confidence({ value = 0, ticks = 5, label = true, style }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * ticks);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", ...style }}>
      <span aria-hidden="true" style={{ display: "inline-flex", gap: 2 }}>
        {Array.from({ length: ticks }).map((_, i) => (
          <span key={i} style={{
            width: 6, height: 12,
            background: i < filled ? "var(--agent-machine)" : "transparent",
            border: "var(--border-w-hair) solid " + (i < filled ? "var(--agent-machine)" : "var(--border-hair)"),
          }} />
        ))}
      </span>
      {label && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-quiet)" }}>
          {filled}/{ticks}
        </span>
      )}
    </span>
  );
}
