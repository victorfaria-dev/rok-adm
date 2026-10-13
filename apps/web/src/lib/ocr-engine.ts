// F-54 (experimental) OCR engine: Tesseract in a Web Worker, loaded only after the user presses
// "Read". Everything comes from our own origin (/ocr/, copied at build by astro.config.mjs): the
// worker, the WebAssembly core and the English model. No CDN, no upload: the image stays here.
import type Tesseract from "tesseract.js";
// Static here: this whole module is itself loaded with import() after the click, so the budget
// script measures it (and Tesseract's ~20 KB gz main-thread code) as one lazy chunk.
import tesseractModule from "tesseract.js/dist/tesseract.esm.min.js";

export const OCR_BASE = "/ocr/";

export interface OcrProgress {
  /** 0..1 for the current step. */
  progress: number;
  /** Plain-English step name. */
  step: string;
}

function stepName(status: string): string {
  if (/core/.test(status)) return "Loading the text reader";
  if (/language|traineddata/.test(status)) return "Loading the English model";
  if (/initializ/.test(status)) return "Starting the text reader";
  if (/recogniz/.test(status)) return "Reading the screenshot";
  return "Working";
}

/** Read the text in an image on this device. Rejects when the browser cannot run the reader. */
export async function readImageText(image: Blob, onProgress: (p: OcrProgress) => void = () => {}): Promise<string> {
  const { createWorker, OEM } = tesseractModule as typeof Tesseract;
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: `${OCR_BASE}worker.min.js`,
    corePath: OCR_BASE,
    langPath: OCR_BASE,
    workerBlobURL: false,
    gzip: true,
    cacheMethod: "none",
    logger: (m: { status: string; progress: number }) => onProgress({ progress: m.progress, step: stepName(m.status) }),
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
