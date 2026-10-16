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
        <h1 id="au-title">Entrar</h1>
        <p class="au-lead" data-auth-off>As contas ainda não estão ativadas. Tudo continua funcionando neste aparelho sem precisar entrar.</p>
        <p><a class="btn btn-secondary" href="/">Voltar para a página inicial</a></p>
      </section>
    );
  }
  if (auth.status === "error") {
    return (
      <section class="au" aria-labelledby="au-title">
        <h1 id="au-title">Entrar</h1>
        <p class="au-error" role="alert">{auth.message}</p>
      </section>
    );
  }
  if (auth.status === "signed_in") {
    return (
      <section class="au" aria-labelledby="au-title">
        <h1 id="au-title">Você está conectado</h1>
        <p class="au-lead">Conectado como <strong>{auth.email ?? "sua conta"}</strong>.</p>
        <div class="au-actions">
          <a class="btn btn-primary" href={next}>Continuar</a>
          <button type="button" class="btn btn-secondary" onClick={async () => { await signOut(auth.client); }}>Sair</button>
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
      setError("Digite um e-mail válido.");
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
      <h1 id="au-title">Entrar no KingdomOps</h1>
      <p class="au-lead">Uma conta leva suas cidades, planos e perfil com você em qualquer aparelho. Os guias continuam abertos para todos.</p>

      {step === "start" ? (
        <div class="au-panel">
          <button type="button" class="btn btn-secondary au-google" onClick={google} disabled={busy}>Continuar com o Google</button>
          <p class="au-or" aria-hidden="true"><span>ou</span></p>
          <form class="au-form" onSubmit={send} noValidate>
            <label class="au-field">
              <span>E-mail</span>
              <input type="email" name="email" autocomplete="email" inputMode="email" required value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "au-err" : undefined} />
            </label>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Enviando…" : "Receber um link de login por e-mail"}</button>
          </form>
        </div>
      ) : (
        <div class="au-panel">
          <p role="status">Enviamos um e-mail para <strong>{email.trim()}</strong>. Abra o link dele neste aparelho ou digite aqui o código que veio nele.</p>
          <form class="au-form" onSubmit={verify} noValidate>
            <label class="au-field">
              <span>Código do e-mail</span>
              <input name="code" autocomplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={code}
                onInput={(e) => setCode((e.target as HTMLInputElement).value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "au-err" : undefined} />
            </label>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? "Conferindo…" : "Entrar"}</button>
          </form>
          <div class="au-actions">
            <button type="button" class="btn btn-secondary" onClick={() => send()} disabled={busy}>Enviar de novo</button>
            <button type="button" class="btn btn-secondary" onClick={() => { setStep("start"); setCode(""); setError(null); }}>Usar outro e-mail</button>
          </div>
        </div>
      )}

      {error && <p id="au-err" class="au-error" role="alert">{error}</p>}

      <ul class="au-notes">
        <li><strong>Sem login do jogo.</strong> O KingdomOps nunca pede a sua conta ou senha do Rise of Kingdoms ou da Lilith. Quem pedir não somos nós.</li>
        <li>Tem menos de 18 anos? Peça a um responsável antes de criar uma conta. Seu perfil fica privado até você escolher o contrário.</li>
        <li>O que uma conta guarda e como apagá-la: <a href="/trust/">Confiança e privacidade</a>.</li>
      </ul>
    </section>
  );
}
