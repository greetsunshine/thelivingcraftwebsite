/** Square, ink-filled checkbox. The check is a typographic × in the mono face, not an icon. */
export interface CheckboxProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
