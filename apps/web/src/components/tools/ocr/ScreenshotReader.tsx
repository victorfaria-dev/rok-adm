import { useEffect, useRef, useState } from "preact/hooks";
import { OCR_LIMITS, checkImageFile, parseProfileText } from "../../../lib/ocr";
import { encodeShare } from "../../../lib/tools-store";
import type { OcrProgress } from "../../../lib/ocr-engine";

type Phase = "idle" | "ready" | "reading" | "done" | "failed";

interface Props {
  /** Tests pass a stub; the page loads Tesseract on demand. */
  read?: (image: Blob, onProgress: (p: OcrProgress) => void) => Promise<string>;
}

const defaultRead = async (image: Blob, onProgress: (p: OcrProgress) => void): Promise<string> =>
  (await import("../../../lib/ocr-engine")).readImageText(image, onProgress);

interface Field {
  key: "cityHall" | "power" | "vip";
  label: string;
  help: string;
  min: number;
  max: number;
}
const FIELDS: readonly Field[] = [
  { key: "cityHall", label: "City Hall level", help: "1 to 25.", min: 1, max: OCR_LIMITS.cityHallMax },
  { key: "power", label: "Power", help: "As shown on your profile, e.g. 45,678,901.", min: OCR_LIMITS.powerMin, max: OCR_LIMITS.powerMax },
  { key: "vip", label: "VIP level", help: "0 to 20.", min: 0, max: OCR_LIMITS.vipMax },
];

function parseField(f: Field, text: string): { value: number | null; error: string | null } {
  const t = text.trim().replace(/[,\s]/g, "");
  if (!t) return { value: null, error: null };
  if (!/^\d+$/.test(t)) return { value: null, error: "Enter a whole number." };
  const n = Number(t);
  if (n < f.min || n > f.max) return { value: null, error: `Use ${f.min.toLocaleString("en-US")} to ${f.max.toLocaleString("en-US")}.` };
  return { value: n, error: null };
}

const link = (path: string, inputs: Record<string, number>): string => `${path}?s=${encodeShare(inputs)}`;

/** F-54 experimental: read City Hall, power and VIP from the player's own profile screenshot, on this device. */
export default function ScreenshotReader({ read = defaultRead }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [rawText, setRawText] = useState("");
  const [values, setValues] = useState<Record<Field["key"], string>>({ cityHall: "", power: "", vip: "" });
  const [found, setFound] = useState<Record<Field["key"], boolean>>({ cityHall: false, power: false, vip: false });
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  // Free the preview image when it changes or the page part goes away.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (phase === "done") resultsHeading.current?.focus(); }, [phase]);

  function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    input.value = "";
    if (!f) return;
    const bad = checkImageFile(f);
    if (bad) {
      setError(bad);
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase("ready");
  }

  async function run() {
    if (!file) return;
    setPhase("reading");
    setError("");
    setProgress({ progress: 0, step: "Loading the text reader" });
    try {
      const text = await read(file, setProgress);
      const s = parseProfileText(text);
      setRawText(text);
      setValues({ cityHall: s.cityHall?.toString() ?? "", power: s.power?.toLocaleString("en-US") ?? "", vip: s.vip?.toString() ?? "" });
      setFound({ cityHall: s.cityHall !== null, power: s.power !== null, vip: s.vip !== null });
      setPhase("done");
    } catch {
      setPhase("failed");
      setError("This browser could not run the text reader (it needs WebAssembly and about 4 MB). Type the values yourself in the tools instead.");
    }
  }

  const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, parseField(f, values[f.key])])) as Record<Field["key"], ReturnType<typeof parseField>>;
  const ch = parsed.cityHall.value, power = parsed.power.value, vip = parsed.vip.value;
  const migration: Record<string, number> = {};
  if (ch !== null) migration.cityHall = ch;
  if (power !== null) migration.powerM = Math.round(power / 10_000) / 100;
  const pct = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <div class="t-page-body ocr" data-ocr={phase}>
      <section class="t-section" aria-labelledby="ocr-pick-h">
        <h2 id="ocr-pick-h">1. Your screenshot</h2>
        <p class="t-note">Use a screenshot of your own governor profile. Other players' screens are not for this tool.</p>
        <label class="btn btn-secondary ocr-file">
          {file ? "Choose another screenshot" : "Choose a screenshot"}
          <input class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} data-ocr-file disabled={phase === "reading"} />
        </label>
        {preview && <img class="ocr-preview" src={preview} alt="Your screenshot (stays on this device)" data-ocr-preview />}
      </section>

      <section class="t-section" aria-labelledby="ocr-read-h">
        <h2 id="ocr-read-h">2. Read it on this device</h2>
        <p class="t-note">The first time, the text reader downloads from this site (about 4 MB). Your image is never uploaded.</p>
        <button type="button" class="btn btn-primary" onClick={() => void run()} disabled={!file || phase === "reading"} data-ocr-read>
          {phase === "reading" ? "Reading…" : "Read the screenshot"}
        </button>
        <p class="t-status" role="status" aria-live="polite" data-ocr-status>
          {phase === "reading" && progress ? `${progress.step}… ${pct}%` : phase === "done" ? "Done. Check the suggestions below." : ""}
        </p>
        {phase === "reading" && <progress class="ocr-progress" max={100} value={pct} aria-label="Reading progress" />}
        {error && <p class="t-error" role="alert">{error}</p>}
      </section>

      {phase === "done" && (
        <section class="t-section" aria-labelledby="ocr-out-h" data-ocr-results>
          <h2 id="ocr-out-h" tabIndex={-1} ref={resultsHeading}>3. Check the suggestions</h2>
          <p class="t-note">Text reading makes mistakes. Compare each value with your screen and fix it. Nothing is saved until you open a tool and change something there.</p>
          <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Suggested values">
            {FIELDS.map((f) => {
              const p = parsed[f.key];
              const id = `ocr-${f.key}`;
              const describedBy = [`${id}-help`, p.error ? `${id}-err` : ""].filter(Boolean).join(" ");
              return (
                <div class={`t-field${p.error ? " t-field-error" : ""}`} key={f.key}>
                  <label for={id}>{f.label}</label>
                  <p id={`${id}-help`} class="t-help">{found[f.key] ? "Suggested from your screenshot. " : "Not found in the screenshot: type it if you want. "}{f.help}</p>
                  <input id={id} type="text" inputMode="numeric" autoComplete="off" value={values[f.key]}
                    aria-invalid={p.error ? "true" : undefined} aria-describedby={describedBy}
                    onInput={(e) => { const v = (e.currentTarget as HTMLInputElement).value; setValues((x) => ({ ...x, [f.key]: v })); }} />
                  {p.error && <p id={`${id}-err`} class="t-error">{p.error}</p>}
                </div>
              );
            })}
          </form>
          <h3>Use them in a tool</h3>
          <ul class="t-links ocr-links">
            {Object.keys(migration).length > 0 && <li><a href={link("/tools/migration/", migration)} data-ocr-use="migration">Migration checker with these values</a></li>}
            {ch !== null && <li><a href={link("/tools/gems/", { cityHall: ch })} data-ocr-use="gems">Gem value table for City Hall {ch}</a></li>}
            {vip !== null && vip < OCR_LIMITS.vipMax && <li><a href={link("/tools/vip/", { targetVip: vip + 1 })} data-ocr-use="vip">Gems to reach VIP {vip + 1}</a></li>}
          </ul>
          <p class="t-note">These links fill the tool for one visit; the tool saves only when you edit a value there.</p>
          <details class="ocr-raw">
            <summary>Text read from the screenshot</summary>
            <pre data-ocr-text>{rawText.trim() || "(no text found)"}</pre>
          </details>
        </section>
      )}
    </div>
  );
}
