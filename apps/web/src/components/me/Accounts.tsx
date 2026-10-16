import { useState } from "preact/hooks";
import { writeStore, type StoreV1 } from "../../lib/store";
import { profileFromCode, profileSummary } from "../../lib/profile";
import { NAME_MAX, newAccountId, removeAccount, saveAccount } from "../../lib/me";
import { accountsOf, switchAccountPatch } from "../../lib/accounts";

interface Props {
  store: StoreV1;
  now: () => Date;
  /** Called with the new stored state; `switched` = the active profile changed. */
  onChange: (next: StoreV1, switched: boolean) => void;
}

/** Saved accounts (main + farms) and which one the guide and routine use. */
export function Accounts({ store, now, onChange }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const view = accountsOf(store);
  const list = view.accounts;
  const active = view.activeId;

  const save = (e: Event): void => {
    e.preventDefault();
    if (!store.profileCode) return;
    const r = saveAccount(list, name, store.profileCode, store.profileOverride, newAccountId(now()));
    if (!r.ok) {
      setStatus("");
      setError(r.error);
      return;
    }
    setError("");
    setName("");
    setStatus(`"${name.trim().replace(/\s+/g, " ")}" salva.`);
    onChange(writeStore({ savedProfiles: r.list, activeAccountId: active }), false);
  };

  return (
    <section class="me-section" aria-labelledby="me-acc-h">
      <h2 id="me-acc-h">Contas</h2>
      <p class="me-note">
        Joga com uma conta principal e farms? Salve cada perfil aqui e troque qual deles a Prefeitura, o guia e a rotina usam.
        Cada conta guarda as próprias marcações da rotina e respostas de comandantes. Você também pode trocar deslizando os cartões na Prefeitura.
      </p>

      {list.length > 0 && (
        <ul class="me-accounts">
          {list.map((p) => {
            const prof = profileFromCode(p.code);
            const inUse = p.id === active;
            return (
              <li class="me-account" key={p.id}>
                <div class="me-account-text">
                  <span class="me-account-name">{p.name}{inUse && <span class="me-badge">Em uso</span>}</span>
                  <span class="me-note mono">{prof ? profileSummary(prof) : "Não foi possível ler as respostas salvas"}</span>
                </div>
                <div class="me-actions">
                  {!inUse && prof && (
                    <button
                      type="button"
                      class="btn btn-secondary"
                      aria-label={`Usar ${p.name}`}
                      onClick={() => {
                        setError("");
                        setStatus(`Agora usando "${p.name}".`);
                        const patch = switchAccountPatch(store, p.id);
                        if (patch) onChange(writeStore(patch), true);
                      }}
                    >Usar</button>
                  )}
                  <button
                    type="button"
                    class="btn btn-secondary"
                    aria-label={`Remover ${p.name}`}
                    onClick={() => {
                      setError("");
                      setStatus(`"${p.name}" removida. Seu perfil atual não mudou.`);
                      onChange(writeStore({ savedProfiles: removeAccount(list, p.id), activeAccountId: active }), false);
                    }}
                  >Remover</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {store.profileCode ? (
        <form class="me-save" onSubmit={save} noValidate>
          <label class="me-label" for="me-acc-name">Salvar o perfil atual como</label>
          <div class="me-save-row">
            <input
              id="me-acc-name"
              class="me-input"
              type="text"
              maxLength={NAME_MAX + 10}
              autoComplete="off"
              placeholder="Principal, Farm 1…"
              value={name}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "me-acc-error" : undefined}
              onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
            />
            <button type="submit" class="btn btn-secondary">Salvar</button>
          </div>
          {error && <p id="me-acc-error" class="me-error" role="alert">{error}</p>}
        </form>
      ) : (
        <p class="me-note">Monte um perfil primeiro e depois salve aqui.</p>
      )}
      <p class="me-status" aria-live="polite">{status}</p>
    </section>
  );
}
