# Raw extract — Fandom wiki building requirement tables

- Source: Rise of Kingdoms Wiki (Fandom), pages `Buildings/<Name>/Requirements`, read via MediaWiki API (`api.php?action=parse&prop=wikitext`) because the HTML page returns HTTP 402/403 to bots.
- Accessed: 2026-10-13
- Extraction: wikitext tables converted mechanically to pipe rows by a script (templates flattened: `F/W/S/G=` = Food/Wood/Stone/Gold cost; '-' = none). Values NOT edited by hand. A few cells were malformed in the wiki itself (e.g. '0', '?', empty) and are reproduced as-is.
- Editor note found in the wikitext (Hospital/Requirements and others): "The build times listed below are raw values! They were provided by the game developers to the Wiki staff. [...] However, the times for Lv.25 were missing from the data set."
- Last revision timestamps checked: City Hall/Requirements 2026-01-04; Wall 2023-12-02; Hospital 2022-09-14; Academy 2026-01-04; Quarry 2026-01-04; Stable 2026-01-04; Tavern 2026-01-05; Trading Post 2026-08-11; Goldmine 2019-02-20.

## City Hall
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/City_Hall/Requirements

```
Level | Unlocks | Requirements | Troop + Capacity | Cost | Time | Power
Stone Age
1 | None | None | 2,000 | None | None | 7
2 | Lumber Mill (1st) + Archery Range + 'Scout Camp' + | None | 3,000 | F/W/S/G=3.5K/3.5K/-/- | 2s | 21
3 | Farm (2nd) + Alliance Center | 'Wall' Lv.2 | 4,000 | F/W/S/G=6.5K/6.5K/-/- | 5m | 59
Bronze Age
4 | 'Academy' + Stable + 'Hospital' (2nd) | 'Wall' Lv.3 | 5,000 | F/W/S/G=11.8K/11.8K/-/- | 20m | 154
5 | Lumber Mill (2nd) + Siege Workshop + 2nd march queue | 'Wall' Lv.4 + 'Hospital' Lv.4 | 7,000 | F/W/S/G=21.3K/21.3K/-/- | 1h | 383
6 | Farm (3rd) + 'Courier Station' | 'Wall' Lv.5 + 'Scout Camp' Lv.5 | 9,000 | F/W/S/G=36.3K/36.3K/12.0K/- | 2h | 852
7 | Quarry (2nd) + 'Castle' | 'Wall' Lv.6 + Storehouse Lv.6 | 12,000 | F/W/S/G=54.4K/54.4K/19.2K/- | 5h | 1,847
8 | Lumber Mill (3rd) + 'Monument' + Tier 2 troops | 'Wall' Lv.7 + Barracks Lv.7 | 15,000 | F/W/S/G=81.8K/81.8K/30.8K/- | 10h | 3,706
9 | 'Hospital' (3rd) + Farm (4th) | 'Wall' Lv.8 + Alliance Center Lv.8 | 19,000 | F/W/S/G=122.8K/122.8K/49.2K/- | 15h | 6,504
Iron Age
10 |  Quarry (3rd) + 'Goldmine' (1st)  'Lyceum of Wisdom' + 'Trading Post' | 'Wall' Lv.9 + 'Academy' Lv.9 | 23,000 | F/W/S/G=184.3K/184.3K/78.7K/- |  22h | 10,933
11 | Lumber Mill (4th) + 3rd march queue | 'Wall' Lv.10 + 'Hospital' Lv.10 | 28,000 | F/W/S/G=277.5K/277.5K/120.0K/- | 1d 6h | 16,723
12 | 'Goldmine' (2nd) | 'Wall' Lv.11 + Storehouse Lv.11 | 33,000 | F/W/S/G=417.5K/417.5K/180.0K/- | 1d 16h | 24,693
13 | Quarry (4th) | 'Wall' Lv.12 + Archery Range Lv.12 | 38,000 | F/W/S/G=627.5K/627.5K/270.0K/- | 2d 2h | 35,213
14 | 'Goldmine' (3rd) | 'Wall' Lv.13 + Alliance Center Lv.13 + 'Trading Post' Lv.13 | 44,000 | F/W/S/G=942.5K/942.5K/405.0K/- | 2d 12h | 48,838
15 | 'Hospital' (4th) | 'Wall' Lv.14 + 'Scout Camp' Lv.14 | 50,000 | F/W/S/G=1.4M/1.4M/607.5K/- | 2d 22h | 66,400
Dark Age
16 | 'Goldmine' (4th) 'Blacksmith' + Tier 3 troops | 'Wall' Lv.15 + 'Academy' Lv.15 | 57,000 | F/W/S/G=2.1M/2.1M/912.5K/- | 4d | 91,451
17 | 4th march queue | 'Wall' Lv.16 + 'Hospital' Lv.16 | 64,000 | F/W/S/G=3.2M/3.2M/1.4M/- | 4d 20h | 125,005
18 | None | 'Wall' Lv.17 + Storehouse Lv.17 | 72,000 | F/W/S/G=4.8M/4.8M/2.1M/- | 5d 20h | 170,590
19 | None | 'Wall' Lv.18 + Stable Lv.18 | 80,000 | F/W/S/G=7.2M/7.2M/3.1M/- | 7d | 232,957
20 | None | 'Wall' Lv.19 + Alliance Center Lv.19 | 90,000 | F/W/S/G=10.8M/10.8M/4.7M/- | 8d 6h | 318,769
Feudal Age
21 | Tier 4 troops | 'Wall' Lv.20 + 'Academy' Lv.20 | 100,000 | F/W/S/G=16.2M/16.2M/7.0M/- | 11d | 442,735
22 | 5th march queue | 'Wall' Lv.21 + 'Hospital' Lv.21 | 110,000 | F/W/S/G=24.3M/24.3M/10.6M/- | 17d 3h | 630,860
23 | ? | 'Wall' Lv.22 + Storehouse Lv.22 | 120,000 | F/W/S/G=36.5M/36.5M/15.9M/- | 23d 23h | 907,085
24 | ? | 'Wall' Lv.23 + Siege Workshop Lv.23 | 130,000 | F/W/S/G=54.8M/54.8M/24.0M/- | 36d | 1,322,48
25 | Tier 5 troops | 'Wall' Lv.24 + 'Trading Post' Lv.24 | 150,000 | F/W/S/G=82.2M/82.2M/36.0M/- 1x Master's Blueprint | 126d 8h | 2,195,458
```

## Wall
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Wall/Requirements

```
Level | Unlocks | Requirements | Max + Wall + Durability | Cost | Time | Power
1 | None | None | 15,000 | None | None | 5
2 | 'Watchtower' Lv.2 | None | 15,500 | F/W/S/G=2.3K/2.8K/-/- | 2s | 15
3 | City Hall Lv.4 + 'Watchtower' Lv.3 | City Hall Lv.3 | 16,000 | F/W/S/G=4.3K/5.0K/-/- | 1m 30s | 37
4 | City Hall Lv.5 + 'Watchtower' Lv.4 | City Hall Lv.4 | 16,500 | F/W/S/G=7.8K/9.0K/-/- | 10m | 94
5 | City Hall Lv.6 + 'Watchtower' Lv.5 | 'Tavern' Lv.5 | 17,000 | F/W/S/G=14.0K/16.3K/-/- | 30m | 226
6 | City Hall Lv.7 + 'Watchtower' Lv.6 | 'Tavern' Lv.6 | 17,500 | F/W/S/G=18.0K/21.0K/25.0K/- | 58m 20s | 519
7 | City Hall Lv.8 + 'Watchtower' Lv.7 | 'Tavern' Lv.7 | 18,250 | F/W/S/G=27.0K/32.0K/40.0K/- | 1h 57m | 1,037
8 | City Hall Lv.9 + 'Watchtower' Lv.8 | 'Tavern' Lv.8 | 19,000 | F/W/S/G=41.0K/47.0K/64.0K/- | 3h 53m | 1,965
9 | City Hall Lv.10 + 'Watchtower' Lv.9 | 'Tavern' Lv.9 | 19,750 | F/W/S/G=61.0K/71.0K/102.4K/- | 7h 47m | 3,656
10 | City Hall Lv.11 + 'Watchtower' Lv.10 | 'Tavern' Lv.10 | 20,500 | F/W/S/G=92.0K/106.0K/164.0K/- | 15h 33m | 6,784
11 | City Hall Lv.12 + 'Watchtower' Lv.11 | 'Tavern' Lv.11 | 21,250 | F/W/S/G=137.0K/160.0K/250.0K/- | 18h 40m | 10,816
12 | City Hall Lv.13 + 'Watchtower' Lv.12 | 'Tavern' Lv.12 | 22,000 | F/W/S/G=207.0K/240.0K/375.0K/- | 22h 24m | 16,060
13 | City Hall Lv.14 + 'Watchtower' Lv.13 | 'Tavern' Lv.13 | 22,750 | F/W/S/G=310.0K/360.0K/565.0K/- | 1d 3h | 22,965
14 | City Hall Lv.15 + 'Watchtower' Lv.14 | 'Tavern' Lv.14 | 23,500 | F/W/S/G=465.0K/540.0K/850.0K/- | 1d 8h | 32,169
15 | City Hall Lv.16 + 'Watchtower' Lv.15 | 'Tavern' Lv.15 | 24,250 | F/W/S/G=698.0K/810.0K/1.3M/- | 1d 22h | 44,583
16 | City Hall Lv.17 + 'Watchtower' Lv.16 | 'Tavern' Lv.16 | 25,000 | F/W/S/G=1.0M/1.2M/1.9M/- | 1d 22h | 61,540
17 | City Hall Lv.18 + 'Watchtower' Lv.17 | 'Tavern' Lv.17 | 26,000 | F/W/S/G=1.6M/1.8M/2.9M/- | 2d 8h | 84,977
18 | City Hall Lv.19 + 'Watchtower' Lv.18 | 'Tavern' Lv.18 | 27,000 | F/W/S/G=2.4M/2.7M/4.4M/- | 2d 19h | 117,860
19 | City Hall Lv.20 + 'Watchtower' Lv.19 | 'Tavern' Lv.19 | 28,000 | F/W/S/G=3.5M/4.1M/6.6M/- | 3d 8h | 164,369
20 | City Hall Lv.21 + 'Watchtower' Lv.20 | 'Tavern' Lv.20 | 29,000 | F/W/S/G=5.3M/6.2M/9.9M/- | 4d  | 230,776
21 | City Hall Lv.22 + 'Watchtower' Lv.21 | 'Tavern' Lv.21 | 30,000 | F/W/S/G=8.0M/9.3M/14.8M/- | 4d 20h | 326,321
22 | City Hall Lv.23 + 'Watchtower' Lv.22 | 'Tavern' Lv.22 | 31,000 | F/W/S/G=12.0M/13.9M/22.2M/- | 6d 6h | 466,309
23 | City Hall Lv.24 + 'Watchtower' Lv.23 | 'Tavern' Lv.23 | 32,000 | F/W/S/G=18.0M/20.9M/33.3M/- | 8d 18h | 674,163
24 | City Hall Lv.25 + 'Watchtower' Lv.24 | 'Tavern' Lv.24 | 33,000 | F/W/S/G=27.0M/31.3M/50.0M/- | 13d 3h | 986,224
25 | 'Watchtower' Lv.25 | 'Tavern' Lv.25 | 40,000 | F/W/S/G=40.5M/47.1M/75.0M1x size = 24 | 41d 4h | 1,545,374
```

## Tavern
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Tavern/Requirements

```
Level | Unlocks | Requirements | Free + Golden + Chest + (Interval) | Daily + Free + Silver + Chests | Cost | Time | Power
1 | None | None | 3d | 3 | F/W/S/G=200/200/-/- | 2s | 5
2 | None | City Hall Lv.2 | 2d23h | 3 | F/W/S/G=300/300/-/- | 15s | 10
3 | None | City Hall Lv.3 | 2d22h | 3 | F/W/S/G=500/500/-/- | 1m | 16
4 | None | City Hall Lv.4 | 2d21h | 3 | F/W/S/G=1.0K/1.0K/-/- | 3m | 27
5 | 'Wall' Lv.5 | City Hall Lv.5 | 2d20h | 4 | F/W/S/G=2.0K/2.0K/-/- | 10m | 59
6 | 'Wall' Lv.6 | Quarry Lv.6 | 2d19h | 4 | F/W/S/G=2.7K/2.7K/7.0K/- | 36m 40s | 178
7 | 'Wall' Lv.7 | Quarry Lv.7 | 2d18h | 4 | F/W/S/G=4.0K/4.0K/10.6K/- | 1h 13m | 401
8 | 'Wall' Lv.8 | Quarry Lv.8 | 2d17h | 5 | F/W/S/G=6.0K/6.0K/16.0K/- | 2h 27m | 825
9 | 'Wall' Lv.9 | Quarry Lv.9 | 2d16h | 5 | F/W/S/G=9.0K/9.0K/24.0K/- | 4h 53m | 1,637
10 | 'Wall' Lv.10 | Quarry Lv.10 | 2d15h | 5 | F/W/S/G=13.5K/13.5K/36.0K/- | 9h 47m | 3,207
11 | 'Wall' Lv.11 | Quarry Lv.11 | 2d14h | 6 | F/W/S/G=21.0K/21.0K/55.0K/- | 11h 44m | 5,145
12 | 'Wall' Lv.12 | Quarry Lv.12 | 2d13h | 6 | F/W/S/G=32.0K/32.0K/85.0K/- | 14h 5m | 7,555
13 | 'Wall' Lv.13 | Quarry Lv.13 | 2d12h | 6 | F/W/S/G=49.0K/49.0K/130.0K/- | 16h 54m | 10,574
14 | 'Wall' Lv.14 | Quarry Lv.14 | 2d11h | 7 | F/W/S/G=74.0K/74.0K/195.0K/- | 20h 17m | 14,374
15 | 'Wall' Lv.15 | Quarry Lv.15 | 2d10h | 7 | F/W/S/G=111.0K/111.0K/295.0K/- | 1d | 19,206
16 | 'Wall' Lv.16 | Quarry Lv.16 | 2d9h | 7 | F/W/S/G=167.0K/167.0K/445.0K/- | 1d 5h | 25,413
17 | 'Wall' Lv.17 | Quarry Lv.17 | 2d8h | 8 | F/W/S/G=252.0K/252.0K/670.0K/- | 1d 11h | 33,476
18 | 'Wall' Lv.18 | Quarry Lv.18 | 2d7h | 8 | F/W/S/G=394.0K/394.0K/1.1M/- | 1d 18h | 44,256
19 | 'Wall' Lv.19 | Quarry Lv.19 | 2d6h | 8 | F/W/S/G=600.0K/600.0K/1.6M/- | 2d 2h | 58,720
20 | 'Wall' Lv.20 | Quarry Lv.20 | 2d5h | 8 | F/W/S/G=900.0K/900.0K/2.4M/- | 2d 13h | 78,237
21 | 'Wall' Lv.21 | Quarry Lv.21 | 2d4h | 9 | F/W/S/G=1.4M/1.4M/3.6M/- | 3d | 104,898
22 | 'Wall' Lv.22 | Quarry Lv.22 | 2d3h | 9 | F/W/S/G=2.0M/2.0M/5.4M/- | 3d 22h | 142,797
23 | 'Wall' Lv.23 | Quarry Lv.23 | 2d2h | 9 | F/W/S/G=3.0M/3.0M/8.1M/- | 5d 12h | 198,288
24 | 'Wall' Lv.24 | Quarry Lv.24 | 2d1h | 9 | F/W/S/G=4.7M/4.7M/12.5M/- | 8d 6h | 283,099
25 | 'Wall' Lv.25 | Quarry Lv.25 | 2d | 10 | F/W/S/G=7.1M/7.1M/19.0M1x size = 24 | 28d 9h | 468,557
```

## Quarry
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Quarry/Requirements

```
Level | Stone/hr | Capacity | Requirements | Cost | Time | Power | ROI days
1 | 300 | 3000 | City Hall Lv.6 | F/W/S/G=100/100/-/- | 10s | 5 | 0.03
2 | 320 | 3200 | City Hall Lv.6 | F/W/S/G=300/300/-/- | 1m | 10 | 1.3
3 | 350 | 3500 | City Hall Lv.6 | F/W/S/G=500/500/-/- | 2m | 16 | 1.4
4 | 390 | 3900 | City Hall Lv.6 | F/W/S/G=1.0K/1.0K/-/- | 5m | 32 | 2.1
5 | 435 | 4350 | City Hall Lv.6 | F/W/S/G=2.0K/2.0K/-/- | 20m | 88 | 3.7
6 | 490 | 4900 | City HallLv.6 | F/W/S/G=3.5K/3.5K/-/- | 40m | 198 | 5.3
7 | 550 | 5500 | City HallLv.7 | F/W/S/G=5.3K/5.3K/-/- | 1h 10m | 387 | 7.4
8 | 620 | 6200 | City HallLv.8 | F/W/S/G=8.0K/8.0K/-/- | 1h 27m | 627 | 9.5
9 | 710 | 7100 | City HallLv.9 | F/W/S/G=12.0K/12.0K/-/- | 1h 48m | 934 | 11.1
10 | 825 | 8250 | City HallLv.10 | F/W/S/G=18.0K/18.0K/-/- | 2h 24m | 1 351 | 13.0
11 | 975 | 9750 | City Hall Lv.11 | F/W/S/G=27.5K/27.5K/-/- | 3h 36m | 1 979 | 15.3
12 | 1160 | 11 600 | City Hall Lv.12 | F/W/S/G=42.5K/42.5K/-/- | 5h 24m | 2 926 | 19.1
13 | 1390 | 13 900 | City Hall Lv.13 | F/W/S/G=65.0K/65.0K/-/- | 6h 43m | 4 152 | 23.6
14 | 1650 | 16 500 | City Hall Lv.14 | F/W/S/G=97.5K/97.5K/-/- | 8h 6m | 5 708 | 31.3
15 | 2025 | 20 250 | City Hall Lv.15 | F/W/S/G=147.5K/147.5K/-/- | 9h 40m | 7 690 | 32.8
16 | 2400 | 24 000 | City Hall Lv.16 | F/W/S/G=222.5K/222.5K/-/- | 11h 40m | 10 260 | 49.4 | 
17 | 2775 | 27 750 | City Hall Lv.17 | F/W/S/G=335.0K/335.0K/-/- | 16h 40m | 14 000 | 74.4
18 | 3225 | 32 250 | City Hall Lv.18 | F/W/S/G=525.0K/525.0K/-/- | 21h 40m | 19 220 | 97.2
19 | 3750 | 37 500 | City Hall Lv.19 | F/W/S/G=800.0K/800.0K/-/- | 1d 3h | 26 260 | 127
20 | 4350 | 43 500 | City Hall Lv.20 | F/W/S/G=1.2M/1.2M/-/- | 1d 9h | 35 860 | 167
21 | 5025 | 50 250 | City Hall Lv.21 | F/W/S/G=1.8M/1.8M/-/- | 1d 19h | 49 300 | 222
22 | 5850 | 58 500 | City Hall Lv.22 | F/W/S/G=2.7M/2.7M/-/- | 2d 5h | 67 780 | 273
23 | 6750 | 67 500 | City Hall Lv.23 | F/W/S/G=4.1M/4.1M/-/- | 2d 22h | 94 060 | 380
24 | 7800 | 78 000 | City Hall Lv.24 | F/W/S/G=6.3M/6.3M/-/- | 3d 21h | 132 500 | 500
25 | 15 600 | 156 000 | City Hall Lv.25 | F/W/S/G=9.5M/9.5M1x size = 24 | 6d 6h | 192 100 | ?
```

## Goldmine
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Goldmine/Requirements

```
Level | Gold/Hr | Capacity | Requirements | Cost | Time | Power | ROI days
1 | 200 | 2,000 | City Hall Lv. 10 | F/W/S/G=500/500/-/- | 10s | 6 | 0.1
2 | 215 | 2,150 | City Hall Lv. 10 | F/W/S/G=1.0K/1.0K/-/- | 4m | 19 | 2.8
3 | 235 | 2,350 | City Hall Lv. 10 | F/W/S/G=2.0K/2.0K/-/- | 8m | 46 | 4.2
4 | 260 | 2,600 | City Hall Lv. 10 | F/W/S/G=3.8K/3.8K/2.5K/- | 13m 20s | 100 | 9.1
5 | 290 | 2,900 | City Hall Lv. 10 | F/W/S/G=6.8K/6.8K/5.0K/- | 32m | 219 | 14.1
6 | 325 | 3,250 | City Hall Lv. 10 | F/W/S/G=11.5K/11.5K/12.0K/- | 41m 40s | 401 | 23.2
7 | 365 | 3,650 | City Hall Lv. 10 | F/W/S/G=17.3K/17.3K/19.2K/- | 1h 12m | 699 | 31.4
8 | 415 | 4,150 | City Hall Lv. 10 | F/W/S/G=26.0K/26.0K/30.8K/- | 1h 40m | 1,335 | 38.8
9 | 475 | 4,750 | City Hall Lv. 10 | F/W/S/G=39.0K/39.0K/49.2K/- | 2h 13m | 1,758 | 50
10 | 550 | 5,500 | City Hall Lv. 10 | F/W/S/G=58.5K/58.5K/78.7K/- | 3h 3m | 2,668 | 61.6
11 | 650 | 6,500 | City Hall Lv. 11 | F/W/S/G=90.0K/90.0K/120.0K/- | 4h 8m | 3,984 | 70.8
12 | 775 | 7,750 | City Hall Lv. 12 | F/W/S/G=135.0K/135.0K/180.0K/- | 6h 13m | 5,958 | 85.0
13 | 925 | 9,250 | City Hall Lv. 13 | F/W/S/G=202.5K/202.5K/270.0K/- | 7h 38m | 8,678 | 106
14 | 1,100 | 11,000 | City Hall Lv. 14 | F/W/S/G=305.0K/305.0K/405.0K/- | 9h 19m | 12,454 | 137
15 | 1,350 | 13,500 | City Hall Lv. 15 | F/W/S/G=457.5K/457.5K/607.5K/- | 11h 7m | 17,707 | 144
16 | 1,600 | 16,000 | City Hall Lv. 16 | F/W/S/G=687.5K/687.5K/912.5K/- | 13h 25m | 25,126 | 216
17 | 1,850 | 18,500 | City Hall Lv. 17 | F/W/S/G=1.0M/1.0M/1.4M/- | 19h 10m | 36,126 | 322
18 | 2,150 | 21,500 | City Hall Lv. 18 | F/W/S/G=1.6M/1.6M/2.1M/- | 1d | 52,139 | 417
19 | 2,500 | 25,000 | City Hall Lv. 19 | F/W/S/G=2.3M/2.3M/3.1M/- | 1d 7h | 75,230 | 520
20 | 2,900 | 29,000 | City Hall Lv. 20 | F/W/S/G=3.5M/3.5M/4.7M/- | 1d 14h | 108,850 | 691
21 | 3,350 | 33,500 | City Hall Lv. 21 | F/W/S/G=5.3M/5.3M/7.1M/- | 2d 2h | 158,176 | 929
22 | 3,900 | 39,000 | City Hall Lv. 22 | F/W/S/G=7.9M/7.9M/10.6M/- | 2d 13h | 230,233 | 1134
23 | 4,500 | 45,000 | City Hall Lv. 23 | F/W/S/G=11.8M/11.8M/15.9M/- | 3d 9h | 336,750 | 1556
24 | 5,200 | 52,000 | City Hall Lv. 24 | F/W/S/G=17.8M/17.8M/24.0M/- | 4d 11h | 495,206 | 2012
25 | 10,400 | 104,000 | City Hall Lv. 25 | F/W/S/G=26.8M/26.8M/36.0M1x size = 24 | 7d 2h | 735,046 | ?
```

## Trading Post
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Trading_Post/Requirements

```
Level | Requirements | Transportation + Capacity | Tax Rate | Cost | Time | Power
1 | City Hall Lv.12 | 10,000 | 35% | F/W/S/G=400/700/-/- | 15s | 5
2 | - | 30,000 | 34% | F/W/S/G=800/1.3K/-/- | 1m 30s | 10
3 | - | 60,000 | 33% | F/W/S/G=1.5K/2.3K/-/- | 4m | 27
4 | - | 100,000 | 32% | F/W/S/G=2.8K/4.3K/-/- | 18m | 84
5 | - | 160,000 | 31% | F/W/S/G=5.0K/7.8K/-/- | 35m | 193
6 | - | 240,000 | 30% | F/W/S/G=8.5K/13.3K/5.0K/- | 53m 20s | 379
7 | - | 320,000 | 29% | F/W/S/G=12.8K/19.9K/7.5K/- | 1h 10m | 634
8 | - | 400,000 | 28% | F/W/S/G=19.3K/30.0K/11.3K/- | 2h 20m | 1,102
9 | - | 500,000 | 27% | F/W/S/G=29.0K/45.0K/17.0K/- | 4h 40m | 1,973
10 | Goldmine Lv.10 | 600,000 | 26% | F/W/S/G=43.5K/67.5K/25.5K/- | 9h 20m | 3,615
11 | Goldmine Lv.11 | 800,000 | 25% | F/W/S/G=67.5K/102.5K/40.0K/- | 11h 12m | 5,687
12 | Goldmine Lv.12 | 1,000,000 | 24% | F/W/S/G=102.5K/155.0K/60.0K/- | 13h 26m | 8,317
13 | Goldmine Lv.13 | 1,200,000 | 23% | F/W/S/G=155.0K/232.5K/90.0K/- | 16h 8m | 11,684
14 | Goldmine Lv.14 | 1,400,000 | 22% | F/W/S/G=232.5K/350.0K/135.0K/- | 19h 21m | 16,040
15 | Goldmine Lv.15 | 1,600,000 | 21% | F/W/S/G=350.0K/525.0K/202.5K/- | 23h 13m | 21,741
16 | Goldmine Lv.16 | 1,800,000 | 20% | F/W/S/G=525.0K/787.5K/305.0K/- | 1d 4h | 29,294
17 | Goldmine Lv.17 | 2,000,000 | 19% | F/W/S/G=787.5K/1.2M/457.5K/- | 1d 9h | 39,422
18 | Goldmine Lv.18 | 2,200,000 | 18% | F/W/S/G=1.2M/1.8M/700.0K/- | 1d 16h | 53,250
19 | Goldmine Lv.19 | 2,400,000 | 17% | F/W/S/G=1.8M/2.7M/1.1M/- | 2d | 72,284
20 | Goldmine Lv.20 | 2,600,000 | 16% | F/W/S/G=2.7M/4.0M/1.6M/- | 2d 10h | 98,780
21 | Goldmine Lv.21 | 2,800,000 | 15% | F/W/S/G=4.1M/6.1M/2.4M/- | 2d 21h | 136,090
22 | Goldmine Lv.22 | 3,000,000 | 14% | F/W/S/G=6.1M/9.1M/3.6M/- | 3d 18h | 190,096
23 | Goldmine Lv.23 | 3,500,000 | 12% | F/W/S/G=9.1M/13.6M/5.4M/- | 5d 6h | 269,894
24 | Goldmine Lv.24 | 4,000,000 | 10% | F/W/S/G=13.8M/20.5M/8.3M/- | 7d 21h | 390,404
25 | Goldmine Lv.25 | 10,000,000 | 8% | F/W/S/G=20.8M/30.8M/12.5M1x size = 24 | 27 d 14 h 24 min | 626,317
```

## Hospital
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Hospital/Requirements

```
Level | Hospital + Capacity | Requirements | Cost | Time | Power
1 | 7,500 | None | None | None | 5
2 | 8,250 | City Hall Lv.2 | F/W/S/G=2.0K/2.0K/-/- | 24s | 13
3 | 9,000 | City Hall Lv.3 | F/W/S/G=3.8K/3.8K/-/- | 1m 40s | 32
4 | 10,000 | City Hall Lv.4 | F/W/S/G=3.8K/3.8K/-/- | 2m 30s | 65
5 | 11,000 | City Hall Lv.5 | F/W/S/G=12.3K/12.3K/-/- | 20m | 162
6 | 12,250 | City Hall Lv.6 | F/W/S/G=21.0K/21.0K/8.2K/- | 40m | 366
7 | 13,500 | City Hall Lv.7 | F/W/S/G=31.5K/31.5K/13.0K/- | 1h 20m | 723
8 | 15,000 | City Hall Lv.8 | F/W/S/G=47.3K/47.3K/20.8K/- | 2h | 1,262
9 | 16,500 | City Hall Lv.9 | F/W/S/G=71.0K/71.0K/33.3K/- | 3h | 2,077
10 | 18,250 | Stable Lv.10 | F/W/S/G=106.5K/106.5K/53.3K/- | 4h 30m | 3,310
11 | 20,000 | City Hall Lv.11 | F/W/S/G=160.0K/160.0K/80.0K/- | 5h 24m | 4,967
12 | 22,000 | City Hall Lv.12 | F/W/S/G=240.0K/240.0K/120.0K/- | 6h 29m | 7,220
13 | 24,000 | City Hall Lv.13 | F/W/S/G=360.0K/360.0K/180.0K/- | 7h 47m | 10,319
14 | 26,500 | City Hall Lv.14 | F/W/S/G=540.0K/540.0K/270.0K/- | 9h 19m | 14,632
15 | 29,000 | City Hall Lv.15 | F/W/S/G=810.0K/810.0K/405.0K/- | 11h 12m | 20,699
16 | 32,000 | Barracks Lv. 16 | F/W/S/G=1.2M/1.2M/607.5K/- | 13h 26m | 29,316
17 | 35,000 | City Hall Lv.17 | F/W/S/G=1.8M/1.8M/912.5K/- | 16h 7m | 41,665
18 | 38,500 | City Hall Lv.18 | F/W/S/G=2.8M/2.8M/1.4M/- | 19h 21m | 59,576
19 | 42,000 | City Hall Lv.19 | F/W/S/G=4.1M/4.1M/2.1M/- | 23h 13m | 85,644
20 | 46,000 | City Hall Lv.20 | F/W/S/G=6.2M/6.2M/3.1M/- | 1d 4h | 123,830
21 | 50,000 | Archery Range Lv. 21 | F/W/S/G=9.3M/9.3M/4.7M/- | 1d 9h | 179,944
22 | 54,500 | City Hall Lv.22 | F/W/S/G=14.0M/14.0M/7.1M/- | 1d 19h | 263,152
23 | 59,500 | City Hall Lv.23 | F/W/S/G=20.9M/20.9M/10.6M/- | 2d 13h 00 sec | 387,338
24 | 65,000 | City Hall Lv.24 | F/W/S/G=31.5M/31.5M/16.0M/- | 3d 19h | 574,480
25 | 75,000 | Castle 25 | F/W/S/G=47.2M/47.2M/24.0M + Master's Blueprint | 0 | 881,480
```

## Academy
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Academy/Requirements

```
Lvl | Requirements | Research + Speed + Boost | Cost | Time | Power
1 | City Hall Lv.6 | 0.5% | F/W/S/G=500/800/-/- | 6s | 5
2 | City Hall Lv.6 | 1.0% | F/W/S/G=1.0K/1.5K/-/- | 40s | 11
3 | City Hall Lv.6 | 1.5% | F/W/S/G=2.0K/2.8K/-/- | 2m 40s | 27
4 | City Hall Lv.6 | 2.0% | F/W/S/G=3.8K/5.0K/800/- | 6m | 61
5 | City Hall Lv.6 | 2.5% | F/W/S/G=6.8K/9.0K/1.5K/- | 20m | 145
6 | City Hall Lv.6 | 3.0% | F/W/S/G=11.5K/15.5K/3.2K/- | 53m 20s | 336
7 | City Hall Lv.7 | 3.5% | F/W/S/G=17.3K/23.3K/5.0K/- | 1h 47m | 688
8 | City Hall Lv.8 | 4.0% | F/W/S/G=26.0K/35.0K/8.0K/- | 3h 33m | 1,346
9 | City Hall Lv.9 | 4.5% | F/W/S/G=39.0K/52.5K/12.8K/- | 7h 7m | 2,591
10 | City Hall Lv.10 | 5.0% | F/W/S/G=58.5K/78.8K/20.5K/- | 14h 13m | 4,975
11 | City Hall Lv.11 | 5.5% | F/W/S/G=90.0K/120.0K/32.5K/- | 17h 4m | 7,970
12 | City Hall Lv.12 | 6.0% | F/W/S/G=135.0K/180.0K/50.0K/- | 20h 29m | 11,679
13 | City Hall Lv.13 | 6.5% | F/W/S/G=202.5K/270.0K/75.0K/- | 1d 1h | 16,387
14 | City Hall Lv.14 | 7.0% | F/W/S/G=305.0K/405.0K/112.5K/- | 1d 5h | 22,391
15 | City Hall Lv.15 | 7.5% | F/W/S/G=457.5K/607.5K/170.0K/- | 1d 11h | 30,127
16 | City Hall Lv.16 | 8.0% | F/W/S/G=687.5K/912.5K/255.0K/- | 1d 18h | 40,207
17 | City Hall Lv.17 | 8.5% | F/W/S/G=1.0M/1.4M/382.5K/- | 2d 3h | 53,497
18 | City Hall Lv.18 | 9.0% | F/W/S/G=1.6M/2.1M/575.0K/- | 2d 13h | 71,227
19 | City Hall Lv.19 | 9.5% | F/W/S/G=2.3M/3.1M/875.0K/- | 3d 1h | 95,369
20 | City Hall Lv.20 | 10.0% | F/W/S/G=3.5M/4.7M/1.3M/- | 3d 16h | 128,424
21 | City Hall Lv.21 | 12.0% | F/W/S/G=5.250.000/7.050.000/2.000.000/- | 6d 5h | 174,240
22 | City Hall Lv.22 | 14.0% | F/W/S/G=7.9M/10.6M/3.0M/- | 5d 17h | 239,921
23 | City Hall Lv.23 | 16.0% | F/W/S/G=11.8M/15.9M/4.5M/- | 8d | 336,515
24 | City Hall Lv.24 | 18.0% | F/W/S/G=17.8M/24.0M/6.8M/- | 12d | 481,806
25 | 'Watchtower' Lv.25 + City Hall Lv.25 + 'Trading Post' Lv.25 | 25.0% | F/W/S/G=26.8M/36.0M/10.2M/-1x size = 24 | ? | 783,449
```

## Storehouse
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Storehouse/Requirements

```
Level | Requirements | Protection Capacity | Cost | Time | Power
1 | None | F/W/S/G=300.0K/300.0K/225.0K/150.0K | None | None | 5
2 | City Hall Lv.2 | F/W/S/G=320.0K/320.0K/225.0K/160.0K | F/W/S/G=500/500/-/- | 18s | 10
3 | City Hall Lv.3 | F/W/S/G=350.0K/350.0K/262.5K/175.0K | F/W/S/G=1.0K/1.0K/-/- | 1m 20s | 17
4 | City Hall Lv.4 | F/W/S/G=380.0K/380.0K/285.0K/190.0K | F/W/S/G=2.0K/2.0K/-/- | 6m 40s | 41
5 | City Hall Lv.5 | F/W/S/G=410.0K/410.0K/307.5K/205.0K | F/W/S/G=3.8K/3.8K/-/- | 15m | 92
6 | City Hall Lv.6 | F/W/S/G=450.0K/450.0K/337.5K/225.0K | F/W/S/G=6.5K/6.5K/3.8K/- | 30m | 201
7 | City Hall Lv.7 | F/W/S/G=500.0K/500.0K/375.0K/250.0K | F/W/S/G=9.8K/9.8K/6.0K/- | 1h | 402
8 | City Hall Lv.8 | F/W/S/G=550.0K/550.0K/412.5K/275.0K | F/W/S/G=14.8K/14.8K/9.6K/- | 2h | 778
9 | City Hall Lv.9 | F/W/S/G=600.0K/600.0K/450.0K/300.0K | F/W/S/G=22.3K/22.3K/15.4K/- | 4h | 1,489
10 | City Hall Lv.10 | F/W/S/G=650.0K/650.0K/487.5K/325.0K | F/W/S/G=33.5K/33.5K/24.6K/- | 8h | 2,848
11 | City Hall Lv.11 | F/W/S/G=700.0K/7600.0K/525.0K/350.0K | F/W/S/G=52.5K/52.5K/37.5K/- | 9h 36m | 4,552
12 | City Hall Lv. 12 | F/W/S/G=750.0K/750.0K/562.5K/375.0K | F/W/S/G=80.0K/80.0K/57.5K/- | 11h 31m | 6,703
13 | City Hall Lv. 13 | F/W/S/G=800.0K/800.0K/600.0K/400.0K | F/W/S/G=120.0K/120.0K/87.5K/- | 13h 49m | 9,436
14 | City Hall Lv. 14 | F/W/S/G=850.0K/850.0K/637.5K/425.0K | F/W/S/G=180.0K/180.0K/132.5K/- | 16h 35m | 12,942
15 | City Hall Lv. 15 | F/W/S/G=900.0K/900.0K/675.0K/450.0K | F/W/S/G=270.0K/270.0K/200.0K/- | 19h 54m | 17,488
16 | City Hall Lv. 16 | F/W/S/G=1.0M/1.0M/750.0K/500.0K | F/W/S/G=405.0K/405.0K/300.0K/- | 23h 53m | 23,447
17 | City Hall Lv. 17 | F/W/S/G=1.1M/1.1M/825.0K/550.0K | F/W/S/G=607.5K/607.5K/450.0K/- | 1d 5h | 31,354
18 | City Hall Lv. 18 | F/W/S/G=1.2M/1.2M/900.0K/600.0K | F/W/S/G=925.0K/925.0K/675.0K/- | 1d 10h | 42,032
19 | City Hall Lv. 19 | F/W/S/G=1.3M/1.3M/975.0K/650.0K | F/W/S/G=1.4M/1.4M/1.0M/- | 1d 17h | 56,560
20 | City Hall Lv. 20 | F/W/S/G=1.4M/1.4M/1.05M/700.0K | F/W/S/G=2.1M/2.1M/1.6M/- | 2d 1h | 76,832
21 | City Hall Lv. 21 | F/W/S/G=1.5M/1.5M/1.125M/750.0K | F/W/S/G=3.2M/3.2M/2.3M/- | 2d 11h | 104,966
22 | City Hall Lv. 22 | F/W/S/G=1.6M/1.6M/1.2M/800.0K | F/W/S/G=4.7M/4.7M/3.5M/- | 3d 5h | 145,492
23 | City Hall Lv. 23 | F/W/S/G=1.8M/1.8M/1.35M/900.0K | F/W/S/G=7.1M/7.1M/5.3M/- | 4d 12h | 205,219
24 | City Hall Lv. 24 | F/W/S/G=2.0M/2.0M/1.5M/1.0M | F/W/S/G=10.8M/10.8M/8.0M/- | 6d 18h | 295,585
25 | City Hall Lv. 25  Hospital 25 | F/W/S/G=2.5M/2.5M/2.5M/2.5M | F/W/S/G=16.2M/16.2M/12.0M/- |  | 478,367
```

## Scout Camp
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Scout_Camp/Requirements

```
Level | Requirements | Scout + March + Speed + Bonus | Exploration + Range | Number + of Scouts | Cost | Time | Power
1 | City Hall Lv.2 | 5% | 5x5 | 1 | F/W/S/G=300/300/-/- | 4s | 5
2 | City Hall Lv.2 | 10% | 5x5 | 1 | F/W/S/G=500/500/-/- | 15s | 10
3 | City Hall Lv.3 | 15% | '6x6' | 1 | F/W/S/G=1.0K/1.0K/-/- | 1m | 16
4 | City Hall Lv.4 | 20% | 6x6 | 1 | F/W/S/G=2.0K/2.0K/-/- | 3m 30s | 32
5 | City Hall Lv.5 | 25% | '7x7' | '2' | F/W/S/G=3.8K/3.8K/-/- | 14m 10s | 81
6 | City Hall Lv.6 | 30% | 7x7 | 2 | F/W/S/G=6.5K/6.5K/-/- | 35m | 191
7 | ? | 35% | '8x8' | 2 | F/W/S/G=9.8K/9.8K/-/- | 1h 10m | 398
8 | ? | 40% | 8x8 | 2 | F/W/S/G=14.8K/14.8K/-/- | 2h 10m | 769
9 | City Hall Lv.9 | 45% | '9x9' | 2 | F/W/S/G=22.3K/22.3K/-/- | 2h 53m | 1,274
10 | ? | 50% | 9x9 | 2 | F/W/S/G=31.3K/31.3K/-/- | 3h 58m | 1,971
11 | ? | 60% | '10x10' | '3' | F/W/S/G=42.5K/42.5K/-/- | 5h 23m | 2,916
12 | ? | 70% | 10x10 | 3 | F/W/S/G=52.5K/52.5K/-/- | 8h 3m | 4,286
13 | ? | 80% | '11x11' | 3 | F/W/S/G=60.0K/60.0K/-/- | 9h 56m | 5,956
14 | ? | 90% | '12x12' | 3 | F/W/S/G=67.5K/67.5K/-/- | 12h 6m | 7,969
15 | ? | 90% | '13x13' | 3 | F/W/S/G=75.0K/75.0K/-/- | 14h 27m | 10,350
16 | ? | 100% | 13x13 | 3 | F/W/S/G=82.5K/82.5K/-/- | 17h 26m | 13,191
17 | ? | 100% | '14x14' | 3 | F/W/S/G=92.5K/92.5K/-/- | 1d | 17,149
18 | ? | 110% | 14x14 | 3 | F/W/S/G=102.5K/102.5K/-/- | 1d 8h | 22,223
19 | ? | 110% | '15x15' | 3 | F/W/S/G=115.0K/115.0K/-/- | 1d 16h | 28,423
20 | ? | 115% | 15x15 | 3 | F/W/S/G=127.5K/127.5K/-/- | 2d 2h | 36,109
21 | ? | 115% | '16x16' | 3 | F/W/S/G=142.5K/142.5K/-/- | 2d 17h | 46,007
22 | ? | 120% | 16x16 | 3 | F/W/S/G=157.5K/157.5K/-/- | 3d 8h | 58,118
23 | ? | 120% | '17x17' | 3 | F/W/S/G=250.0K/250.0K/-/- | 4d 9h | 74,187
24 | ? | 120% | 18x18 | 3 | F/W/S/G=500.0K/500.0K/-/- | 5d 20h | 96,279
25 | ? | 125% | '20x20' | 3 | ? | ? | 139 023
```

## Barracks
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Barracks/Requirements

```
Level | Unlocks Building | Requirements | Training + Capacity | Troop + Attack + Bonus | Cost | Time | Power
1 | None | None | 20 | - | None | None | 5
2 | Siege Workshop Lv.2 | City Hall Lv.2 | 50 | - | F/W/S/G=500/800/-/- | 20s | 10
3 | Siege Workshop Lv.3 | City Hall Lv.3 | 100 | - | F/W/S/G=1.0K/1.5K/-/- | 60s | 20
4 | Siege Workshop Lv.4 | City Hall Lv.4 | 150 | - | F/W/S/G=2.0K/2.8K/-/- | 3m 20s | 37
5 | Siege Workshop Lv.5 | Farm Lv.5 | 200 | - | F/W/S/G=3.8K/5.0K/-/- | 16m 40s | 94
6 | Siege Workshop Lv.6 | Farm Lv.6 | 250 | - | F/W/S/G=6.5K/8.5K/3.4K/- | 45m 50s | 244
7 | Siege Workshop Lv.7 | Farm Lv.7 | 300 | - | F/W/S/G=9.8K/12.8K/5.4K/- | 1h 32m | 525
8 | Siege Workshop Lv.8 | Farm Lv.8 | 350 | - | F/W/S/G=14.8K/19.3K/8.7K/- | 3h 3m | 1,059
9 | Siege Workshop Lv.9 | Farm Lv.9 | 400 | - | F/W/S/G=22.3K/29.0K/13.9K/- | 6h 7m | 2,083
10 | Siege Workshop Lv.10 | Farm Lv.10 | 450 | 0.5% | F/W/S/G=33.5K/43.5K/22.2K/- | 12h 13m | 4,063
11 | Siege Workshop Lv.11 | Farm Lv.11 | 500 | 0.5% | F/W/S/G=52.5K/67.5K/35.0K/- | 14h 40m | 6,520
12 | Siege Workshop Lv.12 | Farm Lv.12 | 550 | 0.5% | F/W/S/G=80.0K/102.5K/52.5K/- | 17h 36m | 9,576
13 | Siege Workshop Lv.13 | Farm Lv.13 | 600 | 0.5% | F/W/S/G=120.0K/155.0K/80.0K/- | 21h 7m | 13,407
14 | Siege Workshop Lv.14 | Farm Lv.14 | 700 | 0.5% | F/W/S/G=180.0K/232.5K/120.0K/- | 1d 1h | 18,241
15 | Siege Workshop Lv.15 | Farm Lv.15 | 800 | 0.5% | F/W/S/G=270.0K/350.0K/180.0K/- | 1d 6h | 24,400
16 | Siege Workshop Lv.16 | Farm Lv.16 | 900 | 1% | F/W/S/G=405.0K/525.0K/270.0K/- | 1d 12h | 32,325
17 | Siege Workshop Lv.17 | Farm Lv.17 | 1,000 | 1% | F/W/S/G=607.5K/787.5K/405.0K/- | 1d 20h | 42,636
18 | Siege Workshop Lv.18 | Farm Lv.18 | 1,100 | 1% | F/W/S/G=925.0K/1.2M/625.0K/- | 2d 5h | 56,328
19 | Siege Workshop Lv.19 | Farm Lv.19 | 1,200 | 1% | F/W/S/G=1.4M/1.8M/950.0K/- | 2d 15h | 74,659
20 | Siege Workshop Lv.20 | Farm Lv.20 | 1,300 | 1% | F/W/S/G=2.1M/2.7M/1.4M/- | 3d 4h | 99,431
21 | Siege Workshop Lv.21 | Farm Lv.21 | 1,400 | 1.5% | F/W/S/G=3.2M/4.1M/2.2M/- | 3d 19h | 133,357
22 | Siege Workshop Lv.22 | Farm Lv.22 | 1,500 | 1.5% | F/W/S/G=4.7M/6.1M/3.2M/- | 4d 22h | 181,631
23 | Siege Workshop Lv.23 | Farm Lv.23 | 1,600 | 1.5% | F/W/S/G=7.1M/9.1M/4.9M/- | 6d 21h | 252,430
24 | Siege Workshop Lv.24 | Farm Lv.24 | 1,700 | 1.5% | F/W/S/G=10.8M/13.8M/7.5M/- | 10d 8h | 359,629
25 | Siege Workshop Lv.25 | Farm Lv.25 | 2,000 | 2% | F/W/S/G=16.2M/20.8M/11.2M1x size = 24 | 34d 2h | 592,326
```

## Farm
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Farm/Requirements

```
Level | Food/Hr | Capacity | Requirements | Cost | Time | Power | ROI Days
1 | 400 | 4,000 | City Hall Lv.1 | F/W/S/G=-/100/-/- | 2s | 5 | 0.01
2 | 430 | 4,300 | City Hall Lv.2 | F/W/S/G=-/200/-/- | 15s | 11 | 0.28
3 | 470 | 4,700 | City Hall Lv.2 | F/W/S/G=-/300/-/- | 60s | 18 | 0.31
4 | 520 | 5,200 | City Hall Lv.2 | F/W/S/G=-/500/-/- | 1m 30s | 28 | 0.42
5 | 580 | 5,800 | City Hall Lv.5 | F/W/S/G=-/1.0K/-/- | 2m | 38 | 0.69
6 | 650 | 6,500 | City Hall Lv.6 | F/W/S/G=-/1.8K/1.0K/- | 10m | 68 | 1.9
7 | 730 | 7,300 | City Hall Lv.7 | F/W/S/G=-/2.7K/1.6K/- | 30m | 150 | 2.5
8 | 830 | 8,300 | City Hall Lv.8 | F/W/S/G=-/4.0K/2.6K/- | 1h | 309 | 3.1
9 | 950 | 9,500 | City Hall Lv.9 | F/W/S/G=-/6.0K/4.2K/- | 1h 30m | 549 | 4.0
10 | 1,100 | 11,000 | City Hall Lv.10 | F/W/S/G=-/9.0K/6.6K/- | 2h | 874 | 4.9
11 | 1,300 | 13,000 | City Hall Lv.11 | F/W/S/G=-/15.0K/10.0K/- | 3h | 1,366 | 5.9
12 | 1,550 | 15,500 | City Hall Lv.12 | F/W/S/G=-/22.5K/15.0K/- | 4h | 2,032 | 7.1
13 | 1,850 | 18,500 | City Hall Lv.13 | F/W/S/G=-/35.0K/22.5K/- | 6h 7m | 3,049 | 9.0
14 | 2,200 | 22,000 | City Hall Lv.14 | F/W/S/G=-/52.5K/35.0K/- | 8h 3m | 4,419 | 11.8
15 | 2,700 | 27,000 | City Hall Lv.15 | F/W/S/G=-/80.0K/52.5K/- | 10h | 6,176 | 12.5
16 | 3,200 | 32,000 | City Hall Lv.16 | F/W/S/G=-/120.0K/80.0K/- | 13h 20m | 8,576 | 18.9
17 | 3,700 | 37,000 | City Hall Lv.17 | F/W/S/G=-/180.0K/120.0K/- | 18h 3m | 11,896 | 28.3
18 | 4,300 | 43,000 | City Hall Lv.18 | F/W/S/G=-/275.0K/200.0K/- | 22h 13m | 16,246 | 37.6
19 | 5,000 | 50,000 | City Hall Lv.19 | F/W/S/G=-/425.0K/300.0K/- | 1d 4h | 21,966 | 49.1
20 | 5,800 | 58,000 | City Hall Lv.20 | F/W/S/G=-/650.0K/450.0K/- | 1d 12h | 29,846 | 65.1
21 | 6,700 | 67,000 | City Hall Lv.21 | F/W/S/G=-/975.0K/675.0K/- | 1d 20h | 40,211 | 86.8
22 | 7,800 | 78,000 | City Hall Lv.22 | F/W/S/G=-/1.5M/1.0M/- | 2d 10h | 54,646 | 107.3
23 | 9,000 | 90,000 | City Hall Lv.23 | F/W/S/G=-/2.2M/1.6M/- | 3d 6h | 74,946 | 150.5
24 | 10,400 | 104,000 | City Hall Lv.24 | F/W/S/G=-/3.5M/2.5M/- | 4d 1h | 103,446 | 203.4
25 | 20,800 | 208,000 | City Hall Lv.25 | F/W/S/G=2 = 5.2M/3 = 3.8M1x size = 24 | 5d 2h | 143,196 | ?
```

## Lumber Mill
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Lumber_Mill/Requirements

```
Level | Wood/Hr | Capacity | Requirements | Cost | Time | Power | ROI days
1 | 400 | 4,000 | City Hall Lv.1 | F/W/S/G=100/-/-/- | 2s | 5 | 0.01
2 | 430 | 4,300 | City Hall Lv.2 | F/W/S/G=200/-/-/- | 15s | 11 | 0.3
3 | 470 | 4,700 | City Hall Lv.2 | F/W/S/G=300/-/-/- | 60s | 18 | 0.3
4 | 520 | 5,200 | City Hall Lv.2 | F/W/S/G=500/-/-/- | 1m 30s | 28 | 0.4
5 | 580 | 5,800 | City Hall Lv.5 | F/W/S/G=1.0K/-/-/- | 2m | 38 | 0.7
6 | 650 | 6,500 | City Hall Lv.6 | F/W/S/G=1.8K/-/1.0K/- | 10m | 68 | 1.9
7 | 730 | 7,300 | City Hall Lv.7 | F/W/S/G=2.7K/-/1.6K/- | 30m | 150 | 2.5
8 | 830 | 8,300 | City Hall Lv.8 | F/W/S/G=4.0K/-/2.6K/- | 1h | 309 | 3.1
9 | 950 | 9,500 | City Hall Lv.9 | F/W/S/G=6.0K/-/4.2K/- | 1h 30m | 549 | 4.0
10 | 1,100 | 11,000 | City Hall Lv.10 | F/W/S/G=9.0K/-/6.6K/- | 2h | 874 | 4.9
11 | 1,300 | 13,000 | City Hall Lv.11 | F/W/S/G=15.0K/-/10.0K/- | 3h | 1,366 | 5.9
12 | 1,550 | 15,500 | City Hall Lv.12 | F/W/S/G=22.5K/-/15.0K/- | 4h | 2,032 | 7.1
13 | 1,850 | 18,500 | City Hall Lv.13 | F/W/S/G=35.0K/-/22.5K/- | 6h 7m | 3,049 | 9.0
14 | 2,200 | 22,000 | City Hall Lv.14 | F/W/S/G=52.5K/-/35.0K/- | 8h 3m | 4,419 | 11.8
15 | 2,700 | 27,000 | City Hall Lv.15 | F/W/S/G=80.0K/-/52.5K/- | 10h | 6,176 | 12.5
16 | 3,200 | 32,000 | City Hall Lv.16 | F/W/S/G=120.0K/-/80.0K/- | 13h 20m | 8,576 | 18.9
17 | 3,700 | 37,000 | City Hall Lv.17 | F/W/S/G=180.0K/-/120.0K/- | 18h 3m | 11,896 | 28.3
18 | 4,300 | 43,000 | City Hall Lv.18 | F/W/S/G=275.0K/-/200.0K/- | 22h 13m | 16,246 | 37.6
19 | 5,000 | 50,000 | City Hall Lv.19 | F/W/S/G=425.0K/-/300.0K/- | 1d 4h | 21,966 | 49.1
20 | 5,800 | 58,000 | City Hall Lv.20 | F/W/S/G=650.0K/-/450.0K/- | 1d 12h | 29,846 | 65.1
21 | 6,700 | 67,000 | City Hall Lv.21 | F/W/S/G=975.0K/-/675.0K/- | 1d 20h | 40,211 | 86.8
22 | 7,800 | 78,000 | City Hall Lv.22 | F/W/S/G=1.5M/-/1.0M/- | 2d 10h | 54,646 | 107
23 | 9,000 | 90,000 | City Hall Lv.23 | F/W/S/G=2.2M/-/1.6M/- | 3d 6h | 74,946 | 151
24 | 10,400 | 104,000 | City Hall Lv.24 | F/W/S/G=3.5M/-/2.5M/- | 4d 1h | 103,446 | 203
25 | 20,800 | 208,000 | City Hall Lv.25 | F/W/S/G=5.2M/3 = 3.8M1x size = 24 | 5d 2h | 143,196 | ?
```

## Alliance Center
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Alliance_Center/Requirements

```
Level | Requirements | Reinforcement + Troop + Capacity | Times + You + Can + Be + Helped | Cost | Time | Power
1 | City Hall Lv.3 | 15,000 | 5 | F/W/S/G=500/500/-/- | 7s | 5
2 | City Hall Lv.3 | 20,000 | 6 | F/W/S/G=1.0K/1.0K/-/- | 35s | 10
3 | City Hall Lv.3 | 30,000 | 7 | F/W/S/G=2.0K/2.0K/-/- | 1m 30s | 21
4 | City Hall Lv.4 | 50,000 | 8 | F/W/S/G=3.8K/3.8K/-/- | 7m | 53
5 | City Hall Lv.5 | 75,000 | 9 | F/W/S/G=6.8K/6.8K/-/- | 15m | 116
6 | City Hall Lv.6 | 100,000 | 10 | F/W/S/G=11.5K/11.5K/4.4K/- | 37m 30s | 265
7 | 0 | 125,000 | 11 | F/W/S/G=17.3K/17.3K/7.0K/- | 1h 15m | 535
8 | 0 | 150,000 | 12 | F/W/S/G=26.0K/26.0K/11.2K/- | 2h 30m | 1,032
9 | 0 | 175,000 | 13 | F/W/S/G=39.0K/39.0K/18.0K/- | 5h | 1,962
10 | City HallLv.10 | 200,000 | 14 | F/W/S/G=58.5K/58.5K/28.7K/- | 10h | 3,722
11 | City HallLv.11 | 237,500 | 15 | F/W/S/G=90.0K/90.0K/45.0K/- | 12h | 5,945
12 | City HallLv.12 | 275,000 | 16 | F/W/S/G=135.0K/135.0K/67.5K/- | 14h 24m | 8,761
13 | City HallLv.13 | 312,500 | 17 | F/W/S/G=202.5K/202.5K/102.5K/- | 17h 16m | 12,366
14 | City HallLv.14 | 350,000 | 18 | F/W/S/G=305.0K/305.0K/155.0K/- | 20h 44m | 17,036
15 | City HallLv.15 | 387,500 | 19 | F/W/S/G=457.5K/457.5K/232.5K/- | 1d 1h | 23,146
16 | City HallLv.16 | 425,000 | 20 | F/W/S/G=687.5K/687.5K/350.0K/- | 1d 6h | 31,245
17 | City HallLv.17 | 462,500 | 21 | F/W/S/G=1.0M/1.0M/525.0K/- | 1d 12h | 42,109
18 | City HallLv.18 | 500,000 | 22 | F/W/S/G=1.6M/1.6M/800.0K/- | 1d 18h | 56,900
19 | City HallLv.19 | 537,500 | 23 | F/W/S/G=2.3M/2.3M/1.2M/- | 2d 3h | 77,229
20 | City HallLv.20 | 575,000 | 24 | F/W/S/G=3.5M/3.5M/1.8M/- | 2d 14h | 105,544
21 | City HallLv.21 | 612,500 | 25 | F/W/S/G=5.3M/5.3M/2.7M/- | 3d 2h | 145,342
22 | City HallLv.22 | 650,000 | 26 | F/W/S/G=7.9M/7.9M/4.1M/- | 4d | 202,900
23 | City HallLv.23 | 687,500 | 27 | F/W/S/G=11.8M/11.8M/6.1M/- | 5d 15h | 287,897
24 | City HallLv.24 | 750,000 | 28 | F/W/S/G=17.8M/17.8M/9.3M/- | 8d 11h | 415,855
25 | City HallLv.25 | 1,000,000 | 30 | F/W/S/G=26.8M/26.8M/14.0M/- Master's Blueprint | 0 | 667,083
```

## Archery Range
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Archery_Range/Requirements

```
Level | Unlocks Building | Requirements | Archer + Training + Capacity | Troop + Health + Bonus | Cost | Time | Power
1 | None | City Hall Lv.2 | 20 | - | F/W/S/G=300/500/- | 4s | 5
2 | Siege Workshop Lv.2 | City Hall Lv.2 | 50 | - | F/W/S/G=500/800/-/- | 30s | 10
3 | Siege Workshop Lv.3 | City Hall Lv.3 | 100 | - | F/W/S/G=1.0K/1.5K/-/- | 1m 40s | 19
4 | Siege Workshop Lv.4 | City Hall Lv.4 | 150 | - | F/W/S/G=2.0K/2.8K/-/- | 5m | 40
5 | Siege Workshop Lv.5 | Lumber Mill Lv.5 | 200 | - | F/W/S/G=3.8K/5.0K/-/- | 16m 40s | 97
6 | Siege Workshop Lv.6 | Lumber Mill Lv.6 | 250 | - | F/W/S/G=6.5K/8.5K/3.4K/- | 45m 50s | 247
7 | Siege Workshop Lv.7 | Lumber Mill Lv.7 | 300 | - | F/W/S/G=9.8K/12.8K/5.4K/- | 1h 32m | 528
8 | Siege Workshop Lv.8 | Lumber Mill Lv.8 | 350 | - | F/W/S/G=14.8K/19.3K/8.7K/- | 3h 3m | 1,062
9 | Siege Workshop Lv.9 | Lumber Mill Lv.9 | 400 | - | F/W/S/G=22.3K/29.0K/13.9K/- | 6h 7m | 2,086
10 | Siege Workshop Lv.10 | Lumber Mill Lv.10 | 450 | 0.5% | F/W/S/G=33.5K/43.5K/22.2K/- | 12h 13m | 4,066
11 | Siege Workshop Lv.11 + Hospital Lv.11 | Lumber Mill Lv.11 | 500 | 0.5% | F/W/S/G=52.5K/67.5K/35.0K/- | 14h 40m | 6,523
12 | Siege Workshop Lv.12 | Lumber Mill Lv.12 | 550 | 0.5% | F/W/S/G=80.0K/102.5K/52.5K/- | 17h 36m | 9,579
13 | Siege Workshop Lv.13 | Lumber Mill Lv.13 | 600 | 0.5% | F/W/S/G=120.0K/155.0K/80.0K/- | 21h 7m | 13,410
14 | Siege Workshop Lv.14 | Lumber Mill Lv.14 | 700 | 0.5% | F/W/S/G=180.0K/232.5K/120.0K/- | 1d 1h | 18,244
15 | Siege Workshop Lv.15 | Lumber Mill Lv.15 | 800 | 0.5% | F/W/S/G=270.0K/350.0K/180.0K/- | 1d 6h | 24,403
16 | Siege Workshop Lv.16 + Hospital Lv.16 | Lumber Mill Lv.16 | 900 | 1% | F/W/S/G=405.0K/525.0K/270.0K/- | 1d 12h | 32,328
17 | Siege Workshop Lv.17 | Lumber Mill Lv.17 | 1,000 | 1% | F/W/S/G=607.5K/787.5K/405.0K/- | 1d 20h | 42,639
18 | Siege Workshop Lv.18 | Lumber Mill Lv.18 | 1,100 | 1% | F/W/S/G=925.0K/1.2M/625.0K/- | 2d 5h | 56,331
19 | Siege Workshop Lv.19 | Lumber Mill Lv.19 | 1,200 | 1% | F/W/S/G=1.4M/1.8M/950.0K/- | 2d 15h | 74,662
20 | Siege Workshop Lv.20 | Lumber Mill Lv.20 | 1,300 | 1% | F/W/S/G=2.1M/2.7M/1.4M/- | 3d 4h | 99,434
21 | Siege Workshop Lv.21 + Hospital Lv.21 | Lumber Mill Lv.21 | 1,400 | 1.5% | F/W/S/G=3.2M/4.1M/2.2M/- | 3d 19h | 133,360
22 | Siege Workshop Lv.22 | Lumber Mill Lv.22 | 1,500 | 1.5% | F/W/S/G=4.7M/6.1M/3.2M/- | 4d 22h | 181,634
23 | Siege Workshop Lv.23 | Lumber Mill Lv.23 | 1,600 | 1.5% | F/W/S/G=7.1M/9.1M/4.9M/- | 6d 21h | 252,433
24 | Siege Workshop Lv.24 | Lumber Mill Lv.24 | 1,700 | 1.5% | F/W/S/G=10.8M/13.8M/7.5M/- | 10d 8h | 359,632
25 | Siege Workshop Lv.25 | Lumber Mill Lv.25 | 2,000 | 2% | F/W/S/G=16.2M/20.8M/11.2M | 0 | 592,329
```

## Stable
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Stable/Requirements

```
Level | Requirements | Unlocks | Cavalry + Training + Capacity | Troop + Defense + Bonus | Cost | Time | Power
1 | City Hall Lv.3 | None | 20 | - | F/W/S/G=300/400/-/- | 8s | 5
2 | City Hall Lv.3 | Siege Workshop Lv.2 | 50 | - | F/W/S/G=500/800/-/- | 40s | 10
3 | City Hall Lv.3 | Siege Workshop Lv.3 | 100 | - | F/W/S/G=1.0K/1.5K/-/- | 2m | 19
4 | City Hall Lv.4 | Siege Workshop Lv.4 | 150 | - | F/W/S/G=2.0K/2.8K/-/- | 6m 40s | 44
5 | Quarry Lv.5 | Siege Workshop Lv.5 | 200 | - | F/W/S/G=3.8K/5.0K/-/- | 16m 40s | 101
6 | Quarry Lv.6 | Siege Workshop Lv.6 | 250 | - | F/W/S/G=6.5K/8.5K/3.4K/- | 45m 50s | 251
7 | Quarry Lv.7 | Siege Workshop Lv.7 | 300 | - | F/W/S/G=9.8K/12.8K/5.4K/- | 1h 32m | 532
8 | Quarry Lv.8 | Siege Workshop Lv.8 | 350 | - | F/W/S/G=14.8K/19.3K/8.7K/- | 3h 3m | 1,066
9 | Quarry Lv.9 | Siege Workshop Lv.9 | 400 | 0.5% | F/W/S/G=22.3K/29.0K/13.9K/- | 6h 7m | 2,090
10 | Quarry Lv.10 | Siege Workshop Lv.10 | 450 | 0.5% | F/W/S/G=33.5K/43.5K/22.2K/- | 12h 13m | 4,070
11 | Quarry Lv.11 | Siege Workshop Lv.11 | 500 | 0.5% | F/W/S/G=52.5K/67.5K/35.0K/- | 14h 40m | 6,527
12 | Quarry Lv.12 | Siege Workshop Lv.12 | 550 | 0.5% | F/W/S/G=80.0K/102.5K/52.5K/- | 17h 36m | 9,583
13 | Quarry Lv.13 | Siege Workshop Lv.13 | 600 | 0.5% | F/W/S/G=120.0K/155.0K/80.0K/- | 21h 7m | 13,414
14 | Quarry Lv.14 | Siege Workshop Lv.14 | 700 | 0.5% | F/W/S/G=180.0K/232.5K/120.0K/- | 1d 1h | 18,248
15 | Quarry Lv.15 | Siege Workshop Lv.15 | 800 | 0.5% | F/W/S/G=270.0K/350.0K/180.0K/- | 1d 6h | 24,407
16 | Quarry Lv.16 | Siege Workshop Lv.16 | 900 | 1% | F/W/S/G=405.0K/525.0K/270.0K/- | 1d 12h | 32,332
17 | Quarry Lv.17 | Siege Workshop Lv.17 | 1,000 | 1% | F/W/S/G=607.5K/787.5K/405.0K/- | 1d 20h | 42,643
18 | Quarry Lv.18 | Siege Workshop Lv.18 | 1,100 | 1% | F/W/S/G=925.0K/1.2M/625.0K/- | 2d 5h | 56,335
19 | Quarry Lv.19 | Siege Workshop Lv.19 | 1,200 | 1% | F/W/S/G=1.4M/1.8M/950.0K/- | 2d 15h | 74,666
20 | Quarry Lv.20 | Siege Workshop Lv.20 | 1,300 | 1% | F/W/S/G=2.1M/2.7M/1.4M/- | 3d 4h | 99,438
21 | Quarry Lv.21 | Siege Workshop Lv.21 | 1,400 | 1.5% | F/W/S/G=3.2M/4.1M/2.2M/- | 3d 19h | 133,364
22 | Quarry Lv.22 | Siege Workshop Lv.22 | 1,500 | 1.5% | F/W/S/G=4.7M/6.1M/3.2M/- | 4d 22h | 181,638
23 | Quarry Lv.23 | Siege Workshop Lv.23 | 1,600 | 1.5% | F/W/S/G=7.1M/9.1M/4.9M/- | 6d 21h | 252,437
24 | Quarry Lv.24 | Siege Workshop Lv.24 | 1,700 | 1.5% | F/W/S/G=10.8M/13.8M/7.5M/- | 10d 8h | 359,636
25 | Quarry Lv.25 | Siege Workshop Lv.25 | 2,000 | 2% | F/W/S/G=16.2M/20.8M/11.2M/- | 20d 7h | 592,333
```

## Siege Workshop
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Siege_Workshop/Requirements

```
Level | Requirements | Siege + Training + Capacity | Cost | Time | Power
1 | City Hall Lv.4 | 20 | F/W/S/G=400/500/-/- | 10s | 5
2 | Barracks Lv.2 + Archery Range Lv.2 + Stable Lv.2 | 50 | F/W/S/G=800/1.0K/-/- | 1m 30s | 10
3 | Barracks Lv.3 + Archery Range Lv.3 + Stable Lv.3 | 100 | F/W/S/G=1.5K/2.0K/-/- | 4m | 26
4 | Barracks Lv.4 + Archery Range Lv.4 + Stable Lv.4 | 150 | F/W/S/G=2.8K/3.8K/-/- | 10m | 63
5 | Barracks Lv.5 + Archery Range Lv.5 + Stable Lv.5 | 200 | F/W/S/G=5.0K/6.8K/-/- | 16m 40s | 126
6 | Barracks Lv.6 + Archery Range Lv.6 + Stable Lv.6 | 250 | F/W/S/G=8.5K/11.5K/5.7K/- | 45m 50s | 293
7 | Barracks Lv.7 + Archery Range Lv.7 + Stable Lv.7 | 300 | F/W/S/G=12.8K/17.3K/9.0K/- | 1h 32m | 600
8 | Barracks Lv.8 + Archery Range Lv.8 + Stable Lv.8 | 350 | F/W/S/G=19.3K/26.0K/14.4K/- | 6h 7m | 1,173
9 | Barracks Lv.9 + Archery Range Lv.9 + Stable Lv.9 | 400 | F/W/S/G=19.3K/26.0K/14.4K/- | 6h 7m | 2,258
10 | Barracks Lv.10 + Archery Range Lv.10 + Stable Lv.10 | 450 | F/W/S/G=43.5K/58.5K/36.9K/- | 12h 13m | 4,332
11 | Barracks Lv.11 + Archery Range Lv.11 + Stable Lv.11 | 500 | F/W/S/G=67.5K/90.0K/57.5K/- | 14h 40m | 6,931
12 | Barracks Lv.12 + Archery Range Lv.12 + Stable Lv.12 | 550 | F/W/S/G=102.5K/135.0K/87.5K/- | 17h 36m | 10,202
13 | Barracks Lv.13 + Archery Range Lv.13 + Stable Lv.13 | 600 | F/W/S/G=102.5K/135.0K/87.5K/- | 21h 7m | 14,355
14 | Barracks Lv.14 + Archery Range Lv.14 + Stable Lv.14 | 700 | F/W/S/G=232.5K/305.0K/200.0K/- | 1d 1h | 19,679
15 | Barracks Lv.15 + Archery Range Lv.15 + Stable Lv.15 | 800 | F/W/S/G=350.0K/457.5K/300.0K/- | 1d 12h | 26,573
16 | Barracks Lv.16 + Archery Range Lv.16 + Stable Lv.16 | 900 | F/W/S/G=525.0K/687.5K/450.0K/- | 1d 12h | 35,603
17 | Barracks Lv.17 + Archery Range Lv.17 + Stable Lv.17 | 1,000 | F/W/S/G=787.5K/1.0M/675.0K/- | 1d 20h | 47,574
18 | Barracks Lv.18 + Archery Range Lv.18 + Stable Lv.18 | 1,100 | F/W/S/G=1.2M/1.6M/1.0M/- | 2d 5h | 63,716
19 | Barracks Lv.19 + Archery Range Lv.19 + Stable Lv.19 | 1,200 | F/W/S/G=1.8M/2.3M/1.6M/- | 3d 4h | 85,697
20 | Barracks Lv.20 + Archery Range Lv.20 + Stable Lv.20 | 1,300 | F/W/S/G=2.7M/3.5M/2.3M/- | 3d 4h | 115,969
21 | Barracks Lv.21 + Archery Range Lv.21 + Stable Lv.21 | 1,400 | F/W/S/G=4.1M/5.3M/3.5M/- | 3d 19h | 158,145
22 | Barracks Lv.22 + Archery Range Lv.22 + Stable Lv.22 | 1,500 | F/W/S/G=6.1M/7.9M/5.3M/- | 4d 22h | 218,794
23 | Barracks Lv.23 + Archery Range Lv.23 + Stable Lv.23 | 1,600 | F/W/S/G=9.1M/11.8M/7.9M/- | 6d 21h | 308,118
24 | Barracks Lv.24 + Archery Range Lv.24 + Stable Lv.24 | 1,700 | F/W/S/G=13.8M/17.8M/12.0M/- | 10d 8h | 442,817
25 | Barracks Lv.25 + Archery Range Lv.25 + Stable Lv.25 | 2,000 | 0 | 0 | 716,764
```

## Watchtower
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Watchtower/Requirements

```
Level | Requirements | Attack | Health | Resources | Time | Power
1 | None | 1,000 | 1,000 | None | None | 5
2 | Wall Lv.2 | 1,500 | 1,500 | F/W/S/G=800/800/-/- Arrow of Resistance x2 | 30s | 11
3 | Wall Lv.3 | 2,000 | 2,000 | F/W/S/G=1.5K/1.5K/-/- Arrow of Resistance x5 | 1m 40s | 21
4 | Wall Lv.4 | 3,000 | 3,000 | F/W/S/G=2.8K/2.8K/-/- Arrow of Resistance x8 | 5m | 44
5 | Wall Lv.5 | 4,000 | 4,000 | F/W/S/G=5.0K/5.0K/-/- Arrow of Resistance x15 | 15m | 100
6 | Wall Lv.6 | 5,000 | 5,000 | F/W/S/G=8.5K/8.5K/1.3K/- Arrow of Resistance x20 | 35m | 221
7 | Wall Lv.7 | 6,000 | 6,000 | F/W/S/G=12.8K/12.8K/2.0K/- Arrow of Resistance x30 | 1h 10m | 446
8 | Wall Lv.8 | 16,000 | 8,000 | F/W/S/G=19.3K/19.3K/3.2K/- Arrow of Resistance x40 | 2h 20m | 868
9 | Wall Lv.9 | 20,000 | 10,000 | F/W/S/G=29.0K/29.0K/5.2K/- Arrow of Resistance x50 | 4h 40m | 1,671
10 | Wall Lv.10 | 24,000 | 12,000 | F/W/S/G=43.5K/43.5K/8.2K/- Arrow of Resistance x70 | 9h 20m | 3,213
11 | Wall Lv.11 | 28,000 | 14,000 | F/W/S/G=67.5K/67.5K/12.5K/- Arrow of Resistance x80 | 11h 12m | 5,133
12 | Wall Lv.12 | 32,000 | 16,000 | F/W/S/G=102.5K/102.5K/20.0K/- Arrow of Resistance x100 | 13h 26m | 7,538
13 | Wall Lv.13 | 36,000 | 18,000 | F/W/S/G=155.0K/155.0K/30.0K/- Arrow of Resistance x125 | 16h 8m | 10,570
14 | Wall Lv.14 | 40,000 | 20,000 | F/W/S/G=232.5K/232.5K/45.0K/- Arrow of Resistance x150 | 19h 21m | 14,421
15 | Wall Lv.15 | 66,000 | 22,000 | F/W/S/G=350.0K/350.0K/67.5K/- Arrow of Resistance x300 | 23h 13m | 19,367
16 | Wall Lv.16 | 72,000 | 24,000 | F/W/S/G=525.0K/525.0K/102.5K/- Arrow of Resistance x500 | 1d 4h | 25,787
17 | Wall Lv.17 | 78,000 | 26,000 | F/W/S/G=787.5K/787.5K/155.0K/- Arrow of Resistance x700 | 1d 9h | 34,217
18 | Wall Lv.18 | 84,000 | 28,000 | F/W/S/G=1.2M/1.2M/250.0K/- Arrow of Resistance x900 | 1d 16h | 45,545
19 | Wall Lv.19 | 90,000 | 30,000 | F/W/S/G=1.8M/1.8M/375.0K/- Arrow of Resistance x1200 | 2d | 60,804
20 | Wall Lv.20 | 96,000 | 32,000 | F/W/S/G=2.7M/2.7M/575.0K/- Arrow of Resistance x1500 | 2d 10h | 81 650
21 | Wall Lv.21 | 136,000 | 34,000 | F/W/S/G=4.1M/4.1M/875.0K/- Arrow of Resistance x1800 | 2d 21h | 110 460
22 | Wall Lv.22 | 144,000 | 36,000 | F/W/S/G=6.1M/6.1M/1.3M/- Arrow of Resistance x2000 | 3d 18h | 151,716
23 | Wall Lv.23 | 152,000 | 38,000 | F/W/S/G=9.1M/9.1M/2.0M/- Arrow of Resistance x2500 | 5d 6h | 212,389
24 | Wall Lv.24 | 160,000 | 40,000 | F/W/S/G=13.8M/13.8M/3.0M/- Arrow of Resistance x3000 | 7d 21h | 303,649
25 |  Storehouse 25  Wall 25 | 500,000 | 50,000 | F/W/S/G=20.8M/20.8M/4.5M/- Arrow of Resistance x5000 | 14d 7h | 495 562
```

## Castle
URL: https://riseofkingdoms.fandom.com/wiki/Buildings/Castle/Requirements

```
Level | Requirements | Rallied + Army + Capacity | Cost | Time | Power
1 | Alliance Center Lv.1 | 25,000 | F/W/S/G=200/300/-/- | 12s | 5
2 | Alliance Center Lv.2 | 40,000 | F/W/S/G=300/500/-/- Book of Covenant x2 | 1m | 11
3 | Alliance Center Lv.3 | 60,000 | F/W/S/G=500/1.0K/-/- Book of Covenant x5 | 5m | 26
4 | Alliance Center Lv.4 | 100,000 | F/W/S/G=1.0K/2.0K Book of Covenant x8 | 16m 40s | 72
5 | Alliance Center Lv.5 | 150,000 | F/W/S/G=2.0K/3.8K Book of Covenant x15 | 35m | 167
6 | Alliance Center Lv.6 | 200,000 | F/W/S/G=3.5K/6.5K/3.5K/- Book of Covenant x20 | 53m 20s | 325
7 | Alliance Center Lv.7 | 250,000 | F/W/S/G=5.3K/9.8K/5.3K/- Book of Covenant x30 | 1h 47m | 627
8 | Alliance Center Lv.8 | 300,000 | F/W/S/G=8.0K/14.8K/8.0K/- Book of Covenant x40 | 3h 33m | 1,208
9 | Alliance Center Lv.9 | 350,000 | F/W/S/G=12.0K/22.3K/12.0K/- Book of Covenant x50 | 7h 7m | 2,336
10 | Alliance Center Lv.10 | 400,000 | F/W/S/G=18.0K/33.5K/18.0K/- Book of Covenant x70 | 14h 13m | 4,541
11 | Alliance Center Lv.11 | 475,000 | F/W/S/G=27.5K/52.5K/27.5K/- Book of Covenant x80 | 17h 4m | 7,241
12 | Alliance Center Lv.12 | 550,000 | F/W/S/G=42.5K/80.0K/42.5K/- Book of Covenant x100 | 20h 29m | 10,562
13 | Alliance Center Lv.13 | 625,000 | F/W/S/G=65.0K/120.0K/65.0K/- Book of Covenant x125 | 1d | 14,665
14 | Alliance Center Lv.14 | 700,000 | F/W/S/G=97.5K/180.0K/97.5K/- Book of Covenant x150 | 1d | 19,759
15 | Alliance Center Lv.15 | 775,000 | F/W/S/G=147.5K/270.0K/147.5K/- Book of Covenant x300 | 1d 11h | 26,132
16 | Alliance Center Lv.16 | 850,000 | F/W/S/G=222.5K/405.0K/222.5K/- Book of Covenant x500 | 1d 18h | 34,169
17 | Alliance Center Lv.17 | 925,000 | F/W/S/G=335.0K/607.5K/335.0K/- Book of Covenant x700 | 2d 3h | 44,397
18 | Alliance Center Lv.18 | 1,000,000 | F/W/S/G=525.0K/925.0K/525.0K/- Book of Covenant x900 | 2d 13h | 57,677
19 | Alliance Center Lv.19 | 1,100,000 | F/W/S/G=800.0K/1.4M/800.0K/- Book of Covenant x1200 | 3d 1h | 75,044
20 | Alliance Center Lv.20 | 1,200,000 | F/W/S/G=1.2M/2.1M/1.2M/- Book of Covenant x1500 | 3d 16h | 97,924
21 | Alliance Center Lv.21 | 1,300,000 | F/W/S/G=1.8M/3.2M/1.8M/- Book of Covenant x1750 | 4d 10h | 128,440
22 | Alliance Center Lv.22 | 1,400,000 | F/W/S/G=2.7M/4.7M/2.7M/- Book of Covenant x2000 | 5d 17h | 171,171
23 | Alliance Center Lv.23 | 1,500,000 | F/W/S/G=4.1M/7.1M/4.1M/- Book of Covenant x2500 | 8d | 233,315
24 | Alliance Center Lv.24 | 1,600,000 | F/W/S/G=6.3M/10.8M/6.3M/- Book of Covenant x3000 | 12d | 327,606
25 |  Siege Workshop 25  Alliance Center 25 | 2,000,000 | F/W/S/G=9.5M/16.2M/9.5M/- Book of Covenant x5000 | 23d 5h | 552,999
```

