import React from "react";

const base = {
  font: "inherit",
  fontFamily: "var(--font-body)",
  fontWeight: "var(--weight-medium)",
  letterSpacing: "var(--tracking-normal)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  borderRadius: "var(--radius-control)",
  borderStyle: "solid",
  borderWidth: "var(--border-w-hair)",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)",
};

const sizes = {
  sm: { height: "calc(var(--control-h) - var(--space-2))", padding: "0 var(--space-3)", fontSize: "var(--size-2)" },
  md: { height: "var(--control-h)", padding: "var(--pad-control)", fontSize: "var(--size-3)" },
  lg: { height: "calc(var(--control-h) + var(--space-3))", padding: "0 var(--space-5)", fontSize: "var(--size-4)" },
};

export function Button({ variant = "secondary", size = "md", disabled = false, full = false, type = "button", href, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const skin = {
    primary: {
      background: hover ? "var(--control-primary-bg-hover)" : "var(--control-primary-bg)",
      color: "var(--control-primary-fg)",
      borderColor: hover ? "var(--control-primary-bg-hover)" : "var(--control-primary-bg)",
    },
    secondary: {
      background: hover ? "var(--surface-hover)" : "transparent",
      color: "var(--text-body)",
      borderColor: "var(--border-field)",
    },
    ghost: {
      background: hover ? "var(--surface-hover)" : "transparent",
      color: "var(--text-quiet)",
      borderColor: "transparent",
    },
    danger: {
      background: hover ? "var(--danger-quiet)" : "transparent",
      color: "var(--danger)",
      borderColor: "var(--danger)",
    },
  }[variant];

  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      type={href ? undefined : type}
      aria-disabled={disabled || undefined}
      disabled={href ? undefined : disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        ...base, ...sizes[size], ...skin,
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.42 : 1,
        pointerEvents: disabled ? "none" : undefined,
        transform: down ? "translateY(1px)" : "none",
        ...style,
      }}
      {...rest}
    >{children}</Tag>
  );
}
