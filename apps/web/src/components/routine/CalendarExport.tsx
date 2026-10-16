import { useState } from "preact/hooks";
import type { PlannedTask } from "@rokadm/planner";
import { ICS_FILENAME, buildRoutineIcs, makeUid } from "../../lib/ics";

interface Props {
  tasks: readonly PlannedTask[];
  totalMinutes: number;
  now: () => Date;
}

/** Hand a text file to the browser as a download. Nothing leaves the device. */
function download(text: string, filename: string): boolean {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

/** F-86 v0: one daily calendar event for the routine, as an .ics file made on this device. */
export function CalendarExport({ tasks, totalMinutes, now }: Props) {
  const [time, setTime] = useState("20:00");
  const [status, setStatus] = useState("");

  const onDownload = (): void => {
    const at = now();
    const ics = buildRoutineIcs({
      tasks: tasks.map((t) => ({ title: t.title, minutes: t.minutes, isEstimate: t.isEstimate })),
      totalMinutes,
      time,
      now: at,
      uid: makeUid(at),
    });
    setStatus(download(ics, ICS_FILENAME) ? `${ICS_FILENAME} salvo. Abra-o para adicionar o evento.` : "Este navegador não consegue salvar arquivos.");
  };

  return (
    <section class="rt-section" aria-labelledby="rt-cal-title">
      <h2 id="rt-cal-title">Adicionar ao calendário</h2>
      <p class="rt-help">
        Um evento por dia com esta checklist. O seu app de calendário vai lembrar você; dá para apagar o evento quando quiser.
        O arquivo é feito neste aparelho e nada é enviado para lugar nenhum.
      </p>
      <div class="rt-cal">
        <div class="rt-field">
          <label for="rt-time">Horário do lembrete</label>
          <input id="rt-time" type="time" value={time} required onInput={(e) => setTime((e.currentTarget as HTMLInputElement).value)} />
        </div>
        <button type="button" class="btn btn-primary" onClick={onDownload}>Baixar arquivo de calendário</button>
      </div>
      <p class="rt-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
