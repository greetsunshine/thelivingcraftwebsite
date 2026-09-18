/** A stated refusal. An agent that will not answer says so in full-size type with a reason and a next step — never a greyed-out control or a silent empty result. */
export interface RefusalProps {
  agent?: string;
  /** Why, in one plain sentence, first person: "I can't read the queue config." */
  reason: React.ReactNode;
  /** What the member can do about it. */
  next?: React.ReactNode;
  stamp?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Refusal(props: RefusalProps): JSX.Element;
