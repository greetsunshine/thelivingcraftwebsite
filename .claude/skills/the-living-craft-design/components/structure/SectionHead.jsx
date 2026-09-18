import React from "react";

export function SectionHead({ index, title, note, level = 2, rule = true, style }) {
  const H = "h" + level;
  return (
    <div style={{
      display: "grid", gap: "var(--space-2)",
      paddingBottom: rule ? "var(--space-2)" : 0,
      borderBottom: rule ? "var(--border-w-rule) solid var(--border-rule)" : "none",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
        {index != null && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--size-1)",
            color: "var(--text-faint)", letterSpacing: "var(--tracking-mono)", flex: "none",
          }}>{index}</span>
        )}
        <H style={{
          fontFamily: "var(--font-display)", fontSize: "var(--size-5)",
          lineHeight: "var(--lh-tight)", letterSpacing: "var(--tracking-display)",
          fontWeight: "var(--weight-strong)", color: "var(--text-loud)",
        }}>{title}</H>
      </div>
      {note && (
        <p style={{
          fontSize: "var(--size-2)", color: "var(--text-quiet)",
          maxWidth: "var(--measure-prose)", lineHeight: "var(--lh-snug)",
        }}>{note}</p>
      )}
    </div>
  );
}
