/**
 * Rule-separated table for dense working surfaces (review queues, cohort rosters,
 * agent run logs). Header rule is heavy, row rules are hairlines; there is no
 * container border, because the table's own alignment is the container.
 * @startingPoint section="Working surfaces" subtitle="Dense table + agent output" viewport="700x320"
 */
export interface DataTableColumn {
  key: string;
  label: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  /** Set numerals/IDs in the mono face. */
  mono?: boolean;
  quiet?: boolean;
}
export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Array<Record<string, React.ReactNode> & { id?: string }>;
  dense?: boolean;
  zebra?: boolean;
  /** Shown when rows is empty — write a real sentence, not "No data". */
  empty?: React.ReactNode;
  style?: React.CSSProperties;
}
export function DataTable(props: DataTableProps): JSX.Element;
