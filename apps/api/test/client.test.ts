// The typed client from @rokadm/core against the real server: proves the contract, the client and
// the handlers agree end to end (status codes, 409 body, 204, erasure).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError, createApiClient } from "@rokadm/core";
import { farmsData, startTest, type TestServer } from "./helpers";

let s: TestServer;
beforeEach(async () => {
  s = await startTest();
});
afterEach(async () => {
  await s.stop();
});

async function rejection(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw e;
  }
  throw new Error("expected an ApiError");
}

describe("typed client against the server", () => {
  it("create, join, sync farms with a conflict, then erase the space", async () => {
    const anon = createApiClient({ baseUrl: s.base });
    expect(await anon.health()).toEqual({ status: "ok", version: "v1" });

    const created = await anon.createSpace({ name: "Kingdom 1234", kingdom: 1234, displayName: "Leader" });
    const admin = anon.withToken(created.token);
    const spaceId = created.space.id;

    const joined = await anon.join({ inviteCode: created.invite.code.toLowerCase(), displayName: "Farmer" });
    const member = anon.withToken(joined.token);
    expect((await member.me(spaceId)).member.role).toBe("member");

    const put = await member.putDoc(spaceId, "farms", "main", { baseVersion: 0, data: farmsData() });
    expect(put.doc.version).toBe(1);
    const stale = await rejection(member.putDoc(spaceId, "farms", "main", { baseVersion: 0, data: farmsData("Other") }));
    expect(stale.status).toBe(409);
    expect(stale.code).toBe("version_conflict");
    expect(stale.current?.version).toBe(1);

    // Members cannot write council documents; admins can, and those survive the member leaving.
    const denied = await rejection(member.putDoc(spaceId, "council-requirements", "kvk", { baseVersion: 0, data: { minPower: 1 } }));
    expect(denied.status).toBe(403);
    await admin.putDoc(spaceId, "council-requirements", "kvk", { baseVersion: 0, data: { minPower: 1 } });

    expect(await member.removeMember(spaceId, "me")).toBeUndefined();
    const docs = await admin.docs(spaceId);
    expect(docs.docs.map((d) => `${d.kind}/${d.id}`)).toEqual(["council-requirements/kvk"]);
    expect((await rejection(member.me(spaceId))).status).toBe(401);

    const exp = await admin.exportSpace(spaceId);
    expect(exp.format).toBe("kingdomops-space-export");
    expect(exp.docs).toHaveLength(1);

    await admin.deleteSpace(spaceId);
    expect((await rejection(admin.me(spaceId))).code).toBe("unauthorized");
  });

  it("admin writes and deletes an MGE plan with its version", async () => {
    const anon = createApiClient({ baseUrl: s.base });
    const created = await anon.createSpace({ name: "K", displayName: "A" });
    const admin = anon.withToken(created.token);
    await admin.putDoc(created.space.id, "mge-plan", "round-1", { baseVersion: 0, data: { ranks: [] } });
    const v = (await admin.getDoc(created.space.id, "mge-plan", "round-1")).doc.version;
    await admin.deleteDoc(created.space.id, "mge-plan", "round-1", v);
    expect((await admin.docs(created.space.id)).docs).toEqual([]);
  });
});
