import { useState } from "preact/hooks";

interface Props {
  shareUrl: () => string;
  /** The screen shows values from a ?s= link and the user has not chosen yet. */
  shared: boolean;
  keepMine?: () => void;
  useLink?: () => void;
}

/** "Copiar link" for the current inputs, with an inline status (no toast library), and the link-values choice. */
export function ShareBar({ shareUrl, shared, keepMine, useLink }: Props) {
  const [msg, setMsg] = useState("");
  const copy = async (): Promise<void> => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copiado. Ele guarda só estes valores, nada sobre você.");
    } catch {
      setMsg(`Copie este link: ${url}`);
    }
  };
  const choose = (fn: () => void, text: string): void => {
    fn();
    setMsg(text);
  };
  return (
    <div class="t-share">
      {shared ? (
        <div class="t-shared" role="group" aria-labelledby="t-shared-text" data-link-choice>
          <p id="t-shared-text">
            Mostrando valores de um link. Seus valores salvos continuam como estão (só o campo que você editar é salvo) até você escolher.
          </p>
          {keepMine && useLink ? (
            <div class="t-shared-actions">
              <button type="button" class="btn btn-secondary" onClick={() => choose(keepMine, "De volta aos seus valores salvos.")}>Manter os meus</button>
              <button type="button" class="btn btn-secondary" onClick={() => choose(useLink, "Valores do link salvos como seus.")}>Usar os valores do link</button>
            </div>
          ) : null}
        </div>
      ) : null}
      <button type="button" class="btn btn-secondary" onClick={() => void copy()}>Copiar link destes valores</button>
      <p role="status" class="t-status">{msg}</p>
    </div>
  );
}
