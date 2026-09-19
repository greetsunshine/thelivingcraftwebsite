/**
 * A block of agent speech. Always attributed (which agent), always stated (which
 * provenance state), always visually offset from human text by the coloured left
 * rule — an agent never speaks in unmarked body copy.
 */
export interface AgentBlockProps {
  /** Agent name as members refer to it: reviewer, guide, scout. */
  agent?: string;
  state?: "machine" | "human" | "uncertain" | "refused" | "cited";
  /** Mono timestamp / run id, right-aligned. */
  stamp?: React.ReactNode;
  /** Approve / dismiss controls — pass Buttons. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function AgentBlock(props: AgentBlockProps): JSX.Element;
