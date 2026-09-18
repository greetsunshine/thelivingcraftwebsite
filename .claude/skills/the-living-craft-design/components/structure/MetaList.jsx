import React from "react";

export function MetaList({ items = [], layout = "rows", style }) {
  if (layout === "inline") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2) var(--space-5)", ...style }}>
        {items.map((it) => (
          <span key={it.label} style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline" }}>
            <span style={{
              fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
              letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)", color: "var(--text-faint)",
            }}>{it.label}</span>
            <span style={{ fontSize: "var(--size-2)", fontFamily: it.mono ? "var(--font-mono)" : "inherit" }}>{it.value}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-1) var(--space-4)", ...style }}>
      {items.map((it) => (
        <React.Fragment key={it.label}>
          <dt style={{
            fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
            letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)",
            color: "var(--text-faint)", paddingTop: "0.25em",
          }}>{it.label}</dt>
          <dd style={{ margin: 0, fontSize: "var(--size-2)", fontFamily: it.mono ? "var(--font-mono)" : "inherit", color: "var(--text-body)" }}>{it.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
