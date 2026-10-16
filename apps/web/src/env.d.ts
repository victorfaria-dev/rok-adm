/// <reference types="astro/client" />

// Prebuilt browser ESM of tesseract.js (types come from "tesseract.js"; see lib/ocr-engine.ts).
declare module "tesseract.js/dist/tesseract.esm.min.js";

// Sign-in (lib/auth/config.ts). Optional: when missing, sign-in is off and the site works as before.
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
}
