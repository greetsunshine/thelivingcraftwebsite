import React from "react";

export function Field({ label, hint, error, required, htmlFor, children, style }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-1)", ...style }}>
      {label && (
        <label htmlFor={htmlFor} style={{
          fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
          letterSpacing: "var(--tracking-caps)", textTransform: "var(--case-label)",
          color: "var(--text-quiet)",
        }}>
          {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
      )}
      {children}
      {(hint || error) && (
        <span style={{
          fontSize: "var(--size-2)", lineHeight: "var(--lh-snug)",
          color: error ? "var(--danger)" : "var(--text-quiet)",
        }}>{error || hint}</span>
      )}
    </div>
  );
}
