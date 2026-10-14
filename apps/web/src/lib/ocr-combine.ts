// F-54 (experimental): put the readings of several screenshots together into one set of suggestions.
// Pure. Where two screens show the same value and disagree, both are kept in a note and the more
// detailed screen wins; the player always has the last word.
import { CIVILIZATION_NAMES } from "./ocr";
import type { ScreenKind, ScreenRead } from "./ocr-read";

export type FieldKey =
  | "governorId" | "power" | "killPoints" | "civilization" | "merit" | "highestMerit"
  | "cityHall" | "vip" | "vipPoints" | "streakDay";

export interface VipLevel {
  vip: number;
  threshold: number;
}

export interface Combined {
  values: Partial<Record<FieldKey, number | string>>;
  /** Which screen each value came from. */
  sources: Partial<Record<FieldKey, ScreenKind>>;
  notes: string[];
  album: { name: string | null; codes: string[]; sameNameAsProfile: boolean | null } | null;
  screens: ScreenKind[];
}

export const SCREEN_NAMES: Record<ScreenKind, string> = {
  profile: "Perfil do Governador",
  city: "Visão da cidade (Prefeitura tocada)",
  vip: "Tela de VIP",
  album: "Álbum",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");
/** Same name, ignoring spaces, case and the usual digit slips (l/I/| for 1, O for 0). */
const norm = (s: string) => s.replace(/\s+/g, "").replace(/(?<=\d|^)[lI|]|[lI|](?=\d)/g, "1").replace(/(?<=\d)O|O(?=\d)/g, "0").toLowerCase();
const sameName = (a: string, b: string) => norm(a) === norm(b);

export function combineReads(reads: readonly ScreenRead[], vipLevels: readonly VipLevel[] = []): Combined {
  const out: Combined = { values: {}, sources: {}, notes: [], album: null, screens: [] };
  const last = <K extends ScreenKind>(k: K) => {
    const all = reads.filter((r) => r.screen === k) as Extract<ScreenRead, { screen: K }>[];
    if (all.length > 1) out.notes.push(`${all.length} prints de "${SCREEN_NAMES[k]}": o último é usado.`);
    return all[all.length - 1];
  };
  const set = (key: FieldKey, value: number | string | null | undefined, from: ScreenKind) => {
    if (value === null || value === undefined) return;
    out.values[key] = value;
    out.sources[key] = from;
  };
  const profile = last("profile"), city = last("city"), vip = last("vip"), album = last("album");
  out.screens = (["profile", "city", "vip", "album"] as const).filter((k) => reads.some((r) => r.screen === k));

  if (city) {
    set("power", city.power, "city");
    set("cityHall", city.cityHall, "city");
    set("vip", city.vip, "city");
  }
  if (profile) {
    if (profile.power !== null && city?.power != null && profile.power !== city.power) {
      out.notes.push(`O poder difere entre o Perfil do Governador (${fmt(profile.power)}) e a visão da cidade (${fmt(city.power)}). O valor do perfil é sugerido; o poder muda muito, então use o print mais recente.`);
    }
    set("governorId", profile.governorId, "profile");
    set("power", profile.power, "profile");
    set("killPoints", profile.killPoints, "profile");
    set("civilization", profile.civilization, "profile");
    set("merit", profile.merit, "profile");
    set("highestMerit", profile.highestMerit, "profile");
  }
  if (vip) {
    if (vip.vip !== null && city?.vip != null && vip.vip !== city.vip) {
      out.notes.push(`O nível de VIP difere entre a tela de VIP (${vip.vip}) e o emblema na visão da cidade (${city.vip}). A tela de VIP é sugerida.`);
    }
    let level = vip.vip;
    if (vip.nextLevelPoints !== null) {
      const next = vipLevels.find((l) => l.threshold === vip.nextLevelPoints);
      if (level === null && next) {
        level = next.vip - 1;
        out.notes.push(`Nível de VIP ${level} deduzido do alvo da barra de pontos (${fmt(vip.nextLevelPoints)}).`);
      } else if (level !== null && vipLevels.length) {
        const want = level + 1, target = vip.nextLevelPoints;
        if (!vipLevels.some((l) => l.vip === want && l.threshold === target)) {
          out.notes.push(`O alvo da barra de pontos (${fmt(target)}) não é o limite do VIP ${want} na nossa tabela. Confira o nível de VIP e os pontos.`);
        }
      }
    }
    set("vip", level, "vip");
    set("vipPoints", vip.points, "vip");
    set("streakDay", vip.loginStreak, "vip");
  }
  if (album) {
    const p = profile?.name ?? null;
    out.album = { name: album.name, codes: album.codes, sameNameAsProfile: p && album.name ? sameName(p, album.name) : null };
  }
  for (const r of [profile, city, vip, album]) if (r) out.notes.push(...r.notes.map((n) => `${SCREEN_NAMES[r.screen]}: ${n}`));
  return out;
}

export { CIVILIZATION_NAMES };
