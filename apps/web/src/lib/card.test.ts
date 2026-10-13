import { describe, expect, it } from "vitest";
import {
  ALLIANCE_COLORS, CARD_KEY, cardData, defaultCard, parseCard, pngFileName, readCard, validateName, validateTag, writeCard,
} from "./card";

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k),
    clear: () => m.clear(), key: () => null, get length() { return m.size; },
  } as Storage;
}

describe("card fields", () => {
  it("name: trims, collapses spaces, strips control characters, caps at 16", () => {
    expect(validateName("  Valerius  ")).toEqual({ value: "Valerius", error: null });
    expect(validateName("Sun\u0000  Tzu\t")).toEqual({ value: "Sun Tzu", error: null });
    expect(validateName("")).toEqual({ value: "", error: null });
    const long = validateName("ABCDEFGHIJKLMNOPQRSTU");
    expect(long.value).toBe("ABCDEFGHIJKLMNOP");
    expect(long.error).toMatch(/16/);
    expect(validateName("1234567890123456").error).toBeNull();
  });

  it("tag: 2–4 letters or digits, uppercased, brackets forgiven, empty allowed", () => {
    expect(validateTag("abc")).toEqual({ value: "ABC", error: null });
    expect(validateTag("[k9x]")).toEqual({ value: "K9X", error: null });
    expect(validateTag("AB")).toEqual({ value: "AB", error: null });
    expect(validateTag("ABCD")).toEqual({ value: "ABCD", error: null });
    expect(validateTag("")).toEqual({ value: "", error: null });
    expect(validateTag("A").error).not.toBeNull();
    expect(validateTag("ABCDE").error).not.toBeNull();
    expect(validateTag("A-B").error).not.toBeNull();
    expect(validateTag("ñab").error).not.toBeNull();
    expect(validateTag("A").value).toBe("");
  });

  it("offers the 12 alliance swatches", () => {
    expect(ALLIANCE_COLORS).toHaveLength(12);
    expect(new Set(ALLIANCE_COLORS).size).toBe(12);
  });
});

describe("card storage", () => {
  it("defaults when empty, corrupted or the wrong version", () => {
    expect(parseCard(null)).toEqual(defaultCard());
    expect(parseCard("{nope")).toEqual(defaultCard());
    expect(parseCard(JSON.stringify({ v: 2, name: "X" }))).toEqual(defaultCard());
    expect(parseCard("[1,2]")).toEqual(defaultCard());
  });

  it("keeps valid fields and repairs malformed ones", () => {
    const c = parseCard(JSON.stringify({ v: 1, name: "  Valerius ", tag: "toolong", color: "neon", reduceMotion: "yes" }));
    expect(c).toEqual({ v: 1, name: "Valerius", tag: "", color: "cobalt", reduceMotion: null });
    expect(parseCard(JSON.stringify({ v: 1, color: "rose", reduceMotion: true, tag: "ab" }))).toMatchObject({ color: "rose", reduceMotion: true, tag: "AB" });
  });

  it("writes to its own key and never touches ko:v1", () => {
    const st = memory();
    st.setItem("ko:v1", '{"v":1,"theme":"light"}');
    writeCard({ name: "Valerius", color: "jade" }, st);
    expect(readCard(st)).toMatchObject({ name: "Valerius", color: "jade" });
    expect(JSON.parse(st.getItem(CARD_KEY)!).v).toBe(1);
    expect(st.getItem("ko:v1")).toBe('{"v":1,"theme":"light"}');
  });

  it("survives a storage that throws or is missing", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readCard(bad)).toEqual(defaultCard());
    expect(writeCard({ tag: "ABC" }, bad).tag).toBe("ABC");
    expect(readCard(null)).toEqual(defaultCard());
    expect(writeCard({ name: "X" }, null).name).toBe("X");
  });
});

describe("cardData", () => {
  it("example card without a profile: F2P at City Hall 22, Epic, F2P Achiever, self-reported", () => {
    const d = cardData(null, defaultCard());
    expect(d.example).toBe(true);
    expect(d).toMatchObject({ cityHall: 22, spending: "f2p", spendingLabel: "F2P", rarity: "epic", f2pAchiever: true, proof: "self-reported" });
    expect(d.name).toBe("Valerius");
    expect(d.tag).toBe("OPS");
  });

  it("real profile: rarity from City Hall, no F2P mark for spenders, display fields from the card", () => {
    const d = cardData({ cityHall: 25, spending: "whale" }, { ...defaultCard(), name: "Ada", tag: "K9X", color: "rose" });
    expect(d).toMatchObject({ example: false, cityHall: 25, rarity: "legendary", f2pAchiever: false, name: "Ada", tag: "K9X", color: "rose", spendingLabel: "Whale" });
    expect(cardData({ cityHall: 12, spending: "f2p" }, defaultCard())).toMatchObject({ rarity: "common", f2pAchiever: false, name: "Governor", tag: "" });
    expect(cardData({ cityHall: 40, spending: "f2p" }, defaultCard()).cityHall).toBe(25);
  });

  it("names the PNG after the governor", () => {
    expect(pngFileName("Valerius")).toBe("kingdomops-card-valerius.png");
    expect(pngFileName("Sun Tzu!")).toBe("kingdomops-card-sun-tzu.png");
    expect(pngFileName("ñ")).toBe("kingdomops-card.png");
  });
});
