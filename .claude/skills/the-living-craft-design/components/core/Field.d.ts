/** Label + control + hint/error wrapper. The label is set in the marginal (mono) face at caps size — labels are apparatus, not content. */
export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Replaces the hint and turns it accent-coloured. */
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Field(props: FieldProps): JSX.Element;
