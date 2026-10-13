// Bearer-token authentication and space/role authorization.
import type { IncomingMessage } from "node:http";
import type { RouteAuth } from "@rokadm/core";
import { TOKEN_PATTERN, hashToken } from "./crypto";
import { HttpError, forbidden } from "./http";
import type { MemberRow, Store } from "./store";

const unauthorized = (): HttpError =>
  new HttpError(401, "unauthorized", "Missing or invalid token.", { headers: { "WWW-Authenticate": 'Bearer realm="kingdomops"' } });

/** The member owning the bearer token; 401 when the header is missing, malformed or unknown. */
export function authenticate(req: IncomingMessage, store: Store, secret: Buffer): MemberRow {
  const header = req.headers.authorization;
  const m = header ? /^Bearer ([^\s]+)$/.exec(header) : null;
  const token = m?.[1];
  if (!token || !TOKEN_PATTERN.test(token)) throw unauthorized();
  const member = store.memberByTokenHash.get<MemberRow>(hashToken(secret, token));
  if (!member) throw unauthorized();
  return member;
}

/**
 * 403 when the member belongs to another space than the path names (also when that space does
 * not exist, so existence is not revealed), or when the route needs an admin.
 */
export function authorize(member: MemberRow, spaceId: string | undefined, auth: RouteAuth): void {
  if (spaceId === undefined || member.space_id !== spaceId) throw forbidden("Token is not valid for this space.");
  if (auth === "admin" && member.role !== "admin") throw forbidden("Admin role required.");
}
