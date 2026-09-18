/**
 * Text-first button. No shadows, no gradients, no radius unless the direction
 * asks for one. `primary` is a single filled block per view — everything else
 * is outlined or bare.
 */
export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Stretch to the container width (used in narrow gated-area forms). */
  full?: boolean;
  type?: "button" | "submit" | "reset";
  /** Renders an <a> instead of a <button>. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Button(props: ButtonProps): JSX.Element;
