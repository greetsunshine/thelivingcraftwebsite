/** Label/value pairs — cohort facts, run parameters, artifact colophons. Labels in mono caps, values in the reading face. */
export interface MetaListItem { label: string; value: React.ReactNode; mono?: boolean }
export interface MetaListProps {
  items: MetaListItem[];
  layout?: "rows" | "inline";
  style?: React.CSSProperties;
}
export function MetaList(props: MetaListProps): JSX.Element;
