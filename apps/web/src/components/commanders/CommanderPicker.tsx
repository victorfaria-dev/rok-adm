import type { JSX } from "preact";
import { useMemo, useRef, useState } from "preact/hooks";
import type { KingdomProgress } from "@rokadm/planner";
import {
  arrivesText,
  filterCommanders,
  groupForPicker,
  isFuture,
  type PickerRarity,
  type PickerRoster,
} from "../../lib/commander-picker";
import { CommanderTile, PortraitCredit } from "./CommanderTile";
import "./picker.css";

interface BaseProps {
  roster: PickerRoster;
  /** Where the player's kingdom is; null = unknown (nothing is dimmed, the "available" filter is hidden). */
  progress: KingdomProgress | null;
  /** Panel title. */
  title?: string;
  /** Prefix for element ids when a page has more than one picker. */
  idPrefix?: string;
  /** Show the rarity and "available to me now" filters (default true). */
  filters?: boolean;
  /** Let future-period commanders be picked (e.g. a wish list). Default false: tapping one explains when it arrives. */
  allowFuture?: boolean;
  /** Extra content under the grid, e.g. an "Another commander" button. */
  children?: preact.ComponentChildren;
}
export type CommanderPickerProps = BaseProps &
  (
    | { mode?: "single"; value: string | null; onChange: (id: string) => void }
    | { mode: "multi"; value: readonly string[]; onChange: (ids: string[]) => void }
  );

const RARITY_OPTIONS: { id: PickerRarity | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "legendary", label: "Lendário" },
  { id: "epic", label: "Épico" },
];

/**
 * Searchable portrait grid grouped by release period (game order) with sticky period headers.
 * One tab stop for the grid (roving tabindex); arrow keys, Home and End move between portraits.
 */
export function CommanderPicker(props: CommanderPickerProps) {
  const { roster, progress, title = "Escolha um comandante", idPrefix = "ckp", filters = true, allowFuture = false } = props;
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<PickerRarity | "all">("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [note, setNote] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = new Set(props.mode === "multi" ? props.value : props.value ? [props.value] : []);
  const visible = useMemo(
    () => filterCommanders(roster.commanders, { query, rarity, availableOnly }, progress),
    [roster, query, rarity, availableOnly, progress],
  );
  const groups = useMemo(() => groupForPicker(roster.periods, visible, progress), [roster, visible, progress]);
  const order = groups.flatMap((g) => g.commanders.map((c) => c.id));
  // The one tile in tab order: the last one focused if still shown, else the first selected, else the first.
  const tabStop = (active && order.includes(active) ? active : order.find((id) => selected.has(id))) ?? order[0];

  const choose = (id: string): void => {
    setActive(id);
    const c = roster.commanders.find((x) => x.id === id);
    if (!c) return;
    if (!allowFuture && isFuture(c, progress)) {
      setNote(arrivesText(c.name, roster.periods.find((p) => p.id === c.period)));
      return;
    }
    setNote("");
    if (props.mode === "multi") {
      const next = selected.has(id) ? props.value.filter((x) => x !== id) : [...props.value, id];
      props.onChange(next);
    } else {
      props.onChange(id);
    }
  };

  const focusTile = (id: string | undefined): void => {
    if (!id) return;
    setActive(id);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-id="${CSS.escape(id)}"]`)?.focus();
  };

  /** Up/Down: the tile in the next/previous visual row whose centre is closest (works across period groups). */
  const vertical = (from: HTMLElement, dir: 1 | -1): string | undefined => {
    const tiles = [...(gridRef.current?.querySelectorAll<HTMLElement>(".ckt[data-id]") ?? [])];
    const r = from.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const rows = tiles
      .map((t) => ({ t, b: t.getBoundingClientRect() }))
      .filter(({ b }) => (dir === 1 ? b.top > r.top + 1 : b.top < r.top - 1));
    if (rows.length === 0) return undefined;
    const rowTop = dir === 1 ? Math.min(...rows.map((x) => x.b.top)) : Math.max(...rows.map((x) => x.b.top));
    const row = rows.filter((x) => Math.abs(x.b.top - rowTop) < 2);
    row.sort((a, b) => Math.abs(a.b.left + a.b.width / 2 - cx) - Math.abs(b.b.left + b.b.width / 2 - cx));
    return row[0]?.t.dataset.id;
  };

  const onKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLButtonElement>): void => {
    const id = e.currentTarget.dataset.id;
    const i = id ? order.indexOf(id) : -1;
    if (i < 0) return;
    let next: string | undefined;
    if (e.key === "ArrowRight") next = order[i + 1];
    else if (e.key === "ArrowLeft") next = order[i - 1];
    else if (e.key === "ArrowDown") next = vertical(e.currentTarget, 1);
    else if (e.key === "ArrowUp") next = vertical(e.currentTarget, -1);
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[order.length - 1];
    else return;
    e.preventDefault();
    focusTile(next);
  };

  const titleId = `${idPrefix}-title`;
  const hintId = `${idPrefix}-hint`;
  const count = visible.length;

  return (
    <section class="ckp" aria-labelledby={titleId}>
      <h2 id={titleId} class="ckp-title">{title}</h2>
      <div class="ckp-tools">
        <div class="ckp-search">
          <label for={`${idPrefix}-q`} class="visually-hidden">Buscar pelo nome</label>
          <input
            id={`${idPrefix}-q`}
            class="ckp-input"
            type="search"
            autoComplete="off"
            spellcheck={false}
            placeholder="Buscar comandantes"
            value={query}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </div>
        {filters && (
          <details class="ckp-more">
            <summary>Filtros</summary>
            <div class="ckp-filters">
            <fieldset class="ckp-seg">
              <legend class="visually-hidden">Raridade</legend>
              {RARITY_OPTIONS.map((o) => (
                <label key={o.id} class="ckp-seg-opt">
                  <input type="radio" name={`${idPrefix}-rarity`} value={o.id} checked={rarity === o.id} onChange={() => setRarity(o.id)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
            {progress && (
              <label class="ckp-check">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.currentTarget.checked)} />
                <span>Só o que posso conseguir agora</span>
              </label>
            )}
            </div>
          </details>
        )}
        <p id={hintId} class="ckp-hint">
          {count === 1 ? "1 comandante" : `${count} comandantes`} em ordem de chegada. As setas movem.
        </p>
      </div>
      <p class="ckp-note" role="status">{note}</p>

      <div class="ckp-scroll" ref={gridRef}>
        {groups.length === 0 && <p class="ckp-empty">Nenhum comandante corresponde a “{query}”.</p>}
        {groups.map((g) => {
          const hid = `${idPrefix}-p-${g.period.id}`;
          return (
            <div key={g.period.id} class="ckp-group" role="group" aria-labelledby={hid} data-future={g.future ? "" : undefined}>
              <h3 id={hid} class="ckp-period">
                <span>{g.period.label}</span>
                {g.future && <span class="ckp-later">Chega depois</span>}
              </h3>
              <div class="ckp-grid">
                {g.commanders.map((c, n) => (
                  <CommanderTile
                    key={c.id}
                    commander={c}
                    // A future commander is never shown as picked, even when a link opened it.
                    pressed={selected.has(c.id) && (allowFuture || !isFuture(c, progress))}
                    future={isFuture(c, progress)}
                    tabIndex={c.id === tabStop ? 0 : -1}
                    onClick={choose}
                    onKeyDown={onKeyDown}
                    loading={g === groups[0] && n < 8 ? "eager" : "lazy"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {props.children}
      <PortraitCredit />
    </section>
  );
}
