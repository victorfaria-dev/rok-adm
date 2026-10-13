import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import type { SpendingProfile } from "@rokadm/core";
import {
  exportStore,
  importStoreReport,
  readStore,
  writeStore,
  type StoreV1,
  type ThemePref,
} from "../../lib/store";
import { applyTheme } from "../../lib/theme";
import { profileFromCode, profileSummary } from "../../lib/profile";
import {
  IMPORTED_MESSAGE,
  deletedMessage,
  skippedMessage,
  OVERRIDE_CHOICES,
  RULE_BODY,
  THEME_CHOICES,
  effectiveView,
  exportFileName,
  isThemePref,
  overrideValue,
  parseOverride,
  profileRows,
} from "../../lib/me";
import { Accounts } from "./Accounts";
import { ProfileDetails } from "./ProfileDetails";
import BackupAll from "./BackupAll";
import { TileIcon, type TileIconName } from "../cityhall/TileIcon";
import { activeAccount } from "../../lib/accounts";
import { PROFILE_NAMES } from "@rokadm/core";
import { ONBOARDING_IDS } from "../../lib/questionnaire-flow";
import { ROLE_LABEL, setPlayingAs } from "../../lib/role";
import { PLAYING_AS } from "../../lib/store";
import { USER_DATA_KEYS, clearAllKeys, clearOfflineCache } from "../../lib/storage-keys";
import "./me.css";

interface Props {
  /** Page navigation; tests pass a spy. */
  navigate?: (url: string) => void;
  /** File download; tests pass a spy. */
  download?: (fileName: string, text: string) => void;
  /** Clock for the export file name; tests pass a fixed date. */
  now?: () => Date;
}

const defaultNavigate = (url: string): void => {
  window.location.assign(url);
};

const defaultDownload = (fileName: string, text: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

function storageOf(name: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return typeof window === "undefined" ? null : window[name];
  } catch {
    return null;
  }
}

/** Keep the header/rail theme pickers in step with the theme chosen here. */
function syncThemePickers(pref: ThemePref): void {
  for (const input of document.querySelectorAll<HTMLInputElement>("[data-theme-picker] input")) {
    input.checked = input.value === pref;
  }
}

/** Keep the header/rail profile chips in step after import or delete (mirrors ProfileChip.astro). */
function syncProfileChips(code: string | null): void {
  const profile = profileFromCode(code);
  for (const chip of document.querySelectorAll<HTMLAnchorElement>("[data-profile-chip]")) {
    const text = chip.querySelector("[data-chip-text]");
    if (!text) continue;
    if (profile) {
      text.textContent = profileSummary(profile);
      chip.href = "/me/";
      chip.removeAttribute("data-empty");
      chip.setAttribute("aria-label", `Your profile: ${profileSummary(profile)}`);
    } else {
      text.textContent = "Set up profile";
      chip.href = "/start/";
      chip.setAttribute("data-empty", "");
      chip.removeAttribute("aria-label");
    }
  }
}

// User-facing strings added in UX stage 1 (role switch, short onboarding, share card), in one place.
const S = {
  title: "Me",
  lead: "Your profile, how you use KingdomOps, theme and data. Everything here is stored only in this browser: no account, no server.",
  playingH: "Playing as",
  playingNote: "Player shows City Hall, Tools and Me. Leader shows Kingdom, Members, Events and Me. Guides stay one tap away, in the first row below.",
  empty: "No profile yet. Answer 5 quick questions and KingdomOps sets up your City Hall, daily routine and guide.",
  start: "Start",
  editAnswers: "Edit answers",
  defaultName: "Governor",
  noProfileLine: "No profile yet",
  groupMain: "You and your accounts",
  groupSettings: "Settings",
  groupAbout: "Trust and about",
  rows: {
    guides: "Guides",
    profile: "Profile and accounts",
    share: "Share card",
    theme: "Appearance",
    data: "Your data",
    backup: "Backup",
    trust: "Trust & privacy",
    about: "About KingdomOps",
    brand: "Brand",
  },
} as const;

/** "Main" → "MA", "Farm 1" → "F1". */
const initials = (name: string): string => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? `${w[0]![0]}${w[1]![0]}` : (w[0] ?? "?").slice(0, 2)).toUpperCase();
};

/** One row of the grouped hub that opens in place (long text lives behind it). */
function Row(props: { id: string; icon: TileIconName; label: string; children: preact.ComponentChildren }) {
  return (
    <li>
      <details class="me-row-item" id={`me-row-${props.id}`} data-me-row={props.id}>
        <summary class="me-item">
          <TileIcon name={props.icon} class="me-item-icon" />
          <span class="me-item-label">{props.label}</span>
          <TileIcon name="chevron" class="me-item-chevron" />
        </summary>
        <div class="me-panel">{props.children}</div>
      </details>
    </li>
  );
}

/** One row of the grouped hub that goes to another page. */
function LinkRow(props: { href: string; icon: TileIconName; label: string }) {
  return (
    <li>
      <a class="me-item" href={props.href}>
        <TileIcon name={props.icon} class="me-item-icon" />
        <span class="me-item-label">{props.label}</span>
        <TileIcon name="chevron" class="me-item-chevron" />
      </a>
    </li>
  );
}

/** Me page island: role switch, profile summary, optional details, F-72 effective profile, share card, theme and local data. */
export default function Me({ navigate = defaultNavigate, download = defaultDownload, now = () => new Date() }: Props) {
  // Server render has no storage: profile area shows a placeholder until the store is read.
  const [store, setStore] = useState<StoreV1 | null>(null);
  /** Status message and where it is shown: next to import/export or next to delete. */
  const [status, setStatus] = useState<{ at: "data" | "delete"; text: string }>({ at: "data", text: "" });
  const [importError, setImportError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [alsoOffline, setAlsoOffline] = useState(false);
  const confirmHeading = useRef<HTMLHeadingElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<"confirm" | "delete" | null>(null);

  useLayoutEffect(() => {
    setStore(readStore());
  }, []);

  // The header/rail pickers change the theme too: follow them.
  useEffect(() => {
    const onChange = (e: Event): void => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.closest("[data-theme-picker]") && isThemePref(t.value)) {
        setStore((s) => (s ? { ...s, theme: t.value as ThemePref } : s));
      }
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);

  // A link to something inside a closed row (e.g. #me-backup-h) opens that row.
  useEffect(() => {
    const open = (): void => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      const row = el?.closest("details");
      if (row && !row.open) row.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  // Focus moves into the confirmation when it opens and back to its trigger when it closes.
  useEffect(() => {
    if (focusAfter.current === "confirm") confirmHeading.current?.focus();
    else if (focusAfter.current === "delete") deleteButton.current?.focus();
    focusAfter.current = null;
  });

  const say = (text: string, at: "data" | "delete" = "data"): void => {
    setImportError("");
    setStatus({ at, text });
  };

  const setOverride = (o: SpendingProfile | null): void => {
    setStore(writeStore({ profileOverride: o }));
  };

  const setTheme = (pref: ThemePref): void => {
    setStore(writeStore({ theme: pref }));
    applyTheme(pref);
    syncThemePickers(pref);
  };

  const editAnswers = (): void => {
    // A stale draft would win over the saved profile in the questionnaire (resume()).
    writeStore({ draft: null });
    navigate("/start/");
  };

  const exportData = (): void => {
    const fileName = exportFileName(now());
    download(fileName, exportStore(readStore()));
    say(`Exported ${fileName}. Check your downloads.`);
  };

  const importFile = async (file: File): Promise<void> => {
    let imported: StoreV1;
    let skipped = 0;
    try {
      const r = importStoreReport(await file.text());
      imported = r.store;
      skipped = r.skippedProfiles;
    } catch (e) {
      setStatus({ at: "data", text: "" });
      setImportError(e instanceof Error ? e.message : "This file could not be read.");
      return;
    }
    const { v: _v, ...rest } = imported;
    const next = writeStore(rest);
    applyTheme(next.theme);
    syncThemePickers(next.theme);
    syncProfileChips(next.profileCode);
    document.documentElement.setAttribute("data-role", next.playingAs);
    setConfirming(false);
    setStore(next);
    say(skipped > 0 ? `${IMPORTED_MESSAGE} ${skippedMessage(skipped)}` : IMPORTED_MESSAGE);
  };

  const openConfirm = (): void => {
    focusAfter.current = "confirm";
    setConfirming(true);
  };

  const cancelConfirm = (): void => {
    focusAfter.current = "delete";
    setConfirming(false);
  };

  const deleteAll = async (): Promise<void> => {
    const removed = clearAllKeys(storageOf("localStorage"), storageOf("sessionStorage"));
    const offline = alsoOffline ? (await clearOfflineCache()) > 0 : null;
    applyTheme("dark");
    syncThemePickers("dark");
    syncProfileChips(null);
    document.documentElement.setAttribute("data-role", "player");
    const fresh = readStore();
    focusAfter.current = "delete";
    setConfirming(false);
    setStore(fresh);
    setAlsoOffline(false);
    say(deletedMessage(removed.length, offline), "delete");
  };

  const profile = store ? profileFromCode(store.profileCode) : null;
  const account = store ? activeAccount(store) : null;
  const eff = profile && store ? effectiveView(profile, store.profileOverride) : null;

  return (
    <div class="me">
      <header class="me-hero" data-layer="2">
        <span class="me-avatar" aria-hidden="true">{initials(account?.name ?? S.defaultName)}</span>
        <div class="me-hero-text">
          <h1><span class="visually-hidden">{S.title}: </span>{account?.name ?? S.defaultName}</h1>
          <p class="me-hero-line mono">
            {profile ? `${ROLE_LABEL[store?.playingAs ?? "player"]} · ${PROFILE_NAMES[profile.spending]} · CH ${profile.cityHall}` : S.noProfileLine}
          </p>
        </div>
      </header>

      <section class="me-section me-role" aria-labelledby="me-role-h" data-playing-as>
        <h2 id="me-role-h" class="me-role-h">{S.playingH}</h2>
        <fieldset class="me-choices me-choices-row">
          <legend class="visually-hidden">{S.playingH}</legend>
          {PLAYING_AS.map((r) => (
            <label class="me-choice" key={r}>
              <input type="radio" name="me-role" value={r} checked={(store?.playingAs ?? "player") === r}
                onChange={() => { setPlayingAs(r); setStore(readStore()); }} />
              <span>{ROLE_LABEL[r]}</span>
            </label>
          ))}
        </fieldset>
        <p class="me-note">{S.playingNote}</p>
      </section>

      <ul class="me-group" aria-label={S.groupMain}>
      <LinkRow href="/guides/" icon="guide" label={S.rows.guides} />
      <Row id="profile" icon="user" label={S.rows.profile}>
      <section class="me-section" aria-labelledby="me-profile-h">
        <h2 id="me-profile-h">Profile</h2>
        {!store ? (
          <div class="me-skeleton" aria-hidden="true"><span /><span /><span /></div>
        ) : profile ? (
          <>
            <dl class="me-answers">
              {profileRows(profile, ONBOARDING_IDS).map((r) => (
                <div class="me-row" key={r.id}>
                  <dt>{r.label}</dt>
                  <dd class={r.numeric ? "mono" : undefined}>{r.value}</dd>
                </div>
              ))}
            </dl>
            <div class="me-actions">
              <button type="button" class="btn btn-secondary" onClick={editAnswers}>{S.editAnswers}</button>
            </div>
          </>
        ) : (
          <div class="me-empty">
            <p>{S.empty}</p>
            <a class="btn btn-primary" href="/start/">{S.start}</a>
          </div>
        )}
      </section>

      {store && profile && <ProfileDetails store={store} onChange={setStore} />}

      {store && (
        <Accounts
          store={store}
          now={now}
          onChange={(next, switched) => {
            if (switched) syncProfileChips(next.profileCode);
            setStore(next);
          }}
        />
      )}

      {store && profile && eff && (
        <section class="me-section" aria-labelledby="me-eff-h">
          <h2 id="me-eff-h">Spending profile used</h2>
          <dl class="me-answers">
            <div class="me-row"><dt>Monthly spending (your answer)</dt><dd>{eff.declared}</dd></div>
            <div class="me-row"><dt>Total spend tier</dt><dd>{eff.lifetime}</dd></div>
            <div class="me-row me-row-strong"><dt>Profile the guide and routine use</dt><dd>{eff.effective}</dd></div>
          </dl>
          <p aria-live="polite">{eff.result.explanation}</p>
          <div class="me-rule">
            <p class="me-rule-label">Product rule, not a game fact</p>
            <p>{RULE_BODY}</p>
          </div>
          <fieldset class="me-choices">
            <legend>Choose the profile by hand</legend>
            {OVERRIDE_CHOICES.map((c) => (
              <label class="me-choice" key={c.value}>
                <input
                  type="radio"
                  name="me-override"
                  value={c.value}
                  checked={overrideValue(store.profileOverride) === c.value}
                  onChange={() => setOverride(parseOverride(c.value))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </fieldset>
          <p class="me-note">Your spending answers stay on this device. KingdomOps never sends them anywhere.</p>
        </section>
      )}
      </Row>
      <LinkRow href="/card/" icon="card" label={S.rows.share} />
      </ul>

      <ul class="me-group" aria-label={S.groupSettings}>
      <Row id="theme" icon="theme" label={S.rows.theme}>
      <section class="me-section" aria-labelledby="me-theme-h">
        <h2 id="me-theme-h">Theme</h2>
        <fieldset class="me-choices me-choices-row">
          <legend class="visually-hidden">Theme</legend>
          {THEME_CHOICES.map((t) => (
            <label class="me-choice" key={t.value}>
              <input
                type="radio"
                name="me-theme"
                value={t.value}
                checked={store?.theme === t.value}
                onChange={() => setTheme(t.value)}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
        <p class="me-note">System follows your device's light or dark setting.</p>
      </section>
      </Row>

      <Row id="data" icon="data" label={S.rows.data}>
      <section class="me-section" aria-labelledby="me-data-h">
        <h2 id="me-data-h">Your data</h2>
        <p>
          The profile file holds only your profile answers (including what you spend), saved accounts, any questionnaire
          draft, routine ticks and settings, commander checks and your theme. Think before you share it. Your card, crest,
          tool inputs, farms and council documents are not in it: use <a href="#me-backup-h">Back up everything</a> for those.
        </p>
        <div class="me-actions">
          <button type="button" class="btn btn-secondary" onClick={exportData}>Export profile file</button>
          <label class="btn btn-secondary me-file">
            Import profile file
            <input
              class="visually-hidden"
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const input = e.currentTarget;
                const file = input.files?.[0];
                if (file) void importFile(file).finally(() => { input.value = ""; });
              }}
            />
          </label>
        </div>
        <p class="me-note">Importing replaces your profile, saved accounts, routine, commander checks and theme with the file's contents. Nothing else changes.</p>
        <p class="me-status" role="status">{status.at === "data" ? status.text : ""}</p>
        <p class="me-error" role="alert">{importError}</p>

        <div class="me-danger">
          <h3>Delete local data</h3>
          <p>Removes everything KingdomOps saved in this browser. Back up everything first if you may want it back.</p>
          {!confirming ? (
            <button type="button" class="btn me-btn-danger-outline" ref={deleteButton} onClick={openConfirm}>
              Delete all data
            </button>
          ) : (
            <div
              class="me-confirm"
              role="group"
              aria-labelledby="me-confirm-h"
              aria-describedby="me-confirm-text"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelConfirm();
                }
              }}
            >
              <h4 id="me-confirm-h" tabIndex={-1} ref={confirmHeading}>Delete everything?</h4>
              <div id="me-confirm-text">
                <p>This deletes from this browser:</p>
                <ul class="me-delete-list" data-delete-list>
                  {USER_DATA_KEYS.map((k) => <li key={k.key}>{k.name}</li>)}
                </ul>
                <p>It cannot be undone.</p>
              </div>
              <label class="me-check">
                <input type="checkbox" checked={alsoOffline} onChange={(e) => setAlsoOffline(e.currentTarget.checked)} />
                <span>Also remove the offline copy of the site (pages saved for offline use; it holds nothing about you)</span>
              </label>
              <div class="me-actions">
                <button type="button" class="btn me-btn-danger" onClick={() => void deleteAll()}>Delete everything</button>
                <button type="button" class="btn btn-secondary" onClick={cancelConfirm}>Cancel</button>
              </div>
            </div>
          )}
          <p class="me-status" role="status">{status.at === "delete" ? status.text : ""}</p>
        </div>
      </section>
      </Row>

      <Row id="backup" icon="backup" label={S.rows.backup}>
        <BackupAll download={download} now={now} />
      </Row>
      </ul>

      <ul class="me-group" aria-label={S.groupAbout}>
        <LinkRow href="/trust/" icon="trust" label={S.rows.trust} />
        <LinkRow href="/?about" icon="info" label={S.rows.about} />
        <LinkRow href="/brand/" icon="flag" label={S.rows.brand} />
      </ul>
    </div>
  );
}
