// /login/: e-mail (link + 6-digit code) or Google. No game login: the site never asks for a
// Rise of Kingdoms / Lilith password.
import { useState } from "preact/hooks";
import { isEmail, sendEmailSignIn, signInWithGoogle, signOut, verifyEmailCode } from "../../lib/auth/actions";
import { CALLBACK_PATH, safeNext } from "../../lib/auth/paths";
import { navigateTo, useAuth } from "./useAuth";
import "./auth.css";

interface Props {
  navigate?: (url: string) => void;
}

const nextFromUrl = (): string => (typeof window === "undefined" ? safeNext(null) : safeNext(new URLSearchParams(window.location.search).get("next")));

export default function Login({ navigate = navigateTo }: Props) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"start" | "sent">("start");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = nextFromUrl();
  const afterSignIn = `${CALLBACK_PATH}?next=${encodeURIComponent(next)}`;

  if (auth.status === "loading") {
    return <div class="au au-skeleton" aria-busy="true"><span /><span /></div>;
  }
  if (auth.status === "off") {
    return (
      <section class="au" aria-labelledby="au-title">
        <h1 id="au-title">Sign in</h1>
        <p class="au-lead" data-auth-off>Accounts are not switched on yet. Everything keeps working on this device without signing in.</p>
        <p><a class="btn btn-secondary" href="/">Back to the start page</a></p>
      </section>
    );
  }
  if (auth.status === "error") {
    return (
      <section class="au" aria-labelledby="au-title">
        <h1 id="au-title">Sign in</h1>
        <p class="au-error" role="alert">{auth.message}</p>
      </section>
    );
  }
  if (auth.status === "signed_in") {
    return (
      <section class="au" aria-labelledby="au-title">
        <h1 id="au-title">You are signed in</h1>
        <p class="au-lead">Signed in as <strong>{auth.email ?? "your account"}</strong>.</p>
        <div class="au-actions">
          <a class="btn btn-primary" href={next}>Continue</a>
          <button type="button" class="btn btn-secondary" onClick={async () => { await signOut(auth.client); }}>Sign out</button>
        </div>
      </section>
    );
  }
  const client = auth.client;
  const origin = window.location.origin;

  const send = async (e?: Event) => {
    e?.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError("Type a valid e-mail address.");
      return;
    }
    setBusy(true);
    const r = await sendEmailSignIn(client, email, next, origin);
    setBusy(false);
    if (r.ok) setStep("sent");
    else setError(r.message);
  };
  const verify = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await verifyEmailCode(client, email, code);
    setBusy(false);
    if (r.ok) navigate(afterSignIn);
    else setError(r.message);
  };
  const google = async () => {
    setError(null);
    setBusy(true);
    const r = await signInWithGoogle(client, next, origin);
    // On success the browser is already leaving for Google.
    if (!r.ok) {
      setBusy(false);
      setError(r.message);
    }
  };

  return (
    <section class="au" aria-labelledby="au-title">
      <h1 id="au-title">Sign in to KingdomOps</h1>
      <p class="au-lead">An account keeps your cities, plans and profile with you on any device. Guides stay open to everyone.</p>

      {step === "start" ? (
        <div class="au-panel">
          <button type="button" class="btn btn-secondary au-google" onClick={google} disabled={busy}>Continue with Google</button>
          <p class="au-or" aria-hidden="true"><span>or</span></p>
          <form class="au-form" onSubmit={send} noValidate>
            <label class="au-field">
              <span>E-mail</span>
              <input type="email" name="email" autocomplete="email" inputMode="email" required value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "au-err" : undefined} />
            </label>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "E-mail me a sign-in link"}</button>
          </form>
        </div>
      ) : (
        <div class="au-panel">
          <p role="status">We sent an e-mail to <strong>{email.trim()}</strong>. Open the link in it on this device, or type the code from it here.</p>
          <form class="au-form" onSubmit={verify} noValidate>
            <label class="au-field">
              <span>Code from the e-mail</span>
              <input name="code" autocomplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={code}
                onInput={(e) => setCode((e.target as HTMLInputElement).value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "au-err" : undefined} />
            </label>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
          </form>
          <div class="au-actions">
            <button type="button" class="btn btn-secondary" onClick={() => send()} disabled={busy}>Send again</button>
            <button type="button" class="btn btn-secondary" onClick={() => { setStep("start"); setCode(""); setError(null); }}>Use another e-mail</button>
          </div>
        </div>
      )}

      {error && <p id="au-err" class="au-error" role="alert">{error}</p>}

      <ul class="au-notes">
        <li><strong>No game login.</strong> KingdomOps never asks for your Rise of Kingdoms or Lilith account or password. Anyone who does is not us.</li>
        <li>Under 18? Ask a parent or guardian before you make an account. Your profile is private until you choose otherwise.</li>
        <li>What an account stores and how to delete it: <a href="/trust/">Trust &amp; privacy</a>.</li>
      </ul>
    </section>
  );
}
