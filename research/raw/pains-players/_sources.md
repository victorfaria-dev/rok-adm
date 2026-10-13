# Sources and method — Pain Collector (players), 2026-10-13

IDs refer to `research/fontes.md` (not edited by this agent): S05 = Reddit r/RiseofKingdoms, S07 = Google Play / App Store reviews, S01 = official Lilith channels (here: the official forum; the *comments* are player voice, T4), S08 = GitHub.

## Sources used

| Source | ID | Access route | Window | Volume | Raw file |
|---|---|---|---|---|---|
| r/RiseofKingdoms posts | S05 | Arctic Shift public Reddit archive API `arctic-shift.photon-reddit.com/api/posts/search?subreddit=RiseofKingdoms` (reddit.com, old.reddit and redlib mirrors were blocked/404/503 for this agent; WebSearch refuses reddit.com) | 2024-10-01 → 2026-10-12 | 14,908 posts; 12,830 after removing recruitment/jump-project/account-sale ads | `reddit-r-riseofkingdoms-posts.md` |
| r/RiseofKingdoms comments | S05 | Arctic Shift `api/comments/tree?link_id=t3_<id>` | same | 2,540 comments from 58 hand-picked threads | `reddit-r-riseofkingdoms-comments.md` |
| Apple App Store reviews | S07 | public iTunes RSS `itunes.apple.com/<cc>/rss/customerreviews/page=1..10/id=1354260888/sortby=mostrecent/json` for US, GB, CA, AU | 2023-05 → 2026-10-11 (1,889 dated 2024+) | 2,000 | `appstore-reviews.md` |
| Google Play reviews | S07 | `google-play-scraper` (Python), app `com.lilithgame.roc.gp`, lang=en, newest + most relevant | mostly 2026-05 → 2026-10-12 (+ older "most relevant") | 1,827 (1,650 dated 2024+) | `googleplay-reviews.md` |
| Lilith official forum | S01 (comments = T4) | public JSON API `forum-global.lilithgame.com/api/v2/posts?account_id=10000000` and `/api/v2/comments?post_id=<id>` (tip from coordinator) | official posts 2024-10 → 2026-10 | 832 official posts; 234 English with comments; 4,273 comments (1,075 > 25 chars) | `lilith-official-forum.md` |
| GitHub tools | S08 | GitHub search API (`rise of kingdoms`) | — | bots (Dylan-Zheng/Rise-of-Kingdoms-Bot 148★, OSROKBOT 74★, ROKBOT 79★), trackers (RokTracker 104★), quiz helper (lyceum-of-wisdom 121★) — used only as evidence of workarounds | (cited in cards; full list in `raw/competitors/github-open-source.md`) |
| Web search (guide sites) | S04 etc. | WebSearch | — | Used only to confirm existing calculators (riseofkingdomsguides.com speedup calculator, everycalculators.com, west-games.com) | — |

### Not reachable / gaps
- reddit.com, old.reddit.com (fetch blocked); WebSearch `allowed_domains=reddit.com` refused; redlib mirrors 404/503.
- Discord servers, Facebook groups (closed / not indexed), YouTube comments (not fetchable), Steam (RoK is not on Steam; PC client is Lilith's own).
- Trustpilot page for RoK 404.

## Method

1. Read 584 negative (1–3★) store reviews from 2024+ in full (manual discovery of themes) and ~600 Reddit posts/1,000 comments (top by comment count per theme).
2. Defined 44 distinct pains (`research/pains/D-0001..D-0044`), one regex per pain (in the collector's scratch script `pains.py`; patterns summarised in each card's title/description).
3. Counted regex matches per channel. Ads removed from Reddit counts with: Recruitment flair, `recruit`, `discord.gg`, `(jump|sleeper|restart|migration) project`, `member goal`, `start date`, `join us`, `we are/offer`, box-drawing banners, `selling account`, `[removed]`.
4. Spot-checked 8 random matched Reddit posts for 12 pains to estimate precision (D-0001 ≈0.7, D-0002 ≈0.7, D-0003 ≈0.5, D-0006 ≈0.55, D-0008 ≈0.7, D-0012 ≈0.5, D-0016 ≈0.7–0.85, D-0018 ≈0.45, D-0019 ≈0.6, D-0020 ≈0.5, D-0037 ≈0.7–0.8). Other precisions are judgement calls stated in each card.
5. `frequencia` = Σ matches × precision (+ manual forum counts; + manual floor for D-0041 after reading reviews). Store reviews containing positive "addictive" lower D-0026 precision to 0.35.
6. Evidence quotes in cards are extracted programmatically from the stored text (verbatim, whitespace-normalised, truncated with …) to avoid transcription errors.

## Bias notes
- Reddit = engaged players (mid/late game, English); store = new/casual/churning players; forum = moderated, contest-heavy.
- Comments sample is hand-picked (pain-dense threads) — do not compare comment counts across pains as prevalence.
- App Store RSS is capped at 500 most recent per storefront; Google Play scraper returns mostly recent months → stores over-represent mid/late 2026.
- Organised campaigns (Persia civ requests) inflate D-0038 in stores and forum.
- Possible seeded / AI-assisted Reddit posts (users Many-Breakfast6136, Organic-Back-4247) with a "planner" angle were kept but weighted low.
- Recent changes players react to (context from coordinator, used to interpret posts): Beginner's Immigration removed (Nov 2024 "death of the jumper strategy" post), commander swap/reset events, tighter account-age migration limits, Conduct Score/anti-script, Wheel of Fortune spin tickets, resource-boost items removed (1.1.09).
