// Session state for islands. Loads the Supabase chunk only when sign-in is configured.
import { useEffect, useState } from "preact/hooks";
import { getSupabase, type KoSupabase } from "../../lib/auth/client";

export type AuthState =
  | { status: "off" } // sign-in not configured: behave like before accounts existed
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "signed_out"; client: KoSupabase }
  | { status: "signed_in"; client: KoSupabase; userId: string; email: string | null };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | null = null;
    getSupabase()
      .then(async (client) => {
        if (!alive) return;
        if (!client) {
          setState({ status: "off" });
          return;
        }
        const apply = (session: { user: { id: string; email?: string | null } } | null) => {
          if (!alive) return;
          setState(session ? { status: "signed_in", client, userId: session.user.id, email: session.user.email ?? null } : { status: "signed_out", client });
        };
        const { data } = await client.auth.getSession();
        apply(data.session);
        const sub = client.auth.onAuthStateChange((_event, session) => apply(session));
        unsubscribe = () => sub.data.subscription.unsubscribe();
      })
      .catch(() => {
        if (alive) setState({ status: "error", message: "O serviço de login não carregou. Verifique sua conexão e recarregue a página." });
      });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);
  return state;
}

export function navigateTo(url: string): void {
  window.location.assign(url);
}
