// Build-time endpoint: Low spender targets (wave J, F-14) precomputed from @rokadm/planner.
// The guide island fetches it for the Low profile only, so /data/guide.json stays F2P-only
// and F2P numbers are never shown as Low's.
import type { APIRoute } from "astro";
import { buildLowBudgetPayload } from "../../lib/guide-payload";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildLowBudgetPayload()), { headers: { "Content-Type": "application/json" } });
