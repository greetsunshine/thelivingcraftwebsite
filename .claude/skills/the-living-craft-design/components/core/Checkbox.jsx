import React from "react";

export function Checkbox({ label, checked, onChange, disabled, hint, style }) {
  return (
    <label style={{
      display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-3)",
      alignItems: "start", cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.42 : 1, ...style,
    }}>
      <span style={{
        width: 20, height: 20, marginTop: 1,
        border: "var(--border-w-rule) solid " + (checked ? "var(--text-body)" : "var(--border-field)"),
        background: checked ? "var(--text-body)" : "var(--surface-panel)",
        borderRadius: "var(--radius-tick)",
        display: "grid", placeItems: "center",
        color: "var(--surface-panel)", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1,
      }}>{checked ? "×" : ""}</span>
      <span>
        <input type="checkbox" checked={!!checked} onChange={onChange} disabled={disabled}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
        <span style={{ fontSize: "var(--size-3)", color: "var(--text-body)" }}>{label}</span>
        {hint && <span style={{ display: "block", fontSize: "var(--size-2)", color: "var(--text-quiet)" }}>{hint}</span>}
      </span>
    </label>
  );
}
