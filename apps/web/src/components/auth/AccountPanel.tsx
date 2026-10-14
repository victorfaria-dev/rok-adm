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
      <section class="au-account" aria-label="Account">
        <p>You are not signed in.</p>
        <a class="btn btn-primary" href={here === LOGIN_PATH ? LOGIN_PATH : loginHref(here)}>Sign in</a>
      </section>
    );
  }
  return (
    <section class="au-account" aria-label="Account" data-account-panel>
      <p>Signed in as <strong>{auth.email ?? "your account"}</strong></p>
      <div class="au-actions">
        <a class="btn btn-secondary" href={PROFILE_EDIT_PATH}>Public profile</a>
        <SignOutButton onDone={() => navigate("/")} />
      </div>
    </section>
  );
}

/** Sign out on this device. Device data is kept (use "Delete all data" on /me/ to clear it). */
export function SignOutButton({ onDone }: { onDone?: () => void }) {
  const auth = useAuth();
  if (auth.status !== "signed_in") return null;
  return (
    <button type="button" class="btn btn-secondary" data-sign-out onClick={async () => {
      await signOut(auth.client);
      onDone?.();
    }}>Sign out</button>
  );
}
