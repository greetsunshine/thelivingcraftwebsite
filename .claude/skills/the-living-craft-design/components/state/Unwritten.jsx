import React from "react";

export function Unwritten({ lines = 3, label = "unwritten", owner, style }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", ...style }}>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
        <span style={{
          fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
          letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)",
          color: "var(--state-unwritten-ink)",
        }}>{label}</span>
        {owner && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)" }}>{owner}</span>}
      </div>
      <div style={{ display: "grid", gap: "var(--space-2)", background: "var(--state-unwritten-bg)" }} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <span key={i} style={{
            height: 1, background: "var(--state-unwritten-line)",
            width: i === lines - 1 ? "48%" : i % 2 ? "88%" : "100%",
          }} />
        ))}
      </div>
    </div>
  );
}
