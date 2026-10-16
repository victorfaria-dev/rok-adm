import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  RECRUIT_LIMITS, RECRUIT_OFFERS, RECRUIT_ROLES, RECRUIT_STAGES, REDDIT_TITLE_LIMIT, emptyRecruitInput, newDocId, parseRoleCount, recruitErrors,
  recruitIsEmpty, recruitPost, roleCountError, type RecruitFormat, type RecruitInput, type RecruitRole, type RecruitRoleKey, type RecruitStage,
} from "@rokadm/planner";
import ConfirmAction from "../shared/ConfirmAction";
import CopyText from "../shared/CopyText";
import { CheckField, SelectField, TextAreaField, TextField } from "../shared/Field";
import { kingdomStorage, removeDoc, type StorageLike } from "../../../lib/kingdom-store";
import { charCount, draftInput, listRecruit, overLimitText, recruitTitle, saveRecruit, titleCutText, type RecruitListItem } from "../../../lib/kingdom-recruit";
import { formatDay } from "../../../lib/kingdom-rules";
import { recruitMessage } from "../../../lib/discord";
import DiscordPost from "../../discord/DiscordPost";

const FORMATS: ReadonlyArray<{ value: RecruitFormat; label: string }> = [
  { value: "discord", label: "Discord" },
  { value: "reddit", label: "Reddit" },
  { value: "text", label: "Texto simples" },
];
const STAGE_OPTIONS = RECRUIT_STAGES.map((s) => ({ value: s.value, label: s.label }));
const ROLE_OPTIONS = RECRUIT_ROLES.map((r) => ({ value: r.key, label: r.label }));

/** Count text as typed, per role (kept so an unreadable count shows an error instead of vanishing). */
const countTexts = (roles: readonly RecruitRole[]): string[] => roles.map((r) => (r.count === null ? "" : String(r.count)));

/** Recruitment post generator (F-42): form, live post for Discord/Reddit/plain text, saved drafts. */
export default function RecruitBuilder() {
  const stRef = useRef<StorageLike | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [drafts, setDrafts] = useState<RecruitListItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [input, setInput] = useState<RecruitInput>(emptyRecruitInput());
  const [counts, setCounts] = useState<string[]>([]);
  const [format, setFormat] = useState<RecruitFormat>("discord");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    stRef.current = st;
    setBlocked(blocked);
    setDrafts(listRecruit(st));
  }, []);

  useEffect(() => {
    const f = focusId.current;
    if (!f) return;
    focusId.current = null;
    document.getElementById(f)?.focus();
  });

  const set = <K extends keyof RecruitInput>(k: K, v: RecruitInput[K]) => setInput((i) => ({ ...i, [k]: v }));
  const errors = recruitErrors(input);
  const post = useMemo(() => recruitPost(input, format), [input, format]);
  const discordBody = useMemo(() => (recruitIsEmpty(input) ? "" : recruitPost(input, "discord").body), [input]);

  function setRole(idx: number, patch: Partial<RecruitRole>) {
    setInput((i) => ({ ...i, roles: i.roles.map((r, j) => (j === idx ? { ...r, ...patch } : r)) }));
  }
  function setCount(idx: number, text: string) {
    setCounts((c) => input.roles.map((_, j) => (j === idx ? text : (c[j] ?? ""))));
    // An unreadable count is left out of the post (and the error under the field says why).
    setRole(idx, { count: parseRoleCount(text) });
  }
  function addRole() {
    if (input.roles.length >= RECRUIT_LIMITS.roles) return;
    focusId.current = `kt-role-${input.roles.length}`;
    setCounts((c) => [...input.roles.map((_, j) => c[j] ?? ""), ""]);
    setInput((i) => ({ ...i, roles: [...i.roles, { role: "rally-leader", count: null, note: "" }] }));
  }
  function removeRole(idx: number) {
    setCounts((c) => input.roles.map((_, j) => c[j] ?? "").filter((_, j) => j !== idx));
    setInput((i) => ({ ...i, roles: i.roles.filter((_, j) => j !== idx) }));
    focusId.current = "kt-add-role";
  }
  function toggleOffer(key: (typeof RECRUIT_OFFERS)[number]["key"], on: boolean) {
    setInput((i) => ({ ...i, offers: on ? RECRUIT_OFFERS.map((o) => o.key).filter((k) => k === key || i.offers.includes(k)) : i.offers.filter((k) => k !== key) }));
  }

  function save() {
    const id = draftId ?? newDocId();
    try {
      saveRecruit(id, input, stRef.current);
      setDraftId(id);
      setDrafts(listRecruit(stRef.current));
      setError("");
      setStatus(blocked ? "Rascunho guardado só para esta visita (este navegador bloqueia o salvamento)." : `Rascunho salvo neste aparelho: ${recruitTitle(input)}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o rascunho.");
    }
  }
  function open(item: RecruitListItem) {
    setInput(draftInput(item.doc));
    setCounts(countTexts(item.doc.roles));
    setDraftId(item.id);
    setError("");
    setStatus(`${item.title} aberto.`);
    focusId.current = "kt-kingdom";
  }
  function startNew() {
    setInput(emptyRecruitInput());
    setCounts([]);
    setDraftId(null);
    setError("");
    setStatus("Novo post: o formulário está vazio.");
    focusId.current = "kt-kingdom";
  }
  function remove(id: string) {
    removeDoc(id, stRef.current);
    setDrafts(listRecruit(stRef.current));
    if (draftId === id) setDraftId(null);
    setStatus("Rascunho apagado deste aparelho.");
  }

  const overText = overLimitText(post);
  const cutText = titleCutText(post);

  return (
    <div class="kt" data-recruit>
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Os rascunhos duram até você fechar esta página; copie o seu post para guardá-lo.</p>}

      <section class="kg-grid" aria-labelledby="kt-drafts-h">
        <h2 id="kt-drafts-h">Rascunhos</h2>
        {drafts.length === 0
          ? <p class="kg-note">Nenhum rascunho salvo neste aparelho ainda.</p>
          : (
            <ul class="kt-list">
              {drafts.map((d) => (
                <li key={d.id} data-draft>
                  <span class="kt-list-title">{d.title}{d.id === draftId ? " (aberto)" : ""}</span>
                  <span class="kt-list-meta">Salvo em {formatDay(d.updatedAt.slice(0, 10))}</span>
                  <div class="kg-actions">
                    <button type="button" class="btn btn-secondary" aria-label={`Abrir ${d.title}`} onClick={() => open(d)}>Abrir</button>
                    <ConfirmAction label="Apagar" ariaLabel={`Apagar ${d.title}`} question={`Apagar o rascunho "${d.title}"?`} onConfirm={() => remove(d.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        <div class="kg-actions">
          <button type="button" class="btn btn-secondary" onClick={startNew} data-new-post>Novo post</button>
        </div>
      </section>

      <form class="kt-form" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="Detalhes do post de recrutamento">
        <fieldset class="kt-group">
          <legend>Seu reino</legend>
          <TextField id="kt-kingdom" label="Número ou nome do reino" hint="Por exemplo 1234 ou K1234." value={input.kingdom} maxLength={RECRUIT_LIMITS.kingdom} onValue={(v) => set("kingdom", v)} />
          <SelectField id="kt-stage" label="Fase" value={input.stage} options={STAGE_OPTIONS} onValue={(v) => set("stage", v as RecruitStage)} />
          {input.stage === "other" && <TextField id="kt-stage-other" label="Nome da fase" value={input.stageOther} maxLength={RECRUIT_LIMITS.stageOther} onValue={(v) => set("stageOther", v)} />}
          <TextField id="kt-seed" label="Seed (opcional)" hint="Como o seu reino informa; deixe vazio se não tiver certeza." value={input.seed} maxLength={RECRUIT_LIMITS.seed} onValue={(v) => set("seed", v)} />
          <TextField id="kt-langs" label="Idiomas" hint="Por exemplo: Português, English." value={input.languages} maxLength={RECRUIT_LIMITS.languages} onValue={(v) => set("languages", v)} />
          <TextField id="kt-tz" label="Fusos horários" hint="Onde está a maior parte dos seus jogadores, por exemplo UTC-3 a UTC+2." value={input.timezones} maxLength={RECRUIT_LIMITS.timezones} onValue={(v) => set("timezones", v)} />
        </fieldset>

        <fieldset class="kt-group">
          <legend>Requisitos</legend>
          <TextField id="kt-power" label="Poder mínimo" inputMode="text" hint="Por exemplo 30m ou 30000000." value={input.minPower} error={errors.minPower} maxLength={RECRUIT_LIMITS.minPower} onValue={(v) => set("minPower", v)} />
          <TextField id="kt-ch" label="Nível mínimo da Prefeitura" inputMode="numeric" hint="De 1 a 25." value={input.minCityHall} error={errors.minCityHall} maxLength={2} onValue={(v) => set("minCityHall", v)} />
          <TextAreaField id="kt-other-req" label="Outros requisitos" hint="Um por linha, por exemplo pontos de abate ou histórico de KvK." rows={3} value={input.otherReq} maxLength={RECRUIT_LIMITS.otherReq} onValue={(v) => set("otherReq", v)} />
        </fieldset>

        <fieldset class="kt-group">
          <legend>O que você oferece</legend>
          <p class="kg-hint">Marque só o que é verdade hoje. Promessas que você não pode cumprir custam mais que uma vaga vazia.</p>
          {RECRUIT_OFFERS.map((o) => (
            <CheckField key={o.key} id={`kt-offer-${o.key}`} label={o.label} checked={input.offers.includes(o.key)} onValue={(v) => toggleOffer(o.key, v)} />
          ))}
        </fieldset>

        <fieldset class="kt-group">
          <legend>Funções abertas</legend>
          {input.roles.length === 0 && <p class="kg-note">Nenhuma função ainda. Adicione as funções de que você precisa: líderes de rally ou de guarnição, oficiais, tradutores.</p>}
          {input.roles.length > 0 && (
            <ol class="kt-roles">
              {input.roles.map((r, i) => (
                <li key={i} class="kt-role" data-role>
                  <SelectField id={`kt-role-${i}`} label={`Função ${i + 1}`} value={r.role} options={ROLE_OPTIONS} onValue={(v) => setRole(i, { role: v as RecruitRoleKey })} />
                  <TextField id={`kt-count-${i}`} label="Quantos (opcional)" inputMode="numeric" value={counts[i] ?? (r.count === null ? "" : String(r.count))}
                    error={roleCountError(counts[i] ?? "")} maxLength={3} onValue={(v) => setCount(i, v)} />
                  <TextField id={`kt-note-${i}`} label="Nota (opcional)" hint="Por exemplo: cavalaria, noite em UTC." value={r.note} maxLength={RECRUIT_LIMITS.roleNote} onValue={(v) => setRole(i, { note: v })} />
                  <div class="kg-actions">
                    <button type="button" class="btn btn-secondary" aria-label={`Remover função ${i + 1}`} onClick={() => removeRole(i)}>Remover</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {input.roles.length < RECRUIT_LIMITS.roles
            ? <div class="kg-actions"><button type="button" id="kt-add-role" class="btn btn-secondary" onClick={addRole} data-add-role>Adicionar função</button></div>
            : <p class="kg-note">Você pode listar até {RECRUIT_LIMITS.roles} funções.</p>}
        </fieldset>

        <fieldset class="kt-group">
          <legend>Migração e contato</legend>
          <TextAreaField id="kt-migration" label="Nota sobre migração" hint="Como a migração funciona para vocês agora, como o seu conselho combinou." rows={3} value={input.migrationNote} maxLength={RECRUIT_LIMITS.migrationNote} onValue={(v) => set("migrationNote", v)} />
          <TextField id="kt-contact" label="Contato" hint="Escrito como você quer que apareça, por exemplo: chame a Ana no Discord." value={input.contact} maxLength={RECRUIT_LIMITS.contact} onValue={(v) => set("contact", v)} />
        </fieldset>

        <div class="kg-actions">
          <button type="submit" class="btn btn-secondary" data-save-draft>{draftId ? "Salvar rascunho" : "Salvar como rascunho"}</button>
        </div>
        {error && <p class="kg-error" role="alert">{error}</p>}
        <p class="kg-status" role="status" aria-live="polite" data-save-status>{status}</p>
      </form>

      <section class="kt-out" aria-labelledby="kt-out-h">
        <h2 id="kt-out-h">Seu post</h2>
        <SelectField id="kt-format" label="Formato" value={format} options={FORMATS} onValue={setFormat} />
        {recruitIsEmpty(input) && <p class="kg-note">Preencha o formulário acima; o post se atualiza enquanto você digita e deixa de fora o que ficar vazio.</p>}
        {post.title !== undefined && (
          <>
            <CopyText id="kt-title-out" label="Título do post" variant="link" text={post.title} copyLabel="Copiar título" />
            <p class="kt-count" data-title-count>Título: {charCount(post.titleChars ?? post.title.length, REDDIT_TITLE_LIMIT)}</p>
            <div aria-live="polite">{cutText && <p class="kg-error" data-title-cut>{cutText}</p>}</div>
          </>
        )}
        <CopyText id="kt-body-out" label={post.title !== undefined ? "Corpo do post" : "Post"} text={post.body} copyLabel={post.title !== undefined ? "Copiar corpo" : "Copiar post"} />
        <p class="kt-count" data-char-count>{post.title !== undefined ? "Corpo: " : ""}{charCount(post.chars, post.limit)}</p>
        <div aria-live="polite">{overText && <p class="kg-error" data-over-limit>{overText}</p>}</div>
        <DiscordPost id="recruit" summary="Postar no Discord (formato Discord)" message={recruitMessage(discordBody)} />
        <p class="kg-note" data-chat-warning><strong>Poste no Discord, no Reddit ou nos seus próprios canais. Nunca cole links no chat do jogo:</strong> jogadores relatam silenciamentos e alertas na conta por compartilhar links externos ali. Use a Praça de Recrutamento do jogo para anúncios dentro do jogo.</p>
      </section>
    </div>
  );
}
