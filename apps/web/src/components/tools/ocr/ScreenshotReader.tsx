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
  { key: "governorId", label: "Governor ID", help: "The number after \"ID:\" on your profile.", min: 100_000, max: 999_999_999_999 },
  { key: "power", label: "Power", help: "As shown in the game, e.g. 45,678,901.", min: 1_000, max: 1_000_000_000_000 },
  { key: "killPoints", label: "Kill points", help: "From your profile.", min: 0, max: 1_000_000_000_000_000 },
  { key: "civilization", label: "Civilization", help: "Pick it if it was not found.", min: 0, max: 0, kind: "civ" },
  { key: "merit", label: "Merit points", help: "From your profile.", min: 0, max: 1_000_000_000_000 },
  { key: "highestMerit", label: "Highest merit", help: "From your profile.", min: 0, max: 1_000_000_000_000 },
  { key: "cityHall", label: "City Hall level", help: "1 to 25.", min: 1, max: 25 },
  { key: "vip", label: "VIP level", help: "0 to 20.", min: 0, max: 20 },
  { key: "vipPoints", label: "VIP points", help: "The first number on the VIP points bar.", min: 0, max: 100_000_000 },
  { key: "streakDay", label: "Login streak (days)", help: "\"Consecutive login days\" on the VIP screen.", min: 1, max: 10_000 },
];

const SOURCE: Record<string, string> = {
  profile: "Governor Profile", city: "city view", vip: "VIP screen", album: "Album",
};

function parseField(f: Field, text: string): { value: number | string | null; error: string | null } {
  const t = text.trim();
  if (!t) return { value: null, error: null };
  if (f.kind === "civ") return { value: t, error: null };
  const n = t.replace(/[,.\s'’]/g, "");
  if (!/^\d+$/.test(n)) return { value: null, error: "Enter a whole number." };
  const v = Number(n);
  if (v < f.min || v > f.max) return { value: null, error: `Use ${f.min.toLocaleString("en-US")} to ${f.max.toLocaleString("en-US")}.` };
  return { value: v, error: null };
}

const show = (f: Field, v: number | string | undefined): string =>
  v === undefined ? "" : typeof v === "string" ? v : f.key === "governorId" || f.key === "cityHall" || f.key === "vip" ? String(v) : v.toLocaleString("en-US");

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
    if (files.length > room) return setError(`Up to ${MAX_FILES} screenshots at a time: one of each screen.`);
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
    setProgress({ progress: 0, step: "Loading the text reader" });
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
      setError("This browser could not run the text reader (it needs WebAssembly and about 4 MB). Type the values yourself in the tools instead.");
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
        <h2 id="ocr-pick-h">1. Your screenshots</h2>
        <p class="t-note">Up to {MAX_FILES}, one of each of these screens of your own account. The reader finds out which is which.</p>
        <ul class="ocr-screens" data-ocr-screens>
          <li><strong>Governor Profile</strong> (tap your portrait): ID, power, kill points, civilization, merit.</li>
          <li><strong>City view with the City Hall tapped</strong>, so its name and level show above it: City Hall level, VIP level, power.</li>
          <li><strong>VIP screen</strong> (tap the VIP badge): VIP level, VIP points, login streak.</li>
          <li><strong>Album</strong> (from your profile): your name and the six-digit code on a photo. Optional; nothing uses the code yet.</li>
        </ul>
        <label class={`btn btn-secondary ocr-file${phase === "reading" || items.length >= MAX_FILES ? " is-disabled" : ""}`}>
          {items.length ? "Add screenshots" : "Choose screenshots"}
          <input class="visually-hidden" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={pick} data-ocr-file
            disabled={phase === "reading" || items.length >= MAX_FILES} />
        </label>
        {items.length > 0 && (
          <ul class="ocr-items" aria-label="Chosen screenshots">
            {items.map((it, i) => (
              <li class="ocr-item" key={it.id} data-ocr-item>
                <img class="ocr-preview" src={it.preview} alt={`Screenshot ${i + 1} (stays on this device)`} data-ocr-preview />
                <div class="ocr-item-body">
                  <p class="ocr-item-name">Screenshot {i + 1}</p>
                  {it.read && <p class="t-note" data-ocr-kind={it.read.screen}>Looks like: {SCREEN_NAMES[it.read.screen]}</p>}
                  {it.problem && <p class="t-error" data-ocr-problem>{it.problem}</p>}
                  {phase !== "reading" && (
                    <button type="button" class="btn btn-secondary ocr-remove" onClick={() => remove(it.id)} aria-label={`Remove screenshot ${i + 1}`}>Remove</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="t-section" aria-labelledby="ocr-read-h">
        <h2 id="ocr-read-h">2. Read them on this device</h2>
        <p class="t-note">The first time, the text reader downloads from this site (about 4 MB). Your images are never uploaded. Each screenshot takes a few seconds.</p>
        <button type="button" class="btn btn-primary" onClick={() => void run()} disabled={!items.length || phase === "reading"} data-ocr-read>
          {phase === "reading" ? "Reading…" : items.length > 1 ? "Read the screenshots" : "Read the screenshot"}
        </button>
        <p class="t-status" role="status" aria-live="polite" data-ocr-status>
          {phase === "reading" && progress
            ? `${items.length > 1 ? `Screenshot ${current} of ${items.length}: ` : ""}${progress.step}… ${pct}%`
            : phase === "done" ? "Done. Check the suggestions below." : ""}
        </p>
        {phase === "reading" && <progress class="ocr-progress" max={100} value={pct} aria-label="Reading progress" />}
        {error && <p class="t-error" role="alert">{error}</p>}
      </section>

      {phase === "done" && combined && (
        <section class="t-section" aria-labelledby="ocr-out-h" data-ocr-results>
          <h2 id="ocr-out-h" tabIndex={-1} ref={resultsHeading}>3. Check the suggestions</h2>
          <p class="t-note">
            These are guesses from reading the image, not checked against the game. Compare each value with your screen and fix it.
            Nothing is saved until you open a tool and change something there.
          </p>
          {combined.screens.length === 0 && <p class="t-error" data-ocr-none>None of the screenshots matched a supported screen. You can still type your values below.</p>}
          {combined.notes.length > 0 && (
            <ul class="ocr-notes" aria-label="Notes about the reading" data-ocr-notes>
              {combined.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Suggested values">
            {shown.map((f) => {
              const p = parsed[f.key];
              const id = `ocr-${f.key}`;
              const src = combined.sources[f.key];
              const describedBy = [`${id}-help`, p.error ? `${id}-err` : ""].filter(Boolean).join(" ");
              const onInput = (e: Event) => { const v = (e.currentTarget as HTMLInputElement | HTMLSelectElement).value; setValues((x) => ({ ...x, [f.key]: v })); };
              return (
                <div class={`t-field${p.error ? " t-field-error" : ""}`} key={f.key}>
                  <label for={id}>{f.label}</label>
                  <p id={`${id}-help`} class="t-help">{src ? `Suggested from the ${SOURCE[src]}. ` : "Not found in your screenshots: type it if you want. "}{f.help}</p>
                  {f.kind === "civ" ? (
                    <select id={id} value={values[f.key]} aria-describedby={describedBy} onChange={onInput}>
                      <option value="">Not set</option>
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
              <h3>Album</h3>
              <p>Name above the photos: <strong>{combined.album.name ?? "not readable"}</strong>.{" "}
                {combined.album.sameNameAsProfile === true && "Same name as on your profile screenshot."}
                {combined.album.sameNameAsProfile === false && "Not the same name as on your profile screenshot."}
              </p>
              <p>Six-digit code{combined.album.codes.length > 1 ? "s" : ""} on the photos: <strong>{combined.album.codes.join(", ")}</strong></p>
              <p class="t-note">Account checks with an album code are not available on this site yet. This only shows what was read.</p>
            </div>
          )}
          <h3>Use them in a tool</h3>
          <ul class="t-links ocr-links">
            {Object.keys(migration).length > 0 && <li><a href={link("/tools/migration/", migration)} data-ocr-use="migration">Migration checker with these values</a></li>}
            {ch !== null && <li><a href={link("/tools/gems/", { cityHall: ch })} data-ocr-use="gems">Gem value table for City Hall {ch}</a></li>}
            {Object.keys(vipInputs).length > 0 && (
              <li><a href={link("/tools/vip/", vipInputs)} data-ocr-use="vip">{vipInputs.targetVip ? `Gems to reach VIP ${vipInputs.targetVip}` : "Gems to VIP with these values"}</a></li>
            )}
          </ul>
          <p class="t-note">These links fill the tool for one visit; the tool saves only when you edit a value there.</p>
          {items.map((it, i) => (
            <details class="ocr-raw" key={it.id}>
              <summary>Text read from screenshot {i + 1}</summary>
              <pre data-ocr-text>{it.text?.trim() || "(no text found)"}</pre>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
