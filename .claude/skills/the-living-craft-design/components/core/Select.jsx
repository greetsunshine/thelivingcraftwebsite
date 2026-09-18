import React from "react";

export function Select({ options = [], style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          font: "inherit",
          fontFamily: "var(--font-body)",
          fontSize: "var(--size-3)",
          color: "var(--text-body)",
          background: "var(--surface-panel)",
          border: "var(--border-w-hair) solid " + (focus ? "var(--text-body)" : "var(--border-field)"),
          borderRadius: "var(--radius-field)",
          height: "var(--control-h)",
          padding: "var(--pad-control)",
          paddingRight: "var(--space-6)",
          width: "100%",
          appearance: "none",
          outline: "none",
          ...style,
        }}
        {...rest}
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span aria-hidden="true" style={{
        position: "absolute", right: "var(--space-3)", top: "50%", transform: "translateY(-50%)",
        fontFamily: "var(--font-mono)", fontSize: "var(--size-1)", color: "var(--text-faint)", pointerEvents: "none",
      }}>▾</span>
    </div>
  );
}
