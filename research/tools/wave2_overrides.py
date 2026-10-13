"""Wave-2 (2026-10-13) verification decisions for A01-A14 and B01-05xx cards.

Data only; consumed by migrate_v2.py. Every change here is backed by a source re-read
on 2026-10-13 (official forum API, Fandom MediaWiki API, curl'd guide pages, Reddit via
Arctic Shift). See research/facts/_verificacao-wave2.md for the narrative.
"""

D = "2026-10-13"
FORUM = "https://forum-global.lilithgame.com/rok/post/{}/?lang=en_US"
RC = "https://www.reddit.com/r/RiseofKingdoms/comments/{}/comment/{}/"


def forum(pid, trecho, date):
    return {"id": "src:lilith-forum", "url": FORUM.format(pid), "trecho": trecho,
            "acessado_em": D, "publicado_em": date, "copia_de": None}


def reddit(post, cid, trecho, date):
    return {"id": "src:reddit", "url": RC.format(post, cid), "trecho": trecho,
            "acessado_em": D, "publicado_em": date, "copia_de": None}


# --- new evidence -----------------------------------------------------------------
F_AP_1041 = forum(1030636, "Optimized the action points system by increasing maximum action points from 1,000 to 1,500, and granting all Governors a claimable extra 500 free action points per day.", "2020-12-15")
F_HOSP_1041 = forum(1030636, "hospital capacity for lower-level hospitals has been increased to be more reasonable.", "2020-12-15")
F_GATHER_1049 = forum(1108303, "We have boosted Resource Point deposits by 25% across all levels on the map (excluding Gem Deposits and Alliance Resource Centers), and improved troops’ base Gathering Speed by 10%.", "2021-08-03")
F_GATHER_1049b = forum(1108923, "we will retain the \"25% increase in resource point deposits for all levels of resource points on the map (except gem and alliance mines) and a 10% increase in the base gathering speed of troops.\"", "2021-08-04")
F_TAX_DEV = forum(1587412, "Suggestion: Reduce the resource assistance tax rate to -5% instead of -8%.", "2023-11-03")
F_SUNSET_113 = forum(2197960, "Optimized replay features for Sunset Canyon, Lost Canyon, the Sunset Canyon Tournament, Canyon Clash, and Mercantile Melee.", "2026-01-13")
F_OLYMPIA_116 = forum(2219742, "Optimized the skill bar display in Champions of Olympia.", "2026-03-18")
F_LOHAR_117 = forum(2232581, "Arms Training: Challenge Armsmaster Lohar as he gets stronger with each battle!", "2026-04-30")
F_EVE_195 = forum(2056756, "Eve of the Crusade will start after entering the Lost Kingdom.", "2025-06-06")
F_TALENT_114 = forum(2213663, "* This adjustment applies only to Season 2 and beyond.", "2026-02-24")
F_VIP19_QA = forum(1812473, "The excess VIP Points you earned after reaching VIP18 have all been recorded by the game.", "2024-10-11")

R_VIP_CUM = reddit("1tdyg74", "olzibz1", "It's 138k VIP points from 6 to 10.", "2026-05-15")
R_VIP10 = reddit("1t5tiv4", "okl5g2x", "Vip 10 costs 150 k vip points", "2026-05-08")
R_VIP_PUSH = reddit("1tdyg74", "olzibz1", "That's why it's recommended to push that as quickly as possible with all your gems.", "2026-05-15")
R_VIP_PUSH2 = reddit("1sjyln9", "ofxrwt6", "I would say to go ahead and push the VIP to 10.", "2026-04-13")
R_MTG_MONTH = reddit("1vb5s2n", "p0t8t0u", "Mtg arrives every month and you'd rather want to have 50k gems saved up in the bag to gem vip and get the extra 26 gold heads.", "2026-07-31")
R_MTG_END = reddit("1w4guqk", "p7cnt4w", "MTG is at the end of every month, you have 30ish days from now to collect enough gems again.", "2026-09-02")
R_MTG_FIRST = reddit("1v9592q", "p0b1n2n", "Yes its generally on the first week of each month", "2026-07-28")
R_MTG_2D = reddit("1unzo4d", "ow2716w", "MTG is a 2 days long event so max it with 25 k and the other day you can max it again", "2026-07-07")
R_MTG_21D = reddit("1tkqp7z", "onfcaqa", "Iirc only kd with 21 days and older gets this kind of event, like mtg and such", "2026-05-23")
R_MTG_ONCE = reddit("1to43kj", "onymdah", "While MTG comes once a month now.", "2026-05-26")
R_SUN_AETH = reddit("1x0nwgb", "pemh3a2", "Sun Tzu/Aethelflaed is always top 1-2 for any F2P kvk1 lineup, no question.", "2026-10-08")
R_SUN_YSG = reddit("1wkihjk", "pas51bb", "you should be running a sun/ysg and thats pretty much the best thing you can do for kvk 2.", "2026-09-19")
R_SKIP_YSG = reddit("1wqjbff", "pc4r9le", "F2P should skip YSG imo.", "2026-09-26")
R_T4_30D = reddit("1tdyg74", "olzge91", "So just focus on getting T4, which is usually around the 30 day mark.", "2026-05-15")
R_LOHAR_AP = reddit("1tdyg74", "olzge91", "I would recommend is to spend all your AP including pots on the Lohar events in the early game.", "2026-05-15")
R_90D = reddit("1whamex", "pa293a9", "The first 90 days or so you are building a kingdom.", "2026-09-15")
R_PREKVK_LK = reddit("1wq3sil", "pc0wmli", "All that will change is that the first 6 days of pre-kvk will also be the first 6 days of the LK", "2026-09-25")
R_KVK50 = reddit("1wbycwz", "pa4ojmw", "All KvK’s last 50 days each, but generally the first 7 days and last 10 days of each KvK is for preparation and recovery", "2026-09-16")
R_CH21_KVK1 = reddit("1w7720l", "p92gnwp", "Litterally fought all the way through kvk1 at ch 21 ch25 is not a requirement bro", "2026-09-11")
R_CH25_NOT = reddit("1w1a0ej", "p6yry47", "as ftp your not even close to on track to having ch25 by kvk1 start", "2026-08-31")
R_FARMS = reddit("1w1h5wq", "p6kxhxv", "Create farm accounts unless you play to buy from rss seller.", "2026-08-29")
R_FORTS = reddit("1w1h5wq", "p6kxhxv", "Forts >>> barbs. Burn your AP doing 1+1 forts and only barbs if theres an event for it", "2026-08-29")
R_GOLD_SEND = reddit("o6yyju", "h2vihw0", "You can only donate whatever excess you have over your storehouse capacity", "2021-06-24")
R_GOLD_POST = {"id": "src:reddit", "url": "https://www.reddit.com/r/RiseofKingdoms/comments/o6yyju/",
               "trecho": "But not sure why I could only donate gold and 2k worth of food", "acessado_em": D,
               "publicado_em": "2021-06-24", "copia_de": None}
R_F2P_10_20M = reddit("1wyy81o", "pe9vje7", "A realistic goal for F2P-Low Spenders is 10-20m power by KvK1", "2026-10-06")

# --- quote replacements (card, source index) -> verbatim text located in the curl'd page ---
QUOTE_FIX = {
    ("A03-0012", 2): "You should be logging in twice daily to make sure you have troops gathering from the alliance resource pit",
    ("A03-0016", 3): "When practical, send your marches to resource nodes before you stop actively playing. Choose nodes with enough remaining resources that the march does not return almost immediately.",
    ("A03-0018", 2): "Stone Cleopatra VII is one of the best-known Stone specialists. Wak Chanil Ajaw can also provide strong gathering utility for Stone and other standard resources. Gold Seondeok remains one of the most useful Gold gathering commanders.",
    ("A03-0020", 2): "Current references list: Level 1 Gem Deposit: 10 Gems Level 2 Gem Deposit: 20 Gems",
    ("A03-0024", 1): "1 City Hall Lv.10 Goldmine Lvl.1 5,000 35% [...] 25 Goldmine Lv25 2,500,000 8%",
    ("A03-0026", 1): "The Rise of Kingdoms Trading Post Guide encourages players to strategically position farm accounts close to their main account",
    ("A03-0027", 1): "Choose Food, Wood, Stone, or Gold. Enter the amount you want to send. Review the Trading Post tax and the amount the main account will receive.",
    ("A06-0501", 3): "when you pair Aethelflaed with Sun Tzu, keeping Sun Tzu as primary is recommended.",
    ("A06-0506", 1): "in the early game, please focus on leveling your gathering commanders to level 37 and filling out the gathering tree before worrying about any combat commanders.",
    ("A06-0512", 2): "Players in charge of defending and rallying during KVK spend $1,000 or more per month.",
    ("A06-0513", 0): "when you pair Aethelflaed with Sun Tzu, keeping Sun Tzu as primary is recommended.",
    ("A06-0514", 0): "Get a ‘Quick Study’ to enhance your experience when you kill barbarians and other neutral units. Move on to acquiring ‘Trophy Hunter’",
    ("A07-0500", 2): "Before you begin crafting legendary equipment, ensure that all of your pairings are equipped with epic equipment.",
    ("A07-0501", 0): "Conservatively hoard Legendary materials for future transitions on your cavalry equipment.",
    ("A07-0502", 2): "Helm (Windswept War Helm): An exceptional budget piece that introduces vital movement speed alongside core stats at a minimal crafting cost. Chest (Vanguard Armor)",
    ("A07-0504", 0): "if you already have purple boots, new legendary boots will boost your stats by 2%.",
    ("A13-0003", 0): "A farming account should have a trading post level of 15 or higher.",
    ("B01-0500", 1): "Pre-KvK (Crusader Eve) occurs at day 85 th or 95 th approximately.",
}

# per-citation copia_de (card, source index) -> slug of the original
COPIA = {
    ("A01-0001", 3): "src:fandom",
    ("A01-0004", 3): "src:fandom", ("A01-0004", 4): "src:fandom",
    ("A04-0007", 0): "src:fandom", ("A04-0007", 1): "src:fandom",
    ("A05-0001", 2): "src:fandom",
    ("A10-0003", 2): "src:fandom",
    ("A03-0020", 2): "src:rkg",
    ("A03-0025", 3): "src:rkg",
    ("A13-0003", 1): "src:rkg",
}

# sources to append to cards
L_TERR = {"id": "src:rkg-lyceum", "url": "https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/",
          "trecho": "When alliance members gather resources in alliance territory, how much is their Gathering Speed increased by? | 25%",
          "acessado_em": D, "publicado_em": "2026-10-01", "copia_de": None}

ADD_SOURCES = {
    "A03-0009": [L_TERR],
    "A09-0001": [F_AP_1041],
    "A09-0006": [F_AP_1041],
    "A01-0008": [F_HOSP_1041],
    "A03-0016": [F_GATHER_1049],
    "A03-0022": [F_GATHER_1049],
    "A03-0024": [F_TAX_DEV],
    "A03-0027": [R_GOLD_POST, R_GOLD_SEND],
    "A05-0001": [R_VIP_CUM, R_VIP10],
    "A05-0008": [R_VIP_PUSH, R_VIP_PUSH2],
    "A11-0504": [R_VIP_PUSH],
    "A11-0502": [R_MTG_MONTH, R_MTG_END, R_MTG_FIRST, R_MTG_2D, R_MTG_21D, R_MTG_ONCE],
    "A06-0501": [R_SUN_AETH, R_SUN_YSG],
    "A06-0504": [R_SUN_AETH],
    "A06-0502": [R_SUN_YSG, R_SKIP_YSG],
    "A06-0514": [F_TALENT_114],
    "A08-0500": [R_T4_30D],
    "A11-0505": [R_LOHAR_AP],
    "A09-0007": [R_FORTS],
    "A10-0008": [F_SUNSET_113],
    "A11-0507": [F_SUNSET_113],
    "A11-0509": [F_OLYMPIA_116],
    "A11-0513": [F_SUNSET_113, F_OLYMPIA_116, F_LOHAR_117],
    "B01-0500": [R_90D],
    "B01-0502": [R_KVK50],
    "B01-0503": [R_PREKVK_LK, F_EVE_195],
    "A13-0010": [R_FARMS],
    "A05-0002": [F_VIP19_QA],
}

# manual n_fontes_contra (independent sources against the claim as stated)
CONTRA = {
    "A09-0001": 1,
    "A01-0008": 1, "A01-0009": 1, "A01-0010": 1, "A04-0009": 1, "A05-0005": 2, "A05-0008": 1,
    "A03-0027": 1, "A06-0501": 1, "A06-0502": 1, "A02-0500": 0, "A02-0502": 1, "A02-0503": 1,
    "A06-0503": 2, "A06-0504": 1, "A06-0505": 1, "A06-0508": 1, "A06-0509": 2, "A06-0510": 1, "A06-0511": 1,
    "A08-0500": 0, "A08-0501": 1, "A11-0501": 1, "A11-0504": 1, "A11-0508": 1, "A13-0004": 1,
    "A13-0009": 1, "B01-0502": 1, "A12-0002": 0, "A07-0500": 1,
}
# slugs that are listed on the card but argue AGAINST it (excluded from n_fontes_pro)
CONTRA_SLUGS = {
    "A09-0001": {"src:rkg-lyceum"},
    "A01-0008": {"src:rkg"}, "A01-0009": {"src:rkg"}, "A01-0010": {"src:fandom"},
    "A04-0009": {"src:allclash"}, "A05-0005": set(), "A05-0008": {"src:allclash"},
    "A03-0027": {"src:theriagames"}, "A13-0004": set(), "B01-0502": set(),
}

# tipo / metodo
DERIVED = {
    "A01-0005": "Script over Fandom per-building requirement tables (raw/A-pilot/fandom-building-tables.md, now facts/A01/data/building-levels.csv): for target CH N, take the transitive closure of prerequisites (A01-0004 rules), sum raw build times of levels 2..L per building (level-1 construction ignored), no speed buffs. Inputs: A01-0001, A01-0004 (both media). Confidence = min(inputs) lowered to baixa because A01-0009 (early unlocks) is contested.",
    "A04-0006": "Arithmetic: 100 gems/day (A04-0001) × 7 and × 30. Other sources listed as unquantified. Inputs: A04-0001 (media), A04-0003 (media), A04-0004 (baixa), A10-0005 (alta).",
    "A05-0007": "day ≈ 9 + (threshold − base9)/rate, with base9 = 1,080 VIP pts after the 9-day streak ramp (40+60+…+200) and rate 200/day (chest only) or 300/day (chest + 100 gems/day at 1 gem = 1 VIP pt); thresholds from A05-0001 read as CUMULATIVE totals. Inputs: A05-0001 (media; cumulative reading supported only by T4), A05-0003 (media), A04-0001 (media), A05-0004 (media).",
}
METODO_EXTRA = {
    "A04-0007": "Derived gem/min values = gem price ÷ speedup minutes (e.g. 240 gems ÷ 480 min = 0.5).",
    "A04-0010": "Derived 170 min/day = 5×5 (training) + 5×5 (building) + 8×5 (research) + 16×5 (universal) from the Fandom Daily Objectives chest table (2020 revision).",
    "A09-0002": "Minimum 30 AP = 50 − 10 (streak) − 10 (Insight).",
    "A09-0006": "Weekly free AP (derived) = 7 × 100 (60-pt chest) + 30 × 100 (VIP shop, VIP2+) + 7 × 500 (daily AP claim, T1 1.0.41) = 7,200 AP/week if all claimed; 360,000 food/week for the VIP-shop part.",
    "A03-0024": "Received = sent × (1 − tax): sending 1.27× needed at 21% tax, 1.11× at 10%.",
    "A12-0004": "VIP/$ ratios = VIP points ÷ price per tier.",
    "A05-0003": "A missed day costs up to 160+140+…+20 = 720 VIP points over the next 8 days (ramp restarts at 40).",
}

PERFIL_FIX = {}  # filled automatically: 'farm' in perfil -> funcao

FUNCAO = {
    "A03-0027": ["farm"], "A13-0001": ["farm"], "A13-0002": ["farm"], "A13-0003": ["farm"], "A13-0004": ["farm"],
    "A13-0005": ["farm"], "A13-0006": ["farm"], "A13-0007": ["farm"], "A13-0008": ["farm"], "A13-0009": ["farm"],
    "A13-0010": ["farm"], "A03-0026": ["farm"], "A06-0512": ["lutador"], "A08-0503": ["lutador"], "A08-0504": ["lutador"],
}

VERSAO_MIN = {
    "A01-0011": "1.1.01", "A09-0008": "1.1.01", "A10-0005": "1.0.79", "A03-0025": "1.0.90", "A03-0030": "1.0.44",
    "A03-0032": "1.0.84", "A09-0001": "1.0.41", "A10-0007": "1.1.09", "A05-0002": "1.1.09", "A14-0002": "1.1.01",
    "A03-0016": "1.0.49",
}

INVALIDADO = {
    "A05-0002": "C04-0004",
    "A10-0001": "C04-0004",
    "A11-0503": "C04-0022",
    "B01-0501": "C04-0007",
    "B01-0503": "C04-0002",
    "A03-0022": "1.0.49 (2021-08-03)",
}

# Overrides: status, confianca, consenso, afirmacao, titulo, valores (replace), conflitos, data_validade, extra note
O = {}

O["A09-0001"] = dict(
    titulo="Action Points: cap 1,500 (raised from 1,000 in 1.0.41, Dec 2020) plus a claimable 500 AP/day; base regeneration rate NOT found",
    afirmacao="Since update 1.0.41 (2020-12-15) the maximum Action Points is 1,500 (previously 1,000) and every governor can claim an extra 500 free AP per day; VIP 15 adds +100 to the AP limit (more at higher VIP). AP regenerate over time; recovery speed is increased by VIP (from VIP2), civilization (Germany +10%, China +5%), the Shrine of Radiance holy site (+20%) and map runes (up to +15%). The base regeneration rate per hour was not found in any accessible source.",
    valores=[{"chave": "AP cap (no buffs)", "valor": "1,500 (since 1.0.41; 1,000 before)", "unidade": "AP"},
             {"chave": "daily AP claim", "valor": "500 per day (since 1.0.41); claimable above cap since 1.1.02", "unidade": "AP"},
             {"chave": "VIP15 AP limit", "valor": "+100", "unidade": "AP"},
             {"chave": "AP recovery buffs", "valor": "VIP 1.05x (VIP2) → 1.15x (VIP8); Germany +10%; China +5%; Shrine of Radiance +20%; runes up to +15%", "unidade": ""},
             {"chave": "base regen rate", "valor": "UNKNOWN (gap L-A09-01; T0)", "unidade": "AP/hour"}],
    status="verificado", confianca="alta", data_validade="2025-12-12",
    nota="CORRECTED in wave 2: the card previously said cap = 1,000 based on the Lyceum quiz answer (src:rkg-lyceum) — that quiz question predates T1 patch 1.0.41, which raised the cap to 1,500. No later official change to the cap found in the 832 official posts. The unverifiable appgamer '1,500' snippet was in fact right. T0 check: AP bar maximum on a fresh account (day 1).")
O["A09-0006"] = dict(
    afirmacao="Recurring free AP for F2P: a Daily Action Points claim of 500 AP (T1 1.0.41; since 1.1.02 claimable whenever AP is below the cap and may push AP above it); one Basic AP Recovery (100 AP) per day from the 60-activity-point Daily Objectives chest; up to 30 Basic AP Recovery (100 AP) per week from the VIP Shop at 12,000 food each (VIP 2+); Emergency AP Recovery (50 AP) from alliance gifts; larger AP items from events.",
    status="verificado", confianca="media",
    nota="Gap closed in wave 2: daily claim amount = 500 AP (official 1.0.41 notes, 2020-12-15). Whether 500 is still the amount in 2026 is not restated officially → T0 check on day 1.")
O["A01-0008"] = dict(status="verificado", confianca="alta",
    nota="Wave 2: T1 1.0.41 (2020-12-15) states lower-level hospital capacity was increased — explains why src:rkg (older table) shows 3,000 at Lv1 vs Fandom 7,500.")
O["A01-0009"] = dict(
    afirmacao="Early prerequisites conflict: Fandom per-building pages (deliberately edited in 2026 by a player-editor) say Academy Lv.1 needs CH6, the first Quarry unlocks at CH6, and Trading Post Lv.1 needs CH12; the Fandom CH table (old developer dataset) and riseofkingdomsguides say Academy/Quarry at CH4 and Trading Post at CH10 (+ Goldmine 1). Most probable current values: Academy CH6, Quarry CH6, Trading Post CH12 — pending T0.",
    status="contestado", confianca="baixa",
    nota="Wave 2 evidence: Fandom revision comments — Academy/Requirements 2026-01-04 'u unlock academy at level 6'; Tavern/Requirements 2026-01-05 'You don’t unlock quarry till ch 6 omfg this mistake is everywhere'; CH/Requirements 2026-01-04 removed 'Quarry (1st)' from CH4; Trading Post/Requirements 2026-08-11 'updated the building requirement from CH lv 10 -> 12'; Trading Post main page has had 1stUnlockCH=12 since a 2019 edit. These are observations by editors (T2, unconfirmed); src:rkg copies the old dataset. All become observable on a fresh account in the first hours (CH4–CH12) → T0 protocol day 1–7.")
O["A03-0001"] = dict(status="contestado", confianca="media",
    nota="Wave 2: downgraded alta→media and contested on the STONE unlock level only: Fandom editors changed the first Quarry unlock from CH4 to CH6 in Jan 2026 (see A01-0009); gold at CH10 and gold uses unchanged.")
O["A03-0005"] = dict(status="contestado", confianca="baixa",
    nota="Wave 2: Quarry #1 unlock CH4 is contested (Fandom edit 2026-01-04 says CH6; see A01-0009). Lumber Mill and Goldmine unlock params verified verbatim in wikitext.")
O["A03-0025"] = dict(status="contestado", confianca="media",
    afirmacao="Per-trip transport capacity: official patch 1.0.90 (Jan 2025) raised Trading Post L25 capacity from 5,000,000 to 10,000,000, matching the Fandom table (L1 10,000, L15 1.6M, L24 4.0M, L25 10M). Guide tables (riseofkingdomsguides; heaven-guardian copies it: L1 5,000, L15 800K, L24 2.0M, L25 2.5M) are half of the wiki and do not match even the pre-1.0.90 L25 value → outdated. Unlock CH: CH12 is most probable (Fandom TP page since 2019 + Requirements page corrected 10→12 on 2026-08-11) vs CH10 in the old CH table — pending T0.",
    nota="Wave 2: L25 = T1; L1–L24 = Fandom only (T2 single). Unlock conflict narrowed, not closed.")
O["A03-0027"] = dict(
    titulo="Gold CAN be sent via Trading Post (only the amount above Storehouse protection is sendable)",
    afirmacao="Resolved in wave 2 (pending T0): gold is one of the four resources selectable in resource assistance (heaven-guardian walk-through: 'Choose Food, Wood, Stone, or Gold'); a 2021 player report describes being able to donate gold, and the limiting rule is that only resources above Storehouse protection can be sent (T1 1.0.44, A03-0030). The Theria Games claim that gold cannot be transferred is contradicted.",
    status="verificado", confianca="media", consenso="majoritario",
    nota="Wave 2: verbatim quote re-located in heaven-guardian HTML (it was a WebFetch summary). Reddit 2021 threads (Arctic Shift): 'I could only donate gold and 2k worth of food' + reply 'You can only donate whatever excess you have over your storehouse capacity'. A 2021 thread asking 'how do I send gold' was explained by the storehouse rule. riseofkingdomsguides 'farm gold on main to avoid transfer taxes' also implies gold is transferable. Remaining doubt: whether gold assistance unlocks at a specific Trading Post level — T0 (screenshot the assistance screen when the Trading Post unlocks).")
O["A03-0020"] = dict(status="verificado", confianca="baixa",
    nota="Wave 2: downgraded media→baixa — the 10/20-gem deposit sizes come from src:rkg only; src:boostroom copies them ('Current references list'). Jewelry tech requirement (Fandom) stands. Canonical card for deposit sizes: A04-0004 (same confidence). T0: gather one Lv1 and one Lv2 gem deposit and note gems + minutes.")
O["A03-0022"] = dict(status="parcialmente_obsoleto", confianca="baixa",
    nota="Wave 2: the author yields (2019–2020) pre-date T1 1.0.49 (2021-08-03): +25% resource-point deposits and +10% base gathering speed. Order-of-magnitude claim (gathering ≫ buildings) still plausible; numbers obsolete.")
O["A03-0016"] = dict(status="verificado", confianca="media",
    nota="Wave 2: T1 1.0.49 (2021-08) adds context: deposits on all node levels were raised 25% and base gathering speed 10% (gem deposits excluded). Node amounts per level remain a gap (L-A03-01).")
O["A03-0024"] = dict(status="verificado", confianca="alta",
    nota="Wave 2: 8% minimum tax corroborated by an official dev-feedback post (2023-11-03) where the team rejects lowering 'the resource assistance tax rate to -5% instead of -8%'. Fandom table re-read via API (rev 2026-08-11). src:rkg table quote re-located verbatim (was WebFetch).")
O["A05-0001"] = dict(status="verificado", confianca="media",
    nota="Wave 2: CUMULATIVE reading now supported by T4 arithmetic — r/RiseofKingdoms (2026-05-15): 'It's 138k VIP points from 6 to 10' = 150,000 − 11,500, and 'Vip 10 costs 150 k vip points'. Still needs T0 (VIP screen shows 'points to next level'). src:rkg table is a copy of Fandom (not independent). VIP19/SVIP thresholds not collected (irrelevant for F2P).")
O["A05-0002"] = dict(status="parcialmente_obsoleto", confianca="baixa",
    nota="Wave 2: canonical card for VIP buffs (A03-0002 and C04-0004 point here for VIP production). Production columns obsolete since 1.1.09 (C04-0004); other columns unverified after the 1.0.87 VIP19/SVIP update. T0: screenshot VIP buff list at each VIP level reached.")
O["A05-0007"] = dict(status="verificado", confianca="baixa", consenso="n/a",
    nota="Wave 2: arithmetic re-run and correct given the inputs; cumulative assumption now T4-supported (A05-0001). Remains an UPPER bound (ignores alliance gifts, events, quest gems). MTG timing (A11-0502) matters: gems saved for More Than Gems go to VIP later but earn extra rewards.")
O["A04-0004"] = dict(status="verificado", confianca="baixa",
    nota="Wave 2: canonical card for gem-deposit size; src:boostroom repeats the same numbers but copies src:rkg (not independent).")
O["A04-0007"] = dict(status="verificado", confianca="media",
    nota="Wave 2: re-checked against Fandom Buildings/Shop (rev 2023-10-12) VIP Shop table: AP 12,000 food VIP2 qty 30; 5m universal 7,000 food VIP3; 8h universal 240 gems VIP7 qty 20; Legendary sculpture 2,000 gems VIP13 qty 20 — identical to src:rkg, which therefore copies Fandom (one independent T2). Restock: 'Items are replenished each Monday at 00:00 UTC' (Fandom). Table: facts/A04/data/vip-shop.csv.")
O["A10-0001"] = dict(status="parcialmente_obsoleto", confianca="baixa")
O["A10-0007"] = dict(status="verificado", confianca="media",  # 5% part is single T3 (A03-0010)
    nota="Wave 2 DEDUP: this card overlaps A03-0009 (+25% in territory), A03-0010 (5% to alliance storage) and A03-0013 (Enhanced Gathering). Canonical mechanics live in A03; this card is kept only as the routine-facing summary and should not be counted as independent evidence.")
O["A03-0009"] = dict(nota="Wave 2: canonical card for the +25% territory bonus (A10-0007 duplicates it).")
O["A03-0002"] = dict(nota="Wave 2: VIP production bonuses → canonical card A05-0002 (+ C04-0004); this card stays the building-output table (facts/A03/data/resource-buildings.csv).")
O["A11-0502"] = dict(
    afirmacao="More Than Gems (2-day event with daily gem-spend milestones) is the best window for F2P to spend gems (except below VIP 6). Reported tiers: 7,000 gems/day → 5 universal legendary sculptures; 25,000/day → 13 (26 over 2 days). Cadence: 2025–2026 players report it roughly MONTHLY (start or end of the month), and only in kingdoms older than ~21 days.",
    status="verificado", confianca="media", consenso="majoritario",
    nota="Wave 2 conflict resolution: T3 said every 2–3 months (src:rkg, old) vs 4–6 weeks (src:packsify). Six 2026 Reddit comments (T4) agree on ~monthly and on the 2-day/25k structure; an official 2023 dev reply says MTG 'is currently in the ideal interval' (no number). Monthly is the working assumption; T0: record every MTG start date in the kingdom calendar.")
O["A11-0503"] = dict(status="parcialmente_obsoleto", confianca="baixa",
    nota="Wave 2: gem-per-spin math is obsolete wherever Spin Tickets are required (Season 2/3/SoC since 2025; Season 1 since 1.1.12 per T3, C04-0022). Home-kingdom (pre-KvK) wheel pricing is unverified → T0 screenshot of the first Wheel of Fortune.")
O["A11-0509"] = dict(status="verificado", confianca="baixa",
    nota="Wave 2: existence of Champions of Olympia in 2026 CONFIRMED by T1 (1.1.01 Nov 2025 and 1.1.06 Mar 2026 patch notes). The 'most F2P-friendly' opinion remains single-source.")
O["A11-0507"] = dict(status="verificado", confianca="baixa",
    nota="Wave 2: Sunset Canyon still exists (T1 1.1.03, Jan 2026). '5 free attempts/day' still single-source → T0.")
O["A10-0008"] = dict(status="verificado", confianca="media",
    nota="Wave 2: Sunset Canyon confirmed live in Jan 2026 (T1 1.1.03).")
O["A11-0513"] = dict(status="verificado", confianca="media",
    nota="Wave 2: upgraded baixa→media — T1 patch notes confirm Sunset Canyon (Jan 2026), Champions of Olympia (Mar 2026) and Arms Training with Lohar (Apr 2026) as live.")
O["A06-0514"] = dict(status="verificado", confianca="baixa", consenso="fonte_unica",
    nota="Wave 2: the 'Feb 2026 talent rework' (1.1.04, C04-0011) only changed the EFFECTS of specific damage-reduction talents/inscriptions and applies only to Season 2+; no official note restructures the talent trees. Quick Study / Trophy Hunter are not among the changed talents → risk lowered; quote now verbatim.")
O["A06-0502"] = dict(status="verificado", confianca="media", consenso="majoritario",
    nota="Wave 2: T4 split — 'you should be running a sun/ysg' vs 'F2P should skip YSG imo' (low spenders can) — YSG is the consensus *long-term* gold-head target but a hardcore/low-spender pick for KvK1.")
O["A06-0501"] = dict(status="verificado", confianca="media",
    nota="Wave 2: T4 (r/RiseofKingdoms 2026-10-08) 'Sun Tzu/Aethelflaed is always top 1-2 for any F2P kvk1 lineup' — independent confirmation.")
O["A06-0504"] = dict(status="verificado", confianca="media")
O["A06-0508"] = dict(nota="Wave 2: since 1.1.09 (C04-0005, T1) Legendary Pelagius upgrade event runs from kingdom day 5 — the 'early-server monster' view now applies to every new kingdom; still divided.")
O["A08-0500"] = dict(status="verificado", confianca="media",
    nota="Wave 2: T4 adds a timing anchor: 'getting T4, which is usually around the 30 day mark' (2026-05).")
O["A11-0505"] = dict(status="verificado", confianca="media", consenso="majoritario",
    nota="Wave 2: T4 independent support ('spend all your AP including pots on the Lohar events in the early game'); Arms Training/Lohar still live in 2026 (T1 1.1.07).")
O["A05-0008"] = dict(status="verificado", confianca="media")
O["A11-0504"] = dict(status="verificado", confianca="media")
O["B01-0500"] = dict(status="verificado", confianca="media")
O["B01-0501"] = dict(
    afirmacao="Season sequence: Preparation Season → Season 1 (KvK1) → Season 2 → Season 3 → Season of Conquest (rotating stories: Heroic Anthem first, then e.g. Strife of the Eight, Desert Conquest, King of the Nile, Siege of Orléans, Storm of Stratagems, Tides of War, Alliance Invictus, Shifting Gears, Keener Blades, Song of Troy). Season 3 is moving from 'Light and Darkness' to King of All Britain (pioneer since May 2026).",
    status="parcialmente_obsoleto", confianca="media",
    nota="Wave 2 corrections: (1) 'Tides of War not found' was wrong — it is an official SoC story (1.0.76, C04-0017); (2) KvK3 = Light and Darkness is outdated for kingdoms where King of All Britain runs as Season 3 (C04-0007). Canonical lifecycle: context/game-state-and-patch-timeline.md.")
O["B01-0502"] = dict(status="contestado", confianca="baixa",
    nota="Wave 2: T4 (2026-09) says 'All KvK’s last 50 days each'; T1 set Heroic Anthem to 50 days (1.0.76). The 60-day KvK1 figure (src:onechilledgamer, 2024) is contested. No official day table (gap L-B01-02).")
O["B01-0503"] = dict(status="parcialmente_obsoleto", confianca="baixa",
    afirmacao="Entering the Lost Kingdom requires City Hall 17 (single T3, age unknown). The older rule 'the map opens after Eve of the Crusade' is outdated: Eve of the Crusade starts after entering the Lost Kingdom in SoC (T1 1.0.95) and, per 1.1.12 (T3) and a 2026 player report, the first ~6 days of pre-KvK now overlap the opening of the Lost Kingdom in Season 1 too.",
    nota="Wave 2: CH17 entry requirement still single-source (T0 or T1 needed; L-B01-03).")
O["A01-0001"] = dict(status="verificado", confianca="media",
    nota="Wave 2: all rows re-read from Fandom wikitext (rev 2026-01-04) → facts/A01/data/city-hall.csv. Editor note 'raw values … provided by the game developers' is in the wikitext HTML comment (verbatim). Note the 2026-01-04 edit removed 'Quarry (1st)' from CH4 (A01-0009). No T0/T1 confirmation yet.")
O["A01-0006"] = dict(status="verificado", confianca="alta")
O["A01-0011"] = dict(status="verificado", confianca="alta")
O["A10-0005"] = dict(status="verificado", confianca="alta")
O["A14-0002"] = dict(status="verificado", confianca="alta")
O["A09-0008"] = dict(status="verificado", confianca="alta",
    nota="Wave 2: 1.1.02 (2025-12) also allows auto-peacekeeping to attack Marauders during Eve of the Crusade (T1). Introduction date/unlock level still unknown (L-A09-04).")
O["A02-0500"] = dict(nota="Wave 2: heaven-guardian page unreachable on re-check (connection reset); other quotes verbatim.")
O["A12-0004"] = dict(status="verificado", confianca="baixa",
    nota="Wave 2: values present on the heaven-guardian top-up page but the quoted text was a WebFetch summary of a table (literal row text not re-located); src:heaven-guardian is a top-up seller (CoI).")
O["A13-0001"] = dict(nota="Wave 2: the appgamer snippet could not be re-fetched (403) — unverified.")
