import React from "react";

export function Citation({ n, source, href, children, style }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: "relative", ...style }}>
      {children}
      <a
        href={href || "#"}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          fontFamily: "var(--font-mono)", fontSize: "0.72em", verticalAlign: "super",
          color: "var(--agent-cite)", textDecoration: "none", padding: "0 0.15em",
        }}
      >†{n}</a>
      {open && source && (
        <span role="note" style={{
          position: "absolute", left: 0, top: "calc(100% + var(--space-1))", zIndex: "var(--z-overlay)",
          minWidth: "18ch", maxWidth: "var(--measure-marginal)",
          background: "var(--surface-panel)", boxShadow: "var(--shadow-overlay)",
          border: "var(--border-w-hair) solid var(--border-rule)",
          padding: "var(--space-2) var(--space-3)",
          fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)", lineHeight: "var(--lh-snug)",
          color: "var(--text-quiet)",
        }}>{source}</span>
      )}
    </span>
  );
}
