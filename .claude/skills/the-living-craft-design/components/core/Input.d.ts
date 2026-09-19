/** Single-line or multi-line text entry. Border-only; the focus state darkens the border rather than adding a ring of colour. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** "input" (default) or "textarea". */
  as?: "input" | "textarea";
  invalid?: boolean;
  /** Monospace value — use for IDs, repo paths, commit SHAs. */
  mono?: boolean;
}
export function Input(props: InputProps): JSX.Element;
