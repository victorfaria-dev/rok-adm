// 24 px stroke icons for the City Hall quick-action tiles and the Me rows (drawn for KingdomOps, no game art).
export type TileIconName = "today" | "cityhall" | "list" | "coin" | "clock" | "heal" | "shield" | "flag" | "guide" | "card" | "theme" | "data" | "backup" | "trust" | "info" | "user" | "chevron";

const PATHS: Record<TileIconName, string> = {
  today: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8.5 15l2 2 4-4",
  cityhall: "M4 20V9h3V6h2v3h2V6h2v3h2V6h2v3h3v11zM10 20v-4.5a2 2 0 0 1 4 0V20M3 20h18",
  list: "M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.6 2.5 1.7c0 2.6-5 1.4-5 4 0 1.1 1.1 1.8 2.5 1.8s2.5-.6 2.5-1.5",
  clock: "M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 8v4.5l3 2M9 2h6",
  heal: "M9 4h6v5h5v6h-5v5H9v-5H4V9h5z",
  shield: "M12 3l7 3v5.5c0 4.3-3 7.8-7 9.5-4-1.7-7-5.2-7-9.5V6zM9 12l2 2 4-4",
  flag: "M6 21V3M6 4h12l-3 4 3 4H6",
  guide: "M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5zM13 4h5.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H13z",
  card: "M5 3h14v18H5zM8 7h8M8 17h8M12 10a2 2 0 1 0 0 .1",
  theme: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3v18",
  data: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  backup: "M12 4v11M7.5 10.5L12 15l4.5-4.5M4 17v3h16v-3",
  trust: "M12 3l7 3v5.5c0 4.3-3 7.8-7 9.5-4-1.7-7-5.2-7-9.5V6z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.5 4.2-5.5 7.5-5.5s6.3 2 7.5 5.5",
  chevron: "M9 5l7 7-7 7",
};

export function TileIcon({ name, class: cls = "ch-icon" }: { name: TileIconName; class?: string }) {
  return (
    <svg class={cls} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
