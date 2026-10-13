import { describe, expect, it } from "vitest";
import { checkImageFile, parseProfileText } from "./ocr";

describe("parseProfileText", () => {
  it("reads the synthetic fixture's text", () => {
    const text = "Governor Profile\nName: Test Governor\nPower 45,678,901\nVIP 12\nCity Hall Lv. 22\nKill Points 1,234,567\n";
    expect(parseProfileText(text)).toEqual({ cityHall: 22, power: 45_678_901, vip: 12 });
  });

  it("tolerates labels with colons, other separators and common OCR slips", () => {
    expect(parseProfileText("POWER: 12.345.678\nVIP Level 9\nCity Hall Level: 2O")).toEqual({ cityHall: 20, power: 12_345_678, vip: 9 });
    expect(parseProfileText("Power 1 234 567\nCH 17\nvip lv. l5")).toEqual({ cityHall: 17, power: 1_234_567, vip: 15 });
    expect(parseProfileText("City HaIl 25")).toMatchObject({ cityHall: 25 });
  });

  it("does not mix fields on one line and refuses out-of-range values", () => {
    expect(parseProfileText("Power 9,876,543    Kill Points 1,000")).toMatchObject({ power: 9_876_543 });
    expect(parseProfileText("City Hall 26\nVIP 25\nPower 12")).toEqual({ cityHall: null, power: null, vip: null });
    expect(parseProfileText("nothing useful here")).toEqual({ cityHall: null, power: null, vip: null });
    expect(parseProfileText("Kill Points 5,000,000")).toMatchObject({ power: null });
  });
});

describe("checkImageFile", () => {
  it("accepts screenshots, refuses other files and huge images", () => {
    expect(checkImageFile({ type: "image/png", size: 100 })).toBeNull();
    expect(checkImageFile({ type: "image/jpeg", size: 100 })).toBeNull();
    expect(checkImageFile({ type: "application/pdf", size: 100 })).toMatch(/screenshot image/);
    expect(checkImageFile({ type: "image/svg+xml", size: 100 })).toMatch(/screenshot image/);
    expect(checkImageFile({ type: "image/png", size: 20_000_000 })).toMatch(/15 MB/);
  });
});
