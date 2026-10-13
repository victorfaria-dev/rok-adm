# Fetch every URL cited by C01/C02/C04 + B01-0001..0003 into ./pages/ (run from a scratch work dir).
import yaml,glob,re,json,os,subprocess,hashlib,sys
from urllib.parse import unquote
R='/home/user/rok-adm/research/facts/'
files=sorted(glob.glob(R+'C0[124]/C*-[0-9]*.md'))+[R+'B01/B01-000%d.md'%i for i in (1,2,3)]
urls=set()
for f in files:
    d=yaml.safe_load(re.match(r"---\n(.*?)\n---",open(f).read(),re.S).group(1))
    for s in d['fontes']: urls.add(s['url'])
out='pages/'; idx={}
UA_FF='Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
for u in sorted(urls):
    h=hashlib.md5(u.encode()).hexdigest()[:12]; idx[u]=h
    p=out+h+'.html'
    if os.path.exists(p) and os.path.getsize(p)>0: continue
    m=re.search(r'forum-global\.lilithgame\.com/rok/post/(\d+)',u)
    if m:
        cmd=['curl','-sS','-m','40','-H','language: en_US','https://forum-global.lilithgame.com/api/v2/posts/'+m.group(1)]
    elif 'fandom.com/wiki/' in u:
        t=u.split('/wiki/')[1].split('#')[0]
        cmd=['curl','-sS','-m','40','-A','rok-research/0.1','https://riseofkingdoms.fandom.com/api.php?action=parse&format=json&prop=text&page='+t]
    elif 'ldshop' in u:
        cmd=['curl','-sS','-m','40','--http1.1','-A',UA_FF,'-L',u]
    elif 'riseofkingdomsguides' in u:
        cmd=['curl','-sS','-m','40','-L',u]
    else:
        cmd=['curl','-sS','-m','40','-L','-A',UA_FF,'-w','\n<!--HTTPCODE %{http_code}-->',u]
    r=subprocess.run(cmd,capture_output=True)
    open(p,'wb').write(r.stdout)
    print(len(r.stdout),r.stderr.decode()[:80].strip(),u,flush=True)
json.dump(idx,open('pages/index.json','w'),indent=1)
