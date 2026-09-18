import React from "react";

export function Switch({ label, checked, onChange, disabled, style }) {
  return (
    <label style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-3)",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.42 : 1, ...style,
    }}>
      <span style={{
        width: 40, height: 24, position: "relative", flex: "none",
        border: "var(--border-w-hair) solid " + (checked ? "var(--text-body)" : "var(--border-field)"),
        background: checked ? "var(--text-body)" : "var(--surface-sunken)",
        borderRadius: "var(--radius-control)",
        transition: "background var(--motion-fast) var(--ease-out)",
      }}>
        <span style={{
          position: "absolute", top: 2, left: checked ? 18 : 2, width: 18, height: 18,
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--surface-panel)" : "var(--text-faint)",
          transition: "left var(--motion-base) var(--ease-out)",
        }} />
      </span>
      <input type="checkbox" role="switch" checked={!!checked} onChange={onChange} disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      {label && <span style={{ fontSize: "var(--size-3)" }}>{label}</span>}
    </label>
  );
}
