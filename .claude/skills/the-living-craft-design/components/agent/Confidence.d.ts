/** Quantised confidence — five ticks and a fraction, never a percentage. A stated 5/5 is still machine-read, so pair it with Provenance rather than letting it stand as a verdict. */
export interface ConfidenceProps {
  /** 0–1. Rounded to the tick count; the system does not display false precision. */
  value?: number;
  ticks?: number;
  label?: boolean;
  style?: React.CSSProperties;
}
export function Confidence(props: ConfidenceProps): JSX.Element;
