import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATED_DIR, buildDataset } from "../scripts/build";
import { compareVersions } from "../src/version";
import { facts, manifest, patches } from "../src";

function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]).sort();
}

describe("build determinism", () => {
  const a = buildDataset();
  const b = buildDataset();

  it("produces byte-identical output on repeated runs", () => {
    expect(Object.keys(a.files).sort()).toEqual(Object.keys(b.files).sort());
    for (const k of Object.keys(a.files)) expect(a.files[k], k).toBe(b.files[k]);
  });

  it("committed generated/ is up to date with research inputs (run `pnpm --filter @rokadm/data build`)", () => {
    expect(listFiles(GENERATED_DIR)).toEqual(Object.keys(a.files).sort());
    for (const [k, v] of Object.entries(a.files)) expect(readFileSync(join(GENERATED_DIR, k), "utf8"), k).toBe(v);
  });

  it("sorts facts by id and patches by version", () => {
    const ids = facts.map((f) => f.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    const vs = patches.map((p) => p.version);
    expect(vs).toEqual([...vs].sort(compareVersions));
  });

  it("manifest matches the data", () => {
    expect(manifest.counts.facts).toBe(facts.length);
    expect(manifest.counts.patches).toBe(patches.length);
    expect(manifest.datasetVersion).toMatch(/^[0-9a-f]{16}$/);
    expect(manifest.latestKnownPatch?.version).toBe(patches.at(-1)?.version);
  });
});
