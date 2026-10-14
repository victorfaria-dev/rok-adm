// /auth/callback/: finish sign-in (PKCE code from the e-mail link or Google), offer the first-login
// upload when this device has data, then go to "next".
import { useEffect, useState } from "preact/hooks";
import { completeCallback } from "../../lib/auth/actions";
import { getSupabase, type KoSupabase } from "../../lib/auth/client";
import { LOGIN_PATH, loginHref } from "../../lib/auth/paths";
import { claimSiteAchievements, currentUserId } from "../../lib/auth/profile-api";
import { localStore } from "../../lib/auth/session";
import { pendingOffer, type UploadPlan } from "../../lib/auth/upload";
import { UploadOffer } from "./UploadOffer";
import { navigateTo } from "./useAuth";
import "./auth.css";

interface Props {
  navigate?: (url: string) => void;
  href?: string;
}

type View =
  | { k: "working" }
  | { k: "off" }
  | { k: "error"; message: string; next: string }
  | { k: "offer"; client: KoSupabase; userId: string; plan: UploadPlan; next: string };

export default function AuthCallback({ navigate = navigateTo, href }: Props) {
  const [view, setView] = useState<View>({ k: "working" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const client = await getSupabase().catch(() => null);
      if (!alive) return;
      if (!client) {
        setView({ k: "off" });
        return;
      }
      const r = await completeCallback(client, href ?? window.location.href);
      if (!alive) return;
      if (!r.ok) {
        setView({ k: "error", message: r.message, next: r.next });
        return;
      }
      // Drop ?code= from the address bar and history.
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        // ignore
      }
      const userId = await currentUserId(client);
      const plan = userId ? pendingOffer(localStore(), userId) : null;
      if (userId && plan) {
        setView({ k: "offer", client, userId, plan, next: r.next });
        return;
      }
      void claimSiteAchievements(client).catch(() => undefined);
      navigate(r.next);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (view.k === "working") return <section class="au"><h1>Signing you in…</h1><p class="au-lead" role="status">One moment.</p></section>;
  if (view.k === "off") {
    return (
      <section class="au">
        <h1>Sign-in is not switched on</h1>
        <p class="au-lead" data-auth-off>Accounts are not available yet. Everything keeps working on this device.</p>
        <p><a class="btn btn-secondary" href="/">Back to the start page</a></p>
      </section>
    );
  }
  if (view.k === "error") {
    return (
      <section class="au">
        <h1>Sign-in did not finish</h1>
        <p class="au-error" role="alert">{view.message}</p>
        <p><a class="btn btn-primary" href={view.next ? loginHref(view.next) : LOGIN_PATH}>Try again</a></p>
      </section>
    );
  }
  return (
    <div class="au">
      <UploadOffer client={view.client} userId={view.userId} plan={view.plan} headingLevel={1}
        onDone={(res) => { if (res !== "uploaded") navigate(view.next); else setTimeout(() => navigate(view.next), 1500); }} />
    </div>
  );
}
