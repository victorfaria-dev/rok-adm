# T0 screenshots (source `src:t0-victor`)

Screenshots from the fresh F2P account diary. Protocol: `../t0-medicao.md`. Log: `../t0-log.csv` (template `../t0-log-template.csv`).

## File naming

`YYYY-MM-DD_dayNN_topic[-detail][_n].png`

- `YYYY-MM-DD`: date the screenshot was taken (UTC if possible).
- `dayNN`: kingdom day, two digits minimum (`day01`, `day24`, `day103`).
- `topic`: a short lowercase name from the protocol, words joined by `-`.
- `-detail` (optional): extra context, e.g. the level.
- `_n` (optional): sequence number when one screen needs several shots (scrolling lists).

Examples:

| File | What |
|---|---|
| `2026-10-14_day01_version.png` | Settings → game version and kingdom number |
| `2026-10-14_day01_ap-bar.png` | AP bar (current/max) |
| `2026-10-14_day01_daily-objectives_1.png`, `_2.png` | Full Daily Objectives list (scrolled) |
| `2026-10-15_day02_ch-upgrade-ch06.png` | CH6 upgrade screen (requirements, cost, time, unlocks) |
| `2026-10-20_day07_trading-post-assistance.png` | Resource-assistance screen with the resource selector (is Gold selectable?) |
| `2026-11-06_day24_event-wheel-of-fortune.png` | First Wheel of Fortune (price) |
| `2026-11-01_day19_calendar.png` | Event calendar |

## Rules

- Do not crop or edit. If something private shows (chat names, other players), leave it in; the files stay in this private repo. Blur only real personal data (e-mail, payment info).
- One topic per file. If a screen answers two questions, save it once and mention both topics in the log `notes`.
- PNG or JPG are both fine. Keep the original resolution.
- When a file answers one of the ranked questions in the protocol (§1), write the question number in the log `notes` (e.g. `Q10`).
