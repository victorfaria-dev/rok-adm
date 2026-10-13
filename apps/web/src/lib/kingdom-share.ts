// Share-link helpers for the council kit. The document travels in the URL fragment (#d=...),
// which browsers never send to a server; see packages/planner/src/kingdom-codec.ts.

/** Absolute view-only URL for a share string, e.g. https://site/kingdom/rules/view/#d=1z... */
export function shareUrl(path: string, code: string, origin: string = typeof location === "undefined" ? "" : location.origin): string {
  return `${origin}${path}#d=${code}`;
}

/** "ok" when the link fits common chat limits, "long" when it may be cut (Discord: 2,000 characters per message). */
export function linkLengthHint(url: string): "ok" | "long" {
  return url.length <= 1900 ? "ok" : "long";
}
