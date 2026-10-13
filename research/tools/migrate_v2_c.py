# Usage: run from the work dir containing qc.json and pages/ (see check_quotes_c.py). One-shot: v1 input only.
"""Migrate C01/C02/C04 + B01-0001..0003 to schema v2 (wave 3, 2026-10-13)."""
import yaml,glob,re,json,os,sys
R='/home/user/rok-adm/research/'
SP=os.getcwd()+'/'
files=sorted(glob.glob(R+'facts/C0[124]/C*-[0-9]*.md'))+[R+'facts/B01/B01-000%d.md'%i for i in (1,2,3)]
QC={(r['card'],r['i']):r for r in json.load(open(SP+'qc.json'))}
IDX=json.load(open(SP+'pages/index.json'))
FD=json.load(open(R+'research/tools/data/forum_dates.json')) if False else json.load(open(R+'tools/data/forum_dates.json'))
DRY='--dry' in sys.argv
MAP={'CS01':'src:lilith-tos','CS02':'src:rok-official-site','CS03':'src:lilith-forum-legacy','CS04':'src:lilith-forum-legacy',
 'CS05':'src:appgamer','CS47':'src:appgamer','CS06':'src:rokhandbook','CS07':'src:rkg','CS08':'src:rkg','CS09':'src:rkg','CS10':'src:rkg',
 'CS11':'src:rok-guide','CS12':'src:allclash','CS13':'src:fandom','CS14':'src:theriagames','CS15':'src:rok-calculator','CS16':'src:metarok',
 'CS17':'src:rokhub','CS19':'src:codexhelper','CS20':'src:codexhelper','CS21':'src:davor-toolkit','CS22':'src:zoe-bot','CS23':'src:auctioneer-bot',
 'CS24':'src:rokstats-online','CS25':'src:rokstats-online','CS26':'src:rokstats-com','CS27':'src:botals','CS28':'src:apo-rok','CS29':'src:roksteward',
 'CS30':'src:heroscroll','CS31':'src:kingdomos','CS43':'src:apievangelist','CS44':'src:justia','CS45':'src:us-copyright','CS46':'src:alternativeto',
 'CS48':'src:everycalculators','S01':'src:lilith-forum','S02':'src:fandom','C04-S01':'src:ldshop','C04-S02':'src:allclash','C04-S03':'src:nedese',
 'C04-S04':'src:lootbar','C04-S05':'src:heaven-guardian','C04-S06':'src:change-org','PL01':'src:reddit','PL02':'src:lilith-forum',
 'PL14':'src:onechilledgamer','PL15':'src:heroscroll'}
for i in range(32,43): MAP['CS%d'%i]='src:github'
TODAY='2026-10-13'
# literal replacements: quote located on the page differs from the recorded trecho
FIX={('C01-0004',0):'"articles":649,"edits":13001,"images":1487,"users":44058386,"activeusers":2 ... "rightsinfo":{"url":"https://www.fandom.com/licensing","text":"CC-BY-SA"}',
 ('C01-0013',0):'Managed KvK Scans & DKP ... Daily full scans of every camp in your Lost Kingdom for the whole season, no scan tokens.',
 ('C01-0021',0):'Open Source Rise of Kingdoms Stats Management Tool. Track TOP X players in kingdom / alliance / honor leaderboard.',
 ('C01-0022',1):'**RoK Vision** is a high-performance **Cognitive OCR API** designed to transform *Rise of Kingdoms* screenshots into structured data.',
 ('C01-0029',1):'Daily updated in-game event tracker',
 ('C02-0001',2):'<a href="https://www.lilith.com/termofservice/?locale=en_US" target="_blank" alt="Terms of Service">TERMS OF SERVICE',
 ('C02-0015',1):'<a href="https://www.lilith.com/privacy/?locale=en_US" target="_blank" alt="privacy policy">PRIVACY POLICY'}
# manual literal decisions where the automatic matcher failed for markup/encoding reasons (checked by hand)
LITERAL_OK={('C01-0009',0):'markup between "$5" and "/ month"',('C02-0001',0):'text is double-escaped JSON (\\u005Cu201c)',
 ('C02-0001',1):'text is double-escaped JSON',('C02-0020',0):'checked with pdftotext'}
NOT_LITERAL={('C01-0002',0):'trecho is our own proxy error message, not page text (re-fetch 2026-10-13: "CONNECT tunnel failed, response 502")',
 ('C01-0027',1):'trecho is a summary of a GitHub search API result, not page text (github.com search not reachable on re-check)'}
# raw captures by curl that could not be re-fetched today
RAW_CURL={'ldshop.gg':'raw/patches/ldshop-gg.md','heaven-guardian.com':'raw/patches/community-misc.md'}
PUB={'https://www.lilith.com/termofservice/?locale=en_US':('2025-04-15','publicacao'),
 'https://www.ldshop.gg/blog/rise-of-kingdoms/update-starry-rendezvous.html':('2026-07-30','publicacao'),
 'https://www.ldshop.gg/blog/rise-of-kingdoms/halloween-guide.html':('2026-09-22','publicacao'),
 'https://heaven-guardian.com/rise-of-kingdoms-beginners-guide/':('2026-09-02',None),
 "https://riseofkingdoms.fandom.com/wiki/Items/Beginner's_Immigration":('2025-04-26','revisao'),
 'https://www.reddit.com/r/RiseofKingdoms/comments/1owb67g/':('2025-11-13','publicacao'),
 'https://www.reddit.com/r/RiseofKingdoms/comments/1rib4nk/':('2026-03-01','publicacao'),
 'https://www.reddit.com/r/RiseofKingdoms/comments/1wmcsf1/':('2026-09-21','publicacao')}
def pub_of(u):
    if u in PUB: return PUB[u]
    m=re.search(r'/post/(\d+)',u)
    if m:
        if m.group(1) in FD: return FD[m.group(1)],'publicacao'
        try:
            p=json.load(open(SP+'pages/'+IDX[u]+'.html'))['posts'][0]; return p['inserted_at'][:10],'publicacao'
        except Exception: return None,None
    if u in IDX:
        b=open(SP+'pages/'+IDX[u]+'.html','rb').read().decode('utf-8','replace')
        mo=re.search(r'(?:article:modified_time|dateModified)[^0-9]{0,40}(\d{4}-\d{2}-\d{2})',b)
        mp=re.search(r'(?:article:published_time|datePublished)[^0-9]{0,40}(\d{4}-\d{2}-\d{2})',b)
        if mo:
            d=mo.group(1)
            return d,('modificado_em_massa' if 'riseofkingdomsguides' in u and d=='2026-01-02' else 'modificado')
        if mp: return mp.group(1),'publicacao'
    return None,None
TIER={'src:lilith-forum':1,'src:lilith-tos':1,'src:rok-official-site':1,'src:lilith-forum-legacy':1,'src:fandom':2,'src:justia':2,'src:davor-toolkit':2,'src:us-copyright':1,'src:reddit':4}
ORDER=["id","dominio","titulo","tipo","metodo","afirmacao","valores","tabela","custo_tempo_min","custo_tempo_origem","perfil","funcao",
 "estagio_reino","fontes","versao_jogo","data_fonte","data_validade","versao_minima","invalidado_por","confianca","status","conflitos",
 "consenso","n_fontes_pro","n_fontes_contra","notas"]
stats=[]
for path in files:
    raw=open(path,encoding='utf-8').read()
    m=re.match(r"---\n(.*?)\n---\n?(.*)",raw,re.S); d,body=yaml.safe_load(m.group(1)),m.group(2)
    if 'data_referencia' not in d: print('already migrated?',path); continue
    cid=d['id']; notes=[]; fontes=[]; lit=[]
    for i,s in enumerate(d['fontes']):
        u=s['url']; q=QC[(cid,i)]; st=q['status']; tr=str(s['trecho'])
        if (cid,i) in FIX: tr=FIX[(cid,i)]; cl=True; st='fixed'
        elif (cid,i) in LITERAL_OK: cl=True; st='verbatim'
        elif (cid,i) in NOT_LITERAL: cl=False; st='not_literal'
        elif st in ('verbatim','near'): cl=True
        elif st in ('partial','not_found'): cl=False
        else: cl=None
        pd,pt=pub_of(u)
        fontes.append({'id':MAP[s['id']],'url':u,'trecho':tr,'acessado_em':str(s.get('acessado_em',TODAY)),'publicado_em':pd,
                       'publicado_em_tipo':pt,'citacao_literal':cl,'copia_de':None})
        lit.append((i,st,cl,u))
    # notes on quote check
    ok=sum(1 for x in lit if x[2] is True); fx=[x for x in lit if x[1]=='fixed']; nl=[x for x in lit if x[2] is False]; un=[x for x in lit if x[2] is None]
    qn=f"Quote re-check 2026-10-13 (curl/API + local parsing): {ok}/{len(lit)} literal"
    if fx: qn+=f" ({len(fx)} replaced by the literal text found on the page: source #{', #'.join(str(x[0]+1) for x in fx)})"
    if nl: qn+=f"; not literal: source #{', #'.join(str(x[0]+1) for x in nl)}"
    if un:
        parts=[]
        for x in un:
            host=next((h for h in RAW_CURL if h in x[3]),None)
            parts.append(f"#{x[0]+1}"+(f" (matches the curl capture in {RAW_CURL[host]}; site blocked/reset on re-check)" if host else " (blocked/snippet only)"))
        qn+="; not verifiable: source "+", ".join(parts)
    notes.append(qn+'.')
    for x in lit:
        if (cid,x[0]) in NOT_LITERAL: notes.append(f"Source #{x[0]+1}: {NOT_LITERAL[(cid,x[0])]}.")
    # perfil / funcao
    pmap={'baixo':'low','medio':'medium','alto':'high'}
    rp=[pmap.get(p,p) for p in d.get('perfil',['todos'])]
    moved=[p for p in rp if p in ('farm','lider','lutador','rally','guarnicao')]
    perfil=[p for p in rp if p not in moved] or ['todos']; funcao=moved or ['todas']
    pro={f['id'] for f in fontes if not f['copia_de']}
    dates=[f['publicado_em'] for f in fontes if f['publicado_em'] and f['publicado_em_tipo']!='modificado_em_massa']
    data_fonte=max(dates) if dates else None
    data_validade=str(d['data_referencia'])
    conf=d['confianca']; status=d['status']; tipo=d['tipo']
    tiers=[TIER.get(f['id'],3) for f in fontes]
    t2=len({f['id'] for f in fontes if TIER.get(f['id'],3)==2})
    if conf=='alta' and not any(t<=1 for t in tiers) and t2<2:
        conf='media'; notes.append('Confidence alta→media at migration: no T0/T1 source and fewer than two independent T2 sources.')
    if conf=='alta' and all(f['citacao_literal'] is not True for f in fontes if TIER.get(f['id'],3)<=1):
        conf='media'; notes.append('Confidence alta→media at migration: the only T0/T1 quotes could not be verified literally.')
    if status=='verificado' and nl: status='organizado'
    cons=d.get('consenso','n/a')
    if tipo=='estrategia' and len(pro)<=1: cons='fonte_unica'
    vm=None
    if cid.startswith('C04') and cid not in ('C04-0001','C04-0026'):
        mv=re.match(r'\s*(\d+\.\d+\.\d+)',str(d['versao_jogo'])); vm=mv.group(1) if mv else None
    if cid=='B01-0001': vm='1.0.95'
    notas=str(d.get('notas','')).strip()+f"\n[migration v2 2026-10-13] "+' '.join(notes)+f" v1 data_referencia was {d['data_referencia']}."
    new={'id':cid,'dominio':d['dominio'],'titulo':d['titulo'],'tipo':tipo,'metodo':'','afirmacao':d['afirmacao'],'valores':d.get('valores') or [],
         'tabela':'','custo_tempo_min':None,'custo_tempo_origem':None,'perfil':perfil,'funcao':funcao,'estagio_reino':d.get('estagio_reino',['todos']),
         'fontes':fontes,'versao_jogo':str(d['versao_jogo']),'data_fonte':data_fonte,'data_validade':data_validade,'versao_minima':vm,
         'invalidado_por':None,'confianca':conf,'status':status,'conflitos':d.get('conflitos') or [],'consenso':cons,
         'n_fontes_pro':len(pro),'n_fontes_contra':0,'notas':notas}
    fm=yaml.safe_dump({k:new[k] for k in ORDER},sort_keys=False,allow_unicode=True,width=4096,default_flow_style=None)
    out="---\n"+fm+"---\n"+(("\n"+body.lstrip("\n")) if body.strip() else "")
    if not DRY: open(path,'w',encoding='utf-8').write(out)
    stats.append({'id':cid,'conf0':d['confianca'],'conf':conf,'status0':d['status'],'status':status,'lit':[x[2] for x in lit],'fixed':len(fx),'n_pro':len(pro),'vm':vm,'df':data_fonte})
json.dump(stats,open(SP+'mig_stats.json','w'),indent=1)
print(len(stats),'cards')
