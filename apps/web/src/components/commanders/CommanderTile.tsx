import type { JSX } from "preact";
import { PERIOD_CHIP, PORTRAIT_CREDIT, RARITY_TEXT, initials, portraitSrc, type PickerCommander } from "../../lib/commander-picker";
import "./picker.css";

export interface CommanderTileProps {
  commander: PickerCommander;
  /** Picked (aria-pressed). Only meaningful with onClick. */
  pressed?: boolean;
  /** The player's kingdom has not reached its period: dimmed, with a period chip. */
  future?: boolean;
  /** Without onClick the tile is a plain figure (e.g. a list of owned commanders). */
  onClick?: (id: string) => void;
  onKeyDown?: (e: JSX.TargetedKeyboardEvent<HTMLButtonElement>) => void;
  tabIndex?: number;
  /** Lazy by default; pass "eager" for the first row above the fold. */
  loading?: "lazy" | "eager";
}

/** "Guan Yu, Legendary, coming in Season 3": starts with the visible name (label in name). */
export function tileLabel(c: PickerCommander, future: boolean): string {
  return `${c.name}, ${RARITY_TEXT[c.rarity]}${future ? `, coming in ${PERIOD_CHIP[c.period]}` : ""}`;
}

/** Portrait (or initials on a tinted tile), name and a rarity gem. Tokens only. */
export function CommanderTile({ commander: c, pressed = false, future = false, onClick, onKeyDown, tabIndex, loading = "lazy" }: CommanderTileProps) {
  const face = c.portrait ? (
    <img class="ckt-img" {...portraitSrc(c.id)} width={56} height={56} alt="" loading={loading} decoding="async" />
  ) : (
    <span class="ckt-initials" aria-hidden="true">{initials(c.name)}</span>
  );
  const body = (
    <>
      <span class="ckt-face">
        {face}
        <span class="ckt-gem" aria-hidden="true" />
      </span>
      <span class="ckt-name">{c.name}</span>
      {!onClick && <span class="visually-hidden">, {RARITY_TEXT[c.rarity]}</span>}
      {future && <span class="ckt-chip">{PERIOD_CHIP[c.period]}</span>}
    </>
  );
  const common = { class: "ckt", "data-rarity": c.rarity, "data-id": c.id, "data-future": future ? "" : undefined };
  if (!onClick) return <div {...common}>{body}</div>;
  return (
    <button
      type="button"
      {...common}
      aria-label={tileLabel(c, future)}
      aria-pressed={pressed}
      aria-disabled={future ? "true" : undefined}
      tabIndex={tabIndex}
      onClick={() => onClick(c.id)}
      onKeyDown={onKeyDown}
    >
      {body}
    </button>
  );
}

/** The credit line, wherever portraits render. */
export function PortraitCredit() {
  return <p class="ckp-credit">{PORTRAIT_CREDIT}</p>;
}
