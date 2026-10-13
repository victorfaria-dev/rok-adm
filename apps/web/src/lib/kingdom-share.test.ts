import { describe, expect, it } from "vitest";
import { linkLengthHint, shareUrl } from "./kingdom-share";

describe("kingdom share links", () => {
  it("puts the document in the fragment", () => {
    expect(shareUrl("/kingdom/rules/view/", "1zabc", "https://x.test")).toBe("https://x.test/kingdom/rules/view/#d=1zabc");
  });
  it("flags links past chat limits", () => {
    expect(linkLengthHint("a".repeat(1900))).toBe("ok");
    expect(linkLengthHint("a".repeat(1901))).toBe("long");
  });
});
