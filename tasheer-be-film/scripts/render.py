#!/usr/bin/env python3
"""Headless Motion Canvas renderer.

Usage:
  python3 scripts/render.py Film.mp4                # full render → MP4
  python3 scripts/render.py --stills 0 2.5 5.5 …    # PNG stills at given seconds → stills/
  python3 scripts/render.py --range 3 6 clip.mp4    # render only seconds 3–6

Starts the Vite dev server, drives the Motion Canvas editor in headless Chromium
(clicks RENDER, waits for it to finish), then encodes the PNG sequence with ffmpeg.
No GPL exporter needed: built-in image-sequence exporter + system ffmpeg.
"""
import argparse, json, os, shutil, socket, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output'
META = ROOT / 'src' / 'project.meta'


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def wait_port(port, timeout=60):
    t0 = time.time()
    while time.time() - t0 < timeout:
        with socket.socket() as s:
            s.settimeout(0.5)
            if s.connect_ex(('127.0.0.1', port)) == 0:
                return True
        time.sleep(0.3)
    raise RuntimeError('vite did not start')


def set_meta(fps=None, rng=None):
    meta = json.loads(META.read_text())
    saved = json.dumps(meta)
    if fps is not None:
        meta['rendering']['fps'] = fps
    if rng is not None:
        meta['shared']['range'] = list(rng)
    META.write_text(json.dumps(meta, indent=2))
    return saved


def run_render(headless=True, timeout_s=1800):
    from playwright.sync_api import sync_playwright
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    port = free_port()  # never reuse a port a stale server may still hold
    vite = subprocess.Popen(
        ['npx', 'vite', '--host', '127.0.0.1', '--port', str(port), '--strictPort'],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT,
    )
    try:
        wait_port(port)
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
            page = browser.new_page(viewport={'width': 1600, 'height': 1000})
            errors = []
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            page.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.status >= 400 and '127.0.0.1' in r.url else None)
            page.goto(f'http://127.0.0.1:{port}/', wait_until='networkidle')
            page.wait_for_selector('main', timeout=60000)
            page.evaluate("""async () => {
                await Promise.all(['400', '500', '600', '700'].map(w =>
                    document.fonts.load(w + ' 48px Cairo')));
                await document.fonts.ready;
            }""")
            time.sleep(1.5)
            page.click('#render')
            page.wait_for_selector('#render:not([data-rendering="true"])', timeout=timeout_s * 1000)
            time.sleep(0.5)
            browser.close()
            if errors:
                print('Browser console errors:', file=sys.stderr)
                for e in errors[:20]:
                    print('  ', e, file=sys.stderr)
    finally:
        vite.terminate()
        try:
            vite.wait(10)
        except subprocess.TimeoutExpired:
            vite.kill()
    frames = sorted(OUT.rglob('*.png'))
    if not frames:
        raise RuntimeError('no frames rendered — check the scene for errors')
    return frames


def encode(frames, out_mp4, fps):
    seq_dir = frames[0].parent
    # frames are named 000000.png … — ffmpeg pattern
    cmd = [
        'ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps),
        '-i', str(seq_dir / '%06d.png'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', str(out_mp4),
    ]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('output', nargs='?', default='Film.mp4')
    ap.add_argument('--fps', type=int, default=None)
    ap.add_argument('--range', nargs=2, type=float, metavar=('FROM', 'TO'))
    ap.add_argument('--stills', nargs='+', type=float, metavar='SECONDS')
    ap.add_argument('--stills-dir', default='stills')
    ap.add_argument('--headed', action='store_true')
    a = ap.parse_args()

    meta = json.loads(META.read_text())
    fps = a.fps or meta['rendering']['fps']

    saved = None
    try:
        if a.stills:
            # Render the full sequence once at working fps, then pick frames.
            saved = set_meta(fps=fps, rng=[0, None])
            frames = run_render(headless=not a.headed)
            d = ROOT / a.stills_dir
            d.mkdir(exist_ok=True)
            for t in a.stills:
                idx = min(int(round(t * fps)), len(frames) - 1)
                dst = d / f'still_{t:06.2f}s.png'
                shutil.copy(frames[idx], dst)
                print('still', t, '->', dst.relative_to(ROOT))
            print(f'{len(frames)} frames rendered ({len(frames)/fps:.2f} s)')
            return
        saved = set_meta(fps=fps, rng=a.range if a.range else [0, None])
        frames = run_render(headless=not a.headed)
        out = Path(a.output)
        if not out.is_absolute():
            out = ROOT / out
        encode(frames, out, fps)
        print(f'{out} — {len(frames)} frames @ {fps} fps = {len(frames)/fps:.2f} s')
    finally:
        if saved is not None:
            META.write_text(saved)


if __name__ == '__main__':
    main()
