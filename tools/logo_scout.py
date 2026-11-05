"""Collect logo candidates from official sites into _cand/<slug>/ and build contact sheets."""
import os, re, sys, json, hashlib, urllib.parse, subprocess
import requests
from bs4 import BeautifulSoup
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      'Accept-Language': 'ru,en;q=0.8'}
SITES = json.load(open('tools/logo_sites.json'))
report = []
for slug, urls in SITES.items():
    out = f'_cand/{slug}'; os.makedirs(out, exist_ok=True); n = 0
    for base in urls:
        try:
            r = requests.get(base, headers=UA, timeout=20); r.raise_for_status()
        except Exception as e:
            report.append(f'{slug} {base} FAIL {e.__class__.__name__}'); continue
        soup = BeautifulSoup(r.text, 'html.parser'); cands = []
        for l in soup.find_all('link', rel=True):
            rel = ' '.join(l['rel']).lower()
            if 'icon' in rel and l.get('href'): cands.append(('icon', l['href']))
        for m in soup.find_all('meta'):
            if m.get('property') in ('og:image',) and m.get('content'): cands.append(('og', m['content']))
        for im in soup.find_all('img'):
            src = im.get('src') or im.get('data-src') or im.get('data-original') or ''
            attrs = ' '.join([src, im.get('alt', ''), ' '.join(im.get('class', [])), im.get('id', '')]).lower()
            par = ' '.join(' '.join(p.get('class', [])) for p in im.parents if hasattr(p, 'get'))[:400].lower()
            if src and ('logo' in attrs or 'logo' in par or 'header' in par): cands.append(('img', src))
        for i, sv in enumerate(soup.find_all('svg')):
            par = ' '.join(' '.join(p.get('class', [])) for p in sv.parents if hasattr(p, 'get'))[:400].lower()
            if 'logo' in par or 'logo' in ' '.join(sv.get('class', [])).lower():
                if len(str(sv)) > 300:
                    open(f'{out}/{n:02d}_inline.svg', 'w').write(str(sv)); report.append(f'{slug} {n:02d} inline-svg'); n += 1
        seen = set()
        for kind, u in cands:
            u = urllib.parse.urljoin(r.url, u)
            if u in seen or u.startswith('data:'): continue
            seen.add(u)
            try:
                d = requests.get(u, headers=UA, timeout=20)
                if d.status_code != 200 or len(d.content) < 200: continue
            except Exception: continue
            ext = os.path.splitext(urllib.parse.urlparse(u).path)[1].lower()[:5] or '.img'
            fn = f'{out}/{n:02d}_{kind}{ext}'; open(fn, 'wb').write(d.content)
            report.append(f'{slug} {n:02d} {kind} {len(d.content)} {u}'); n += 1
            if n >= 10: break
    if n == 0: report.append(f'{slug} NONE')
open('_cand/report.txt', 'w').write('\n'.join(report) + '\n')
print('\n'.join(report))
