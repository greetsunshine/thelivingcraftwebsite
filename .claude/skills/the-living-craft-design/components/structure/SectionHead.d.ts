/** Numbered section header with a rule under it. The index is a real reference (§ 03.2, PR-4821) that appears in printed artifacts too, not decoration. */
export interface SectionHeadProps {
  /** Mono reference printed before the title, e.g. "03.2". */
  index?: string | number;
  title: React.ReactNode;
  note?: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  rule?: boolean;
  style?: React.CSSProperties;
}
export function SectionHead(props: SectionHeadProps): JSX.Element;
