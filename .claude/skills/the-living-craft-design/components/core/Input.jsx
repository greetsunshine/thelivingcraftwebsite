import React from "react";

export function Input({ as = "input", invalid = false, mono = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const Tag = as;
  return (
    <Tag
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      aria-invalid={invalid || undefined}
      style={{
        font: "inherit",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        fontSize: "var(--size-3)",
        lineHeight: as === "textarea" ? "var(--lh-normal)" : "var(--lh-flat)",
        color: "var(--text-body)",
        background: "var(--surface-panel)",
        border: "var(--border-w-rule) solid " + (invalid ? "var(--danger)" : focus ? "var(--text-body)" : "var(--border-field)"),
        borderRadius: "var(--radius-field)",
        height: as === "textarea" ? undefined : "var(--control-h)",
        minHeight: as === "textarea" ? "calc(var(--control-h) * 2.6)" : undefined,
        padding: as === "textarea" ? "var(--space-2) var(--space-3)" : "var(--pad-control)",
        width: "100%",
        outline: "none",
        resize: as === "textarea" ? "vertical" : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}
