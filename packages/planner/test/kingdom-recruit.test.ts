import { describe, expect, it } from "vitest";
import {
  DISCORD_LIMIT, RECRUIT_LIMITS, REDDIT_TITLE_LIMIT, emptyRecruitInput, escapeMarkdown, kingdomLabel, parseCityHall, parseRecruitDoc,
  recruitErrors, recruitIsEmpty, recruitPost, redditTitle, type RecruitInput,
} from "../src/kingdom-recruit";

function filled(): RecruitInput {
  return {
    ...emptyRecruitInput(),
    kingdom: "1234",
    stage: "kvk2",
    seed: "B",
    languages: "English, Portuguese",
    timezones: "UTC-3 to UTC+2",
    minPower: "30m",
    minCityHall: "25",
    otherReq: "- 50M kill points\nActive in KvK",
    offers: ["mge-rules", "beginners"],
    roles: [
      { role: "rally-leader", count: 2, note: "cavalry" },
      { role: "translator", count: null, note: "" },
    ],
    migrationNote: "Free migration for the first 10 accounts.",
    contact: "DM Ana on Discord",
  };
}

describe("recruitPost discord", () => {
  it("builds a bold-labelled post with every entered field", () => {
    const p = recruitPost(filled(), "discord");
    expect(p.body).toBe([
      "**Kingdom 1234 is recruiting**",
      "",
      "**Stage:** KvK2",
      "**Seed:** B",
      "**Languages:** English, Portuguese",
      "**Timezones:** UTC-3 to UTC+2",
      "",
      "**Open roles**",
      "- Rally leader ×2 — cavalry",
      "- Translator",
      "",
      "**Requirements**",
      "- Power: 30M+",
      "- City Hall: 25+",
      "- 50M kill points",
      "- Active in KvK",
      "",
      "**What we offer**",
      "- Transparent MGE rules",
      "- Help for beginners",
      "",
      "**Migration**",
      "Free migration for the first 10 accounts.",
      "",
      "**Contact:** DM Ana on Discord",
    ].join("\n"));
    expect(p.chars).toBe(p.body.length);
    expect(p.limit).toBe(DISCORD_LIMIT);
    expect(p.over).toBe(false);
    expect(p.title).toBeUndefined();
  });

  it("is deterministic", () => {
    expect(recruitPost(filled(), "discord")).toEqual(recruitPost(filled(), "discord"));
  });

  it("omits empty fields and sections", () => {
    const p = recruitPost({ ...emptyRecruitInput(), kingdom: "K99" }, "discord");
    expect(p.body).toBe("**K99 is recruiting**");
    expect(recruitPost(emptyRecruitInput(), "discord").body).toBe("**We are recruiting**");
  });

  it("leaves out power and City Hall that cannot be read", () => {
    const p = recruitPost({ ...emptyRecruitInput(), minPower: "lots", minCityHall: "30" }, "discord");
    expect(p.body).not.toContain("Requirements");
  });

  it("flags posts over 2,000 characters and reports the length", () => {
    const big = { ...filled(), roles: Array.from({ length: 12 }, () => ({ role: "other" as const, count: 1, note: "n".repeat(RECRUIT_LIMITS.roleNote) })), migrationNote: "m".repeat(600) };
    const p = recruitPost(big, "discord");
    expect(p.chars).toBeGreaterThan(DISCORD_LIMIT);
    expect(p.over).toBe(true);
  });

  it("uses the other-stage label", () => {
    expect(recruitPost({ ...emptyRecruitInput(), stage: "other", stageOther: "Lost Kingdom" }, "discord").body).toContain("**Stage:** Lost Kingdom");
  });
});

describe("recruitPost reddit", () => {
  it("has a title and blank lines around lists", () => {
    const p = recruitPost(filled(), "reddit");
    expect(p.title).toBe("[K1234] KvK2 kingdom recruiting: Rally leader, Translator");
    expect(p.body.startsWith("**Stage:** KvK2  \n**Seed:** B")).toBe(true);
    expect(p.body).toContain("**Open roles**\n\n- Rally leader ×2 — cavalry\n- Translator");
    expect(p.over).toBe(false);
  });

  it("cuts the title to 300 characters", () => {
    const t = redditTitle({ ...emptyRecruitInput(), kingdom: "x".repeat(40), roles: Array.from({ length: 12 }, () => ({ role: "other" as const, count: null, note: "" })), stage: "other", stageOther: "y".repeat(40) });
    expect(t.length).toBeLessThanOrEqual(REDDIT_TITLE_LIMIT);
    const long = redditTitle({ ...emptyRecruitInput(), kingdom: "K".repeat(40), stage: "other", stageOther: "S".repeat(40), roles: (["rally-leader", "garrison-leader", "scout", "event-officer", "data-officer", "translator", "alliance-leader", "farmers", "other"] as const).map((role) => ({ role, count: null, note: "" })) });
    expect(long.length).toBeLessThanOrEqual(REDDIT_TITLE_LIMIT);
    expect(redditTitle(emptyRecruitInput())).toBe("Kingdom recruiting");
    expect(redditTitle({ ...emptyRecruitInput(), kingdom: "Avalon" })).toBe("[Avalon] Kingdom recruiting");
  });

  it("forces a title cut with an ellipsis when unparsed input is too long", () => {
    const t = redditTitle({ ...emptyRecruitInput(), kingdom: "z".repeat(400) });
    expect(t).toHaveLength(REDDIT_TITLE_LIMIT);
    expect(t.endsWith("…")).toBe(true);
  });
});

describe("recruitPost text", () => {
  it("has no markdown and keeps user text as typed", () => {
    const p = recruitPost({ ...filled(), contact: "*Ana* on Discord" }, "text");
    expect(p.body).not.toContain("**");
    expect(p.body).toContain("Stage: KvK2");
    expect(p.body).toContain("Open roles:\n- Rally leader ×2 — cavalry");
    expect(p.body).toContain("Contact: *Ana* on Discord");
    expect(p.limit).toBeNull();
    expect(p.over).toBe(false);
  });
});

describe("escapeMarkdown", () => {
  it("escapes inline markers and line-start block markers", () => {
    expect(escapeMarkdown("# Big", "discord")).toBe("\\# Big");
    expect(escapeMarkdown("> quote", "discord")).toBe("\\> quote");
    expect(escapeMarkdown("1. one", "reddit")).toBe("1\\. one");
    expect(escapeMarkdown("a*b_c~d`e|f\\g", "discord")).toBe("a\\*b\\_c\\~d\\`e\\|f\\\\g");
    expect(escapeMarkdown("[x](y) ^z", "reddit")).toBe("\\[x\\](y) \\^z");
    expect(escapeMarkdown("[x](y)", "discord")).toBe("[x](y)");
    expect(escapeMarkdown("mid # hash", "discord")).toBe("mid # hash");
  });

  it("defuses Discord mass mentions only on Discord", () => {
    expect(escapeMarkdown("ping @everyone and @here", "discord")).toBe("ping @​everyone and @​here");
    expect(escapeMarkdown("@everyone", "reddit")).toBe("@everyone");
  });

  it("leaves plain text alone", () => {
    expect(escapeMarkdown("# *x*", "text")).toBe("# *x*");
  });

  it("keeps user text from breaking the post's bold labels", () => {
    const p = recruitPost({ ...emptyRecruitInput(), kingdom: "**K1**", migrationNote: "# Header\n- item" }, "discord");
    expect(p.body).toContain("**\\*\\*K1\\*\\* is recruiting**");
    expect(p.body).toContain("\\# Header\n\\- item");
  });
});

describe("parseRecruitDoc", () => {
  it("round-trips a draft", () => {
    const d = { id: "r1", updatedAt: "2026-10-13T10:00:00.000Z", ...filled() };
    expect(parseRecruitDoc(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it("drops unknown values and cuts long text", () => {
    const d = parseRecruitDoc({
      stage: "kvk9", offers: ["mge-rules", "free-gems", "mge-rules"], kingdom: "k".repeat(99),
      roles: [{ role: "king", count: 1 }, { role: "scout", count: 500, note: 5 }, { role: "scout", count: "3" }, "x"],
    })!;
    expect(d.id).toBe("draft");
    expect(d.stage).toBe("");
    expect(d.offers).toEqual(["mge-rules"]);
    expect(d.kingdom).toHaveLength(RECRUIT_LIMITS.kingdom);
    expect(d.roles).toEqual([{ role: "scout", count: null, note: "" }, { role: "scout", count: 3, note: "" }]);
    expect(parseRecruitDoc(null)).toBeNull();
    expect(parseRecruitDoc([])).toBeNull();
  });

  it("keeps at most 12 roles", () => {
    const d = parseRecruitDoc({ roles: Array.from({ length: 20 }, () => ({ role: "other" })) })!;
    expect(d.roles).toHaveLength(RECRUIT_LIMITS.roles);
  });
});

describe("validation and helpers", () => {
  it("reports unreadable power and City Hall", () => {
    expect(recruitErrors(filled())).toEqual({});
    const e = recruitErrors({ ...emptyRecruitInput(), minPower: "a lot", minCityHall: "26" });
    expect(e.minPower).toMatch(/30m/);
    expect(e.minCityHall).toMatch(/1 to 25/);
  });

  it("parses City Hall levels", () => {
    expect(parseCityHall("25")).toBe(25);
    expect(parseCityHall(" 1 ")).toBe(1);
    for (const t of ["0", "26", "x", "2.5", ""]) expect(parseCityHall(t)).toBeNull();
  });

  it("labels kingdoms and detects empty input", () => {
    expect(kingdomLabel("1234")).toBe("Kingdom 1234");
    expect(kingdomLabel("K1234")).toBe("K1234");
    expect(recruitIsEmpty(emptyRecruitInput())).toBe(true);
    expect(recruitIsEmpty({ ...emptyRecruitInput(), contact: "x" })).toBe(false);
  });
});
