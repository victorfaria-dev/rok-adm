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

const FORMATS: ReadonlyArray<{ value: RecruitFormat; label: string }> = [
  { value: "discord", label: "Discord" },
  { value: "reddit", label: "Reddit" },
  { value: "text", label: "Plain text" },
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
      setStatus(blocked ? "Draft kept for this visit only (this browser blocks saving)." : `Draft saved on this device: ${recruitTitle(input)}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The draft could not be saved.");
    }
  }
  function open(item: RecruitListItem) {
    setInput(draftInput(item.doc));
    setCounts(countTexts(item.doc.roles));
    setDraftId(item.id);
    setError("");
    setStatus(`Opened ${item.title}.`);
    focusId.current = "kt-kingdom";
  }
  function startNew() {
    setInput(emptyRecruitInput());
    setCounts([]);
    setDraftId(null);
    setError("");
    setStatus("New post: the form is empty.");
    focusId.current = "kt-kingdom";
  }
  function remove(id: string) {
    removeDoc(id, stRef.current);
    setDrafts(listRecruit(stRef.current));
    if (draftId === id) setDraftId(null);
    setStatus("Draft deleted from this device.");
  }

  const overText = overLimitText(post);
  const cutText = titleCutText(post);

  return (
    <div class="kt" data-recruit>
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Drafts last until you close this page; copy your post to keep it.</p>}

      <section class="kg-grid" aria-labelledby="kt-drafts-h">
        <h2 id="kt-drafts-h">Drafts</h2>
        {drafts.length === 0
          ? <p class="kg-note">No drafts saved on this device yet.</p>
          : (
            <ul class="kt-list">
              {drafts.map((d) => (
                <li key={d.id} data-draft>
                  <span class="kt-list-title">{d.title}{d.id === draftId ? " (open)" : ""}</span>
                  <span class="kt-list-meta">Saved {formatDay(d.updatedAt.slice(0, 10))}</span>
                  <div class="kg-actions">
                    <button type="button" class="btn btn-secondary" aria-label={`Open ${d.title}`} onClick={() => open(d)}>Open</button>
                    <ConfirmAction label="Delete" ariaLabel={`Delete ${d.title}`} question={`Delete the draft "${d.title}"?`} onConfirm={() => remove(d.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        <div class="kg-actions">
          <button type="button" class="btn btn-secondary" onClick={startNew} data-new-post>New post</button>
        </div>
      </section>

      <form class="kt-form" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="Recruitment post details">
        <fieldset class="kt-group">
          <legend>Your kingdom</legend>
          <TextField id="kt-kingdom" label="Kingdom number or name" hint="For example 1234 or K1234." value={input.kingdom} maxLength={RECRUIT_LIMITS.kingdom} onValue={(v) => set("kingdom", v)} />
          <SelectField id="kt-stage" label="Stage" value={input.stage} options={STAGE_OPTIONS} onValue={(v) => set("stage", v as RecruitStage)} />
          {input.stage === "other" && <TextField id="kt-stage-other" label="Stage name" value={input.stageOther} maxLength={RECRUIT_LIMITS.stageOther} onValue={(v) => set("stageOther", v)} />}
          <TextField id="kt-seed" label="Seed (optional)" hint="As your kingdom states it; leave empty if you are not sure." value={input.seed} maxLength={RECRUIT_LIMITS.seed} onValue={(v) => set("seed", v)} />
          <TextField id="kt-langs" label="Languages" hint="For example: English, Portuguese." value={input.languages} maxLength={RECRUIT_LIMITS.languages} onValue={(v) => set("languages", v)} />
          <TextField id="kt-tz" label="Timezones" hint="Where most of your players are, for example UTC-3 to UTC+2." value={input.timezones} maxLength={RECRUIT_LIMITS.timezones} onValue={(v) => set("timezones", v)} />
        </fieldset>

        <fieldset class="kt-group">
          <legend>Requirements</legend>
          <TextField id="kt-power" label="Minimum power" inputMode="text" hint="For example 30m or 30,000,000." value={input.minPower} error={errors.minPower} maxLength={RECRUIT_LIMITS.minPower} onValue={(v) => set("minPower", v)} />
          <TextField id="kt-ch" label="Minimum City Hall level" inputMode="numeric" hint="1 to 25." value={input.minCityHall} error={errors.minCityHall} maxLength={2} onValue={(v) => set("minCityHall", v)} />
          <TextAreaField id="kt-other-req" label="Other requirements" hint="One per line, for example kill points or KvK history." rows={3} value={input.otherReq} maxLength={RECRUIT_LIMITS.otherReq} onValue={(v) => set("otherReq", v)} />
        </fieldset>

        <fieldset class="kt-group">
          <legend>What you offer</legend>
          <p class="kg-hint">Tick only what is true today. Promises you cannot keep cost more than an empty seat.</p>
          {RECRUIT_OFFERS.map((o) => (
            <CheckField key={o.key} id={`kt-offer-${o.key}`} label={o.label} checked={input.offers.includes(o.key)} onValue={(v) => toggleOffer(o.key, v)} />
          ))}
        </fieldset>

        <fieldset class="kt-group">
          <legend>Open roles</legend>
          {input.roles.length === 0 && <p class="kg-note">No roles yet. Add the roles you are short of: rally or garrison leaders, officers, translators.</p>}
          {input.roles.length > 0 && (
            <ol class="kt-roles">
              {input.roles.map((r, i) => (
                <li key={i} class="kt-role" data-role>
                  <SelectField id={`kt-role-${i}`} label={`Role ${i + 1}`} value={r.role} options={ROLE_OPTIONS} onValue={(v) => setRole(i, { role: v as RecruitRoleKey })} />
                  <TextField id={`kt-count-${i}`} label="How many (optional)" inputMode="numeric" value={counts[i] ?? (r.count === null ? "" : String(r.count))}
                    error={roleCountError(counts[i] ?? "")} maxLength={3} onValue={(v) => setCount(i, v)} />
                  <TextField id={`kt-note-${i}`} label="Note (optional)" hint="For example: cavalry, evening UTC." value={r.note} maxLength={RECRUIT_LIMITS.roleNote} onValue={(v) => setRole(i, { note: v })} />
                  <div class="kg-actions">
                    <button type="button" class="btn btn-secondary" aria-label={`Remove role ${i + 1}`} onClick={() => removeRole(i)}>Remove</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {input.roles.length < RECRUIT_LIMITS.roles
            ? <div class="kg-actions"><button type="button" id="kt-add-role" class="btn btn-secondary" onClick={addRole} data-add-role>Add role</button></div>
            : <p class="kg-note">You can list up to {RECRUIT_LIMITS.roles} roles.</p>}
        </fieldset>

        <fieldset class="kt-group">
          <legend>Migration and contact</legend>
          <TextAreaField id="kt-migration" label="Migration note" hint="How migration works for you right now, as your council has agreed it." rows={3} value={input.migrationNote} maxLength={RECRUIT_LIMITS.migrationNote} onValue={(v) => set("migrationNote", v)} />
          <TextField id="kt-contact" label="Contact" hint="Written as you want it shown, for example: DM Ana on Discord." value={input.contact} maxLength={RECRUIT_LIMITS.contact} onValue={(v) => set("contact", v)} />
        </fieldset>

        <div class="kg-actions">
          <button type="submit" class="btn btn-secondary" data-save-draft>{draftId ? "Save draft" : "Save as draft"}</button>
        </div>
        {error && <p class="kg-error" role="alert">{error}</p>}
        <p class="kg-status" role="status" aria-live="polite" data-save-status>{status}</p>
      </form>

      <section class="kt-out" aria-labelledby="kt-out-h">
        <h2 id="kt-out-h">Your post</h2>
        <SelectField id="kt-format" label="Format" value={format} options={FORMATS} onValue={setFormat} />
        {recruitIsEmpty(input) && <p class="kg-note">Fill in the form above; the post updates as you type and leaves out anything you leave empty.</p>}
        {post.title !== undefined && (
          <>
            <CopyText id="kt-title-out" label="Post title" variant="link" text={post.title} copyLabel="Copy title" />
            <p class="kt-count" data-title-count>Title: {charCount(post.titleChars ?? post.title.length, REDDIT_TITLE_LIMIT)}</p>
            <div aria-live="polite">{cutText && <p class="kg-error" data-title-cut>{cutText}</p>}</div>
          </>
        )}
        <CopyText id="kt-body-out" label={post.title !== undefined ? "Post body" : "Post"} text={post.body} copyLabel={post.title !== undefined ? "Copy body" : "Copy post"} />
        <p class="kt-count" data-char-count>{post.title !== undefined ? "Body: " : ""}{charCount(post.chars, post.limit)}</p>
        <div aria-live="polite">{overText && <p class="kg-error" data-over-limit>{overText}</p>}</div>
        <p class="kg-note" data-chat-warning><strong>Post on Discord, Reddit or your own channels. Never paste links in in-game chat:</strong> players report mutes and account flags for sharing outside links there. Use the in-game Recruitment Plaza for in-game ads.</p>
      </section>
    </div>
  );
}
