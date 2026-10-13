// Build-time endpoint: one lean payload per profile delta set (today only
// /data/guide-low.json). The guide island fetches it for Low and higher profiles
// and merges it over the F2P guide, so /data/guide.json stays F2P-only and small.
import type { APIRoute, GetStaticPaths } from "astro";
import { GUIDE_SETS } from "@rokadm/core";
import { buildGuidePayload } from "../../lib/guide-payload";

export const getStaticPaths: GetStaticPaths = () =>
  GUIDE_SETS.filter((s) => s.kind === "profile-delta").map((s) => ({ params: { set: s.id } }));

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(buildGuidePayload(String(params.set))), { headers: { "Content-Type": "application/json" } });
