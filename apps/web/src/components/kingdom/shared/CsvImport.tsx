import { useRef } from "preact/hooks";

interface Props {
  /** Button text, ex.: "Importar CSV". */
  label: string;
  /** Called with the file's text; nothing is uploaded. */
  onText: (text: string, fileName: string) => void;
  /** Called when the file cannot be read at all. */
  onError: (message: string) => void;
  /** Visible hint id the button points to (column names). */
  describedBy?: string;
  testId?: string;
}

const MAX_BYTES = 1_000_000;

/** A button that opens a .csv file picker and hands back the text. Files are read on this device only. */
export default function CsvImport({ label, onText, onError, describedBy, testId }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) return onError("Este arquivo é grande demais (mais de 1 MB). Exporte menos linhas.");
    try {
      onText(await file.text(), file.name);
    } catch {
      onError("Não foi possível ler este arquivo.");
    }
  }

  return (
    <>
      <button type="button" class="btn btn-secondary" aria-describedby={describedBy} onClick={() => ref.current?.click()}>{label}</button>
      <input ref={ref} type="file" accept=".csv,text/csv,text/plain" class="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={onFile} data-csv-import={testId ?? ""} />
    </>
  );
}
