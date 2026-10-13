# Raw notes — Rise of Kingdoms Fandom wiki (S02)

- Access method: MediaWiki API `api.php?action=parse&prop=wikitext` (HTML pages return 402/403 to WebFetch/curl). Quotes below are verbatim wikitext (templates simplified).
- Accessed: 2026-10-13. Last-revision timestamps from `action=query&prop=revisions`.
- Note: build times on wiki are "raw values ... provided by the game developers to the Wiki staff" (editor comment on Buildings/Farm).

## Buildings/Farm (rev 2026-09-19) — https://riseofkingdoms.fandom.com/wiki/Buildings/Farm
- "Each upgrade of the farm improves it's food production per hour and it's max food capacity."
- Table (Level ; Food/Hr ; Capacity ; CH req ; Cost (wood, stone) ; Time ; Power ; ROI days):
  1;400;4,000;CH1 · 5;580;5,800;CH5 · 10;1,100;11,000;CH10 · 15;2,700;27,000;CH15 · 17;3,700;37,000;CH17 · 20;5,800;58,000;CH20 · 22;7,800;78,000;CH22 · 24;10,400;104,000;CH24 · 25;20,800;208,000;CH25 + 1 Master's Blueprint.
  Full table in A03-0002. ROI days at lvl 16 = 18.9, lvl 20 = 65.1, lvl 24 = 203.4.

## Buildings/Lumber Mill/Requirements (rev 2019-02-20; parent page rev 2026-09-19)
- Identical numbers to Farm (Wood/Hr 400 → 20,800; capacity 4,000 → 208,000). Unlocks: "1stUnlockCH=2 | 2ndUnlockCH=5 | 3rdUnlockCH=8 | 4thUnlockCH=11".

## Buildings/Quarry/Requirements (rev 2026-01-04)
- Stone/hr: L1 300 (CH6) · L10 825 · L15 2025 · L17 2775 · L20 4350 · L22 5850 · L24 7800 · L25 15 600. Capacity = 10× hourly. ROI L24 = 500 days.

## Buildings/Goldmine/Requirements (rev 2019-02-20)
- Gold/Hr: L1 200 (CH10) · L10 550 · L15 1,350 · L17 1,850 · L20 2,900 · L22 3,900 · L24 5,200 · L25 10,400. ROI L20 = 691 days, L24 = 2012 days.
- Goldmine unlocks: "1stUnlockCH=10 |2ndUnlockCH=12 |3rdUnlockCH=14 |4thUnlockCH=16".

## Buildings/Storehouse (+ /Requirements rev 2022-09-14)
- "The Storehouse is a building which allows the governor to protect resources from plunder. Upgrading the storehouse will permanently increase the amount of resources that can be protected."
- Protection capacity (F/W/S/G): L1 300K/300K/225K/150K · L5 410K/410K/307.5K/205K · L10 650K/650K/487.5K/325K · L15 900K/900K/675K/450K · L17 1.1M/1.1M/825K/550K · L20 1.4M/1.4M/1.05M/700K · L22 1.6M/1.6M/1.2M/800K · L24 2.0M/2.0M/1.5M/1.0M · L25 2.5M each.
- Typo on wiki row 11 wood "7600.0K" (should likely be 700K; recorded as-is).

## Buildings/Trading Post (+ /Requirements rev 2026-08-11)
- "allows you to donate certain resources with your alliance members ... Trading is not an instant transaction; the trader will occupy a troop dispatch queue (shared with commanders), walk to the target city, and then walk back."
- "Each transaction is taxed at the tax rate, which also decreases with each upgrade of the trading post."
- 1stUnlockCH=12 (conflicts with riseofkingdomsguides CH table: CH10 unlocks Trading Post).
- Capacity/tax: L1 10,000/35% · L5 160,000/31% · L10 600,000/26% · L15 1,600,000/21% · L20 2,600,000/16% · L21 2,800,000/15% · L22 3,000,000/14% · L23 3,500,000/12% · L24 4,000,000/10% · L25 10,000,000/8%.
- L10+ require Goldmine of same level. L25 time "27 d 14 h 24 min" + Master's Blueprint.

## Resources (rev 2025-05-31)
- "When stored as an item, resources cannot be plundered by other governors and there is no limit to how many can be stored."
- "Resources in item form can be readily exchanged for raw resources, but raw resources can only be converted into items by purchasing resource items at the mysterious merchant."
- Stone: "unlocked upon building the first Quarry after upgrading to City Hall level 4 ... gathered from the map once the first level of the Quarrying technology has been researched".
- Stone: "becomes a requirement for the upgrade of most buildings around City Hall level 6 and is the primary resource required for upgrading the Wall."
- Gold: "unlocked upon building the first Goldmine after upgrading to City Hall level 10 ... gathered from the map once the first level of the Metallurgy technology has been researched".
- Gold: "required to research all technologies unlocked after Academy level 10, as well as the training/upgrade of all Tier 3 and higher troops, though it is not used in any building upgrades."
- Gems "cannot be plundered regardless of which form they are in."

## Territory (rev 2024-06-12)
- "Alliance members 25% faster gathering speed at normal resource points the alliance owns. Alliance members gathering at normal resource points grants the alliance extra resources into its storehouse."
- Alliance Resource Points: "members get 50% of these values which they can claim in the Alliance Territory page".
- "For every ten alliance flags built the maximum member capacity of the alliance grows by one."

## Items/Enhanced Gathering (rev 2018-12-08)
- "Increases gathering speed of all types of resources by 50% for 8 hours." Sources: Mysterious Merchant (varies), Mighty Army, Imperial Wealth, Hungry Turkey.
- "Increases gathering speed of all types of resources by 50% for 24 hours." Sources: Mysterious Merchant, Era Breakthrough, gems Shop.

## Items/Resource Pack (rev 2024-05-06)
- "Lv.2 Resource Pack ... Randomly grants you 10,000 Food, 10,000 Wood, 7,500 Stone or 5,000 Gold." (Barbarian Forts, Hungry Turkey)
- "Lv.3 Resource Pack ... Randomly grants you 100,000 Food, 100,000 Wood, 100,000 Stone or 100,000 Gold."

## Buildings/Courier Station (rev 2020-01-11)
- "The Mysterious Merchant always appears at the courier station at exactly 0:00 UTC."
- "offers 16 items for purchase: 4x resources, 4x speedups, 4x boosts, and 4x other items." Refresh: 1st free, then 100/200/300/400 gems.
- "offers some shop items priced in food or wood instead of gems at a lesser discount of 10% to 40%".

## Troops/Siege (rev 2023-06-08), Troops/Infantry (rev 2026-09-28)
- Load per unit: Battering Ram (T1) 20 · Arcuballista (T2) 22 · Mangonel (T3) 24 · Ballista (T4) 26 · Trebuchet (T5) 30.
- Infantry: Warrior (T1) 7 · Swordsman (T2) 11 · Spearman (T3) 12 · T4 13 · T5 15.

## Technology/Jewelry (rev 2024-03-11)
- "Allows your troops to gather gems on the map." Req: Multilayer Structure L4, Academy L16. Cost 1.00M food / 1.00M wood / 750.0K stone / 500.0K gold, 3h.

## Gaps
- No wiki page found listing resource-node (Cropland/Logging Camp/Stone/Gold Deposit) amounts per level, or base gathering speed per level.
