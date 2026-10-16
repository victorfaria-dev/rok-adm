import { useEffect, useRef, useState } from "preact/hooks";
import { CIVILIZATION_NAMES, checkImageFile } from "../../../lib/ocr";
import { combineReads, SCREEN_NAMES, type Combined, type FieldKey, type VipLevel } from "../../../lib/ocr-combine";
import { wordsToText, type ScreenRead } from "../../../lib/ocr-read";
import { encodeShare } from "../../../lib/tools-store";
import type { OcrProgress, ScreenReader } from "../../../lib/ocr-engine";

type Phase = "idle" | "ready" | "reading" | "done" | "failed";
const MAX_FILES = 4;

interface Props {
  /** VIP thresholds (from the data table), to check the VIP points bar. */
  vipLevels?: VipLevel[];
  /** Tests pass a stub; the page loads Tesseract on demand. */
  createReader?: (onProgress: (p: OcrProgress) => void) => Promise<ScreenReader>;
}

const defaultCreate = async (onProgress: (p: OcrProgress) => void): Promise<ScreenReader> =>
  (await import("../../../lib/ocr-engine")).createScreenReader(onProgress);

interface Item {
  id: number;
  file: File;
  preview: string;
  read?: ScreenRead;
  /** Why this screenshot gave nothing. */
  problem?: string;
  text?: string;
}

interface Field {
  key: FieldKey;
  label: string;
  help: string;
  min: number;
  max: number;
  kind?: "civ";
}
const FIELDS: readonly Field[] = [
  { key: "governorId", label: "ID do Governador", help: "O número depois de \"ID:\" no seu perfil.", min: 100_000, max: 999_999_999_999 },
  { key: "power", label: "Poder", help: "Como aparece no jogo, por exemplo 45.678.901.", min: 1_000, max: 1_000_000_000_000 },
  { key: "killPoints", label: "Pontos de abate", help: "Do seu perfil.", min: 0, max: 1_000_000_000_000_000 },
  { key: "civilization", label: "Civilização", help: "Escolha, se não foi encontrada.", min: 0, max: 0, kind: "civ" },
  { key: "merit", label: "Pontos de mérito", help: "Do seu perfil.", min: 0, max: 1_000_000_000_000 },
  { key: "highestMerit", label: "Maior mérito", help: "Do seu perfil.", min: 0, max: 1_000_000_000_000 },
  { key: "cityHall", label: "Nível da Prefeitura", help: "1 a 25.", min: 1, max: 25 },
  { key: "vip", label: "Nível de VIP", help: "0 a 20.", min: 0, max: 20 },
  { key: "vipPoints", label: "Pontos VIP", help: "O primeiro número da barra de pontos VIP.", min: 0, max: 100_000_000 },
  { key: "streakDay", label: "Sequência de login (dias)", help: "O contador de dias seguidos de login na tela de VIP.", min: 1, max: 10_000 },
];

const SOURCE: Record<string, string> = {
  profile: "Perfil do Governador", city: "visão da cidade", vip: "tela de VIP", album: "Álbum",
};

function parseField(f: Field, text: string): { value: number | string | null; error: string | null } {
  const t = text.trim();
  if (!t) return { value: null, error: null };
  if (f.kind === "civ") return { value: t, error: null };
  const n = t.replace(/[,.\s'’]/g, "");
  if (!/^\d+$/.test(n)) return { value: null, error: "Digite um número inteiro." };
  const v = Number(n);
  if (v < f.min || v > f.max) return { value: null, error: `Use ${f.min.toLocaleString("pt-BR")} a ${f.max.toLocaleString("pt-BR")}.` };
  return { value: v, error: null };
}

const show = (f: Field, v: number | string | undefined): string =>
  v === undefined ? "" : typeof v === "string" ? v : f.key === "governorId" || f.key === "cityHall" || f.key === "vip" ? String(v) : v.toLocaleString("pt-BR");

const link = (path: string, inputs: Record<string, number>): string => `${path}?s=${encodeShare(inputs)}`;
const empty = (): Record<FieldKey, string> => Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>;

/** F-54 experimental: read the player's own game screenshots on this device and suggest values to check. */
export default function ScreenshotReader({ vipLevels = [], createReader = defaultCreate }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [current, setCurrent] = useState(0);
  const [combined, setCombined] = useState<Combined | null>(null);
  const [values, setValues] = useState<Record<FieldKey, string>>(empty);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const nextId = useRef(1);

  // Free the preview images when the list changes or the page part goes away.
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => { if (phase === "done") resultsHeading.current?.focus(); }, [phase]);

  function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = "";
    if (!files.length) return;
    const room = MAX_FILES - items.length;
    const bad = files.map(checkImageFile).find((x) => x !== null);
    if (bad) return setError(bad);
    if (files.length > room) return setError(`No máximo ${MAX_FILES} prints por vez: um de cada tela.`);
    setError("");
    const added = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { id: nextId.current++, file, preview };
    });
    setItems((xs) => [...xs.map(({ read: _r, problem: _p, text: _t, ...x }) => x), ...added]);
    setCombined(null);
    setPhase("ready");
  }

  function remove(id: number) {
    setItems((xs) => {
      const next = xs.filter((x) => x.id !== id);
      if (!next.length) setPhase("idle");
      return next;
    });
  }

  async function run() {
    if (!items.length) return;
    setPhase("reading");
    setError("");
    setProgress({ progress: 0, step: "Carregando o leitor de texto" });
    let reader: ScreenReader | null = null;
    try {
      reader = await createReader(setProgress);
      const done: Item[] = [];
      for (const [i, item] of items.entries()) {
        setCurrent(i + 1);
        const out = await reader.read(item.file, setProgress);
        const text = out.parts.map((p) => `[${p.part.name}]\n${wordsToText(p.words)}`).join("\n\n");
        done.push(out.result.ok ? { ...item, read: out.result, text } : { ...item, problem: out.result.reason, text });
      }
      const c = combineReads(done.flatMap((x) => (x.read ? [x.read] : [])), vipLevels);
      setItems(done);
      setCombined(c);
      setValues(Object.fromEntries(FIELDS.map((f) => [f.key, show(f, c.values[f.key])])) as Record<FieldKey, string>);
      setPhase("done");
    } catch {
      setPhase("failed");
      setError("Este navegador não conseguiu executar o leitor de texto (ele precisa de WebAssembly e de cerca de 4 MB). Digite os valores você mesmo nas ferramentas.");
    } finally {
      await reader?.close().catch(() => {});
    }
  }

  const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, parseField(f, values[f.key])])) as Record<FieldKey, ReturnType<typeof parseField>>;
  const num = (k: FieldKey) => (typeof parsed[k].value === "number" ? (parsed[k].value as number) : null);
  const ch = num("cityHall"), power = num("power"), vip = num("vip"), vipPoints = num("vipPoints"), streak = num("streakDay");
  const migration: Record<string, number> = {};
  if (ch !== null) migration.cityHall = ch;
  if (power !== null) migration.powerM = Math.round(power / 10_000) / 100;
  const vipInputs: Record<string, number> = {};
  if (vip !== null && vip < 20) vipInputs.targetVip = vip + 1;
  if (vipPoints !== null) vipInputs.vipPoints = vipPoints;
  if (streak !== null) vipInputs.streakDay = streak;
  const pct = progress ? Math.round(progress.progress * 100) : 0;
  const shown = FIELDS.filter((f) => combined?.sources[f.key] || values[f.key] || ["power", "cityHall", "vip"].includes(f.key));

  return (
    <div class="t-page-body ocr" data-ocr={phase}>
      <section class="t-section" aria-labelledby="ocr-pick-h">
        <h2 id="ocr-pick-h">1. Seus prints</h2>
        <p class="t-note">Até {MAX_FILES}, um de cada uma destas telas da sua própria conta. O leitor descobre qual é qual.</p>
        <ul class="ocr-screens" data-ocr-screens>
          <li><strong>Perfil do Governador</strong> (toque no seu retrato): ID, poder, pontos de abate, civilização, mérito.</li>
          <li><strong>Visão da cidade com a Prefeitura tocada</strong>, para o nome e o nível aparecerem acima dela: nível da Prefeitura, nível de VIP, poder.</li>
          <li><strong>Tela de VIP</strong> (toque no emblema de VIP): nível de VIP, pontos VIP, sequência de login.</li>
          <li><strong>Álbum</strong> (a partir do seu perfil): o seu nome e o código de seis dígitos numa foto. Opcional; nada usa o código ainda.</li>
        </ul>
        <label class={`btn btn-secondary ocr-file${phase === "reading" || items.length >= MAX_FILES ? " is-disabled" : ""}`}>
          {items.length ? "Adicionar prints" : "Escolher prints"}
          <input class="visually-hidden" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={pick} data-ocr-file
            disabled={phase === "reading" || items.length >= MAX_FILES} />
        </label>
        {items.length > 0 && (
          <ul class="ocr-items" aria-label="Prints escolhidos">
            {items.map((it, i) => (
              <li class="ocr-item" key={it.id} data-ocr-item>
                <img class="ocr-preview" src={it.preview} alt={`Print ${i + 1} (fica neste aparelho)`} data-ocr-preview />
                <div class="ocr-item-body">
                  <p class="ocr-item-name">Print {i + 1}</p>
                  {it.read && <p class="t-note" data-ocr-kind={it.read.screen}>Parece ser: {SCREEN_NAMES[it.read.screen]}</p>}
                  {it.problem && <p class="t-error" data-ocr-problem>{it.problem}</p>}
                  {phase !== "reading" && (
                    <button type="button" class="btn btn-secondary ocr-remove" onClick={() => remove(it.id)} aria-label={`Remover print ${i + 1}`}>Remover</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="t-section" aria-labelledby="ocr-read-h">
        <h2 id="ocr-read-h">2. Leia-os neste aparelho</h2>
        <p class="t-note">Na primeira vez, o leitor de texto é baixado deste site (cerca de 4 MB). Suas imagens nunca são enviadas. Cada print leva alguns segundos.</p>
        <button type="button" class="btn btn-primary" onClick={() => void run()} disabled={!items.length || phase === "reading"} data-ocr-read>
          {phase === "reading" ? "Lendo…" : items.length > 1 ? "Ler os prints" : "Ler o print"}
        </button>
        <p class="t-status" role="status" aria-live="polite" data-ocr-status>
          {phase === "reading" && progress
            ? `${items.length > 1 ? `Print ${current} de ${items.length}: ` : ""}${progress.step}… ${pct}%`
            : phase === "done" ? "Pronto. Confira as sugestões abaixo." : ""}
        </p>
        {phase === "reading" && <progress class="ocr-progress" max={100} value={pct} aria-label="Progresso da leitura" />}
        {error && <p class="t-error" role="alert">{error}</p>}
      </section>

      {phase === "done" && combined && (
        <section class="t-section" aria-labelledby="ocr-out-h" data-ocr-results>
          <h2 id="ocr-out-h" tabIndex={-1} ref={resultsHeading}>3. Confira as sugestões</h2>
          <p class="t-note">
            São palpites a partir da leitura da imagem, não conferidos com o jogo. Compare cada valor com a sua tela e corrija.
            Nada é salvo até você abrir uma ferramenta e mudar algo lá.
          </p>
          {combined.screens.length === 0 && <p class="t-error" data-ocr-none>Nenhum dos prints correspondeu a uma tela compatível. Você ainda pode digitar seus valores abaixo.</p>}
          {combined.notes.length > 0 && (
            <ul class="ocr-notes" aria-label="Observações sobre a leitura" data-ocr-notes>
              {combined.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Valores sugeridos">
            {shown.map((f) => {
              const p = parsed[f.key];
              const id = `ocr-${f.key}`;
              const src = combined.sources[f.key];
              const describedBy = [`${id}-help`, p.error ? `${id}-err` : ""].filter(Boolean).join(" ");
              const onInput = (e: Event) => { const v = (e.currentTarget as HTMLInputElement | HTMLSelectElement).value; setValues((x) => ({ ...x, [f.key]: v })); };
              return (
                <div class={`t-field${p.error ? " t-field-error" : ""}`} key={f.key}>
                  <label for={id}>{f.label}</label>
                  <p id={`${id}-help`} class="t-help">{src ? `Sugerido por: ${SOURCE[src]}. ` : "Não encontrado nos seus prints: digite, se quiser. "}{f.help}</p>
                  {f.kind === "civ" ? (
                    <select id={id} value={values[f.key]} aria-describedby={describedBy} onChange={onInput}>
                      <option value="">Não definida</option>
                      {Object.entries(CIVILIZATION_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                    </select>
                  ) : (
                    <input id={id} type="text" inputMode="numeric" autoComplete="off" value={values[f.key]}
                      aria-invalid={p.error ? "true" : undefined} aria-describedby={describedBy} onInput={onInput} />
                  )}
                  {p.error && <p id={`${id}-err`} class="t-error">{p.error}</p>}
                </div>
              );
            })}
          </form>
          {combined.album && (
            <div class="ocr-album" data-ocr-album>
              <h3>Álbum</h3>
              <p>Nome acima das fotos: <strong>{combined.album.name ?? "ilegível"}</strong>.{" "}
                {combined.album.sameNameAsProfile === true && "Mesmo nome do print do seu perfil."}
                {combined.album.sameNameAsProfile === false && "Nome diferente do print do seu perfil."}
              </p>
              <p>{combined.album.codes.length > 1 ? "Códigos" : "Código"} de seis dígitos nas fotos: <strong>{combined.album.codes.join(", ")}</strong></p>
              <p class="t-note">A verificação de conta com código do álbum ainda não está disponível neste site. Isto só mostra o que foi lido.</p>
            </div>
          )}
          <h3>Use em uma ferramenta</h3>
          <ul class="t-links ocr-links">
            {Object.keys(migration).length > 0 && <li><a href={link("/tools/migration/", migration)} data-ocr-use="migration">Verificador de migração com estes valores</a></li>}
            {ch !== null && <li><a href={link("/tools/gems/", { cityHall: ch })} data-ocr-use="gems">Tabela de valor das gemas para a Prefeitura {ch}</a></li>}
            {Object.keys(vipInputs).length > 0 && (
              <li><a href={link("/tools/vip/", vipInputs)} data-ocr-use="vip">{vipInputs.targetVip ? `Gemas para chegar ao VIP ${vipInputs.targetVip}` : "Gemas para VIP com estes valores"}</a></li>
            )}
          </ul>
          <p class="t-note">Estes links preenchem a ferramenta por uma visita; a ferramenta só salva quando você edita um valor lá.</p>
          {items.map((it, i) => (
            <details class="ocr-raw" key={it.id}>
              <summary>Texto lido do print {i + 1}</summary>
              <pre data-ocr-text>{it.text?.trim() || "(nenhum texto encontrado)"}</pre>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
