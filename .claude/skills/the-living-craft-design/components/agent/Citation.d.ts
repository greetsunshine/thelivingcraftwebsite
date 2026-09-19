/** Dagger-numbered citation for anything an agent asserts from a source. The marker is †n in mono; the source shows on hover/focus and prints as a footnote. */
export interface CitationProps {
  n: number | string;
  /** What is being cited — file path, incident id, URL title. */
  source?: React.ReactNode;
  href?: string;
  /** The cited text. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Citation(props: CitationProps): JSX.Element;
