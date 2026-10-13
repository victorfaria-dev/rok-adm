import { emptyRecruitInput, recruitPost } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { memoryStorage, saveDoc } from "./kingdom-store";
import { charCount, draftInput, listRecruit, overLimitText, recruitTitle, saveRecruit, titleCutText } from "./kingdom-recruit";

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

  it("words the over-limit warning for the format, and the title cut", () => {
    expect(overLimitText({ format: "discord", chars: 2100, limit: 2000, over: true })).toBe(
      "This post is 2,100 characters, over Discord's 2,000-character limit by 100. Shorten the notes or split it into two messages.");
    expect(overLimitText({ format: "reddit", chars: 40_005, limit: 40_000, over: true })).toBe(
      "This post body is 40,005 characters, over Reddit's 40,000-character limit by 5. Shorten the notes before you post.");
    expect(overLimitText({ format: "reddit", chars: 10, limit: 40_000, over: false })).toBe("");
    expect(overLimitText({ format: "text", chars: 99_999, limit: null, over: false })).toBe("");
    const huge = recruitPost({ ...emptyRecruitInput(), migrationNote: "m".repeat(40_000) }, "reddit");
    expect(overLimitText(huge)).toContain("over Reddit's 40,000-character limit");
    expect(titleCutText({ titleCut: true })).toContain("Reddit titles stop at 300 characters");
    expect(titleCutText({ titleCut: false })).toBe("");
  });
});
