# Raw notes — J2 (late-stage troops, healing economy, research, gems/speedups, lifecycle)

Worker J2, Onda J. Accessed 2026-10-13. All quotes below were re-located literally with curl + local whitespace-normalized search (script outside the repo). No page dumps kept here.

## Access log

| Source | Method | Result |
|---|---|---|
| Official forum (T1) | `api/v2/posts?account_id=10000000&limit=100&offset=0..900` (header `language: en_US`), 832 posts, latest 2026-06-23 (1.1.09); text extracted locally and grepped | OK. Nothing official after 1.1.09 (same gap as `raw/patches/lilith-official-forum.md`). |
| Fandom wiki | MediaWiki API (`action=parse`, `prop=revisions`), UA `rok-research/0.1` | OK. Pages `Hall_of_Heroes`, `Hospital`, `Healing`, `Crystal_Technology`, `Season_of_Conquest` do not exist. Used `Buildings/Hospital` (rev 2020-04-30), `Technology/Medical Corps` (rev 2025-03-12), `Technology/Royal Guard` (rev 2025-03-18), `Template:NoticeResearchTimes`, `Buildings/Castle/Requirements` (rev 2021-06-23), `Frequently_Asked_Questions` (rev 2026-06-25), `Events/The Mightiest Governor` (rev 2026-01-15), `Troops/Infantry/Comparison`, `Lost_Kingdom`. No per-unit training/healing costs on the wiki. |
| riseofkingdomsguides.com (T3) | WordPress REST `wp-json/wp/v2/posts/<id>` (gives true `date`; `modified` = 2026-01-02 mass edit) | OK. Healing calculator constants read from the plugin JS `wp-content/cache/min/1/wp-content/plugins/healing-calculator/healing-calculator.js?ver=1772408572`. |
| lootbar.com (T3, CoI top-up) | curl, Firefox UA | OK (healing cost guide 2026-07-01; speedups guide 2026-06-11; KvK prep guide 2026-06-12). |
| boostroom.com (T3, CoI boosting) | curl, Firefox UA | OK (KvK guide 2026-09-02). |
| packsify.com (T3, CoI top-up) | curl | OK (T5 troops guide 2026-03-21). |
| Arctic Shift (Reddit, T4) | posts/comments search with `query`/`title`/`body` | **FAILED**: "Timeout. Maybe slow down a bit" / "Too many requests" on every full-text query (a no-query call worked). No Reddit corroboration in this front. |
| appgamer.com (Hall of Heroes Q&A, T4) | curl / WebFetch | **FAILED**: Cloudflare challenge / 403. A search snippet mentioned "30% S3 / 50% SoC" in a guest comment — NOT used (not literal). |
| everycalculators.com | curl | **FAILED**: Cloudflare block. |

## Official forum (T1) — excerpts used

- 1.0.41 (post 1030636, 2020-12-15): "Adjusted the duration of the first two seasons of “Lost Kingdom” to 49 days each." / "Decreased the duration of each stage in “Eve of the Crusade” from three days to two days." / hospital capacity of lower-level hospitals increased.
- Dev feedback Oct 2020 (post 1014483, 2020-11-04): "Troops that are not attacking the city or stronghold will be severely wounded instead of dying from the AoE skills of garrison commanders."
- SoC adjustments (post 1046727, 2021-02-04): crystal research redesign, "significantly reduce the combat buff effects from crystal research".
- Dev feedback Mar 2021 (post 1059232): "we have added some crystal technologies which will reduce the cost of healing tier 5 units". Jun 2021 (post 1080797): "We added Crystal Technologies in Season of Conquest which can decrease the healing cost for tier 5 units."
- 1.0.45 highlight (post 1062616, 2021-04-09): "Troops in the Hall of Heroes will now be returned at the end of the Season of Conquest regardless of whether or not the Governor is online." + siege unit zone in addition to the hospital.
- 1.0.47 (post 1071541, 2021-05-18): "Troops in the Hall of Heroes will now also be part of the total power calculations." (Imperium designation)
- 1.0.49 (post 1108303, 2021-08-03): daily cap 200,000,000 each on Resource Assistance and Plundering → **cancelled** next day (post 1108923, 2021-08-04): "Remove resource assistance and looting limits that were proposed in this update earlier."
- 1.0.60 (post 1359527, 2022-07-29): Crystal tech "Plunder" now "Increases Crystals earned from defeating barbarian patrols and Barbarian Forts in Lost Kingdom"; "First Aid" removed; Karaku's Gift, Surprise Strike added.
- 1.0.70 (post 1474351, 2023-05-18): "The Taverns will not be opened during your kingdom's first Season of Conquest."
- 1.0.76 (post 1589003, 2023-11-07): Heroic Anthem fog removed and "extended the story's duration to 50 days".
- 1.0.77 (post 1599092, 2023-12-05): King of the Nile seasonal strategies capped — Frugality (heal resources −10%, max 700,000,000 per Season), Medical Skills (healing speed +15%, max 6,000 minutes per Season), Safe Return (−8% severely wounded, max 500,000 units).
- F2F Oct 2024 (post 1831889, 2024-10-28): Q5 offseason resource stress → partial refund of healing resources planned; Q6 KvKs too long → "looking into ways to shorten the KvK season".
- 1.0.89 (post 1868790, 2024-12-03): Hall of Heroes returns part of Lost Kingdom healing resources (already C04-0028).
- 1.0.90 (post 1896244, 2024-12-31): return to original kingdom after Lost Kingdom 3 → 2 days.
- 1.0.91 (post 1935973, 2025-02-06): Eve of the Crusade phase 3 shortened by 12 h.
- 1.0.92 (post 1963188, 2025-03-04): SoC Wheel of Fortune pool — construction speedups replaced with healing speedups (already in C04-0022).
- F2F Apr 2025 (post 2013999): new Crystal tech to summon a rune near your city.
- 1.0.94 (post 2030530, 2025-05-06): Lost Kingdom tiers from dead + severely wounded units; "the Hall of Heroes' unit return rate will be increased"; Crystal rework (C04-0018).
- 1.1.02 (post 2179486, 2025-12-12): fixed dead units in city reinforcements "incorrectly calculated as less than 50%".
- 1.1.04 (post 2213663, 2026-02-24): Acclaim Shop Recovery Potions (C04-0015); 4 new queues incl. "Crystal tech research".
- Searched and NOT found in official posts: Hall of Heroes return percentage; per-unit healing or training costs; KvK1→KvK2 gap length; any official F2P spending advice.

## riseofkingdomsguides.com (T3)

- Healing calculator JS constants (per unit; `time` in seconds per unit as used by `formatTime(seconds)`):
  T1 inf 20/20/0/0 t3 · T2 inf 40/40/0/0 t1 · T3 inf 60/60/0/4 t2 · T4 inf 120/120/0/8 t3, archer 0/120/90/8, cav 120/0/90/8, siege 80/80/60/8 · T5 inf 320/320/0/160 t4, archer 0/320/240/160, cav 320/0/240/160, siege 200/200/160/160 (food/wood/stone/gold). Page published 2024-07-06.
- KvK tips (id 11872, 2022-01-27), Upgrading troops (12027, 2022-01-21), Lost Kingdom guide (1703, 2022-01-31), Heroic Anthem guide (5260, 2022-01-07), Tier 5 guide (947, 2022-01-05), Where to spend gems (2022-01-05), More Than Gems (3362, 2022-01-10). Quotes in cards A08-06xx/A04-06xx.
- Same-site inconsistency: "next season begins around 2 months later" (11872) vs "usually start three months after the last lost kingdoms" (1703).

## Commercial sites (CoI)

- lootbar healing guide: T4 open field / T5 decisive fights; alliance help cheapest healing. lootbar speedups: "Reserve 100% of your universal speedups for Hospital Healing during Kvk."; "Never heal your hospitals entirely with speedups during fights." lootbar KvK prep: "Aim to have at least 500M Food and Wood, 200M Stone, and 100M Gold in item form."
- boostroom KvK guide: one-hospital-cycle warning, resources in item form, healing/universal speedup protection, F2P selective with crystal tech.
- packsify T5 guide: 100,000 T5 heal ≈ 192M/192M/144M/144M; T4 ≈ 72M/72M/54M/7.2M (≈20× gold) — absolute values disagree with the rkg calculator.

>> Organizer: Hall of Heroes % and existence of HoH in Seasons 1–3 need T0 (end-of-season mail screenshot).
