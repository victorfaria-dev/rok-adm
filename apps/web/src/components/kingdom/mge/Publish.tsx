import { useEffect, useState } from "preact/hooks";
import { mgePublicPayload, type MgeDoc, type MgePlan } from "@rokadm/planner";
import { publishMge, type PublishedLink } from "../../../lib/kingdom-mge";
import { mgeResultsMessage } from "../../../lib/discord";
import DiscordPost from "../../discord/DiscordPost";
import { CheckField } from "../shared/Field";
import CopyText from "../shared/CopyText";

interface Props {
  doc: MgeDoc;
  plan: MgePlan;
  today: string;
}

/** "Publish ledger": a view-only link that carries the ledger in its fragment. */
export default function Publish({ doc, plan, today }: Props) {
  const [includeScores, setIncludeScores] = useState(false);
  const [link, setLink] = useState<PublishedLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Any edit makes an earlier link out of date: hide it so nobody copies a stale ledger.
  useEffect(() => setLink(null), [doc, includeScores]);

  async function publish() {
    setBusy(true);
    setError("");
    try {
      setLink(await publishMge(doc, plan, includeScores, today));
    } catch (e) {
      setError(e instanceof Error && e.name === "ShareTooLargeError"
        ? `${e.message} Trave e remova eventos antigos, ou comece um plano novo para a próxima temporada.`
        : "Não foi possível gerar o link neste navegador.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-pub-h">
      <h2 id="kx-pub-h">Publicar o registro</h2>
      <p class="kg-lead">Um registro público transforma acusações de "monopólio" em fatos conferíveis: qualquer pessoa do reino pode ver quem ficou com qual vaga, quando e por quê.</p>
      <CheckField
        id="kx-scores"
        label="Incluir pontuações no link público"
        checked={includeScores}
        onValue={setIncludeScores}
        hint="Desligado por padrão: o link mostra nomes, vagas, motivos e as suas regras. Ligue só se os seus governadores concordaram em ter as pontuações exibidas."
      />
      <div class="kg-actions">
        <button type="button" class="btn btn-primary" onClick={publish} disabled={busy || doc.events.length === 0}>Criar link público</button>
        {doc.events.length === 0 && <p class="kg-hint">Adicione pelo menos um evento primeiro.</p>}
      </div>
      {error && <p class="kg-error" role="alert" data-too-large>{error}</p>}
      <DiscordPost
        id="mge"
        summary="Postar os resultados no Discord"
        message={mgeResultsMessage(mgePublicPayload(doc, includeScores, today, plan), link?.url ?? null)}
      />
      {link && (
        <div class="kg-grid" data-published>
          <CopyText
            id="kx-link"
            label="Link do registro público"
            text={link.url}
            variant="link"
            copyLabel="Copiar link"
            hint={link.hint === "long"
              ? `Este link tem ${link.url.length.toLocaleString("pt-BR")} caracteres e pode ser cortado no Discord (2.000 por mensagem). Poste-o num arquivo fixado ou encurte o plano (menos eventos).`
              : "Quem tiver este link pode ler o registro. O registro viaja dentro do link; nada fica guardado em servidor."}
          />
          <p><a href={link.url} target="_blank" rel="noopener">Abrir o registro público</a> (nova aba)</p>
        </div>
      )}
    </section>
  );
}
