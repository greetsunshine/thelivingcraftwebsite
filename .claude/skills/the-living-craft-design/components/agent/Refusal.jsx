import React from "react";
import { Provenance } from "./Provenance.jsx";

export function Refusal({ agent = "reviewer", reason, next, stamp, style }) {
  return (
    <div style={{
      border: "var(--border-w-hair) solid var(--agent-refused)",
      background: "var(--agent-refused-bg)",
      borderRadius: "var(--radius-inner)",
      padding: "var(--space-3) var(--space-4)",
      display: "grid", gap: "var(--space-2)",
      ...style,
    }}>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--size-1)",
          letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)", color: "var(--text-quiet)",
        }}>{agent}</span>
        <Provenance state="refused" />
        {stamp && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)", marginLeft: "auto" }}>{stamp}</span>}
      </div>
      <p style={{ fontSize: "var(--size-3)", lineHeight: "var(--lh-snug)", color: "var(--text-body)", maxWidth: "var(--measure-narrow)" }}>{reason}</p>
      {next && <p style={{ fontSize: "var(--size-2)", color: "var(--text-quiet)", maxWidth: "var(--measure-narrow)" }}>{next}</p>}
    </div>
  );
}
