/**
 * Nothing here yet, said properly. Content arrives late by design in this
 * programme, so an empty surface is a written surface: it names what will appear,
 * who writes it, and when — never "No results found."
 */
export interface EmptyStateProps {
  /** One sentence in display type: "Cohort 05 opens in November." */
  label: React.ReactNode;
  note?: React.ReactNode;
  /** A single Button, or nothing. */
  action?: React.ReactNode;
  /** Optional section reference, so an empty slot still has an address. */
  index?: string;
  style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
