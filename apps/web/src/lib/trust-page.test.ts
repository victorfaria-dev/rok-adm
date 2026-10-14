// /trust/ "What data we store" must list every local store by the manifest's plain-language name (Q2 P1-3).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { USER_DATA_KEYS } from "./storage-keys";

const md = readFileSync(new URL("../../../../content/legal/trust-and-privacy.md", import.meta.url), "utf8");
const section = md.slice(md.indexOf("## 1. Quais dados guardamos"), md.indexOf("## 2. "));

describe("trust page data list", () => {
  it("keeps the legal-review banner", () => {
    expect(md).toContain("**RASCUNHO — precisa de revisão jurídica antes de qualquer monetização.**");
  });

  it("names every store from lib/storage-keys.ts, each under its own heading", () => {
    for (const k of USER_DATA_KEYS) expect(section, k.key).toContain(`#### ${k.name}\n`);
  });

  it("covers Discord, on-device OCR, the offline copy, other players' data and how to delete", () => {
    expect(section).toMatch(/Discord/);
    expect(section).toMatch(/OCR\) roda \*\*no seu dispositivo\*\*/);
    expect(section).toMatch(/A imagem nunca sai do seu navegador/);
    expect(section).toMatch(/Cópia offline/);
    expect(section).toMatch(/nomes de governadores e pontuações de outros jogadores/);
    expect(section).toContain("Apagar todos os dados");
    expect(section).toContain("Fazer backup de tudo");
  });
});
