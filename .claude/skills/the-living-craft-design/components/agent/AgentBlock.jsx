import React from "react";
import { Provenance, PROVENANCE } from "./Provenance.jsx";

export function AgentBlock({ agent = "reviewer", state = "machine", stamp, actions, children, style }) {
  const ink = (PROVENANCE[state] || PROVENANCE.machine).ink;
  return (
    <div style={{
      borderLeft: "var(--agent-rule) solid " + ink,
      background: "var(--surface-sunken)",
      padding: "var(--space-3) var(--space-4)",
      display: "grid", gap: "var(--space-2)",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--size-1)",
          letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)", color: "var(--text-quiet)",
        }}>{agent}</span>
        <Provenance state={state} />
        {stamp && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)", marginLeft: "auto" }}>{stamp}</span>}
      </div>
      <div style={{
        fontSize: "var(--size-2)", lineHeight: "var(--lh-snug)", color: "var(--text-body)",
        maxWidth: "var(--measure-prose)",
      }}>{children}</div>
      {actions && <div style={{ display: "flex", gap: "var(--space-2)", paddingTop: "var(--space-1)" }}>{actions}</div>}
    </div>
  );
}
