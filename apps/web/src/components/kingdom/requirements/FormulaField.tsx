// Formula input with live validation (error below, aria-invalid) and a plain-language explanation.
import { explainFormula, formatFormula, parseFormula, type ParseResult } from "@rokadm/planner";
import type { JSX } from "preact";
import { TextField } from "../shared/Field";

export const FORMULA_HINT = "Names: t1–t5 (kills by troop tier), deads, kp (kill points), power. Use + - * / and parentheses; min, max, round, floor, ceil, abs. Example: t4 * 10 + t5 * 20 + deads * 50.";

interface Props {
  id: string;
  label: string;
  value: string;
  onValue: (v: string) => void;
  /** Show "write a formula" as an error when empty (otherwise empty is allowed and quiet). */
  required?: boolean;
  hint?: string;
}

export function formulaState(value: string, required: boolean): { parsed: ParseResult | null; error?: string } {
  if (!value.trim() && !required) return { parsed: null };
  const parsed = parseFormula(value);
  return { parsed, error: parsed.ok ? undefined : parsed.error.message };
}

export default function FormulaField({ id, label, value, onValue, required = true, hint = FORMULA_HINT }: Props): JSX.Element {
  const { parsed, error } = formulaState(value, required);
  return (
    <div class="kr-formula">
      <TextField id={id} label={label} value={value} onValue={onValue} hint={hint} error={error} maxLength={300} placeholder="t4 * 10 + t5 * 20 + deads * 50" />
      {parsed?.ok && (
        <div class="kr-explain" data-explain={id}>
          <p>{explainFormula(parsed.ast)}</p>
          <p class="kg-hint">Read as: <code>{formatFormula(parsed.ast)}</code></p>
        </div>
      )}
    </div>
  );
}
