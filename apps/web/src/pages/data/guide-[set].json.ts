// Build-time endpoint: one lean payload per profile delta set (today only
// /data/guide-low.json), plus the late-game guide (/data/guide-latestage.json, wave J).
// The guide island fetches the delta for Low and higher profiles and merges it over the
// F2P guide, and the late-game set for KvK2, KvK3 and SoC profiles, so /data/guide.json
// stays F2P-only and small.
import type { APIRoute, GetStaticPaths } from "astro";
import { GUIDE_SETS } from "@rokadm/core";
import { buildGuidePayload } from "../../lib/guide-payload";

export const getStaticPaths: GetStaticPaths = () =>
  GUIDE_SETS.filter((s) => s.kind === "profile-delta" || s.id === "latestage").map((s) => ({ params: { set: s.id } }));

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(buildGuidePayload(String(params.set))), { headers: { "Content-Type": "application/json" } });
