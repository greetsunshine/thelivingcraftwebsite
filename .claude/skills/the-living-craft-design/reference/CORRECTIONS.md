# Eight places the shipped components contradict the readme

Found by reading `_ds_bundle.js` against `readme.md`, and by rendering a full page.
`page.css` in this directory is a worked example with all eight corrected — use it as the
reference rather than copying component source verbatim.

1. **`Citation` sets a shadow and a border.** Its tooltip carries `--shadow-overlay` and a
   hairline border. §3 forbids both on one element.
2. **`Panel heavy` adds a 3px rule to an element that always has `--shadow-raise`.** §5 says
   Panel dropped its hairline; only the header divider went. Same violation as 1.
3. **Caps tracking on sentence-case labels.** §5 records the `--tracking-label` fix for
   `DataTable`. `Field`, `MetaList`, `Panel`, `Provenance`, `AgentBlock`, `Refusal` and
   `Unwritten` still pair `--case-label: none` with `--tracking-caps` (0.06em), so every
   label in the system is loosely tracked lowercase. The QA fix landed in one of eight
   places.
4. **`MetaList` sets every `dt` to `--text-faint`** — 2.29:1, and §3 says that value is not
   a text colour on white. Those are real labels, not scaffolding. Use `--text-quiet`.
5. **`Checkbox` and `Switch` have no focus ring.** Both hide the real `<input>` with
   `position:absolute; opacity:0` and paint a `<span>` that never reads focus state, so
   §3's "always visible, never removed" is structurally unreachable. Drive the ring off
   `input:focus-visible ~ .box`.
6. **`Checkbox` paints `×` when checked** — the fixed sigil for *refused*. A checkbox that
   shows the refusal mark when ticked reads as the opposite of its state. Use `✓`.
7. **`Button disabled` with `href`** renders `<a aria-disabled>` with `pointer-events:none`:
   mouse-dead, still tab-focusable and Enter-activatable. Add `tabindex="-1"`, or render a
   `<button>`.
8. **`--agent-cite` is `var(--ink-3)`** — the same value §3 rules out as a text colour on
   white, used for the `†n` marker and the `[†] cited` legend, which are text marks on a
   white card. The system forbids the value and then hands it to the one mark whose job is
   being findable in running prose. Found by rendering, not by reading. Re-point it at
   `--ink-2` in `tokens/theme.css`; nothing else is affected.

## Two open decisions, not defects

- **`--font-marginal` resolves to Figtree**, so §2's "apparatus and machine speech in the
  mono face" is only half true — labels are in the core family, only figures and sigils are
  mono. Either the token or the sentence needs changing.
- **Two density mechanisms.** §3 says compact is `data-density="compact"` retuning the same
  token names; `DataTable` also has a `dense` boolean that hardcodes
  `var(--space-1) var(--space-3)` and bypasses `--pad-cell`.
