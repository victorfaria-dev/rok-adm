import { formatInt, type MgePublicEvent } from "@rokadm/planner";
import { longDay } from "../../../lib/kingdom-mge";

interface Props {
  event: MgePublicEvent;
  showScores: boolean;
}

/** One event's ledger: slot → governor → why. Used by the planner and the public view page. */
export default function LedgerTable({ event, showScores }: Props) {
  const rows: Array<{ slot: number; name: string | null; reason: string; score?: number }> = [
    ...event.slots,
    ...event.unfilled.map((slot) => ({ slot, name: null, reason: "" })),
  ].sort((a, b) => a.slot - b.slot);
  const caption = `${longDay(event.date)}${event.commander ? `, ${event.commander}` : ""}${event.locked ? " (travado)" : ""}`;
  return (
    <div class="kg-table-wrap" tabIndex={0} role="region" aria-label={`Registro: ${caption}`}>
      <table class="kg-table kx-ledger" data-ledger={event.date}>
        <caption>Registro: {caption}</caption>
        <thead>
          <tr>
            <th scope="col" class="num">Vaga</th>
            <th scope="col">Governador</th>
            <th scope="col">Por quê</th>
            {showScores && <th scope="col" class="num">Pontuação</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slot} data-slot={r.slot}>
              <td class="num">{r.slot}</td>
              <td>{r.name ?? <span class="kx-muted">Não preenchida</span>}</td>
              <td>{r.reason}</td>
              {showScores && <td class="num">{r.score !== undefined ? formatInt(r.score) : ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
