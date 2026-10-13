# Raw: kingdom/alliance admin services, scanners, Discord bots

All accessed 2026-10-13.

## Hosted stat/scan services (paid unless noted)

### ROKSTATS — app.rokstats.online (CS24, CS25)
- Modules: Title Manager (Title Bot, VIP/priority queues, Discord requests), Fort Tracker (rally automation, troop-threshold kicks, fort DKP, CSV/Excel, public API), Alliance Tracker (member reports, storehouse, passlist automation, R4 rotation, gift tracker), Player Finder ("full-map scans, rogue finder, shield timers"), War Map Planner (live Lost Kingdom map, flag routing).
- Bundles: All-In-One; Kingdom Pro ("Managed KvK Scans & DKP (daily camp scans, no scan tokens)"). Personal "Oracle" plan: "Live account sync, City Hall, Hall of Heroes, KvK preparation, quick scan every 30 minutes, farm accounts".
- Prices visible: single modules "from $10/mo"; KvK season one-time "from $25"; term discounts "up to −30%". Search snippets mentioned season bundles $25–$200 (not confirmed on page).
- About: "ROKSTATS started as a personal tool to make sense of messy KvK numbers." Footer: ROKSTATS Limited, Hong Kong address; founder "iBUGBEAR". "independent and not affiliated with the game publisher". Method: "Flexible scans with image recognition turn in-game screenshots into structured, trackable data." No ToS statement.
- Note: features like "Title Bot", "rally automation", "troop-threshold kicks", "full-map scans", "live account sync" imply automated in-game accounts (inference) → high ToS exposure (17.1.15).

### Hero Scrolls — heroscroll.com/rok (CS30)
- Kingdom Rankings, KvK dashboards, Seeds, Scrolls of Knowledge, Governor's tools (VIP/Speed/Healing/Training calculators, Equipment, Armaments), KvK Tools (Crystal Tech, Territory Planner, KvK Chronicles, Ally Builder), Intel, Migration Feed/Investigation, Title Bot, DKP calculator. "Download Ultra Launcher". Version v1.244.1.
- Live counters: 3,198 kingdoms tracked; 1.5M governors indexed; 584.7K CH25 governors. Last dated news Feb 20, 2026.
- Pricing: Kingdom Store / Governor Store; prices not shown.
- Testimonials (vendor-selected, T4 at best):
  - "As a long-time Great Game Stats user, I was nervous about the transition" → Great Game Stats (another service) migrated into Hero Scrolls (consolidation signal).
  - "Over three years, our kingdom got caught in a web of tools across multiple service partners; separate solutions for titles, alliance activity, fort tracking, HoH screenshots, KvK spending. All at exorbitant cost." / "From 2022 to 2024, third-party tools barely progressed."
  - "the Title Bot completely replaced our old manual title system"
  - "My personal favorite is the Overlay system within Heroscrolls Ultra" — Ultra = launcher with overlay; how it interacts with the game client is not documented (risk unknown).

### Botals — rc.botals.com (CS27)
- Per-scan: Silver €10 (TOP300), Gold €12 (TOP400), Platinum €15 (TOP600), Diamond €20 (TOP1000). Revolut/PayPal. Stats: Power, KP, Deads, T1–T5, RSS gathered, helps, scouts. "calculating the difference in all stats between two scans". Review: "Having a CH8 available to retrieve data is an advantage" (they use an account in your kingdom). No ToS disclaimer.

### ROKStats — rokstats.com (CS26)
- Scans top 300/600/900 profiles; CSV; "Real data 100% Accurate from Server"; prices "Chat for Details or Promo code"; PayPal. Relationship to app.rokstats.online unknown.

### APO RoK Data Analytics — apo-rok-data.com (CS28)
- Free: "All analytics are free", "no account or payment required"; optional one-time support via Stripe. "7 KVKs · 134 kingdoms"; "Scanned daily"; updated 12 Oct 2026. Method not described ("scanner operation").

### ROK Steward — roksteward.com (CS29)
- **Upload-only, no scanning**: "Drag in the xlsx you exported from Rise of Kingdoms" → Excel/PDF reports, DKP formulas, 90-day share links.
- "Previews are always free — you only pay for downloads." Report Pack $4.99 / 5 downloads; Pro $9.99/month; Pro Annual $89/year.

### KingdomOS — kingdomos.ai (CS31)
- "The Kingdom Intelligence Platform." Login with Discord; "Complete the signup survey after connecting Discord. Kingdom leadership will review your application." Features/pricing not public.

### rok-suite (avweigel) — rok-suite-web.vercel.app (CS32)
- Built for one kingdom (K23). Calendar, Alliance Calculator, RoK Mail composer (Gemini drafting), DKP Score from uploaded exports, Emigration tracker, AoO Planner (30v30), MGE tracking, Kingdom Stats, KvK War Room map, battle sim engine, map optimizer. README states MIT (GitHub license field: none detected). Caveats in README: access control "gate UI only", passwords extractable from bundle; broad public RLS policies. Last push 2026-10-07.

### ROK Battles — rokbattles.com (CS33, CS34)
- "community-driven platform for sharing, exploring, and analyzing battle reports"; Olympian Arena, Loot Explorer, Combat Lab, Territory Lab. MIT/Apache-2.0. Donations via GitHub Sponsors.
- Method (docs): "Connect your mailcache folder and start uploading reports"; "The desktop app watches your mailcache folder and uploads battle reports automatically while you play." Mobile: "iPhone and iPad — Download and install the ROK Battles configuration profile. Android — Install Intra and configure it for ROK Battles." (Intra is a DNS app → mobile path appears to be DNS/network-level; inference, not documented.) Reading the PC client's local cache files and network-level capture are both outside "screenshots" and closer to 17.1.6/17.1.12 territory — risk unassessed by Lilith publicly.

## Discord bots

### Codex Helper (CS19, CS20)
- Free: leveling, rank cards, giveaways, reaction roles, tickets, message templates, translator, healing calculator, mail templates.
- Patreon "$5/ month" (FAQ: "The only tier you need is the lowest ($5 USD/month), and it unlocks every Patron feature."): commander guides & pairings, MGE applications, Ark of Osiris signups, event reminders/tracker/calendar, bundle info, KvK commands (timers, flag calcs), auto verification, inventory trackers ("any game language" screenshots).
- Claims: 220 servers, 339,694 users (homepage counters).
- Event Calendar (docs snippet): knows the event rotation, syncs daily, can create Discord Scheduled Events.

### Zoe | RoK (CS22)
- "used in 5,290 Discord servers". Commander talents/pairings/equipment/accessories; troop/passport calculators; reads a Google Sheet of KvK stats; Peerless answers from screenshots; UTC time, maps; AoO organizing. Premium tier (price not shown): "Automatic Jump Group Advertisments", "Faster Commands!", moderation tools.

### Auctioneer Bot (CS23, snippet) — zff.dev/juan_jm/auctioneer-bot
- Self-hosted, MIT; "Reads governor DKP balances from Google Sheets, independent of the underlying DKP calculation system"; DKP auctions via slash commands; "used for over a year by hundreds of active players".

### Others
- Safloet RoK Verification Bot (top.gg) — screenshot-based nickname/role verification (snippet).
- TheMaxi7/RoK-discord-bots (MIT, last push 2024-05-15) — collection incl. AoO/stats.
- Title bots (ADB-driven, automate a king/officer account): mattspen/RoK-Title-Bot (2024–2026), rctz/rok_title_bot, Ily1606/Rok-BotgiverTitle (archived), roka (archived: game added own title system).

## DKP spreadsheets
- No canonical public DKP template found; DKP lives in per-kingdom Google Sheets read by bots (Zoe, Auctioneer). everycalculators.com has a generic "RoK DKP Calculator" page (snippet). Gap: Reddit/Discord, where templates are shared, are not accessible to us.
