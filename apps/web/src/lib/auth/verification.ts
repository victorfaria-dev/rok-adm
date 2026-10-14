// Governor verification, client side (schema: supabase/migrations/20261013200007_verification.sql).
// The browser only PRE-FILLS values from screenshots: OCR on the device can be fooled, so a
// moderator approves levels 2 and 3 in the database (AUTH-11). The code shown in the Album is
// bound to one request, valid for 1 hour and never reused (AUTH-13): the database enforces it.
import type { KoSupabase } from "./client";
import type { AccountRow, CityKind, Json, VerificationLevel, VerificationRequestRow } from "./database.types";
import { dbError, currentUserId } from "./profile-api";
import { encodeToFit, extensionOf } from "./image";

// ---------------------------------------------------------------------------------------------
// OCR interface consumed here. The screenshot readers live in lib/ocr*.ts (another track owns
// them); this module never imports them directly. Wire them in `loadVerificationOcr` below.

export type VerificationScreen = "governor_profile" | "city_hall" | "album" | "unknown";

/** Governor Profile screen. */
export interface GovernorProfileValues {
  governorId: string | null;
  name: string | null;
  power: number | null;
  killPoints: number | null;
  civilization: string | null;
}
/** City view with the City Hall tapped. */
export interface CityHallValues {
  cityHall: number | null;
  vip: number | null;
  power: number | null;
}
/** In-game Album with the site's code image. */
export interface AlbumValues {
  /** Governor name shown on the Album page. */
  name: string | null;
  /** 6 digits read from the code image. */
  code: string | null;
}

export interface VerificationOcr {
  detectScreen(image: Blob): Promise<VerificationScreen>;
  readGovernorProfile(image: Blob): Promise<Partial<GovernorProfileValues>>;
  readCityHall(image: Blob): Promise<Partial<CityHallValues>>;
  readAlbum(image: Blob): Promise<Partial<AlbumValues>>;
}

/**
 * Where the OCR track plugs in: return its implementation, loaded on demand, e.g.
 *   () => import("../ocr-verification").then((m) => m.verificationOcr)
 * Until then the player types the values (the moderator checks them either way).
 */
export const loadVerificationOcr = async (): Promise<VerificationOcr | null> => null;

// ---------------------------------------------------------------------------------------------
// Values, checks and labels.

export type ScreenshotSlot = "profile" | "city_hall" | "album";
export const SLOTS: readonly { slot: ScreenshotSlot; screen: VerificationScreen; label: string; help: string; level: 2 | 3 }[] = [
  { slot: "profile", screen: "governor_profile", label: "Perfil do Governador", help: "Mostra o seu ID de governador, nome, poder, pontos de abate e civilização.", level: 2 },
  { slot: "city_hall", screen: "city_hall", label: "Prefeitura", help: "Sua cidade com a Prefeitura tocada: nível da Prefeitura, VIP e poder.", level: 2 },
  { slot: "album", screen: "album", label: "Álbum com o código", help: "Seu Álbum depois de adicionar a imagem do código desta página.", level: 3 },
];

export interface ClaimedValues {
  governorId: string;
  name: string;
  power: string;
  killPoints: string;
  civilization: string;
  cityHall: string;
  vip: string;
  albumName: string;
  albumCode: string;
}

export const emptyClaim = (): ClaimedValues => ({
  governorId: "", name: "", power: "", killPoints: "", civilization: "", cityHall: "", vip: "", albumName: "", albumCode: "",
});

/** Merge OCR output into the form without overwriting what the player already typed. */
export function mergeOcr(form: ClaimedValues, slot: ScreenshotSlot, v: Partial<GovernorProfileValues & CityHallValues & AlbumValues>): ClaimedValues {
  const out = { ...form };
  const put = (k: keyof ClaimedValues, x: string | number | null | undefined) => {
    if (x !== null && x !== undefined && String(x).trim() !== "" && out[k].trim() === "") out[k] = String(x).trim();
  };
  if (slot === "profile") {
    put("governorId", v.governorId); put("name", v.name); put("power", v.power); put("killPoints", v.killPoints); put("civilization", v.civilization);
  } else if (slot === "city_hall") {
    put("cityHall", v.cityHall); put("vip", v.vip);
    if (out.power.trim() === "") put("power", v.power);
  } else {
    put("albumName", v.name); put("albumCode", v.code);
  }
  return out;
}

const norm = (s: string): string => s.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");

export interface Check {
  id: "governor_id" | "city_hall" | "album_code" | "album_name";
  ok: boolean;
  label: string;
}

/** What the page can check before sending (the moderator checks the screenshots again). */
export function crossCheck(v: ClaimedValues, level: 2 | 3, requestCode: string): Check[] {
  const checks: Check[] = [
    { id: "governor_id", ok: /^\d{5,12}$/.test(v.governorId.trim()), label: "O ID do governador tem de 5 a 12 dígitos" },
    { id: "city_hall", ok: v.cityHall.trim() === "" || (/^\d{1,2}$/.test(v.cityHall.trim()) && +v.cityHall >= 1 && +v.cityHall <= 25), label: "O nível da Prefeitura vai de 1 a 25" },
  ];
  if (level === 3) {
    checks.push({ id: "album_code", ok: v.albumCode.replace(/\s/g, "") === requestCode, label: "O Álbum mostra o código desta solicitação" });
    checks.push({ id: "album_name", ok: v.albumName.trim() !== "" && norm(v.albumName) === norm(v.name), label: "O nome do governador no Álbum confere com o nome do perfil" });
  }
  return checks;
}

/** JSON sent as claimed_values (numbers parsed where possible). */
export function claimJson(v: ClaimedValues, checks: readonly Check[], ocrUsed: boolean): Json {
  const num = (s: string): number | null => (/^\d[\d,.\s]*$/.test(s.trim()) ? Number(s.replace(/[,.\s]/g, "")) : null);
  return {
    governorId: v.governorId.trim() || null, name: v.name.trim() || null, power: num(v.power), killPoints: num(v.killPoints),
    civilization: v.civilization.trim() || null, cityHall: num(v.cityHall), vip: num(v.vip), albumName: v.albumName.trim() || null,
    source: ocrUsed ? "device-ocr+typed" : "typed",
    checks: Object.fromEntries(checks.map((c) => [c.id, c.ok])),
  };
}

export const LEVEL_LABEL: Record<VerificationLevel, string> = {
  1: "Não verificada (declarada)",
  2: "Conferida por print",
  3: "Posse comprovada",
};

export const STATUS_LABEL: Record<VerificationRequestRow["status"], string> = {
  awaiting_screenshots: "Aguardando seus prints",
  pending_review: "Aguardando um moderador",
  approved: "Aprovada",
  rejected: "Não aprovada",
  expired: "Código expirado",
  cancelled: "Cancelada",
};

/** "59:30" style countdown; "0:00" when over. */
export function countdown(expiresAt: string, now: number): { text: string; over: boolean } {
  const ms = Date.parse(expiresAt) - now;
  if (!(ms > 0)) return { text: "0:00", over: true };
  const s = Math.ceil(ms / 1000);
  return { text: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, over: false };
}

// ---------------------------------------------------------------------------------------------
// The code image: a white card with a big red number, 4:3 landscape like the in-game Album photo
// (owner, 2026-10-13). Everything stays inside a 10% safe margin so the tile crop and downscaling
// keep the code readable. Drawn on a canvas in the browser; it carries only this request's code.
// No game assets.

export const CODE_CARD = { width: 1200, height: 900 } as const;
/** Safe margin on every side (10%): nothing is drawn outside it except the white background. */
export const CODE_CARD_SAFE = { x: 120, y: 90 } as const;
/** Fixed print colours (not theme tokens: the card must look the same in every theme and read well in OCR). */
const CARD_BG = "rgb(255, 255, 255)";
const CARD_RED = "rgb(200, 16, 32)";
const CARD_INK = "rgb(90, 90, 90)";

export function codeCardFileName(code: string): string {
  return `kingdomops-code-${code}.png`;
}

/** Draw the card on a 2D context (separate from canvas creation so tests can pass a fake context). */
export function drawCodeCard(ctx: CanvasRenderingContext2D, code: string): void {
  if (!/^\d{6}$/.test(code)) throw new Error("Um código de verificação tem 6 dígitos.");
  const { width: w, height: h } = CODE_CARD;
  const { x: mx, y: my } = CODE_CARD_SAFE;
  const safeW = w - 2 * mx;
  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, w, h);
  // Thin frame on the edge of the safe area.
  ctx.strokeStyle = CARD_RED;
  ctx.lineWidth = 12;
  ctx.strokeRect(mx, my, safeW, h - 2 * my);
  ctx.fillStyle = CARD_RED;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 240px ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace";
  // Digits spaced a little so OCR does not merge them; maxWidth keeps them inside the safe area.
  const spaced = code.split("").join("\u2009");
  ctx.fillText(spaced, w / 2, h / 2 - 30, safeW - 80);
  ctx.fillStyle = CARD_INK;
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillText("Código de verificação do KingdomOps", w / 2, h - my - 70, safeW - 80);
}

/** Browser only: the card as a PNG blob. */
export async function codeCardPng(code: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CODE_CARD.width;
  canvas.height = CODE_CARD.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador não consegue desenhar a imagem do código.");
  drawCodeCard(ctx, code);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("Este navegador não consegue salvar a imagem do código.");
  return blob;
}

// ---------------------------------------------------------------------------------------------
// Screenshots: scaled to at most 2000 px on the long side, re-encoded (drops photo metadata), ≤ 3 MB.

export const SCREENSHOT_MAX_BYTES = 3 * 1024 * 1024;
export const SCREENSHOT_MAX_SIDE = 2000;

export function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  const s = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
}

export async function prepareScreenshot(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Não foi possível ler este print. Use o PNG ou JPEG que o seu celular salvou.");
  });
  try {
    const size = fitWithin(bitmap.width, bitmap.height, SCREENSHOT_MAX_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador não consegue redimensionar imagens.");
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    const blob = await encodeToFit((type, q) => new Promise((res) => canvas.toBlob(res, type, Math.max(q, 0.75))), SCREENSHOT_MAX_BYTES);
    if (!blob) throw new Error("Este print continua grande demais mesmo depois de redimensionado.");
    return blob;
  } finally {
    bitmap.close();
  }
}

// ---------------------------------------------------------------------------------------------
// API.

export type CityRow = Pick<AccountRow, "id" | "kind" | "name" | "city_hall" | "verification_level" | "governor_id" | "governor_name">;

export async function listCities(client: KoSupabase): Promise<CityRow[]> {
  const { data, error } = await client.from("accounts")
    .select("id, kind, name, city_hall, verification_level, governor_id, governor_name").order("sort_order", { ascending: true });
  if (error) throw new Error(dbError(error));
  return (data ?? []) as CityRow[];
}

export async function addCity(client: KoSupabase, name: string, kind: CityKind): Promise<{ ok: true } | { ok: false; message: string }> {
  const n = name.trim();
  if (!n || n.length > 40) return { ok: false, message: "Dê um nome à cidade (até 40 caracteres)." };
  const { error } = await client.from("accounts").insert({ name: n, kind });
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}

export async function listRequests(client: KoSupabase): Promise<VerificationRequestRow[]> {
  const userId = await currentUserId(client);
  if (!userId) return [];
  const { data, error } = await client.from("verification_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(dbError(error));
  return (data ?? []) as VerificationRequestRow[];
}

export async function startVerification(client: KoSupabase, accountId: string, level: 2 | 3): Promise<{ ok: true; request: VerificationRequestRow } | { ok: false; message: string }> {
  const { data, error } = await client.rpc("start_verification", { p_account_id: accountId, p_level: level });
  if (error) return { ok: false, message: /in progress/i.test(error.message) ? "Esta cidade já tem uma verificação em andamento." : dbError(error) };
  return { ok: true, request: data as VerificationRequestRow };
}

export async function uploadScreenshot(client: KoSupabase, userId: string, requestId: string, slot: ScreenshotSlot, blob: Blob): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  if (blob.size > SCREENSHOT_MAX_BYTES) return { ok: false, message: "O print passa de 3 MB." };
  const path = `${userId}/${requestId}/${slot}.${extensionOf(blob.type)}`;
  const { error } = await client.storage.from("verification").upload(path, blob, { contentType: blob.type, upsert: true });
  return error ? { ok: false, message: dbError(error) } : { ok: true, path };
}

export async function submitVerification(
  client: KoSupabase, requestId: string, claimed: Json, paths: string[], albumCode: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await client.rpc("submit_verification", { p_request_id: requestId, p_claimed: claimed, p_paths: paths, p_album_code: albumCode });
  if (!error) return { ok: true };
  const m = error.message ?? "";
  if (/expired/i.test(m)) return { ok: false, message: "O código expirou (1 hora). Comece de novo para receber um código novo." };
  if (/does not match/i.test(m)) return { ok: false, message: "O código do Álbum não confere com o código desta verificação." };
  if (/already used/i.test(m)) return { ok: false, message: "Este código já foi usado. Comece de novo para receber um código novo." };
  return { ok: false, message: dbError(error) };
}

export async function cancelVerification(client: KoSupabase, requestId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await client.rpc("cancel_verification", { p_request_id: requestId });
  return error ? { ok: false, message: dbError(error) } : { ok: true };
}
