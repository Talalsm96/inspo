# Business Excellence — 2025 achievements, 2026 plan

A 90-second Tasheer film about the Business Excellence Department: what 2025
delivered and what 2026 plans, one station per subject. Built with Motion Canvas
(`tasheer-motion-canvas`), rendered headlessly to `BE_Achievements_2025.mp4` and
`BE_Achievements_2025_AR.mp4` (1920×1080 / 30 fps), each with a scrub-anywhere
HTML player carrying the beat markers.

## The film

One world, ten stations on a bent path 2000 px apart, joined by a dashed route
that a 34 px guide dot rides and that closes back into the Business Excellence
hub. Establish → track/push-in per station → data beat inside the station →
pull-back finale → lockup.

It is shot as a film, not played as a deck. The things that would make it read
as slides are deliberately absent:

- **No enclosure.** Each station is held by four corner brackets that sit
  outside the push-in frame, so they structure the wide shots and vanish the
  moment the camera arrives. Close up there is no box at all.
- **No bullets.** The 2026 side is plan *lines* — text that rises into place
  over a hairline drawn outward from its centre. No pills, no tick boxes.
- **A far layer** of faint NAVY_10 forms tracks the camera at 42 %, so the world
  has depth. Flat shapes only: the depth comes from parallax, never shading.
- **The camera is never parked.** Every arrival overshoots to 1.62 and settles
  back to 1.55 across the first content beat, and every station pans 150 px from
  the 2025 side to the 2026 side as the plan lines arrive — so each subject
  plays as two framings, with the earlier material bleeding off frame.
- **The rhythm varies.** The move that rounds the corner of the route, between
  stations 5 and 6, runs 2.0 s against the usual 1.6 s.

The reading logic is unchanged: **2025 is solid navy**, **2026 is outline**, so
"done" versus "next" reads by fill and never by colour. The two years are named
in full once, at the first station, and carried by year markers after that.

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
  `timelineBand`, `hubSpoke`, `flowBetween`, `pdcaRing`, `clockSweep`,
  `wrapTxt`, `setRtl`/`mirror`, `at`).
- `src/copy.ts` — every string in both languages, keyed by the English original.
- `src/scenes/film.tsx` — beat sheet, `DATA`, the world, and scenes 0–12.
- `scripts/` — headless render (`--lang`), contact sheet, scrub-player builder.

## The Arabic cut

`BE_Achievements_2025_AR.mp4` is the same scene, the same beat sheet and the
same numbers — only the strings and the reading direction change:

```bash
python3 scripts/render.py --lang ar BE_Achievements_2025_AR.mp4
```

All copy lives in `src/copy.ts`, keyed by its English original, so the two cuts
cannot drift apart: `t('41 new processes documented')` resolves per language and
a missing key fails loudly. Standards codes (ISO 9001, ISO/IEC 27001, EFQM) stay
in Latin, as they do in Tasheer's own Arabic material.

`setRtl()` flips the house module: the 2025 side moves to the right where Arabic
reading starts, blocks inside a station arrange right to left, flows run right to
left, the timeline sweeps right to left, and the intra-station pan follows. Chart
interiors keep their left-to-right axes, which is standard for Arabic data
visualisation.

**One Motion Canvas caveat worth knowing.** A `Txt` that combines `width` with
`textWrap` mis-places wrapped Arabic — the whole block lands about one
line-width to the right of its anchor. Single-line text is fine, and English is
fine. `wrapTxt()` works around it: in the RTL cut it breaks the lines itself and
stacks single-line `Txt` nodes, and in the LTR cut it uses the native path
untouched, so the English film is unaffected.
