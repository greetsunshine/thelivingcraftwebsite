import React from "react";

export const PROVENANCE = {
  machine:   { sigil: "M", label: "machine-read",   ink: "var(--agent-machine)",   bg: "var(--agent-machine-bg)" },
  human:     { sigil: "H", label: "human-approved", ink: "var(--agent-human)",     bg: "var(--agent-human-bg)" },
  uncertain: { sigil: "~", label: "hedged",         ink: "var(--agent-uncertain)", bg: "var(--agent-uncertain-bg)" },
  refused:   { sigil: "×", label: "refused",        ink: "var(--agent-refused)",   bg: "var(--agent-refused-bg)" },
  cited:     { sigil: "†", label: "cited",          ink: "var(--agent-cite)",      bg: "transparent" },
};

export function Provenance({ state = "machine", label, filled = false, style }) {
  const s = PROVENANCE[state] || PROVENANCE.machine;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
      fontFamily: "var(--font-mono)", fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)",
      color: s.ink,
      background: filled ? s.bg : "transparent",
      border: filled ? "var(--border-w-hair) solid " + s.ink : "none",
      borderRadius: "var(--radius-control)",
      padding: filled ? "1px var(--space-2)" : 0,
      whiteSpace: "nowrap",
      ...style,
    }}>
      <span aria-hidden="true" style={{ opacity: 0.85 }}>[{s.sigil}]</span>
      {label !== false && <span>{label || s.label}</span>}
    </span>
  );
}
