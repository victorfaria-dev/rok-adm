// F-54 (experimental) OCR engine: Tesseract in a Web Worker, loaded only after the user presses
// "Read". Everything comes from our own origin (/ocr/, copied at build by astro.config.mjs): the
// worker, the WebAssembly core and the English model. No CDN, no upload: the images stay here.
import type Tesseract from "tesseract.js";
// Static here: this whole module is itself loaded with import() after the click, so the budget
// script measures it (and Tesseract's ~20 KB gz main-thread code) as one lazy chunk.
import tesseractModule from "tesseract.js/dist/tesseract.esm.min.js";
import type { Img } from "./ocr-image";
import type { OcrWord } from "./ocr";
import { readScreenshot, type Layout, type Part, type ReadResult } from "./ocr-read";

export const OCR_BASE = "/ocr/";

export interface OcrProgress {
  /** 0..1 for the current step. */
  progress: number;
  /** Plain-English step name. */
  step: string;
}

export interface ReadOutput {
  result: ReadResult;
  /** Every reading with its words (source pixels), for the "text read" panel. */
  parts: { part: Part; words: OcrWord[] }[];
}

export interface ScreenReader {
  read(image: Blob, onProgress: (p: OcrProgress) => void): Promise<ReadOutput>;
  close(): Promise<void>;
}

function loadingStep(status: string): string {
  if (/core/.test(status)) return "Carregando o leitor de texto";
  if (/language|traineddata/.test(status)) return "Carregando o modelo em inglês";
  if (/initializ/.test(status)) return "Iniciando o leitor de texto";
  return "Trabalhando";
}

const PSM: Record<Layout, string> = { auto: "3", sparse: "11", line: "7" };

async function decode(image: Blob): Promise<Img> {
  const bmp = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data };
}

function toCanvas(img: Img): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return canvas;
}

/** Start one reader for several screenshots. Rejects when the browser cannot run it. */
export async function createScreenReader(onProgress: (p: OcrProgress) => void = () => {}): Promise<ScreenReader> {
  const { createWorker, OEM } = tesseractModule as typeof Tesseract;
  let report = onProgress;
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: `${OCR_BASE}worker.min.js`,
    corePath: OCR_BASE,
    langPath: OCR_BASE,
    workerBlobURL: false,
    gzip: true,
    cacheMethod: "none",
    logger: (m: { status: string; progress: number }) => {
      if (!/recogniz/.test(m.status)) report({ progress: m.progress, step: loadingStep(m.status) });
    },
  });
  return {
    async read(image, progress) {
      report = progress;
      const src = await decode(image);
      const parts: ReadOutput["parts"] = [];
      let step = "Lendo o print";
      let done = 0;
      const result = await readScreenshot(
        src,
        async (img, layout) => {
          await worker.setParameters({ tessedit_pageseg_mode: PSM[layout] as Tesseract.PSM });
          const { data } = await worker.recognize(toCanvas(img), {}, { blocks: true, text: false });
          const words: OcrWord[] = [];
          for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) {
            words.push({ text: w.text, confidence: w.confidence, bbox: w.bbox });
          }
          done++;
          progress({ progress: Math.min(0.95, done / 4), step });
          return words;
        },
        {
          onStep: (s) => {
            step = s;
            progress({ progress: Math.min(0.95, done / 4), step: s });
          },
          onPart: (part, words) => parts.push({ part, words }),
        },
      );
      return { result, parts };
    },
    async close() {
      await worker.terminate();
    },
  };
}
