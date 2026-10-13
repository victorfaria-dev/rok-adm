// Matches method + path against the ROUTES table of @rokadm/core.
import { ROUTES, type RouteDef, type RouteName } from "@rokadm/core";
import { HttpError, badRequest, notFound } from "./http";

export interface RouteMatch {
  name: RouteName;
  route: RouteDef;
  params: Record<string, string>;
}

interface Compiled {
  name: RouteName;
  route: RouteDef;
  /** Literal segment, or `{ param }` for a template segment. */
  segments: (string | { param: string })[];
}

const COMPILED: Compiled[] = (Object.entries(ROUTES) as [RouteName, RouteDef][]).map(([name, route]) => ({
  name,
  route,
  segments: route.path.split("/").map((s) => {
    const m = /^\{(\w+)\}$/.exec(s);
    return m ? { param: m[1]! } : s;
  }),
}));

/** Returns the match, or throws 400 (undecodable segment), 404 (unknown path) or 405 (with Allow). */
export function matchRoute(method: string, pathname: string): RouteMatch {
  const parts = pathname.split("/");
  const allowed: string[] = [];
  let bad = false;
  for (const c of COMPILED) {
    const params = matchSegments(c.segments, parts);
    if (params === "bad") bad = true;
    if (!params || params === "bad") continue;
    if (c.route.method === method) return { name: c.name, route: c.route, params };
    allowed.push(c.route.method);
  }
  if (allowed.length) {
    throw new HttpError(405, "method_not_allowed", "Method not allowed on this path.", { headers: { Allow: allowed.join(", ") } });
  }
  if (bad) throw badRequest("Path segment is not valid percent-encoding.");
  throw notFound("No such route.");
}

function matchSegments(segments: Compiled["segments"], parts: string[]): Record<string, string> | null | "bad" {
  if (segments.length !== parts.length) return null;
  const params: Record<string, string> = {};
  let bad = false;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const part = parts[i]!;
    if (typeof seg === "string") {
      if (seg !== part) return null;
      continue;
    }
    if (part === "") return null;
    try {
      params[seg.param] = decodeURIComponent(part);
    } catch {
      bad = true;
    }
  }
  return bad ? "bad" : params;
}
