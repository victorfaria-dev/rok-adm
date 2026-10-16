// Small "your account" block for /me/ (and anywhere the navigation wants it): who is signed in,
// links to the public profile, sign out. Renders nothing when sign-in is not configured, so pages
// look exactly as before accounts existed.
import { signOut } from "../../lib/auth/actions";
import { LOGIN_PATH, loginHref } from "../../lib/auth/paths";
import { navigateTo, useAuth } from "./useAuth";
import "./auth.css";

export const PROFILE_EDIT_PATH = "/me/profile/";

interface Props {
  navigate?: (url: string) => void;
}

export default function AccountPanel({ navigate = navigateTo }: Props) {
  const auth = useAuth();
  if (auth.status === "off" || auth.status === "loading") return null;
  if (auth.status === "error") return <p class="au-error" role="alert">{auth.message}</p>;
  if (auth.status === "signed_out") {
    const here = typeof window === "undefined" ? "/me/" : window.location.pathname;
    return (
      <section class="au-account" aria-label="Conta">
        <p>Você não está conectado.</p>
        <a class="btn btn-primary" href={here === LOGIN_PATH ? LOGIN_PATH : loginHref(here)}>Entrar</a>
      </section>
    );
  }
  return (
    <section class="au-account" aria-label="Conta" data-account-panel>
      <p>Conectado como <strong>{auth.email ?? "sua conta"}</strong></p>
      <div class="au-actions">
        <a class="btn btn-secondary" href={PROFILE_EDIT_PATH}>Perfil público</a>
        <SignOutButton onDone={() => navigate("/")} />
      </div>
    </section>
  );
}

/** Sign out on this device. Device data is kept (use "Apagar todos os dados" em /me/ para limpar). */
export function SignOutButton({ onDone }: { onDone?: () => void }) {
  const auth = useAuth();
  if (auth.status !== "signed_in") return null;
  return (
    <button type="button" class="btn btn-secondary" data-sign-out onClick={async () => {
      await signOut(auth.client);
      onDone?.();
    }}>Sair</button>
  );
}
