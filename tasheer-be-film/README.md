# Business Excellence — 2025 achievements, 2026 plan

A 90-second Tasheer film about the Business Excellence Department: what 2025
delivered and what 2026 plans, one station per subject. Built with Motion Canvas
(`tasheer-motion-canvas`), rendered headlessly to `BE_Achievements_2025.mp4`
(1920×1080 / 30 fps) plus a scrub-anywhere HTML player with beat markers.

## The film

One world, ten stations on a bent path 2000 px apart, joined by a dashed route
that a 34 px guide dot rides and that closes back into the Business Excellence
hub. Establish → track/push-in per station → data beat inside the station →
pull-back finale → lockup.

Every station is the same object: a 1400×760 enclosure, a 58 px heading, an icon
slot above the connector, and a two-panel interior — **left = 2025 Achieved**
(solid navy objects, counters) and **right = 2026 Plan** (NAVY_50 outline
objects, checklist pills). The 2025 side always animates first; the 2026 side
arrives as outlines, so "done" versus "next" reads by fill, never by colour.

The beat sheet is the comment at the top of `src/scenes/film.tsx`, and it is the
contract: each scene ends with `at(t)`, so the beats in the film match the beats
in the player. A 60-second cut drops scenes 3, 8 and 9 and carries them as
captions inside the neighbouring stations.

## Data

Every number on screen lives in the `DATA` literal at the top of
`src/scenes/film.tsx`, prepared at build time — the scene never computes from raw
cells. Axes start at 0, side-by-side charts share one scale, `niceMax` supplies
the headroom, count-ups land exactly on the true value, and a zero renders as a
baseline tick rather than invented height. Judgment is only ever position against
a dashed target line.

## Brand

Navy `#17458C` with tints 70/50/30/10 on white, deep navy `#103062` for the
closing ground, ink `#333333`. No red, green or gold anywhere, including in the
data. Flat 2D only — no gradients, shadows, faces or 3D. Cairo throughout. One
caption at a time, bottom-centre, 48 px, never changing mid-travel.

The close uses the drawn chevron-shield, because no official logo file was in the
session. To use the real mark, drop it in `public/` and pass it through:

```tsx
addLockup(view, {src: '/logo.svg', light: true});
```

## Building

```bash
npm install
npx tsc --noEmit -p .                                    # typecheck first, always
python3 scripts/render.py --stills 0.5 4 12 … --fps 10   # QA stills
python3 scripts/contact_sheet.py                         # then LOOK at stills/sheet.png
python3 scripts/render.py BE_Achievements_2025.mp4        # 30 fps H.264
python3 scripts/build_player.py BE_Achievements_2025.mp4 BE_Achievements_2025.html \
  --title "Business Excellence — 2025 achievements, 2026 plan" \
  --beats "0:Establish,4:Documentation,12:Audit,21:Improvement,27.5:SLA,37:Automation,46:Standards,55:Local Content,62.5:Reports,68:Training,74.5:Excellence,83.5:Finale,87:Lockup"
```

`npm start` opens the Motion Canvas editor on :9000 for voice-over timing.

Rendering needs Python Playwright with Chromium and ffmpeg with libx264 on PATH.

## Layout

- `src/tasheer.tsx` — house module: tokens, captions, counters, bars, lockup,
  plus the object grammar this film added (23 drawn icons, `panelStation`,
  `counterGrid`, `checklistPills`, `gaugeArc`, `rankedBars`, `funnelToStack`,
  `timelineBand`, `hubSpoke`, `flowBetween`, `pdcaRing`, `clockSweep`, `at`).
- `src/scenes/film.tsx` — beat sheet, `DATA`, the world, and scenes 0–12.
- `scripts/` — headless render, contact sheet, scrub-player builder.

## An Arabic cut

Same beat sheet with RTL captions: `addCaptionBar(view, {rtl: true})` and Arabic
caption strings. Cairo shapes Arabic natively, and the lockup already carries
تاشير.
