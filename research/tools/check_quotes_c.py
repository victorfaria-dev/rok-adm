"""Quote re-check for C01/C02/C04 + B01-0001..0003 (migration v2, 2026-10-13).
Run from a work dir that holds pages/ (fetched by fetch step: curl per URL, forum via /api/v2/posts/<id>, Fandom via api.php parse,
GitHub READMEs via raw.githubusercontent.com in extra/gh_*.md, Reddit via Arctic Shift in extra/rd_*.json). Writes qc.json
(copy kept in tools/data/quote_check_migration_c.json)."""
import yaml,glob,re,json,os,html,sys
R='/home/user/rok-adm/research/facts/'
files=sorted(glob.glob(R+'C0[124]/C*-[0-9]*.md'))+[R+'B01/B01-000%d.md'%i for i in (1,2,3)]
idx=json.load(open('pages/index.json'))
def norm(t):
    t=html.unescape(t)
    t=t.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"').replace('–','-').replace('—','-').replace('\xa0',' ')
    t=re.sub(r'\s+',' ',t).lower()
    return t
def text_of(u):
    gh=re.match(r'https://github.com/([^/]+/[^/?#]+)',u)
    if gh:
        p='extra/gh_'+gh.group(1).replace('/','_')+'.md'
        return open(p).read() if os.path.exists(p) else None
    rd=re.search(r'reddit.com/r/\w+/comments/(\w+)',u)
    if rd:
        t=''
        for k in ('post','comments'):
            j=json.load(open(f'extra/rd_{rd.group(1)}.{k}.json'))
            for x in j.get('data') or []:
                t+=' '+(x.get('title') or '')+' '+(x.get('selftext') or '')+' '+(x.get('body') or '')
        return t
    p='pages/'+idx[u]+'.html'
    b=open(p,'rb').read().decode('utf-8','replace')
    if 'forum-global' in u:
        j=json.loads(b); c=j['posts'][0]
        return (c.get('title') or '')+' '+c['content']+' '+(c.get('plain_content') or '')
    if 'fandom.com/wiki' in u:
        return json.loads(b)['parse']['text']['*']
    if len(b)<9000 and ('Just a moment' in b or 'have been blocked' in b or 'Access Denied' in b or 'HTTPCODE 000' in b or 'HTTPCODE 5' in b or '"message":"GitHub' in b):
        return None
    try: b2=b.encode().decode('unicode_escape',errors='ignore').encode('latin-1',errors='ignore').decode('utf-8',errors='ignore')
    except Exception: b2=''
    return b+' '+b2
def strip(t):
    t=re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>',' ',t) if False else t
    t2=re.sub(r'<[^>]+>',' ',t)
    return t2
res=[]
for f in files:
    d=yaml.safe_load(re.match(r"---\n(.*?)\n---",open(f).read(),re.S).group(1))
    for i,s in enumerate(d['fontes']):
        u=s['url']; q=str(s['trecho'])
        t=text_of(u)
        r={'card':d['id'],'i':i,'src':s['id'],'url':u,'q':q}
        if t is None:
            r['status']='unreachable'
        else:
            T=norm(strip(t)); T2=norm(t)
            frags=[norm(x).strip(' "\'.,;:') for x in re.split(r'\.\.\.|…|\[\.\.\.\]|\[[^\]]*\]',q)]
            frags=[x for x in frags if len(x)>3]
            ok=[x for x in frags if x in T or x in T2]
            toks=re.findall(r'[a-z0-9]+',norm(q)); Ts=set(re.findall(r'[a-z0-9]+',T+' '+T2))
            cov=sum(1 for x in toks if x in Ts)/max(1,len(toks))
            r['cov']=round(cov,2); r['frags']=f'{len(ok)}/{len(frags)}'
            r['status']='verbatim' if frags and len(ok)==len(frags) else ('near' if cov>=0.9 and ok else ('partial' if cov>=0.6 else 'not_found'))
        res.append(r)
json.dump(res,open('qc.json','w'),indent=1)
from collections import Counter
print(Counter(r['status'] for r in res))
for r in res:
    if r['status']!='verbatim': print(r['card'],r['i'],r['status'],r.get('cov'),r.get('frags'),r['url'][:60],'|',r['q'][:140])
