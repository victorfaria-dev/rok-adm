// Build-time endpoint: the lean guide payload (blocks with pre-rendered HTML,
// fact-card badges, precomputed Budget Reality Check). Written to
// dist/data/guide.json, fetched by the guide island and precached by the service worker.
import type { APIRoute } from "astro";
import { buildGuideData } from "../../lib/guide-payload";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildGuideData()), { headers: { "Content-Type": "application/json" } });
