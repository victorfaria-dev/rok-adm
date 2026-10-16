// Web glue for the experimental seed simulator (F-39): saved simulations in ko:kingdom:v1
// (kind "seed", local only) and the plain-language summary. Logic: @rokadm/planner kingdom-seed.ts.
import { formatCompact, formatInt, parseSeedDoc, type SeedComparison, type SeedDoc } from "@rokadm/planner";
import { getDoc, listDocs, removeDoc, saveDoc, type StorageLike, type StoredDoc } from "./kingdom-store";

export const SEED_KIND = "seed";

export function listSeeds(st: StorageLike | null): StoredDoc[] {
  return listDocs(SEED_KIND, st);
}

export function loadSeed(id: string, st: StorageLike | null): SeedDoc | null {
  const d = getDoc(id, st);
  if (!d || d.kind !== SEED_KIND) return null;
  return { ...parseSeedDoc(d.data, d.id), id: d.id, updatedAt: d.updatedAt };
}

export function saveSeed(doc: SeedDoc, st: StorageLike | null, now: Date = new Date()): SeedDoc {
  const data = { ...doc, updatedAt: now.toISOString() };
  saveDoc({ id: doc.id, kind: SEED_KIND, title: doc.title, data }, st, now);
  return data;
}

export function deleteSeed(id: string, st: StorageLike | null): void {
  removeDoc(id, st);
}

/** "23.5B (23,500,000,000)" */
export function powerText(n: number): string {
  return `${formatCompact(n)} (${formatInt(n)})`;
}

/** Resumo de um parágrafo para a região aria-live. */
export function seedSummary(c: SeedComparison): string {
  const r = c.before;
  if (r.totalGovernors === 0) return "Nenhum governador informado ainda.";
  const parts = [
    `Poder do reino contado: ${formatCompact(r.counted)}, dos ${r.countedGovernors} primeiros de ${r.totalGovernors} governadores.`,
  ];
  if (r.ignoredGovernors > 0) parts.push(`${r.ignoredGovernors} ${r.ignoredGovernors === 1 ? "governador está abaixo" : "governadores estão abaixo"} do top 300 e não ${r.ignoredGovernors === 1 ? "conta" : "contam"}.`);
  parts.push(r.imperium.reached ? "No limite do Imperium (23,5B) ou acima dele." : `${formatCompact(r.imperium.gap)} abaixo do limite do Imperium (23,5B).`);
  if (c.vacationCount + c.zeroedCount > 0) {
    const sign = c.delta < 0 ? "cai" : c.delta > 0 ? "sobe" : "não muda";
    parts.push(`Com as marcas de simulação, o poder contado ${sign}${c.delta === 0 ? "" : ` ${formatCompact(Math.abs(c.delta))}`} e vai a ${formatCompact(c.after.counted)}.`);
  }
  return parts.join(" ");
}
