/* @ds-bundle: {"format":4,"namespace":"TheLivingCraftDesignSystem_41caae","components":[{"name":"AgentBlock","sourcePath":"components/agent/AgentBlock.jsx"},{"name":"Citation","sourcePath":"components/agent/Citation.jsx"},{"name":"Confidence","sourcePath":"components/agent/Confidence.jsx"},{"name":"PROVENANCE","sourcePath":"components/agent/Provenance.jsx"},{"name":"Provenance","sourcePath":"components/agent/Provenance.jsx"},{"name":"Refusal","sourcePath":"components/agent/Refusal.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"EmptyState","sourcePath":"components/state/EmptyState.jsx"},{"name":"Unwritten","sourcePath":"components/state/Unwritten.jsx"},{"name":"DataTable","sourcePath":"components/structure/DataTable.jsx"},{"name":"MetaList","sourcePath":"components/structure/MetaList.jsx"},{"name":"Panel","sourcePath":"components/structure/Panel.jsx"},{"name":"SectionHead","sourcePath":"components/structure/SectionHead.jsx"}],"sourceHashes":{"applied/content.js":"70307565dc37","components/agent/AgentBlock.jsx":"7525a2240cd7","components/agent/Citation.jsx":"b926e55f28d6","components/agent/Confidence.jsx":"04b3973e67a7","components/agent/Provenance.jsx":"55af8ad5052b","components/agent/Refusal.jsx":"8e4145df948b","components/core/Button.jsx":"67a0c55022cb","components/core/Checkbox.jsx":"35ed75ea10e3","components/core/Field.jsx":"e2a83827723d","components/core/Input.jsx":"1d9b9e1c7cf0","components/core/Select.jsx":"d8106f1b76c9","components/core/Switch.jsx":"303cd12a71f1","components/state/EmptyState.jsx":"d7403b8895a6","components/state/Unwritten.jsx":"0d57293b436d","components/structure/DataTable.jsx":"12027fc87b58","components/structure/MetaList.jsx":"4968d0b77e54","components/structure/Panel.jsx":"2bafb688d942","components/structure/SectionHead.jsx":"59a28be8fa9f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TheLivingCraftDesignSystem_41caae = window.TheLivingCraftDesignSystem_41caae || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// applied/content.js
try { (() => {
/* One body of content, rendered by all three directions, so the comparison is
   about the direction and not about the copy. */
window.TLC = {
  wordmark: "The Living Craft",
  nav: ["Programme", "Field notes", "Apply"],
  facts: [{
    label: "Cohort",
    value: "04 — Sep"
  }, {
    label: "Seats",
    value: "8",
    mono: true
  }, {
    label: "Fee",
    value: "\u20B91,20,000",
    mono: true
  }, {
    label: "Length",
    value: "6 weeks"
  }],
  claim: "Anyone can show you the agent pattern. I can show you the three times it failed in production.",
  section: {
    index: "03.2",
    title: "Where the retry loop failed",
    note: "Two incidents, six weeks apart, one wrapper that looked idempotent."
  },
  prose1: "The wrapper was written by someone careful. It checked for an existing job id before it submitted, and under test it never double-submitted once in four thousand runs.",
  prose2: "What the test did not know is that the queue was configured for at-least-once delivery, and the consumer acknowledged before it committed. The pattern was right. The deployment around it was not.",
  cite: {
    n: 4,
    source: "queue/config.yaml:31 \u2014 read at run 118"
  },
  citedText: "the queue was configured for at-least-once delivery",
  agent: "The retry wrapper around submitJob reads as idempotent, but I could not open the consumer, so I have not checked the acknowledgement order.",
  refusal: {
    reason: "I won't summarise this incident \u2014 the postmortem is a draft and two of its claims contradict each other.",
    next: "Ask Arun, or read both versions in \u00A7 04."
  },
  rows: [{
    id: 1,
    pr: "#4821",
    finding: "Retry wrapper is not idempotent under at-least-once",
    who: "reviewer",
    state: "machine",
    conf: 0.6
  }, {
    id: 2,
    pr: "#4818",
    finding: "Queue config unread \u2014 finding is partial",
    who: "reviewer",
    state: "uncertain",
    conf: 0.2
  }, {
    id: 3,
    pr: "#4802",
    finding: "Fan-out bound removed; approved with a note",
    who: "Arun",
    state: "human",
    conf: 1
  }, {
    id: 4,
    pr: "#4791",
    finding: "Postmortem is a draft; declined to summarise",
    who: "scout",
    state: "refused",
    conf: 0
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "applied/content.js", error: String((e && e.message) || e) }); }

// components/agent/Citation.jsx
try { (() => {
function Citation({
  n,
  source,
  href,
  children,
  style
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      ...style
    }
  }, children, /*#__PURE__*/React.createElement("a", {
    href: href || "#",
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "0.72em",
      verticalAlign: "super",
      color: "var(--agent-cite)",
      textDecoration: "none",
      padding: "0 0.15em"
    }
  }, "\u2020", n), open && source && /*#__PURE__*/React.createElement("span", {
    role: "note",
    style: {
      position: "absolute",
      left: 0,
      top: "calc(100% + var(--space-1))",
      zIndex: "var(--z-overlay)",
      minWidth: "18ch",
      maxWidth: "var(--measure-marginal)",
      background: "var(--surface-panel)",
      boxShadow: "var(--shadow-overlay)",
      border: "var(--border-w-hair) solid var(--border-rule)",
      padding: "var(--space-2) var(--space-3)",
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      lineHeight: "var(--lh-snug)",
      color: "var(--text-quiet)"
    }
  }, source));
}
Object.assign(__ds_scope, { Citation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/Citation.jsx", error: String((e && e.message) || e) }); }

// components/agent/Confidence.jsx
try { (() => {
function Confidence({
  value = 0,
  ticks = 5,
  label = true,
  style
}) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * ticks);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      gap: 2
    }
  }, Array.from({
    length: ticks
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 6,
      height: 12,
      background: i < filled ? "var(--agent-machine)" : "transparent",
      border: "var(--border-w-hair) solid " + (i < filled ? "var(--agent-machine)" : "var(--border-hair)")
    }
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-quiet)"
    }
  }, filled, "/", ticks));
}
Object.assign(__ds_scope, { Confidence });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/Confidence.jsx", error: String((e && e.message) || e) }); }

// components/agent/Provenance.jsx
try { (() => {
const PROVENANCE = {
  machine: {
    sigil: "M",
    label: "machine-read",
    ink: "var(--agent-machine)",
    bg: "var(--agent-machine-bg)"
  },
  human: {
    sigil: "H",
    label: "human-approved",
    ink: "var(--agent-human)",
    bg: "var(--agent-human-bg)"
  },
  uncertain: {
    sigil: "~",
    label: "hedged",
    ink: "var(--agent-uncertain)",
    bg: "var(--agent-uncertain-bg)"
  },
  refused: {
    sigil: "×",
    label: "refused",
    ink: "var(--agent-refused)",
    bg: "var(--agent-refused-bg)"
  },
  cited: {
    sigil: "†",
    label: "cited",
    ink: "var(--agent-cite)",
    bg: "transparent"
  }
};
function Provenance({
  state = "machine",
  label,
  filled = false,
  style
}) {
  const s = PROVENANCE[state] || PROVENANCE.machine;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-1)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: s.ink,
      background: filled ? s.bg : "transparent",
      border: filled ? "var(--border-w-hair) solid " + s.ink : "none",
      borderRadius: "var(--radius-control)",
      padding: filled ? "1px var(--space-2)" : 0,
      whiteSpace: "nowrap",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      opacity: 0.85
    }
  }, "[", s.sigil, "]"), label !== false && /*#__PURE__*/React.createElement("span", null, label || s.label));
}
Object.assign(__ds_scope, { PROVENANCE, Provenance });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/Provenance.jsx", error: String((e && e.message) || e) }); }

// components/agent/AgentBlock.jsx
try { (() => {
function AgentBlock({
  agent = "reviewer",
  state = "machine",
  stamp,
  actions,
  children,
  style
}) {
  const ink = (__ds_scope.PROVENANCE[state] || __ds_scope.PROVENANCE.machine).ink;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: "var(--agent-rule) solid " + ink,
      background: "var(--surface-sunken)",
      padding: "var(--space-3) var(--space-4)",
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-3)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--text-quiet)"
    }
  }, agent), /*#__PURE__*/React.createElement(__ds_scope.Provenance, {
    state: state
  }), stamp && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)",
      marginLeft: "auto"
    }
  }, stamp)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--size-2)",
      lineHeight: "var(--lh-snug)",
      color: "var(--text-body)",
      maxWidth: "var(--measure-prose)"
    }
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)",
      paddingTop: "var(--space-1)"
    }
  }, actions));
}
Object.assign(__ds_scope, { AgentBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/AgentBlock.jsx", error: String((e && e.message) || e) }); }

// components/agent/Refusal.jsx
try { (() => {
function Refusal({
  agent = "reviewer",
  reason,
  next,
  stamp,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: "var(--border-w-hair) solid var(--agent-refused)",
      background: "var(--agent-refused-bg)",
      borderRadius: "var(--radius-inner)",
      padding: "var(--space-3) var(--space-4)",
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--text-quiet)"
    }
  }, agent), /*#__PURE__*/React.createElement(__ds_scope.Provenance, {
    state: "refused"
  }), stamp && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)",
      marginLeft: "auto"
    }
  }, stamp)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-3)",
      lineHeight: "var(--lh-snug)",
      color: "var(--text-body)",
      maxWidth: "var(--measure-narrow)"
    }
  }, reason), next && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-2)",
      color: "var(--text-quiet)",
      maxWidth: "var(--measure-narrow)"
    }
  }, next));
}
Object.assign(__ds_scope, { Refusal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/Refusal.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  transition: "background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)"
};
const sizes = {
  sm: {
    height: "calc(var(--control-h) - var(--space-2))",
    padding: "0 var(--space-3)",
    fontSize: "var(--size-2)"
  },
  md: {
    height: "var(--control-h)",
    padding: "var(--pad-control)",
    fontSize: "var(--size-3)"
  },
  lg: {
    height: "calc(var(--control-h) + var(--space-3))",
    padding: "0 var(--space-5)",
    fontSize: "var(--size-4)"
  }
};
function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  full = false,
  type = "button",
  href,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const skin = {
    primary: {
      background: hover ? "var(--control-primary-bg-hover)" : "var(--control-primary-bg)",
      color: "var(--control-primary-fg)",
      borderColor: hover ? "var(--control-primary-bg-hover)" : "var(--control-primary-bg)"
    },
    secondary: {
      background: hover ? "var(--surface-hover)" : "transparent",
      color: "var(--text-body)",
      borderColor: "var(--border-field)"
    },
    ghost: {
      background: hover ? "var(--surface-hover)" : "transparent",
      color: "var(--text-quiet)",
      borderColor: "transparent"
    },
    danger: {
      background: hover ? "var(--danger-quiet)" : "transparent",
      color: "var(--danger)",
      borderColor: "var(--danger)"
    }
  }[variant];
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    type: href ? undefined : type,
    "aria-disabled": disabled || undefined,
    disabled: href ? undefined : disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      ...base,
      ...sizes[size],
      ...skin,
      width: full ? "100%" : undefined,
      opacity: disabled ? 0.42 : 1,
      pointerEvents: disabled ? "none" : undefined,
      transform: down ? "translateY(1px)" : "none",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  hint,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: "var(--space-3)",
      alignItems: "start",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.42 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      marginTop: 1,
      border: "var(--border-w-rule) solid " + (checked ? "var(--text-body)" : "var(--border-field)"),
      background: checked ? "var(--text-body)" : "var(--surface-panel)",
      borderRadius: "var(--radius-tick)",
      display: "grid",
      placeItems: "center",
      color: "var(--surface-panel)",
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      lineHeight: 1
    }
  }, checked ? "×" : ""), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-3)",
      color: "var(--text-body)"
    }
  }, label), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: "var(--size-2)",
      color: "var(--text-quiet)"
    }
  }, hint)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-1)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--text-quiet)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, " *")), children, (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-2)",
      lineHeight: "var(--lh-snug)",
      color: error ? "var(--danger)" : "var(--text-quiet)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  as = "input",
  invalid = false,
  mono = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": invalid || undefined,
    style: {
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
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  options = [],
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
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
      ...style
    }
  }, rest), options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const l = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      right: "var(--space-3)",
      top: "50%",
      transform: "translateY(-50%)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)",
      pointerEvents: "none"
    }
  }, "\u25BE"));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.42 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 24,
      position: "relative",
      flex: "none",
      border: "var(--border-w-hair) solid " + (checked ? "var(--text-body)" : "var(--border-field)"),
      background: checked ? "var(--text-body)" : "var(--surface-sunken)",
      borderRadius: "var(--radius-control)",
      transition: "background var(--motion-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: checked ? 18 : 2,
      width: 18,
      height: 18,
      borderRadius: "var(--radius-pill)",
      background: checked ? "var(--surface-panel)" : "var(--text-faint)",
      transition: "left var(--motion-base) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: !!checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-3)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/state/EmptyState.jsx
try { (() => {
function EmptyState({
  label,
  note,
  action,
  index,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: "var(--border-w-rule) dashed var(--border-field)",
      borderRadius: "var(--radius-panel)",
      padding: "var(--space-5)",
      display: "grid",
      gap: "var(--space-2)",
      justifyItems: "start",
      ...style
    }
  }, index && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)"
    }
  }, index), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--size-4)",
      lineHeight: "var(--lh-snug)",
      color: "var(--text-body)",
      maxWidth: "var(--measure-narrow)"
    }
  }, label), note && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-2)",
      color: "var(--text-quiet)",
      maxWidth: "var(--measure-narrow)",
      lineHeight: "var(--lh-snug)"
    }
  }, note), action && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: "var(--space-2)"
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/state/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/state/Unwritten.jsx
try { (() => {
function Unwritten({
  lines = 3,
  label = "unwritten",
  owner,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--state-unwritten-ink)"
    }
  }, label), owner && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)"
    }
  }, owner)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      background: "var(--state-unwritten-bg)"
    },
    "aria-hidden": "true"
  }, Array.from({
    length: lines
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      height: 1,
      background: "var(--state-unwritten-line)",
      width: i === lines - 1 ? "48%" : i % 2 ? "88%" : "100%"
    }
  }))));
}
Object.assign(__ds_scope, { Unwritten });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/state/Unwritten.jsx", error: String((e && e.message) || e) }); }

// components/structure/DataTable.jsx
try { (() => {
function DataTable({
  columns = [],
  rows = [],
  dense = false,
  zebra = false,
  empty = "No rows.",
  style
}) {
  const cellPad = dense ? "var(--space-1) var(--space-3)" : "var(--pad-cell)";
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: dense ? "var(--size-2)" : "var(--size-3)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: cellPad,
      width: c.width,
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "var(--case-label)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-quiet)",
      borderBottom: "var(--border-w-rule) solid var(--border-rule)",
      whiteSpace: "nowrap"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      padding: "var(--space-5)",
      color: "var(--text-faint)",
      fontSize: "var(--size-2)"
    }
  }, empty)), rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id || i,
    style: {
      background: zebra && i % 2 ? "var(--surface-sunken)" : "transparent"
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: cellPad,
      height: dense ? "var(--row-h)" : undefined,
      borderBottom: "var(--border-w-hair) solid var(--border-hair)",
      fontFamily: c.mono ? "var(--font-mono)" : "inherit",
      color: c.quiet ? "var(--text-quiet)" : "var(--text-body)",
      verticalAlign: "middle"
    }
  }, r[c.key]))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/structure/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/structure/MetaList.jsx
try { (() => {
function MetaList({
  items = [],
  layout = "rows",
  style
}) {
  if (layout === "inline") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-2) var(--space-5)",
        ...style
      }
    }, items.map(it => /*#__PURE__*/React.createElement("span", {
      key: it.label,
      style: {
        display: "flex",
        gap: "var(--space-2)",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-marginal)",
        fontSize: "var(--size-1)",
        letterSpacing: "var(--tracking-caps)",
        textTransform: "var(--case-label)",
        color: "var(--text-faint)"
      }
    }, it.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--size-2)",
        fontFamily: it.mono ? "var(--font-mono)" : "inherit"
      }
    }, it.value))));
  }
  return /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: 0,
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: "var(--space-1) var(--space-4)",
      ...style
    }
  }, items.map(it => /*#__PURE__*/React.createElement(React.Fragment, {
    key: it.label
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--text-faint)",
      paddingTop: "0.25em"
    }
  }, it.label), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      fontSize: "var(--size-2)",
      fontFamily: it.mono ? "var(--font-mono)" : "inherit",
      color: "var(--text-body)"
    }
  }, it.value))));
}
Object.assign(__ds_scope, { MetaList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/structure/MetaList.jsx", error: String((e && e.message) || e) }); }

// components/structure/Panel.jsx
try { (() => {
function Panel({
  title,
  meta,
  tone = "plain",
  heavy = false,
  footer,
  children,
  style
}) {
  const bg = tone === "sunken" ? "var(--surface-sunken)" : tone === "invert" ? "var(--surface-invert)" : "var(--surface-panel)";
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      color: tone === "invert" ? "var(--text-on-invert)" : "var(--text-body)",
      border: heavy ? "var(--border-w-heavy) solid var(--border-rule)" : "none",
      borderRadius: "var(--radius-panel)",
      boxShadow: "var(--shadow-raise)",
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, (title || meta) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      padding: "var(--space-3) var(--pad-panel)",
      borderBottom: "var(--border-w-hair) solid var(--border-hair)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-marginal)",
      fontSize: "var(--size-1)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "var(--case-label)",
      color: "var(--text-quiet)",
      fontWeight: "var(--weight-medium)",
      whiteSpace: "nowrap"
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)",
      whiteSpace: "nowrap"
    }
  }, meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--pad-panel)",
      flex: 1
    }
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: "var(--space-3) var(--pad-panel)",
      borderTop: "var(--border-w-hair) solid var(--border-hair)",
      fontSize: "var(--size-2)",
      color: "var(--text-quiet)"
    }
  }, footer));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/structure/Panel.jsx", error: String((e && e.message) || e) }); }

// components/structure/SectionHead.jsx
try { (() => {
function SectionHead({
  index,
  title,
  note,
  level = 2,
  rule = true,
  style
}) {
  const H = "h" + level;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      paddingBottom: rule ? "var(--space-2)" : 0,
      borderBottom: rule ? "var(--border-w-rule) solid var(--border-rule)" : "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-3)"
    }
  }, index != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--size-1)",
      color: "var(--text-faint)",
      letterSpacing: "var(--tracking-mono)",
      flex: "none"
    }
  }, index), /*#__PURE__*/React.createElement(H, {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--size-5)",
      lineHeight: "var(--lh-tight)",
      letterSpacing: "var(--tracking-display)",
      fontWeight: "var(--weight-strong)",
      color: "var(--text-loud)"
    }
  }, title)), note && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-2)",
      color: "var(--text-quiet)",
      maxWidth: "var(--measure-prose)",
      lineHeight: "var(--lh-snug)"
    }
  }, note));
}
Object.assign(__ds_scope, { SectionHead });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/structure/SectionHead.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AgentBlock = __ds_scope.AgentBlock;

__ds_ns.Citation = __ds_scope.Citation;

__ds_ns.Confidence = __ds_scope.Confidence;

__ds_ns.PROVENANCE = __ds_scope.PROVENANCE;

__ds_ns.Provenance = __ds_scope.Provenance;

__ds_ns.Refusal = __ds_scope.Refusal;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Unwritten = __ds_scope.Unwritten;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.MetaList = __ds_scope.MetaList;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.SectionHead = __ds_scope.SectionHead;

})();
