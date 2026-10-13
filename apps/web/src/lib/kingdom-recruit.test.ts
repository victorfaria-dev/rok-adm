import { emptyRecruitInput } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { memoryStorage, saveDoc } from "./kingdom-store";
import { charCount, draftInput, listRecruit, recruitTitle, saveRecruit } from "./kingdom-recruit";

const NOW = new Date("2026-10-13T10:00:00.000Z");

describe("recruit store glue", () => {
  it("saves and lists drafts with a readable title", () => {
    const st = memoryStorage();
    const input = { ...emptyRecruitInput(), kingdom: "1234", contact: "DM Ana" };
    const doc = saveRecruit("d1", input, st, NOW);
    expect(doc).toEqual({ ...input, id: "d1", updatedAt: NOW.toISOString() });
    const list = listRecruit(st);
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("Kingdom 1234 recruitment post");
    expect(draftInput(list[0]!.doc)).toEqual(input);
  });

  it("skips drafts that are not objects and titles empty drafts", () => {
    const st = memoryStorage();
    saveDoc({ id: "bad", kind: "recruit", title: "x", data: 5 }, st, NOW);
    expect(listRecruit(st)).toEqual([]);
    expect(recruitTitle({ kingdom: " " })).toBe("Recruitment post");
    expect(recruitTitle({ kingdom: "K9" })).toBe("K9 recruitment post");
  });

  it("formats character counts", () => {
    expect(charCount(1234, 2000)).toBe("1,234 / 2,000 characters");
    expect(charCount(5, null)).toBe("5 characters");
  });
});
