# Raw notes — Rise of Kingdoms Wiki (Fandom)

- Source ID: S02 (fontes.md) — proposed tier T2 (community wiki with edit history)
- Base URL: https://riseofkingdoms.fandom.com/wiki/
- Access method: HTML pages return HTTP 402 (WebFetch) / 403 (curl). Content was read through the public MediaWiki API: `https://riseofkingdoms.fandom.com/api.php?action=parse&page=<Page>&prop=wikitext&format=json`. Revision dates via `action=query&prop=revisions`.
- Accessed: 2026-10-13
- Building requirement tables are in `fandom-building-tables.md` (same folder).
- Quotes below are from wikitext (templates flattened). "rev" = last revision timestamp of the page.

## Buildings/City Hall/Requirements (rev 2026-01-04)
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/City_Hall/Requirements
- C1. Full CH1→CH25 table (unlocks, requirements, troop capacity, cost, time, power). See appendix. Key rows quoted:
  - "5 | Lumber Mill (2nd) + Siege Workshop + 2nd march queue | 'Wall' Lv.4 + 'Hospital' Lv.4 | 7,000 | 21.3K/21.3K | 1h | 383"
  - "10 | Quarry (3rd) + 'Goldmine' (1st) 'Lyceum of Wisdom' + 'Trading Post' | 'Wall' Lv.9 + 'Academy' Lv.9 | 23,000 | 184.3K/184.3K/78.7K | 22h | 10,933"
  - "16 | 'Goldmine' (4th) 'Blacksmith' + Tier 3 troops | 'Wall' Lv.15 + 'Academy' Lv.15 | 57,000 | 2.1M/2.1M/912.5K | 4d | 91,451"
  - "17 | 4th march queue | 'Wall' Lv.16 + 'Hospital' Lv.16 | 64,000 | 3.2M/3.2M/1.4M | 4d 20h | 125,005"
  - "21 | Tier 4 troops | 'Wall' Lv.20 + 'Academy' Lv.20 | 100,000 | 16.2M/16.2M/7.0M | 11d | 442,735"
  - "22 | 5th march queue | 'Wall' Lv.21 + 'Hospital' Lv.21 | 110,000 | 24.3M/24.3M/10.6M | 17d 3h | 630,860"
  - "25 | Tier 5 troops | 'Wall' Lv.24 + 'Trading Post' Lv.24 | 150,000 | 82.2M/82.2M/36.0M + 1x Master's Blueprint | 126d 8h | 2,195,458"
  - Power for CH24 is malformed in the wiki: "1,322,48" (also copied verbatim by riseofkingdomsguides.com → evidence that S04 copies S02).
- C2. Wiki editor comment: "The build times listed below are raw values! They were provided by the game developers to the Wiki staff. [...] every city has different build speed bonuses [...] which reduce their build time."

## Buildings/City Hall/Rewards (rev 2023-03-24)
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/City_Hall/Rewards
- C3. Per-level upgrade rewards. Quotes: "9 | 50.0K/50.0K/50.0K | Universal Speedup (24h) x1"; "10 | 50.0K/50.0K/50.0K/10.0K | Civilization Change"; "16 | -/-/100.0K/20.0K | Universal Speedup (7d) x1 + Gem (100) x1"; "25 | -/-/200.0K/50.0K | Master's Blueprint x1 + Gem x500".
- C4. Row 21/22 malformed in wiki: "21 | ?/?/?/? | Universal Speedup (7d) x1 + Training Speedup (10m) x22" (row 22 missing).

## Other building requirement pages (see appendix)
- C5. Wall: "5 | City Hall Lv.6 + 'Watchtower' Lv.5 | 'Tavern' Lv.5 | ... | 30m" — Wall Lv.N (N≥5) requires Tavern Lv.N.
- C6. Tavern: "6 | 'Wall' Lv.6 | Quarry Lv.6 | 2d19h | 4 | 2.7K/2.7K/7.0K | 36m 40s" — Tavern Lv.N (N≥6) requires Quarry Lv.N; columns include free golden chest interval and daily free silver chests ("1 | ... | 3d | 3", "25 | ... | 2d | 10").
- C7. Hospital: requirements mostly "City Hall Lv.N", but "10 | ... | Stable Lv.10", "16 | Barracks Lv. 16", "21 | Archery Range Lv. 21", "25 | Castle 25". Hospital capacity column starts "1 | 7,500".
- C8. Academy: "1 | City Hall Lv.6 | 0.5%" ... "25 | 'Watchtower' Lv.25 + City Hall Lv.25 + 'Trading Post' Lv.25 | 25.0%" (Lv.25 time missing).
- C9. Trading Post: "1 | City Hall Lv.12" ... "10 | Goldmine Lv.10" ... "25 | Goldmine Lv.25 | ... | 27 d 14 h 24 min".
- C10. Barracks Lv.N (N≥5) requires Farm Lv.N; Archery Range Lv.N (N≥5) requires Lumber Mill Lv.N; Stable Lv.N (N≥5) requires Quarry Lv.N; Siege Workshop Lv.N (N≥2) requires Barracks+Archery Range+Stable Lv.N; Storehouse/Scout Camp/Alliance Center/Farm/Lumber Mill/Quarry/Goldmine require City Hall Lv.N; Castle Lv.N requires Alliance Center Lv.N (+Book of Covenant costs); Watchtower Lv.N requires Wall Lv.N.
- C11. Quarry: "1 | 300 | 3000 | City Hall Lv.6" (requires CH6 in this table, while CH table says 1st Quarry unlocks at CH4 — internal inconsistency or patch change).
- C12. Alliance Center: "1 | City Hall Lv.3 | 15,000 | 5" ... times helped column 5 → 30 ("25 | ... | 30").

## VIP (rev 2026-08-02)
URL: https://riseofkingdoms.fandom.com/wiki/VIP
- C13. "Every day a Governor logs in, they will receive a free amount of VIP Points, starting at 40 and increasing by 20 up to a maximum of 200 per day. If a Governor does not claim the daily points chest one day, their streak will be broken and their chest will go back to giving 40 VIP Points."
- C14. "The VIP Shop is unlocked after building the Shop at City Hall level 5 and allows you to purchase some items at a reduced gem cost, depending on your VIP level."
- C15. "When leveling VIP, if you happen to skip a level, for example using 1,000 gems or 1,000 VIP Points token while being VIP 0 (which would take you to VIP 3), then you will not lose the daily chest of skipped levels." (NB: 1,000 points from VIP 0 reaching VIP 3 is inconsistent with a cumulative threshold of 1,200 for VIP 3 — ambiguity.)
- C16. "Note that at VIP Level 6, Governors permanently unlock the second building queue, rendering Builder's Contracts useless. After VIP Level 6 is reached, all used Builder's Contracts will turn into 60min Building Speedups."
- C17. "many players recommend unlocking VIP level 6 by investing with gems earned through the normal course play, such through main quests and city hall upgrade rewards."
- C18. VIP buffs table (VIP 0–18). Quotes: "0 | 1.03x | 1.03x" (food/wood prod.); "6 | 1.15x | 1.15x | 1.15x | 1.15x | 1.1x | 1.1x | 1.1x | 1.05x | 1.05x | 1.05x | +1" (prod ×4, gathering, AP recovery, building, research, training, hospital capacity, Sunset Canyon free attempts); "15 | 1.5x ... | +100" (AP limit +100 from VIP 15); "17 | ... | +350 | 0.9x | 1.05x".
- C19. VIP points needed + daily free chest + special privileges (paid) table. Quotes: "Level 1 | 200"; "Level 2 | 400"; "Level 3 | 1,200"; "Level 4 | 3,500"; "Level 5 | 6,000"; "Level 6 | 11,500"; "Level 7 | 17,500"; "Level 8 | 35,000"; "Level 9 | 75,000"; "Level 10 | 150,000 | ... Legendary Commander Sculpture x1"; "Level 11 | 250,000"; "Level 12 | 350,000 | ... Legendary Commander Sculpture x2"; "Level 13 | 500,000"; "Level 14 | 750,000 | ... Legendary Commander Sculpture x3"; "Level 15 | 1,000,000"; "Level 16 | 1,500,000"; "Level 17 | 2,500,000"; "Level 18 | 4,000,000". Special privilege chests priced "$0.99" (VIP0–3), "$4.99" (VIP4–5), "$9.99" (VIP6) etc.

## Builder queue / Builder's Hut / Items/Builder Recruitment
URLs: https://riseofkingdoms.fandom.com/wiki/Builder_queue ; .../Items/Builder_Recruitment
- C20. "The builder queue is the number of buildings that can be built at the same time. It is by default 1, and maximum 2. This maximum can be achieved using a Builder Recruitment temporarily for 2 days or permanently by reaching VIP 6."
- C21. "You will get approximately 3 Builder Recruitments before getting to City Hall 10 (Haven't recorded where the source is)."

## Quests/Daily Objectives (rev 2020-01-11 — old)
URL: https://riseofkingdoms.fandom.com/wiki/Quests/Daily_Objectives
- C22. "Daily objectives progress resets each day at 00:00 UTC."
- C23. "Generally, they are worth doing at least until 100 activity points have been reached to unlock the final chest."
- C24. Task table (task | requirement | activity points): "A Small Problem | Defeat 1 Barbarian troop on the map | 2"; "Hazard Cleanup | Defeat 5 Barbarian troops | 8"; "The Gatherer | Gather 25,000 Food | 5"; "The Lumberjack | Gather 25,000 Wood | 5"; "Rock Star | Gather 18,000 Stone | 5"; "Gold Digger | Gather 12,000 Gold | 5"; "Sustainable Development | Collect 30,000 Resources in the city | 3"; "The Great Physician | Heal and collect 50 units | 2"; "Help Each Other | Help your allies 20 times | 10"; "Skillful Craftsman | Upgrade buildings in the city 1 times | 10"; "Age Of Science | Upgrade technologies in the Academy 1 times | 5"; "Strange Fate | Open 7 Silver Chest in the Tavern | 5"; "Do More With Less | Use 5 Resource Items | 5"; "Food/Wood/Stone/Gold Growth | Use a ... Boost Item | 5" each; "Gathering Enhancement | Use 1 Enhanced Gathering item | 5"; "Sword/Bow/Horse of the King | Recruit 200 Infantry/Archer/Cavalry units | 5" each; "Power of Knowledge | Use 5 Tome of Knowledge | 5"; "Friendly Commerce | Purchase 10 item(s) in the Courier Station | 10".
- C25. Chests: "20 | 30,000/30,000/22,500/3,000 | Training Speedup (5m) x5"; "40 | 60,000/60,000/45,000/6,000 | Building Speedup (5m) x5"; "60 | Silver Key x1 + Research Speedup (5m) x8 + Basic Action Point Recovery (100 AP) x1 + Lv.1 Tome of Knowledge (100 EXP) x40 + Brand-new Starlight Sculpture x2"; "80 | 120,000/120,000/90,000/12,000 | Universal Speedup (5m) x16"; "100 | {{BuildingResources|||||100}} Golden Key x1 + Magic Box x1 + Epic Commander Sculpture x3" (5th resource slot = gems → 100 gems).

## Items/Gem (rev 2025-01-29)
URL: https://riseofkingdoms.fandom.com/wiki/Items/Gem
- C26. "10 Gem [...] * Barbarians Lv.1-25 * Barbarian Forts Lv.1-4 (x2) * Bone Necklace (x1) * Lohar's Trial event (varies)"
- C27. "100 Gem [...] * Era Breakthrough event (x1-8) * Lord of War event (x3-30) * Clarion Call event (x1-10) * Strategic Reserve event (x1-15) * Cornucopia event (x1-15) * Barbarians Lv.41-55 * Barbarian Fort Lv.11-15"
- C28. "650 Gem [...] Tiles & Bricks event (x1) * Overwhelming Strength event (x2)"; "2,000 Gem [...] Ark of Osiris".

## Items/VIP Points (rev 2024-04-10)
- C29. "VIP points can also be acquired through the opening of daily VIP chests at a rate of 200 VIP points per day or alliance chests purchased by alliance members."
- C30. Sources: "10 VIP Points: Alliance Wooden Chest; Shop (gems)"; "50 VIP Points: Mysterious Caves; Alliance Wooden Chest"; "100 VIP Points: Mysterious Caves; Shop (gems)"; "500 VIP Points: vip plus button; Shop (gems)"; "1,000 VIP Points: Alliance Gold Chest".

## Items/Action Point Recovery (rev 2024-11-03)
- C31. "If you run out of Action Point Recovery items, you'll have the option to buy 'Intermediate Action Point Recovery'. The cost starts at 100 gems and increases by 50 gems with each additional purchase. This price resets to 100 gems at the daily server reset."
- C32. "Emergency Action Point Recovery: Restore 50 Action Points. * Alliance Gift (x1)"; "Basic [...] Restore 100 Action Points. * Daily objectives (x1)"; "Intermediate [...] 500"; "Advanced [...] 1,000".

## Barbarians (rev 2024-11-07)
URL: https://riseofkingdoms.fandom.com/wiki/Barbarians
- C33. "Attacking barbarians will cost 50 action points. This amount is reduced by 2 action points each time barbarians are attacked without the commander returning to the city (these may be reduced even further, by up to 10 action points, if the leading commander has the 'Insight' talent)."
- C34. "Killing barbarians will reward a set amount of commander experience [...] as well as 3 or 4 items. [...] The fourth item, when given, may include a set amount of Arrow of Resistance, 10 Gems, Obsolete Starlight Sculpture x1 or Ordinary Starlight Sculpture x1."
- C35. "When the kingdom is first opened, only barbarians level 1-6 will spawn on the map and higher level barbarians will be unlocked, kingdom-wide, incrementally over the subsequent days. When searching for barbarians using the map UI, barbarians level 12 and below will instantly spawn beside your city [...] Barbarians level 13 and above only spawn at specific intervals in random locations"
- C36. "Subsequent levels will be unlocked by winning a battle against the previous level barbarians."
- C37. Table "Level | Recommended troops | Commander EXP | Line-up | Advertised Rewards": "Lv.1 | 900 Tier 1 units | 106 | ... | 1,000 Food x2 + 1,000 Wood x2 + 10 Gems x1 + ..."; "Lv.10 | 12,000 Tier 2 units | 1,060 | ... 10 Gems x1 ..."; "Lv.15 | 40,000 Tier 2 units | 1,500 | ... 10 Gems x3"; "Lv.20 | 87,000 Tier 3 units | 2,000 | ... 10 Gems x2"; "Lv.25 | 120,000 Tier 4 units | 2,500 | ... 10 Gems x3"; "Lv.31 ... 10 Gems x4"; "Lv.36 ... 10 Gems x5". (Advertised = possible drops, not guaranteed.)

## Fort / Barbarians/Fort/Rules (rev 2024-11-25)
URL: https://riseofkingdoms.fandom.com/wiki/Fort
- C38. "Barbarian Forts are the primary source of Book of Covenant. [...] Barbarian Forts can only be attacked through a rally."
- C39. "Destroying Barbarian Forts is also important for alliances because it also grants trophies to all alliance members giving a resource, key, and gift points."
- C40. "There is an approximate '50% chance' to get Books of Covenant at each reward tier. In addition, Silver Key, Gold Key, Gems, and Brand-new Starlight Sculptures may be rewarded at a lower chance."
- C41. "Level | Recommended Troops | Gift Box Keys | Gift Box Level Points": "1 | 120,000 Tier 1 | 20 | 1"; "2 | 300,000 Tier 2 | 30 | 2"; "3 | 480,000 Tier 3 | 40 | 3"; "4 | 780,000 Tier 4 | 50 | 4"; "5 | 1,200,000 Tier 4 | 60 | 5".
- C42. Rules: "The target must be destroyed in a single attempt, or nearby reinforcements will immediately replenish any losses"; "You will only suffer minor losses from attacking."

## Civilizations (rev 2025-12-04)
URL: https://riseofkingdoms.fandom.com/wiki/Civilizations
- C43. "they must choose one of fifthteen (15) civilizations [...] If the player wishes to change their civilization, they may purchase a Civilization Change for 10,000 gems from the Shop, or from the Alliance Shop for 2M individual alliance credits. The civilization change will not affect their starting commander"
- C44. Perks table (quoted per civ): Egypt "Increase archer attack by 5%; increase damage dealt by rallied armies by 5%; increase building and research speed by 1.5%"; Greece "infantry health 5%; rallied damage 5%; stone gathering 10%"; Maya "archer defense 5%; Gold gathering 10%; normal damage 3%"; Rome "infantry defense 5%; march speed 5%; food gathering 10%"; Germany "cavalry attack 5%; troop training speed 5%; action point recovery 10%"; Britain "archer attack 5%; troop training speed 5%; ally garrison capacity 20%"; France "troop health 3%; wood gathering 10%; Hospital healing speed 20%"; Vikings "infantry attack 5%; counterattack damage 3%; troop load 10%"; China "troop defense 3%; action point recovery 5%; building speed 5%"; Japan "troop attack 3%; scout march speed 30%; resource gathering speed 5%"; Korea "archer defense 5%; Hospital capacity 15%; research speed 3%"; Spain "cavalry defense 5%; EXP from barbarians/neutral units 10%; resource production 20%"; Arabia "cavalry attack 5%; damage to barbarians/neutral 10%; rallied damage 5%"; Ottoman "archer health 5%; march speed 5%; active skill damage 5%"; Byzantium "cavalry health 5%; stone gathering 10%; Hospital capacity 15%". Starting commanders: Egypt Imhotep, Greece Pericles, Maya Wak Chanil Ajaw, Rome Scipio Africanus, Germany Hermann, Britain Boudica, France Joan of Arc, Vikings Björn Ironside, China Sun Tzu, Japan Kusunoki Masashige, Korea Eulji Mundeok, Spain Pelagius, Arabia Baibars, Ottoman Osman I, Byzantium Belisarius.

## Items/Civilization Change
- C45. "Mysterious Merchant - gems (varies) * Shop - gems 10K * Alliance Shop - Individual Credits 2.0M (Note: The restock fee is Alliance Credits 650K)"; "The original civilization's commander will remain unchanged, but the quest-reward focus for additional Commander Sculpture will change to the new civilization's starting commander."

## Buildings/Tavern/Silver Chests (rev 2020-12-02)
- C46. Drop rates: "Elite Commander (or 10 sculptures if obtained previously) | 0.707%"; "Advanced Commander | 2.122%"; "Epic Commander Sculpture | 1.009%"; "Speedup | 12.614%"; "Tome of Knowledge | 23.125%"; "Resource Item | 21.023%".

## Expedition (rev 2024-03-11)
- C47. "If three stars are received in a mission, completing all mission targets, some of the rewards for that mission will be available for collection daily by opening a chest on the mission panel."
- C48. "Each day, the Medal Shop will also include 6 random items, which can be refreshed up to 5 times a day, with a cost of 100 gems each refresh except the first which is free."

## Peerless Scholar (rev 2023-04-15)
- C49. "The Preliminaries are held every weekday from 0:00 to 23:00 UTC [...] This stage consists of 10 questions with no time limit. [...] Answer 6 questions correctly to qualify for the Midterm of the week"
- C50. "The Midterms are held every Saturday at 2:30 and 12:30 UTC." "The Final Exam is held on the last Saturday of the month at 14:30 UTC." "Winning the final set will give you gems shared by the winners." (pool size not stated)

## Alliance Gift (rev 2025-06-07)
- C51. "Purchase bundles or defeat special targets to send all members alliance gifts." Treasure of Crystal key-point thresholds: "White Cystal | 2,000,000"; "Blue Crystal | 3,000,000".

## Frequently Asked Questions
- C52. "Q.) What should I spend my gems on? A.) Spend them on VIP points until you get to VIP level 10. [...] At VIP level 6 you gain permanent access to the second builder queue. At VIP level 10, you get one Legendary Commander sculpture each day which is the hardest resource to get in the game."

## Gaps from this source
- No page found for base Action Point regeneration rate (per hour).
- Daily Objectives page last edited 2020 — task list may be outdated.
- No page with gem amount per gem deposit level.
