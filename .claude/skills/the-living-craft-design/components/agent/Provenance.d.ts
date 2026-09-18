/**
 * The provenance marker — the single most important component in this system.
 * Every claim on every surface is one of five states, and each has a fixed mono
 * sigil so it survives print, plain text, and a colour-blind reader:
 * [M] machine-read · [H] human-approved · [~] hedged · [×] refused · [†] cited.
 * Never invent a sixth state; never use colour alone to carry the distinction.
 */
export interface ProvenanceProps {
  state?: "machine" | "human" | "uncertain" | "refused" | "cited";
  /** Override the word after the sigil, or `false` for sigil only (table cells). */
  label?: React.ReactNode | false;
  /** Bordered chip instead of bare text — for table cells and dense rails. */
  filled?: boolean;
  style?: React.CSSProperties;
}
export function Provenance(props: ProvenanceProps): JSX.Element;
export const PROVENANCE: Record<string, { sigil: string; label: string; ink: string; bg: string }>;
