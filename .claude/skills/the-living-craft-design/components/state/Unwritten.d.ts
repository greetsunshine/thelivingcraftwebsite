/** A slot whose content has not been written yet — visible in production, not hidden. Dashed rules stand in for the missing lines and the label says who owes it. Distinct from EmptyState: unwritten means "a human still has to write this". */
export interface UnwrittenProps {
  lines?: number;
  /** Defaults to "unwritten". Other honest labels: "draft", "after cohort 04". */
  label?: string;
  /** Who owes it, in mono: "Arun · before week 3". */
  owner?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Unwritten(props: UnwrittenProps): JSX.Element;
