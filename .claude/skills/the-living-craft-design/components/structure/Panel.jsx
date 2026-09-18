import React from "react";

export function Panel({ title, meta, tone = "plain", heavy = false, footer, children, style }) {
  const bg = tone === "sunken" ? "var(--surface-sunken)" : tone === "invert" ? "var(--surface-invert)" : "var(--surface-panel)";
  return (
    <section style={{
      background: bg,
      color: tone === "invert" ? "var(--text-on-invert)" : "var(--text-body)",
      border: heavy ? "var(--border-w-heavy) solid var(--border-rule)" : "none",
      borderRadius: "var(--radius-panel)",
      boxShadow: "var(--shadow-raise)",
      display: "flex", flexDirection: "column",
      ...style,
    }}>
      {(title || meta) && (
        <header style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-4)",
          padding: "var(--space-3) var(--pad-panel)",
          borderBottom: "var(--border-w-hair) solid var(--border-hair)",
        }}>
          <h3 style={{
            fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
            letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)",
            color: "var(--text-quiet)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap",
          }}>{title}</h3>
          {meta && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{meta}</span>}
        </header>
      )}
      <div style={{ padding: "var(--pad-panel)", flex: 1 }}>{children}</div>
      {footer && (
        <footer style={{
          padding: "var(--space-3) var(--pad-panel)",
          borderTop: "var(--border-w-hair) solid var(--border-hair)",
          fontSize: "var(--size-2)", color: "var(--text-quiet)",
        }}>{footer}</footer>
      )}
    </section>
  );
}
