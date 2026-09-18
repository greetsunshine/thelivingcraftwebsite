/** Bordered region. There are no drop shadows in this system: a panel is a rectangle with a rule around it, and `heavy` is the only emphasis available. */
export interface PanelProps {
  title?: React.ReactNode;
  /** Right-aligned mono metadata in the header (counts, timestamps, IDs). */
  meta?: React.ReactNode;
  tone?: "plain" | "sunken" | "invert";
  /** Thicker, darker border — use for the one panel that owns the view. */
  heavy?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Panel(props: PanelProps): JSX.Element;
