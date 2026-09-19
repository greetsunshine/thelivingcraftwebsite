import React from "react";

export function DataTable({ columns = [], rows = [], dense = false, zebra = false, empty = "No rows.", style }) {
  const cellPad = dense ? "var(--space-1) var(--space-3)" : "var(--pad-cell)";
  return (
    <table style={{ width: "100%", fontSize: dense ? "var(--size-2)" : "var(--size-3)", ...style }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{
              textAlign: c.align || "left", padding: cellPad, width: c.width,
              fontFamily: "var(--font-marginal)", fontSize: "var(--size-1)",
              letterSpacing: "var(--tracking-label)", textTransform: "var(--case-label)",
              fontWeight: "var(--weight-medium)", color: "var(--text-quiet)",
              borderBottom: "var(--border-w-rule) solid var(--border-rule)", whiteSpace: "nowrap",
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ padding: "var(--space-5)", color: "var(--text-faint)", fontSize: "var(--size-2)" }}>{empty}</td></tr>
        )}
        {rows.map((r, i) => (
          <tr key={r.id || i} style={{ background: zebra && i % 2 ? "var(--surface-sunken)" : "transparent" }}>
            {columns.map((c) => (
              <td key={c.key} style={{
                textAlign: c.align || "left", padding: cellPad,
                height: dense ? "var(--row-h)" : undefined,
                borderBottom: "var(--border-w-hair) solid var(--border-hair)",
                fontFamily: c.mono ? "var(--font-mono)" : "inherit",
                color: c.quiet ? "var(--text-quiet)" : "var(--text-body)",
                verticalAlign: "middle",
              }}>{r[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
