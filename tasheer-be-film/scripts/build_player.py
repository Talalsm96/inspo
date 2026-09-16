#!/usr/bin/env python3
"""Wrap a rendered MP4 in a self-contained, scrub-anywhere HTML player (Tasheer navy).

Usage: build_player.py Film.mp4 Film.html --title "…" [--beats "0:Establish,2.4:Plan,…"]
The MP4 is embedded as base64, so the HTML is a single shareable file.
"""
import argparse, base64, html
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('mp4'); ap.add_argument('out')
ap.add_argument('--title', default='Tasheer film')
ap.add_argument('--beats', default='', help='comma list of seconds:label markers')
a = ap.parse_args()
b64 = base64.b64encode(Path(a.mp4).read_bytes()).decode()
beats = [(float(s), l) for s, l in (p.split(':', 1) for p in a.beats.split(',') if ':' in p)]
markers = ''.join(f'<button class="beat" data-t="{t}">{html.escape(l)}</button>' for t, l in beats)
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>{html.escape(a.title)}</title>
<style>
:root{{--navy:#17458C;--n70:#5D7DAF;--n30:#B9C7DC;--n10:#E7ECF3;--ink:#333}}
body{{margin:0;background:#fff;font-family:Cairo,system-ui,sans-serif;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px}}
h1{{font-size:22px;color:var(--navy);margin:0}}
video{{width:min(1280px,96vw);aspect-ratio:16/9;background:#fff;border:1px solid var(--n30);border-radius:8px}}
.bar{{width:min(1280px,96vw);display:flex;align-items:center;gap:12px}}
button{{font:inherit;border:1px solid var(--n30);background:#fff;color:var(--navy);border-radius:6px;padding:6px 14px;cursor:pointer}}
button:hover{{background:var(--n10)}}
input[type=range]{{flex:1;accent-color:var(--navy)}}
.time{{font-variant-numeric:tabular-nums;min-width:96px;text-align:right;color:var(--n70)}}
.beats{{display:flex;flex-wrap:wrap;gap:8px;width:min(1280px,96vw)}}
</style></head><body>
<h1>{html.escape(a.title)}</h1>
<video id="v" src="data:video/mp4;base64,{b64}" playsinline></video>
<div class="bar"><button id="p">Play</button><input id="s" type="range" min="0" max="1000" value="0"><span class="time" id="t">0.00 s</span></div>
<div class="beats">{markers}</div>
<script>
const v=document.getElementById('v'),p=document.getElementById('p'),s=document.getElementById('s'),t=document.getElementById('t');
p.onclick=()=>v.paused?v.play():v.pause();
v.onplay=()=>p.textContent='Pause';v.onpause=()=>p.textContent='Play';
v.ontimeupdate=()=>{{if(!s.matches(':active'))s.value=v.currentTime/v.duration*1000;t.textContent=v.currentTime.toFixed(2)+' s'}};
s.oninput=()=>{{v.currentTime=s.value/1000*v.duration;t.textContent=v.currentTime.toFixed(2)+' s'}};
document.querySelectorAll('.beat').forEach(b=>b.onclick=()=>{{v.currentTime=+b.dataset.t;v.pause()}});
document.addEventListener('keydown',e=>{{if(e.key===' '){{e.preventDefault();p.click()}}if(e.key==='ArrowRight')v.currentTime+=1/30;if(e.key==='ArrowLeft')v.currentTime-=1/30}});
</script></body></html>'''
Path(a.out).write_text(page)
print(a.out, f'{Path(a.out).stat().st_size/1e6:.1f} MB')
