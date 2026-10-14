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
    setStatus(`Saved "${name.trim().replace(/\s+/g, " ")}".`);
    onChange(writeStore({ savedProfiles: r.list, activeAccountId: active }), false);
  };

  return (
    <section class="me-section" aria-labelledby="me-acc-h">
      <h2 id="me-acc-h">Accounts</h2>
      <p class="me-note">
        Play a main and farms? Save each profile here and switch which one City Hall, the guide and the routine use.
        Each account keeps its own routine checks and commander answers. You can also switch by swiping the cards on City Hall.
      </p>

      {list.length > 0 && (
        <ul class="me-accounts">
          {list.map((p) => {
            const prof = profileFromCode(p.code);
            const inUse = p.id === active;
            return (
              <li class="me-account" key={p.id}>
                <div class="me-account-text">
                  <span class="me-account-name">{p.name}{inUse && <span class="me-badge">In use</span>}</span>
                  <span class="me-note mono">{prof ? profileSummary(prof) : "Saved answers could not be read"}</span>
                </div>
                <div class="me-actions">
                  {!inUse && prof && (
                    <button
                      type="button"
                      class="btn btn-secondary"
                      aria-label={`Use ${p.name}`}
                      onClick={() => {
                        setError("");
                        setStatus(`Now using "${p.name}".`);
                        const patch = switchAccountPatch(store, p.id);
                        if (patch) onChange(writeStore(patch), true);
                      }}
                    >Use</button>
                  )}
                  <button
                    type="button"
                    class="btn btn-secondary"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => {
                      setError("");
                      setStatus(`Removed "${p.name}". Your current profile was not changed.`);
                      onChange(writeStore({ savedProfiles: removeAccount(list, p.id), activeAccountId: active }), false);
                    }}
                  >Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {store.profileCode ? (
        <form class="me-save" onSubmit={save} noValidate>
          <label class="me-label" for="me-acc-name">Save the current profile as</label>
          <div class="me-save-row">
            <input
              id="me-acc-name"
              class="me-input"
              type="text"
              maxLength={NAME_MAX + 10}
              autoComplete="off"
              placeholder="Main, Farm 1…"
              value={name}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "me-acc-error" : undefined}
              onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
            />
            <button type="submit" class="btn btn-secondary">Save</button>
          </div>
          {error && <p id="me-acc-error" class="me-error" role="alert">{error}</p>}
        </form>
      ) : (
        <p class="me-note">Build a profile first, then save it here.</p>
      )}
      <p class="me-status" aria-live="polite">{status}</p>
    </section>
  );
}
