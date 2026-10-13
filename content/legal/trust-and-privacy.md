# Trust & Privacy

> **DRAFT — needs legal review before monetization.** This page describes how the hub works in its MVP. It is not legal advice, and it must be reviewed by a lawyer (LGPD, GDPR, Lilith Terms of Service) before the hub charges money, shows ads, or stores any data on a server.
>
> Feature: F-56 Trust & Privacy Center. Sources: `research/context/competitors-and-constraints.md` (ToS cards C02-0001 … C02-0021). Last updated: 2026-10-13.

## The short version

- **We store nothing about you on our servers.** In the MVP, everything you enter stays in your own browser.
- **We are a fan project.** We are not affiliated with, endorsed by, or sponsored by Lilith Games.
- **We will never ask for your game login**, never automate the game, and never scan kingdoms.
- **You can delete everything** with **Delete all data** on the You page, or by clearing this site's data in your browser.

## 1. What data we store

### MVP (now)

Everything below lives in your browser's storage on this device. Only you can see it, unless you export a file or share a link yourself. The **You** page (`/me/`) has **Back up everything** (one file with every row marked "yes" below) and **Delete all data** (removes every row below, the Discord webhook included, and can also remove the offline copy).

#### Profile & answers, saved accounts, routine ticks, commander checks and theme

- **What is in it:** Your questionnaire answers (spending, role, minutes per day, kingdom stage, City Hall level, civilization), any unfinished questionnaire, accounts you saved (main, farms), today's routine ticks and routine settings, your commander checklist answers, your theme
- **In "Back up everything":** Yes
- **Other ways to export:** You page: **Export profile file**
- **How to delete it:** **Delete all data** on the You page (routine ticks also reset each day; a saved account can be removed on its own)

#### Governor card

- **What is in it:** The name, tag and colours you typed for your card
- **In "Back up everything":** Yes
- **Other ways to export:** Card page: save as PNG
- **How to delete it:** no separate button; **Delete all data** on the You page removes it with everything else

#### Alliance crest

- **What is in it:** Shield shape, colours, emblem and tag you picked
- **In "Back up everything":** Yes
- **Other ways to export:** Crest page: save as SVG or PNG
- **How to delete it:** no separate button; **Delete all data** on the You page removes it with everything else

#### Tool inputs (calculators, shared inventory, checklists)

- **What is in it:** Numbers you typed in the calculators, the inventory they share, and checklist ticks
- **In "Back up everything":** Yes
- **Other ways to export:** Each calculator: **Copy link to these inputs** (holds the inputs only)
- **How to delete it:** no separate button; **Delete all data** on the You page removes it with everything else

#### Farms & shipment log

- **What is in it:** Your farm accounts (names, levels, notes) and every shipment you logged
- **In "Back up everything":** Yes
- **Other ways to export:** Farms page: **Export farms (JSON)**; shipment log: **Export CSV**
- **How to delete it:** Farms page: delete a farm, or **Delete all farm data**; shipment log: delete a shipment

#### Kingdom council documents (rules, requirements, MGE ledger, recruiting post, seed plans)

- **What is in it:** What the council types: rules, requirement bands, the MGE ledger, recruiting posts, seed plans. **This can include other players' governor names and scores that the council types in.**
- **In "Back up everything":** Yes
- **Other ways to export:** Council kit page (`/kingdom/`): **Export (.json)**; each tool: share link or CSV
- **How to delete it:** Each tool: delete a document; council kit page: **Delete all council data** (also forgets the webhook)

#### Discord webhook URL

- **What is in it:** The Discord webhook the council pasted to post from KingdomOps
- **In "Back up everything":** **No** (it is a secret: anyone with it can post in that channel)
- **Other ways to export:** None, on purpose
- **How to delete it:** **Forget webhook** next to any Discord post button, or **Delete all council data**


- **Discord.** Nothing is posted to Discord unless you press a post button after pasting a webhook URL. Then the post you see (for example an MGE ledger or the rules link) goes straight from your browser to Discord, and Discord's own terms and privacy policy apply to it. KingdomOps has no server in between.
- **Screenshot reader (experimental).** When you pick a screenshot of your own profile at `/tools/screenshot/`, the text recognition (OCR) runs **on your device**. The image never leaves your browser and is not saved; only the numbers you choose to use are carried in a calculator link.
- **Offline copy.** After your first visit, a service worker keeps a copy of the site's pages and data files in your browser so it opens offline. It holds nothing about you. Remove it with the option in **Delete all data**, or in your browser's site settings.
- **Small flags.** A tab-only flag remembers that the logo animation already played; it disappears when you close the tab.
- **No account, no login, no server-side database.** The guides are static pages; filtering happens in your browser.
- **No game data leaves your device** unless you export a file, copy a link or post to Discord yourself. If you clear the site's data, or use a private window, it is gone.
- **Hosting logs:** the company that hosts the static files may keep standard technical logs (IP address, time, page requested) for security. *[Legal review: name the host and its retention period before launch.]*
- **Analytics and ads:** none in the MVP. If that changes, this page changes first and we will ask for consent where the law requires it.

### Later releases (planned, not live)

Server-side features (shared kingdom pages, alliance tools) will only ship after this page is updated, reviewed and published, and you will be told **before** anything you enter leaves your device.

## 2. Not affiliated with Lilith Games

Rise of Kingdoms is a trademark of Lilith Games. This hub is an independent, fan-made planner and is **not affiliated with, endorsed by, or sponsored by Lilith Games**. Commander, event and item names are used only to describe the game. We use our own wording and our own artwork; we do not use Lilith's logos or game art.

Lilith's Terms of Service apply to your game account; nothing on this site changes them. When we describe game rules, we link the source and the patch we checked.

## 3. What we will never do

These are design rules, not just promises. They follow from Lilith's Terms of Service.

| We will never… | Why |
|---|---|
| Ask for your game login, password, or account-binding details | Account sharing and soliciting credentials are prohibited (ToS 17.1.21, 4.4, 17.1.15). Anyone who asks for them — including people claiming to be us — is not us. |
| Build or link bots, scripts, auto-clickers or "farming" tools | Bots and advantage-giving third-party software are prohibited (ToS 17.1.18), and the game penalises scripts through Conduct Score. |
| Scan leaderboards or kingdoms with emulators, OCR bots or service accounts | Automated access and data-mining tools are prohibited (ToS 17.1.7, 17.1.15). |
| Read game files, network traffic or memory | Reverse engineering and circumvention are prohibited (ToS 17.1.12, 17.1.6). |
| Buy, sell or broker accounts or items | Accounts and virtual items are not user property and cannot be sold (ToS §4.5, §12.2). |
| Post links to this site in game chat, or ask you to | Players report mutes and bans for sharing "third-party information" in chat. Share the hub on Reddit, Discord or YouTube instead. |

Everything you put into the hub, you type in yourself.

## 4. Screenshots (planned, not live)

A later release may let you **upload your own screenshots** (inventory, commander, city) so the hub can read the numbers for you instead of making you type them. When it ships:

- **Your screens only.** Upload screens of your own account. Do not upload screens that show other players' personal details.
- **You take the screenshot.** The hub never connects to the game.
- **Numbers kept, image deleted.** We will process the image, keep only the numbers you confirm, and offer immediate deletion of the image. *[Legal review: set the maximum retention period and say where processing happens.]*
- **Opt-in.** Manual input will always remain available.

## 5. Kingdom data (planned for R2, not live)

Kingdom tools (rosters, DKP, kingdom pages) involve **other players' data**. Lilith's terms forbid collecting or storing other users' personal data without their express permission (ToS 17.1.13), and data-protection law applies too. Before any kingdom feature launches, these principles apply:

1. **Import, don't scan.** We accept files that your kingdom already produces; we do not scan.
2. **Leadership attestation.** The person who uploads kingdom data confirms that they are authorised by the kingdom's leadership and that members were told.
3. **Member notice and opt-out.** Every member listed can ask to be hidden or removed from a kingdom page, by governor ID, without needing an account. Opt-outs are honoured in all future imports.
4. **Data minimisation.** Only the columns a feature needs (for example governor ID, name, power, kills, deaths). No real names, emails or contact details from game data.
5. **Retention limits.** Kingdom data is deleted after a fixed period or when the kingdom's page is deleted. *[Legal review: set the period.]*
6. **No public ranking of individuals** unless the kingdom chooses to publish it and members were told.

## 6. Your rights (LGPD and GDPR)

If you are in Brazil (LGPD) or the EU/EEA/UK (GDPR), you have the right to:

- **know** whether we hold data about you, and get a copy of it;
- **correct** inaccurate data;
- **delete** your data, or have it anonymised;
- **object to** or **restrict** processing, and **withdraw consent** at any time;
- **move** your data to another service (portability);
- **complain** to your data-protection authority: ANPD (Brazil) or your local supervisory authority (EU/EEA/UK).

In the MVP we hold no personal data on our servers, so you exercise most of these rights yourself by clearing your browser's site data. For anything else, contact us: *[Legal review: add the controller's name and a contact email or form; name the data-protection contact (encarregado/DPO) if one is required.]*

We will answer within the period the law sets (*[legal review: confirm 15 days LGPD / one month GDPR]*).

## 7. Children

The hub is not aimed at children. *[Legal review: set the minimum age and check it against the game's own age rating and the applicable law.]*

## 8. Changes to this page

We will date every change at the top of this page. A material change (for example, starting to store data on a server) will be announced on the hub **before** it takes effect.

## 9. Contact

*[To be completed before launch.]*
