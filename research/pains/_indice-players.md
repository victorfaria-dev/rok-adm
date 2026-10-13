# Player pains index (D-0001 … D-0044) — individual players, F2P / early-kingdom focus

> Pain Collector (voice of the player), run of 2026-10-13. Cards follow `schemas/dor.md`. Raw quotes in `research/raw/pains-players/`; method and sources in `research/raw/pains-players/_sources.md`; solution brainstorm in `research/raw/pains-players/_feature-ideas.md`.

## How to read the numbers

- **Corpus**: 12,830 r/RiseofKingdoms posts (2024-10-01 → 2026-10-12, recruitment/project/sale ads removed), 2,540 comments from 58 hand-picked threads, 3,539 store reviews dated 2024+ (App Store 1,889 across US/GB/CA/AU; Google Play 1,650 English), 1,075 substantive comments under official posts on the Lilith forum.
- **Freq.** = keyword-regex matches × estimated precision (from spot checks), summed over channels. It counts *reports*, not unique people, and is an **order-of-magnitude** figure. Reddit questions (e.g. "which commander should I invest in?") count as evidence of a need/uncertainty, not always of a complaint.
- **Score** = Freq. × gravity weight (alta 3, media 2, baixa 1). Ranking is sensitive to the precision factors; treat ranks within ±5 positions as ties.
- **Matches** column = Reddit posts / Reddit comments (sample) / App Store / Google Play / Lilith forum.
- **Status** `validada` = ≥5 reports, ≥2 channels and literal evidence from ≥2 channels; `bruto` otherwise (D-0006 and D-0007 are high-volume but Reddit-only).

## Ranking (frequency × gravity)

| # | Card | Pain | Freq. | Gravity | Score | Channels | Matches P / C / AS / GP / F | Status |
|---|------|------|------:|---------|------:|---------:|------------------|--------|
| 1 | [D-0001](D-0001.md) | Pay-to-win gap makes F2P/low-spender effort feel futile | 286 | alta | 858 | 4 | 85 / 56 / 119 / 89 / 0 | validada |
| 2 | [D-0008](D-0008.md) | Commander investment uncertainty and regret (which commander to put scarce heads/sculptures into) | 159 | alta | 477 | 3 | 226 / 1 / 0 / 1 / 0 | validada |
| 3 | [D-0018](D-0018.md) | New kingdoms dominated from day 1 by jumpers/sleepers/whales; newcomers cannot compete | 154 | alta | 462 | 4 | 276 / 35 / 8 / 7 / 0 | validada |
| 4 | [D-0002](D-0002.md) | Time burden: the game demands hours/day and constant presence ("second job") | 152 | alta | 456 | 5 | 93 / 78 / 20 / 18 / 2 | validada |
| 5 | [D-0016](D-0016.md) | Returning players: outdated account, no kingdom will accept them, migration locked by account age | 209 | media | 418 | 4 | 269 / 22 / 6 / 1 / 0 | validada |
| 6 | [D-0003](D-0003.md) | Being zeroed / farmed by stronger players wipes months of progress | 139 | alta | 417 | 4 | 152 / 62 / 21 / 11 / 0 | validada |
| 7 | [D-0006](D-0006.md) | Not knowing what to do next / what to prioritize | 196 | media | 392 | 4 | 350 / 3 / 3 / 1 / 0 | bruto |
| 8 | [D-0026](D-0026.md) | Burnout, addiction and real-life harm (relationships, health, money) | 130 | alta | 390 | 4 | 75 / 42 / 110 / 62 / 0 | validada |
| 9 | [D-0007](D-0007.md) | Uncertainty about whether the account is on track ("rate my account", "am I ready for KvK", "am I cooked") | 166 | media | 332 | 1 | 195 / 0 / 0 / 0 / 0 | bruto |
| 10 | [D-0004](D-0004.md) | Kingdom leadership coercion: forced migration, KP/DKP quotas, rules, threats | 110 | alta | 330 | 4 | 103 / 26 / 20 / 8 / 0 | validada |
| 11 | [D-0020](D-0020.md) | Managing farm accounts / multiple accounts is laborious but needed for resources | 163 | media | 326 | 4 | 260 / 47 / 6 / 1 / 0 | validada |
| 12 | [D-0010](D-0010.md) | Gem spending decisions: unsure where to spend gems; regret wasted gems | 144 | media | 288 | 5 | 182 / 19 / 3 / 2 / 2 | validada |
| 13 | [D-0021](D-0021.md) | Bots, pilots, resource sellers and cheaters go unpunished | 137 | media | 274 | 4 | 132 / 31 / 14 / 15 / 0 | validada |
| 14 | [D-0017](D-0017.md) | Account lost/inaccessible after a break or device change; binding problems | 85 | alta | 255 | 4 | 92 / 4 / 27 / 4 / 0 | bruto |
| 15 | [D-0012](D-0012.md) | KvK preparation confusion: how much RSS/speedups/troops/tech, conflicting numbers | 124 | media | 248 | 4 | 235 / 10 / 1 / 2 / 0 | validada |
| 16 | [D-0042](D-0042.md) | Identity: chasing prestige city skins (Hidden Lotus, Zenith) | 118 | media | 236 | 4 | 169 / 10 / 2 / 0 / 9 | validada |
| 17 | [D-0019](D-0019.md) | Hard to migrate / join friends: passports, requirements, restrictions | 112 | media | 224 | 4 | 158 / 16 / 7 / 0 / 2 | validada |
| 18 | [D-0015](D-0015.md) | Restart-or-continue dilemma: early mistakes feel unrecoverable | 105 | media | 210 | 2 | 131 / 1 / 0 / 0 / 0 | validada |
| 19 | [D-0024](D-0024.md) | Toxic chat, harassment and child-safety concerns | 65 | alta | 195 | 4 | 40 / 7 / 32 / 14 / 0 | validada |
| 20 | [D-0023](D-0023.md) | Customer support unresponsive or unhelpful | 93 | media | 186 | 4 | 85 / 5 / 19 / 14 / 0 | bruto |
| 21 | [D-0037](D-0037.md) | Cannot find a kingdom/alliance that fits a casual, PvE or F2P playstyle | 89 | media | 178 | 4 | 96 / 25 / 6 / 3 / 0 | validada |
| 22 | [D-0039](D-0039.md) | Crashes, freezes, loading and lag | 73 | media | 146 | 3 | 54 / 0 / 20 / 19 / 0 | bruto |
| 23 | [D-0036](D-0036.md) | Exiting the game: what to do with an invested account (sell, park, value it) | 125 | baixa | 125 | 2 | 22 / 11 / 0 / 0 / 0 | validada |
| 24 | [D-0030](D-0030.md) | Onboarding overload: complex UI, unskippable tutorial, game does not teach mid-game systems | 62 | media | 124 | 4 | 73 / 9 / 13 / 3 / 0 | validada |
| 25 | [D-0038](D-0038.md) | Missing preferred civilization (Persia, India, Africa, Mongols...) | 102 | baixa | 102 | 5 | 52 / 1 / 31 / 17 / 17 | validada |
| 26 | [D-0027](D-0027.md) | Slow progression and long timers (100-day research, slow T5, weeks of waiting) | 49 | media | 98 | 4 | 25 / 3 / 25 / 12 / 0 | validada |
| 27 | [D-0033](D-0033.md) | RNG/gambling mechanics (wheels, equipment crafting, lucky chests) waste resources | 45 | media | 90 | 4 | 49 / 17 / 4 / 3 / 0 | validada |
| 28 | [D-0034](D-0034.md) | Spending pressure, FOMO and post-purchase regret (bundles, limited events, crystal tech) | 42 | media | 84 | 4 | 40 / 13 / 6 / 7 / 0 | validada |
| 29 | [D-0014](D-0014.md) | Missing time-limited windows: event timing, timezones, unclear timers | 37 | media | 74 | 4 | 30 / 8 / 0 / 2 / 13 | validada |
| 30 | [D-0028](D-0028.md) | Resource and healing costs for KvK are enormous (billions of RSS, months of speedups) | 37 | media | 74 | 4 | 34 / 20 / 1 / 1 / 0 | validada |
| 31 | [D-0043](D-0043.md) | Identity: showcasing account journey / progress diaries | 70 | baixa | 70 | 2 | 88 / 5 / 0 / 0 / 0 | bruto |
| 32 | [D-0035](D-0035.md) | Ads misrepresent the game, creating wrong expectations at install | 54 | baixa | 54 | 4 | 2 / 2 / 41 / 15 / 0 | bruto |
| 33 | [D-0031](D-0031.md) | Advice is scattered, outdated, contradictory and spender-biased; few F2P guides | 26 | media | 52 | 4 | 26 / 7 / 1 / 2 / 0 | validada |
| 34 | [D-0005](D-0005.md) | Kicked from alliance for being offline/low power, especially as a new player | 25 | media | 50 | 4 | 19 / 6 / 5 / 2 / 0 | validada |
| 35 | [D-0025](D-0025.md) | Language barriers: kingdoms in other languages, translation paywalled or incomplete | 24 | media | 48 | 4 | 27 / 3 / 4 / 4 / 0 | validada |
| 36 | [D-0011](D-0011.md) | Speedups: when to use vs save; fear of wasting them | 46 | baixa | 46 | 3 | 50 / 8 / 1 / 0 / 0 | bruto |
| 37 | [D-0041](D-0041.md) | Constantly attacked as a newcomer; shields too expensive, no protection for low levels | 15 | alta | 45 | 4 | 1 / 1 / 2 / 2 / 0 | validada |
| 38 | [D-0009](D-0009.md) | Power creep / meta churn devalues past investment (commanders, gear, formations, armaments) | 20 | media | 40 | 4 | 12 / 9 / 4 / 1 / 0 | validada |
| 39 | [D-0022](D-0022.md) | Unfair or opaque automated bans/mutes (incl. false bot flags, gem deductions) | 14 | media | 28 | 3 | 11 / 0 / 3 / 3 / 0 | validada |
| 40 | [D-0032](D-0032.md) | Calculators/tools are unreliable, down, or require screenshots/Discord | 23 | baixa | 23 | 3 | 35 / 6 / 0 / 0 / 2 | validada |
| 41 | [D-0013](D-0013.md) | Season/KvK mechanics and progression system confusion (seasons, crystal tech, honor, commander swap rules) | 22 | baixa | 22 | 3 | 32 / 1 / 0 / 0 / 2 | validada |
| 42 | [D-0044](D-0044.md) | Identity: desire for more customization/cosmetics | 15 | baixa | 15 | 3 | 20 / 0 / 3 / 1 / 0 | validada |
| 43 | [D-0029](D-0029.md) | Gold heads / legendary sculptures too scarce for F2P (slow commander progression) | 7 | media | 14 | 2 | 7 / 0 / 0 / 1 / 0 | validada |
| 44 | [D-0040](D-0040.md) | Alliance officers burn out on manual admin (Ark rosters, activity tracking, DKP sheets) | 2 | media | 4 | 2 | 2 / 1 / 0 / 0 / 0 | bruto |

## Clusters / themes

| Cluster | Cards | What it means for a hub |
|---|---|---|
| **A. Decision paralysis & irreversible choices** (the most hub-solvable cluster) | D-0006 what next, D-0007 am I on track, D-0008 which commander, D-0010 gems, D-0011 speedups, D-0012 KvK prep, D-0015 restart?, D-0013 seasons/mechanics, D-0029 heads supply | Together ≈1,000 Reddit posts in 2 years. Players repeatedly post screenshots asking for a personal plan; answers are inconsistent and often harsh. A personalised planner + benchmarks directly targets this. |
| **B. Pay-to-win & spending pressure** | D-0001, D-0034, D-0033, D-0009, D-0028 | Dominant complaint in store reviews. A hub cannot remove P2W but can (a) set realistic, budget-specific goals, (b) show value per $/gem, (c) say what to skip. |
| **C. Time burden & burnout** | D-0002, D-0026, D-0020 (farms), D-0014 (time windows) | "Second job" framing is everywhere. Time-boxed routines ("10-minute session plan"), calendars in local time, and explicit "safe to skip" lists are the hub's levers. |
| **D. Social power & kingdom politics (player side)** | D-0003 zeroed, D-0004 leadership coercion, D-0005 kicked, D-0041 newcomer attacked, D-0024 toxicity | Mostly not solvable by tools; a hub can help players *choose* kingdoms/alliances that fit and give survival/recovery playbooks. Cross-check with leaders' cards (raw/pains-leaders). |
| **E. Where do I belong? (kingdom fit & mobility)** | D-0018 new-kingdom domination, D-0016 returning players, D-0019 migration, D-0037 casual kingdom, D-0025 language | Strong unmet need: there is no neutral directory of kingdoms by playstyle/language/requirements/seed. Returning players are a large, under-served segment (≈270 posts). |
| **F. Information quality** | D-0031 scattered/outdated/spender-biased advice, D-0032 tools unreliable | Evidence that guides must be tagged by spend profile and by patch date. |
| **G. Game-side issues (out of hub scope)** | D-0017 account loss, D-0021 bots, D-0022 bans, D-0023 support, D-0035 ads, D-0039 crashes | Record only; hub must avoid automation/ToS conflicts (D-0022 shows players get banned even for asking for a Discord link in chat). |
| **H. Identity** | D-0042, D-0043, D-0044, D-0038 | See next section. |

## Identity (requested topic)

Hypothesis tested: *players value identity a lot (names, avatar frames, city skins, alliance tag/flag, titles, Discord roles).*

| Signal | Evidence | Strength |
|---|---|---|
| **Prestige city skins** (Hidden Lotus, Zenith of Power) — D-0042 | 169 Reddit posts mention lotus/zenith/city skins (≈1,100 comments); players restart up to "40th restart" to get Hidden Lotus; ask for "day by day step to get 1.5 million power"; one got scheduled to be zeroed for pushing Zenith without kingdom permission; 9 forum comments ask for new/updated skins/themes. Caveat: these skins carry stat buffs, so identity and power are entangled. | **Strong** |
| **Showcasing the account journey** — D-0043 | 88 Reddit posts are progress diaries/showcases ("Day 500", "Day 750", "1000 days old low spender Account showcase"); author says "I liked those posts when I started to get a feeling on what is achievable". 'Rate my account' posts (D-0007, 195 posts) mix showcase + benchmarking. The official forum holds ≈298k "photowall" and ≈217k "Cityscape" posts — showing off city/account is a mass behaviour. | **Strong** (behaviour), but no explicit request for a *profile page* found |
| **Civilization / culture representation** — D-0038 | 102 estimated reports across 5 channels: requests for Persia (incl. organised review campaigns), India, African civs, Maya rant, "all the meta commanders are chinese". Players tie personal/national identity to civ choice. | **Strong** but partly campaign-driven |
| **Customization wishes** — D-0044 | ≈15 reports: customize heroes / a custom king or queen, earn themes without paying, building appearance, choose architecture of any civ (forum). | Weak–moderate |
| **Titles / status labels** | Players invent spend-tier identities (whale, kraken, dolphin — "F2P and low spenders titles" post); kingdom titles appear mainly as power/abuse topics. | Moderate (as status vocabulary) |
| **Alliance identity / branding** (tags, flags, logos, Discord roles, profile cards) | **No meaningful public evidence found**: alliance-flag mentions are about map structures, not branding; 'family' language exists but no requests for logos/Discord roles. Likely lives in closed Discords (not accessible) — mark as **inferred / untested**. | None in sample |

Implication (hypothesis): identity features are a plausible *engagement* hook for a hub (shareable account card, progress timeline, skin-milestone planner), but the evidence supports **personal** identity (account, city, civ) far more than **alliance** branding.

## Unexpected findings

1. **Returning players are a large segment** (≈270 Reddit posts, D-0016): outdated accounts, account-age migration locks, "no kingdom accepts returning players". Few guides target them.
2. **"Rate my account / am I cooked" is a core ritual** (195 posts, several of the most-commented threads): players crave benchmarking against peers of the same kingdom age.
3. **Restart loops**: some players restart dozens of times to hit early milestones (Hidden Lotus "40th restart"); "should I restart?" is a recurring dilemma (131 posts).
4. **Exit is a pain too** (D-0036): heavy-investment players don't know what to do when quitting (sell — ToS-violating — park in a dead KD, give to a friend); ≈80 "selling account" ad posts in 2 years.
5. **Chat-filter bans for mentioning Discord** (D-0022): players are banned/muted for "asking for third party information" (alliance Discord). This directly constrains how any external hub can be shared in-game.
6. **Commander swap ended a day early with no countdown (Jan 2025)** — 13 multilingual complaints on the official forum plus Reddit; illustrates how a personal event calendar with exact end times would prevent real losses.
7. **Guides feel biased in both directions**: low spenders say advice assumes spending; a high spender says guides only cover low/medium spenders → spend-profile tagging is needed for everyone.
8. **Relationship harm is a visible theme** (posts by spouses: "Husband & ROK", "asked my husband to delete his account") — healthy-play framing could be a differentiator.
9. **Store reviews and Reddit describe two different games**: store reviewers (new/casual) complain about ads, P2W, bullying, crashes, account loss; Reddit (engaged) asks optimisation questions. Pains like "what next" (D-0006) barely appear in stores.
10. **Possible seeded posts**: a few highly "planner-flavoured" Reddit posts (user Many-Breakfast6136: "calendar app with troops", "simple weekly routine"; Organic-Back-4247: "KVK prep is like cooking…") read like market-research or AI-assisted posts. They were kept but down-weighted; the needs they describe are corroborated elsewhere.

## Coverage limits and sampling bias

- **Reddit** accessed through the Arctic Shift archive (reddit.com blocked). Archive completeness ~good but deleted/removed posts lose text (649 posts "[removed]/[deleted]"). Comments were fetched for only 58 hand-picked threads → comment counts are biased toward pain threads.
- **Store reviews**: App Store RSS caps at 500 most-recent reviews per storefront (so 2026-heavy); Google Play scraper returned mostly Jun–Oct 2026 reviews. Earlier-2024/2025 store sentiment is under-sampled. Some store reviews are jokes/memes or campaigns (Persia).
- **Not covered**: Discord (closed), Facebook groups, YouTube comments (not fetchable), non-English communities (VN, TR, AR, RU, PT-BR are large RoK populations) — language bias toward English-speaking players.
- **Survivorship/vocality**: Reddit over-represents engaged, mid/late-game players and complainers; store reviews over-represent new or churned players. Silent satisfied F2P players are invisible.
- **Classification**: regex + spot checks, not full human coding. Precision factors per pain are stated in each card; borderline pains (D-0003, D-0006, D-0012, D-0018, D-0020) have ≈45–55% precision on posts.
- **Inferred pains**: alliance identity/branding (no card) is inferred and untested.
