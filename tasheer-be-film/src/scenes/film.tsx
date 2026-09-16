import {Camera, Circle, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  chain,
  sequence,
  waitFor,
} from '@motion-canvas/core';
import {
  DEEP,
  DOC_PLAIN,
  DOC_RIBBON,
  INK,
  NAVY,
  NAVY_10,
  NAVY_30,
  NAVY_50,
  NAVY_70,
  WHITE,
  addCaptionBar,
  addLockup,
  after,
  at,
  barGroup,
  checklistPills,
  clockSweep,
  counterGrid,
  datePill,
  drawBell,
  drawBriefcase,
  drawCalendar,
  drawCertificate,
  drawCheckCircle,
  drawClipboard,
  drawCreditCard,
  drawCycleArrows,
  drawDashboard,
  drawDocStack,
  drawDocument,
  drawEnvelope,
  drawGearsPair,
  drawLaptop,
  drawLightbulb,
  drawMagnifier,
  drawNotebook,
  drawPeopleGroup,
  drawPerson,
  drawPin,
  drawShieldCheck,
  drawStopwatch,
  drawTarget,
  flowBetween,
  funnelToStack,
  gaugeArc,
  mirror,
  hubSpoke,
  outlineBadge,
  panelStation,
  pdcaRing,
  rankedBars,
  setRtl,
  statCounter,
  timelineBand,
  txt,
  wrapTxt,
} from '../tasheer';
import {RTL, t} from '../copy';

/* ============================================================================
   Business Excellence Department — 2025 achievements, 2026 plan
   Combined story + data film, camera grammar. One world, ten stations on a bent
   path 2000 px apart, a dashed route and a guide dot. Every number below is in
   DATA, prepared at build time: axes from 0, niceMax headroom, count-ups land
   exactly on the true value.

   BEAT SHEET (sums to 90.0 s)
     t      scene                                     move                     dur
     0.0    0  Establish                              pull-back over the route  4.0
     4.0    1  BPM · Documentation                    track + push-in           8.0
    12.0    2  BPM · Compliance (Internal ISO Audit)  track + push-in           9.0
    21.0    3  BPM · Improvement                      track + push-in           6.5
    27.5    4  BPM · Service Level Agreements         track + push-in + crane   9.5
    37.0    5  Automation of Internal Services        track + push-in           9.0
    46.0    6  International Standards & Frameworks   track + push-in           9.0
    55.0    7  Local Content                          track + push-in           7.5
    62.5    8  TIC/PIF Reports                        track + push-in           5.5
    68.0    9  Training & Awareness                   track + push-in           6.5
    74.5   10  Excellence Framework                   track + push-in, crane    9.0
    83.5   11  Finale                                 pull-back to 0.38         3.5
    87.0   12  Lockup                                 fade world, reveal logo   3.0
                                                                        total  90.0
   A 60 s cut drops scenes 3, 8 and 9 and carries them as captions inside the
   neighbouring stations.
   ========================================================================== */

const DATA = {
  documentation: {newProcesses: 41, revamped: 68},
  audit: {
    audits: [
      {label: t('Completed'), value: 12},
      {label: t('Rescheduled'), value: 3},
    ],
    auditsMax: 15, // niceMax(12)
    findings: [
      {label: t('Major NC'), value: 0},
      {label: t('Minor NC'), value: 3},
      {label: t('Observation'), value: 9},
    ],
    findingsMax: 10, // niceMax(9)
    status: [
      {label: t('On target'), value: 7},
      {label: t('Complete'), value: 3},
      {label: t('No response'), value: 1},
      {label: t('Failed target, no plan'), value: 1},
    ],
    statusMax: 10,
    closedOrOnTarget: 80, // % — as reported in the deck
  },
  improvement: {minor: 48},
  sla: {
    finalised: 152,
    monitored: 115,
    byDept: [
      {label: t('Digital & Technology'), value: 50},
      {label: t('Cybersecurity'), value: 12},
      {label: t('GRC'), value: 12},
      {label: t('Legal'), value: 11},
      {label: t('Finance'), value: 10},
      {label: t('Admin'), value: 9},
      {label: t('Business Operations'), value: 9},
      {label: t('Business Excellence'), value: 8},
      {label: t('Human Capital'), value: 8},
      {label: t('Procurement'), value: 8},
      {label: t('Marketing'), value: 6},
      {label: t('Operations'), value: 5},
      {label: t('PMO'), value: 4},
    ],
    deptMax: 50, // niceMax(50)
  },
  automation: {
    funnel: [
      {label: t('All SLAs'), value: 152},
      {label: t('Eligible for automation'), value: 135},
      {label: t('Automated'), value: 115},
    ],
    funnelMax: 160, // niceMax(152)
    eligiblePct: 89, // 135 of 152
    automatedPct: 85, // 115 of 135
    newServices: 11,
    criteria: [
      {label: t('on system'), value: 50},
      {label: t('tracking'), value: 20},
      {label: t('reminder'), value: 10},
      {label: t('escalation'), value: 10},
      {label: t('dashboard'), value: 10},
    ],
  },
  localContent: {score: 75.81, target: 70, compliance: 96.25},
  reports: {submitted: 20},
};

/* ---------------------------------------------------------------- the world ---
   Two rows of five, 2000 px apart along the path, joined by a dashed route that
   runs in the corridor between them and closes back into the hub. Ten stations
   2000 px apart cannot all sit inside one 0.38 frame (that frame is 5053 px
   wide), so the establish and the finale hold 0.38 exactly and drift across. */

const ROW1 = -800;
const ROW2 = 800;
/** Wide shots bias the camera down so the bottom row clears the caption band. */
const WIDE_Y = 130;
const STATION_POS: [number, number][] = [
  [-4000, ROW1], [-2000, ROW1], [0, ROW1], [2000, ROW1], [4000, ROW1],
  [4000, ROW2], [2000, ROW2], [0, ROW2], [-2000, ROW2], [-4000, ROW2],
];
const HUB: [number, number] = [-5250, -800];

const ROUTE_PTS: [number, number][] = [
  [-5250, -620],                      // 0  hub exit
  [-4000, -300],                      // 1  station 1
  [-2000, -300],                      // 2  station 2
  [0, -300],                          // 3  station 3
  [2000, -300],                       // 4  station 4
  [4000, -300],                       // 5  station 5
  [4700, -200], [4950, 0], [4700, 200], // 6,7,8  the turn
  [4000, 300],                        // 9  station 6
  [2000, 300],                        // 10 station 7
  [0, 300],                           // 11 station 8
  [-2000, 300],                       // 12 station 9
  [-4000, 300],                       // 13 station 10
  [-4800, 240], [-5250, 0],           // 14,15  the return
  [-5250, -620],                      // 16 back into the hub
];
const ANCHOR = [1, 2, 3, 4, 5, 9, 10, 11, 12, 13];

const CUM: number[] = [0];
for (let i = 1; i < ROUTE_PTS.length; i++) {
  const [ax, ay] = ROUTE_PTS[i - 1];
  const [bx, by] = ROUTE_PTS[i];
  CUM.push(CUM[i - 1] + Math.hypot(bx - ax, by - ay));
}
const ROUTE_LEN = CUM[CUM.length - 1];
const uAt = (i: number) => CUM[i] / ROUTE_LEN;

/* The far layer. Sparse, faint, and deliberately off the station centres. */
const FAR_CIRCLES: [number, number, number][] = [
  [-5600, -1500, 420], [-3100, 1450, 300], [-900, -1850, 560], [1700, 1600, 380],
  [3900, -1700, 300], [5900, 900, 500], [-1900, 60, 240], [4600, 120, 200],
];
const FAR_RULES: [number, number, number][] = [
  [-4600, -2050, 2000], [-1200, 2050, 2600], [2600, -2150, 2200],
  [5200, 1950, 1800], [0, -60, 1400],
];
const FAR_DOTS: [number, number][] = [
  [-6100, 400], [-2600, -2000], [1100, -1950], [3300, 1850], [6100, -1300],
];

function pointAt(u: number): [number, number] {
  const d = Math.max(0, Math.min(1, u)) * ROUTE_LEN;
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < d) i++;
  const t = (d - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  const [ax, ay] = ROUTE_PTS[i - 1];
  const [bx, by] = ROUTE_PTS[i];
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
}

export default makeScene2D(function* (view) {
  setRtl(RTL); // before any node is built
  const M = mirror(); // -1 in the Arabic cut: blocks arrange right to left
  view.fill(WHITE);
  const cam = createRef<Camera>();
  const world = createRef<Node>();
  const far = createRef<Node>();
  view.add(
    <Camera ref={cam}>
      <Node ref={far} />
      <Node ref={world} />
    </Camera>,
  );
  // Parallax: the far layer follows the camera at 42 %, so it slides past at 58 %
  // of the world's speed. Flat NAVY_10 forms only — depth from motion, not shading.
  far().position(() => cam().position().mul(0.42));
  FAR_CIRCLES.forEach(([x, y, r]) =>
    far().add(<Circle x={x} y={y} size={r * 2} stroke={NAVY_10} lineWidth={4} />),
  );
  FAR_RULES.forEach(([x, y, w]) =>
    far().add(<Line points={[[x - w / 2, y], [x + w / 2, y]]} stroke={NAVY_10} lineWidth={3} />),
  );
  FAR_DOTS.forEach(([x, y]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        far().add(<Circle x={x + c * 46} y={y + r * 46} size={9} fill={NAVY_10} />);
      }
    }
  });
  const caption = addCaptionBar(view, {rtl: RTL}); // on view, outside the camera

  /* route, hub and guide dot */
  const route = createRef<Line>();
  const dot = createRef<Circle>();
  const hub = createRef<Node>();
  const routeU = createSignal(0);
  world().add(
    <>
      <Line ref={route} points={ROUTE_PTS} stroke={NAVY_30} lineWidth={5} lineDash={[18, 16]} end={0} />
      <Node ref={hub} x={HUB[0]} y={HUB[1]} opacity={0}>
        <Circle size={360} fill={NAVY} />
        <Node scale={1.25}>{drawGearsPair({stroke: WHITE, size: 150})}</Node>
        <Txt {...txt({fontSize: 76, fontWeight: 700})} y={-282} text={t('Business Excellence')} />
      </Node>
      <Circle ref={dot} size={34} fill={NAVY} position={() => pointAt(routeU())} opacity={0} />
    </>,
  );

  /* ------------------------------------------------------------- stations --- */

  const s1 = panelStation(world(), {
    x: STATION_POS[0][0], y: STATION_POS[0][1],
    title: t('BPM · Documentation'),
    leftLabel: t('2025 — Achieved'),
    rightLabel: t('2026 — Plan'),
    icon: drawDocStack({size: 104}),
  });
  const s2 = panelStation(world(), {
    x: STATION_POS[1][0], y: STATION_POS[1][1],
    title: t('BPM · Internal ISO Audit'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: (
      <Node>
        <Node x={-22} y={4}>{drawClipboard({size: 96})}</Node>
        <Node x={30} y={18}>{drawMagnifier({size: 78})}</Node>
      </Node>
    ),
  });
  const s3 = panelStation(world(), {
    x: STATION_POS[2][0], y: STATION_POS[2][1],
    title: t('BPM · Improvement'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: drawLightbulb({size: 104}),
  });
  const s4 = panelStation(world(), {
    x: STATION_POS[3][0], y: STATION_POS[3][1],
    title: t('BPM · Service Level Agreements'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: drawStopwatch({size: 104}),
  });
  const s5 = panelStation(world(), {
    x: STATION_POS[4][0], y: STATION_POS[4][1],
    title: t('Automation of Internal Services'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: (
      <Node>
        <Node x={-60}>{drawGearsPair({size: 96})}</Node>
        <Node x={70} y={6}>{drawLaptop({size: 86})}</Node>
      </Node>
    ),
  });
  const s6 = panelStation(world(), {
    x: STATION_POS[5][0], y: STATION_POS[5][1],
    title: t('International Standards & Frameworks'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: drawCertificate({size: 108}),
  });
  const s7 = panelStation(world(), {
    x: STATION_POS[6][0], y: STATION_POS[6][1],
    title: t('Local Content'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: (
      <Node>
        <Node x={16} y={12}>{drawBriefcase({size: 98})}</Node>
        <Node x={-62} y={-26}>{drawPin({size: 68})}</Node>
      </Node>
    ),
  });
  const s8 = panelStation(world(), {
    x: STATION_POS[7][0], y: STATION_POS[7][1],
    title: t('TIC / PIF Reports'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: (
      <Node>
        <Node x={-50}>{drawEnvelope({size: 92})}</Node>
        <Node x={64} y={2}>{drawCalendar({size: 80})}</Node>
      </Node>
    ),
  });
  const s9 = panelStation(world(), {
    x: STATION_POS[8][0], y: STATION_POS[8][1],
    title: t('Training & Awareness'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: drawPeopleGroup({size: 116}),
  });
  const s10 = panelStation(world(), {
    x: STATION_POS[9][0], y: STATION_POS[9][1],
    title: t('Excellence Framework'),
    leftLabel: t('2025'),
    rightLabel: t('2026'),
    icon: drawTarget({size: 100}),
  });
  const ST = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];

  /* the 2027–2028 roadmap lives below station 10, reached by a crane */
  const roadmap = createRef<Node>();
  world().add(<Node ref={roadmap} x={STATION_POS[9][0]} y={1900} />);

  /** Track to a station: camera, guide dot and route draw-on in one move.
      The route always draws one segment ahead of the dot. */
  /** Drift across the station toward the 2026 side. Rides the plan-line reveal,
      so each station plays as two framings rather than one locked-off slide. */
  function* pan(dx: number, seconds = 0.85) {
    yield* cam().position.x(cam().position.x() + dx * M, seconds, easeInOutCubic);
  }

  /** Settle back from the overshoot. Rides the first content beat, so it is free. */
  function* settle(seconds = 1.0) {
    yield* cam().zoom(1.55, seconds, easeInOutCubic);
  }

  function* goTo(i: number, seconds = 1.6, zoom = 1.62) {
    const ahead = Math.min(ANCHOR[i] + 1, ROUTE_PTS.length - 1);
    yield* all(
      cam().centerOn(STATION_POS[i], seconds, easeInOutCubic),
      cam().zoom(zoom, seconds, easeInOutCubic),
      routeU(uAt(ANCHOR[i]), seconds, easeInOutCubic),
      route().end(uAt(ahead), seconds, easeInOutCubic),
    );
  }

  /* ============================================================ 0 · ESTABLISH */
  cam().zoom(0.38);
  cam().position([-3600, -420]);
  yield* all(
    hub().opacity(1, 0.5),
    dot().opacity(1, 0.5),
    route().end(uAt(1), 0.9, easeInOutCubic),
    caption.swap(t('Business Excellence — 2025 achievements, 2026 plan')),
  );
  yield* all(
    sequence(
      0.12,
      ...ST.map(s =>
        all(s.root().opacity(1, 0.35), s.root().scale(0.88, 0).to(1, 0.5, easeOutBack)),
      ),
    ),
    cam().position([2550, WIDE_Y], 2.4, easeInOutCubic),
  );
  yield* waitFor(0.6);
  yield* at(4.0);

  /* ====================================================== 1 · DOCUMENTATION */
  yield* caption.hide();
  yield* goTo(0);

  const d41 = statCounter(s1.left(), {
    target: DATA.documentation.newProcesses,
    label: t('new processes established'),
    x: -178, y: -122, size: 96, labelSize: 19, labelWidth: 210,
  });
  const g41 = counterGrid(s1.left(), {
    count: DATA.documentation.newProcesses, cols: 11, cw: 18, ch: 22, gx: 5, gy: 5,
    x: 112, y: -118, kind: 'doc',
  });
  const d68 = statCounter(s1.left(), {
    target: DATA.documentation.revamped,
    label: t('processes revamped'),
    x: -178, y: 40, size: 96, labelSize: 19, labelWidth: 210,
  });
  const g68 = counterGrid(s1.left(), {
    count: DATA.documentation.revamped, cols: 17, cw: 12, ch: 16, gx: 4, gy: 4,
    x: 112, y: 38, kind: 'doc',
  });
  const morphDoc = createRef<Path>();
  const morphLabel = createRef<Node>();
  s1.left().add(
    <>
      <Path
        ref={morphDoc}
        data={DOC_PLAIN}
        stroke={NAVY}
        lineWidth={5}
        lineJoin={'round'}
        scale={0.62}
        x={-206 * M}
        y={152}
        opacity={0}
      />
      <Node ref={morphLabel} opacity={0}>
        {wrapTxt({
          text: t('re-aligned with Tasheer policies'),
          width: 250,
          fontSize: 18,
          x: -15 * M,
          y: 152,
          lineHeight: 22,
          textAlign: 'left',
        })}
      </Node>
    </>,
  );
  const p1 = checklistPills(s1.right(), {
    items: [
      t('Re-align all processes with policies'),
      t('Revamp all Tasheer processes'),
      t('Evaluate the need for a BPM tool'),
    ],
    y0: -132,
  });

  yield* caption.swap(t('41 new processes documented'));
  yield* all(d41.run(1.1), g41.fill(1.1), settle(1.1));
  yield* caption.swap(t('68 processes revamped'));
  yield* all(d68.run(1.1), g68.fill(1.1));
  yield* all(morphDoc().opacity(1, 0.3), morphLabel().opacity(1, 0.3));
  yield* morphDoc().data(DOC_RIBBON, 0.9, easeInOutCubic);
  yield* caption.swap(t('2026: align, revamp, tool'));
  yield* all(p1.tick(0.18, 0.28), pan(150));
  yield* at(12.0);

  /* ============================================================ 2 · COMPLIANCE */
  yield* caption.hide();
  yield* goTo(1);

  const audits = barGroup(s2.left(), DATA.audit.audits, {
    max: DATA.audit.auditsMax, height: 86, width: 44, gap: 30, labelSize: 14, valueSize: 24,
  });
  audits.group().position([-176 * M, -46]);
  audits.group().opacity(0);
  const findings = barGroup(s2.left(), DATA.audit.findings, {
    max: DATA.audit.findingsMax, height: 86, width: 40, gap: 36, labelSize: 13, valueSize: 24,
  });
  findings.group().position([156 * M, -46]);
  findings.group().opacity(0);
  s2.left().add(
    <>
      <Txt {...txt({fontSize: 20, fontWeight: 700, fill: NAVY_70})} x={-176 * M} y={-176} text={t('Audits')} />
      <Txt {...txt({fontSize: 20, fontWeight: 700, fill: NAVY_70})} x={156 * M} y={-176} text={t('Findings')} />
      <Txt {...txt({fontSize: 13, fontWeight: 500, fill: NAVY_70})} x={-176 * M} y={30} text={t('scale 0–15')} />
      <Txt {...txt({fontSize: 13, fontWeight: 500, fill: NAVY_70})} x={156 * M} y={30} text={t('scale 0–10')} />
    </>,
  );
  const status = rankedBars(s2.left(), {
    items: DATA.audit.status, max: DATA.audit.statusMax,
    width: 340, barH: 18, gap: 8, labelW: 162, labelSize: 14, valueSize: 15, x: -108, y0: 58,
  });
  const g80 = gaugeArc(s2.left(), {
    value: DATA.audit.closedOrOnTarget, label: t('findings closed or on target'),
    size: 130, decimals: 0, x: 168, y: 74, labelSize: 15, labelWidth: 210,
  });
  const cycle = createRef<Node>();
  s2.right().add(<Node ref={cycle} y={40} opacity={0}>{drawCycleArrows({size: 320})}</Node>);
  const p2 = checklistPills(s2.right(), {
    items: [
      t('Audit to ISO 9001 and the new standards'),
      t('Fully automate the audit process'),
      t('Quantify the audit score, link to performance'),
    ],
    y0: -132,
  });

  yield* caption.swap(t('12 compliance audits completed'));
  yield* all(audits.group().opacity(1, 0.3), audits.reveal(0.9, 0.12), settle(1.0));
  yield* caption.swap(t('0 major, 3 minor, 9 observations'));
  yield* all(findings.group().opacity(1, 0.3), findings.reveal(0.9, 0.12));
  yield* caption.swap(t('80 % of findings closed or on target'));
  yield* all(status.reveal(1.0, 0.12), g80.run(1.3));
  yield* caption.swap(t('2026: automate the audit, score it'));
  yield* all(cycle().opacity(0.14, 0.5), cycle().rotation(70, 0.9), p2.tick(0.2, 0.3), pan(150));
  yield* at(21.0);

  /* =========================================================== 3 · IMPROVEMENT */
  yield* caption.hide();
  yield* goTo(2);

  const d48 = statCounter(s3.left(), {
    target: DATA.improvement.minor, label: t('minor process improvements'),
    x: -176, y: -122, size: 96, labelSize: 19, labelWidth: 214,
  });
  const g48 = counterGrid(s3.left(), {
    count: DATA.improvement.minor, cols: 12, cw: 16, ch: 16, gx: 5, gy: 5,
    x: 110, y: -122, kind: 'gear',
  });
  const p2p = flowBetween(s3.left(), {
    from: [-150, 92], to: [150, 92],
    fromIcon: drawDocument({size: 86}),
    toIcon: drawCreditCard({size: 92}),
    fromLabel: t('Purchase request'), toLabel: t('Payment'),
    dots: 4,
  });
  s3.left().add(
    wrapTxt({
      text: t('problem-solving support across procure-to-pay'),
      width: 520,
      fontSize: 17,
      y: 182,
    }),
  );
  const pdca = pdcaRing(s3.right(), {x: 0, y: -94, r: 64, nodeR: 25});
  const p3 = checklistPills(s3.right(), {
    items: [
      t('End-to-end critical processes'),
      t('Optimize and automate the improvement solution'),
      t('Facilitate operational challenges'),
    ],
    height: 62, gap: 12, size: 21, y0: 14,
  });

  yield* caption.swap(t('48 process improvements delivered'));
  yield* all(d48.run(0.85), g48.fill(0.85), settle(0.85));
  yield* p2p.run(0.7);
  yield* caption.swap(t('2026: end-to-end, PDCA'));
  yield* all(pdca.draw(0.9), pan(150, 1.1), after(0.4, p3.tick(0.14, 0.24)));
  yield* at(27.5);

  /* =================================================================== 4 · SLA */
  yield* caption.hide();
  yield* goTo(3);

  const sla152 = statCounter(s4.left(), {
    target: DATA.sla.finalised, label: t('SLAs finalised with end users'),
    x: -176, y: -158, size: 62, labelSize: 17, labelWidth: 230,
  });
  const sla115 = statCounter(s4.left(), {
    target: DATA.sla.monitored, label: t('monitored — reminders and escalation'),
    x: 62, y: -158, size: 62, labelSize: 17, labelWidth: 230,
  });
  const bell = createRef<Node>();
  s4.left().add(<Node ref={bell} x={232 * M} y={-176} opacity={0} scale={0.7}>{drawBell({size: 58})}</Node>);
  const depts = rankedBars(s4.left(), {
    items: DATA.sla.byDept, max: DATA.sla.deptMax,
    width: 566, barH: 22, gap: 6, labelW: 186, labelSize: 18, valueSize: 18, y0: -72,
  });
  const dashChip = createRef<Node>();
  const targetChip = createRef<Node>();
  s4.head().add(
    <>
      <Node ref={dashChip} x={-482 * M} y={-46} opacity={0}>
        {drawDashboard({size: 54})}
        {wrapTxt({text: t('dashboard with D&T'), width: 210, fontSize: 16, y: 44, lineHeight: 19})}
      </Node>
      <Node ref={targetChip} x={482 * M} y={-46} opacity={0}>
        {drawTarget({size: 54})}
        {wrapTxt({text: t('linked to performance'), width: 210, fontSize: 16, y: 44, lineHeight: 19})}
      </Node>
    </>,
  );
  const p4 = checklistPills(s4.right(), {
    items: [
      t('Automate all eligible SLAs'),
      t('Set a target scale per department'),
      t('Transition to end-to-end SLAs for critical processes'),
    ],
    y0: -132,
  });

  yield* caption.swap(t('152 SLAs agreed across 13 departments'));
  yield* all(sla152.run(1.2), settle(1.1), after(0.4, all(dashChip().opacity(1, 0.5), targetChip().opacity(1, 0.5))));
  yield* depts.reveal(1.2, 0.06);
  // the list is taller than the push-in frame: crane down, caption held
  yield* all(
    cam().centerOn([STATION_POS[3][0], STATION_POS[3][1] + 75], 0.8, easeInOutCubic),
    dashChip().opacity(0, 0.5),
    targetChip().opacity(0, 0.5),
  );
  yield* caption.swap(t('115 SLAs monitored, reminders, escalation'));
  yield* all(
    sla115.run(1.0),
    after(0.5, all(bell().opacity(1, 0.3), bell().scale(1, 0.4, easeOutBack))),
  );
  yield* caption.swap(t('2026: automate, target, end-to-end'));
  yield* all(p4.tick(0.16, 0.26), pan(150));
  yield* at(37.0);

  /* ============================================================ 5 · AUTOMATION */
  yield* caption.hide();
  yield* goTo(4);

  const auto11 = statCounter(s5.head(), {
    target: DATA.automation.newServices, label: t('new services automated'),
    x: 318, y: -24, size: 54, labelSize: 16, labelWidth: 200,
  });
  const check11 = createRef<Node>();
  s5.head().add(<Node ref={check11} x={452 * M} y={-24} opacity={0} scale={0.7}>{drawCheckCircle({size: 56})}</Node>);
  const funnel = funnelToStack(s5.left(), {
    funnel: DATA.automation.funnel, max: DATA.automation.funnelMax,
    segments: DATA.automation.criteria,
    width: 560, labelW: 186, barH: 34, gap: 18, yFunnel: -150, yStack: -110, labelSize: 17,
  });
  const gEligible = gaugeArc(s5.left(), {
    value: DATA.automation.eligiblePct, decimals: 0,
    label: t('of all 152 SLAs are eligible for automation'),
    size: 148, x: -148, y: 96, labelSize: 15, labelWidth: 236,
  });
  const gAutomated = gaugeArc(s5.left(), {
    value: DATA.automation.automatedPct, decimals: 0,
    label: t('of the 135 eligible are automated'),
    size: 148, x: 148, y: 96, labelSize: 15, labelWidth: 236,
  });
  const p5 = checklistPills(s5.right(), {
    items: [
      t('100 % automation of eligible SLAs'),
      t('Start end-to-end process-cycle automation'),
      t('Documentation, governance and roadmap'),
    ],
    y0: -132,
  });

  yield* caption.swap(t('11 services and 115 SLAs automated'));
  yield* all(auto11.run(0.8), settle(0.75), after(0.35, all(check11().opacity(1, 0.3), check11().scale(1, 0.4, easeOutBack))));
  yield* caption.swap(t('135 of 152 eligible — 115 automated'));
  yield* funnel.revealFunnel(0.8, 0.08);
  yield* all(gEligible.run(0.9), gAutomated.run(0.9));
  yield* caption.swap(t('Automation criteria, weighted'));
  yield* funnel.morph(1.0);
  yield* all(caption.swap(t('2026: 100 % of eligible SLAs')), p5.tick(0.16, 0.26), pan(150));
  yield* at(46.0);

  /* ============================================================= 6 · STANDARDS */
  yield* caption.hide();
  yield* goTo(5, 2.0); // rounding the corner of the route: the film's longest move

  const cert = createRef<Node>();
  s6.left().add(
    <Node ref={cert} y={-62} opacity={0} scale={0.82}>
      {drawCertificate({size: 210})}
      <Node x={104} y={72}>{drawShieldCheck({size: 84})}</Node>
    </Node>,
  );
  const certName = createRef<Txt>();
  s6.left().add(
    <Txt ref={certName} {...txt({fontSize: 30, fontWeight: 700})} y={96} opacity={0} text={t('ISO 9001:2015')} />,
  );
  const certDate = datePill(s6.left(), {y: 150, text: t('April 2025 — TÜV Austria'), width: 330, size: 19});
  const q3 = datePill(s6.right(), {y: 194, text: t('all three — target Q3 2026'), width: 300, size: 18});
  const ims = hubSpoke(s6.right(), {
    hub: t('Tasheer IMS'),
    satellites: [
      {label: t('ISO/IEC 20000-1'), sub: t('with Digital & Technology')},
      {label: t('ISO 22301'), sub: t('with GRC')},
      {label: t('ISO/IEC 27001'), sub: t('with Cybersecurity')},
    ],
    x: -40, y: -14, hubR: 50, radius: 158, satR: 46, subSide: true, subWidth: 160,
  });

  yield* caption.swap(t('ISO 9001:2015 — certified April 2025'));
  yield* all(
    cert().opacity(1, 0.4),
    cert().scale(1, 0.6, easeOutBack),
    settle(0.75),
    after(0.3, all(certName().opacity(1, 0.4), certDate.pop(0.45))),
  );
  yield* waitFor(0.5);
  yield* caption.swap(t('2026: ISO 20000-1, 22301, 27001 by Q3'));
  yield* all(q3.pop(0.45), ims.draw(1.1, 0.28), pan(150, 1.2));
  yield* waitFor(0.4);
  yield* caption.swap(t('One integrated management system'));
  yield* ims.merge(1.4);
  yield* at(55.0);

  /* ========================================================= 7 · LOCAL CONTENT */
  yield* caption.hide();
  yield* goTo(6);

  const lc = gaugeArc(s7.left(), {
    value: DATA.localContent.score, target: DATA.localContent.target, decimals: 2,
    label: t('Local Content score — valid until July 2026'),
    size: 178, x: -146, y: -28, labelSize: 15, labelWidth: 250,
  });
  const comp = gaugeArc(s7.left(), {
    value: DATA.localContent.compliance, decimals: 2,
    label: t('compliance score — 2024 performance report'),
    size: 178, x: 146, y: -28, labelSize: 15, labelWidth: 250,
  });
  const lcPlan = timelineBand(s7.right(), {
    stops: [
      {label: t('EY engagement'), sub: t('Feb–Mar')},
      {label: t('Finance & HR data review'), sub: t('Apr–May')},
      {label: t('Audit before FS approval'), sub: t('May–Jun')},
      {label: t('FS approval'), sub: t('Jun')},
      {label: t('Certificate'), sub: t('by 31 July')},
    ],
    width: 450, y: -100, labelSize: 14, subSize: 13, dotR: 10, labelWidth: 112, subWidth: 130,
  });
  const p7 = checklistPills(s7.right(), {
    items: [
      t('Keep Local Content above 70 %'),
      t('Control local vs foreign at PR level'),
      t('Improve or replace low-LC vendors'),
      t('Maintain Saudization %'),
      t('100 % reporting compliance'),
    ],
    height: 36, gap: 5, size: 18, y0: 22,
  });

  yield* caption.swap(t('Local Content 75.81 % — above the 70 % line'));
  yield* all(lc.run(1.0), chain(settle(0.6), cam().zoom(1.64, 0.4, easeInOutCubic)));
  yield* all(caption.swap(t('96.25 % compliance, 2024 report')), cam().zoom(1.55, 0.7, easeInOutCubic));
  yield* comp.run(0.9);
  yield* caption.swap(t('2026: certified before 31 July'));
  yield* all(lcPlan.sweep(1.1), pan(150, 1.2), after(0.5, p7.tick(0.12, 0.22)));
  yield* at(62.5);

  /* =============================================================== 8 · REPORTS */
  yield* caption.hide();
  yield* goTo(7);

  const rep20 = statCounter(s8.left(), {
    target: DATA.reports.submitted, label: t('reports submitted'),
    x: -176, y: -64, size: 118, labelSize: 19, labelWidth: 210,
  });
  const gRep = counterGrid(s8.left(), {
    count: DATA.reports.submitted, cols: 5, cw: 44, ch: 32, gx: 10, gy: 10,
    x: 100, y: -64, kind: 'envelope',
  });
  const clock = clockSweep(s8.left(), {x: -176, y: 112, size: 112, deadline: -60});
  const onTime = datePill(s8.left(), {x: 72, y: 112, text: t('100 % on deadline'), width: 240, size: 19});
  const people8 = createRef<Node>();
  s8.right().add(
    <Node ref={people8} y={66} opacity={0}>
      {drawPeopleGroup({size: 126, stroke: NAVY_50})}
      {wrapTxt({text: t('in coordination with stakeholders'), width: 420, fontSize: 19, y: 88, lineHeight: 23})}
    </Node>,
  );
  const p8 = checklistPills(s8.right(), {items: [t('Maintain 100 % on-time submission')], y0: -104});

  yield* caption.swap(t('20 TIC/PIF reports — 100 % on time'));
  yield* all(rep20.run(0.9), gRep.fill(0.9), settle(0.9));
  yield* all(clock.run(2, 0.9), after(0.45, onTime.pop(0.4)));
  yield* caption.swap(t('2026: keep it at 100 %'));
  yield* all(p8.tick(0.2, 0.3), people8().opacity(1, 0.5), pan(150, 0.7));
  yield* at(68.0);

  /* ============================================================== 9 · TRAINING */
  yield* caption.hide();
  yield* goTo(8);

  const efqmFlow = flowBetween(s9.left(), {
    from: [-148, -112], to: [122, -112],
    fromIcon: drawCertificate({size: 84}),
    toIcon: (
      <Node>
        <Node x={-32}>{drawPerson({size: 68})}</Node>
        <Node x={32}>{drawPerson({size: 68})}</Node>
      </Node>
    ),
    fromLabel: t('EFQM Foundation'), toLabel: t('two candidates trained'),
    dots: 3,
  });
  const isoFlow = flowBetween(s9.left(), {
    from: [-148, 84], to: [122, 84],
    fromIcon: drawNotebook({size: 84}),
    toIcon: drawPeopleGroup({size: 92}),
    fromLabel: t('ISO 9001'), toLabel: t('delivered to teams'),
    dots: 3,
  });
  const badges = [
    outlineBadge(s9.right(), {x: -180, y: -130, r: 52, title: t('ISO/IEC 20000-1'), sub: t('4–5 internal auditors')}),
    outlineBadge(s9.right(), {x: 0, y: -130, r: 52, title: t('ISO/IEC 27001'), sub: t('4–5 internal auditors')}),
    outlineBadge(s9.right(), {x: 180, y: -130, r: 52, title: t('ISO 22301'), sub: t('4–5 internal auditors')}),
  ];
  const aware = createRef<Node>();
  s9.right().add(
    <Node ref={aware} y={26} opacity={0}>
      <Rect width={548} height={54} radius={27} stroke={NAVY_50} lineWidth={4} />
      {wrapTxt({
        text: t('Awareness for all Tasheer employees — ISO 27001 & ISO 22301'),
        width: 500,
        fontSize: 20,
        lineHeight: 24,
      })}
    </Node>,
  );
  const parade = flowBetween(s9.right(), {
    from: [-160, 140], to: [140, 140],
    fromIcon: drawPeopleGroup({size: 76, stroke: NAVY_50}),
    toIcon: drawLaptop({size: 84, stroke: NAVY_50}),
    dots: 4, dotFill: NAVY_50, dotSize: 14,
  });

  yield* caption.swap(t('EFQM Foundation — two trained; ISO 9001 delivered'));
  yield* all(efqmFlow.run(0.9), settle(1.0), after(0.35, isoFlow.run(0.9)));
  yield* caption.swap(t('2026: auditors for three standards, awareness for all'));
  yield* all(
    sequence(0.22, ...badges.map(b => b.pop(0.6))),
    after(0.5, aware().opacity(1, 0.4)),
    after(0.3, parade.run(0.6)),
    pan(150, 1.2),
  );
  yield* at(74.5);

  /* =========================================================== 10 · EXCELLENCE */
  yield* caption.hide();
  yield* goTo(9);

  const trained = createRef<Node>();
  s10.left().add(
    <Node ref={trained} opacity={0}>
      <Node x={-92} y={-52}>{drawPerson({size: 128})}</Node>
      <Node x={92} y={-52}>{drawPerson({size: 128})}</Node>
      {wrapTxt({
        text: t('two candidates trained — EFQM Foundation'),
        width: 460,
        fontSize: 19,
        y: 158,
        lineHeight: 23,
      })}
    </Node>,
  );
  const efqmBadges = [
    outlineBadge(s10.left(), {x: -92, y: 62, r: 34, title: t('EFQM'), solid: true}),
    outlineBadge(s10.left(), {x: 92, y: 62, r: 34, title: t('EFQM'), solid: true}),
  ];
  const p10 = checklistPills(s10.right(), {
    items: [t('Internal assessment against KAQA (tentative)')],
    height: 70, y0: -140,
  });
  const kaqa = gaugeArc(s10.right(), {
    value: 0, target: 100, decimals: 0,
    label: t('gap analysis and strategic plan — no score claimed yet'),
    size: 168, y: 58, labelSize: 16, labelWidth: 320,
  });
  roadmap().add(
    <Txt {...txt({fontSize: 58, fontWeight: 700})} y={-210} text={t('The road to 2028')} />,
  );
  const road = timelineBand(roadmap(), {
    stops: [
      {label: t('2025'), sub: t('ISO 9001 — QMS'), solid: true},
      {label: t('2026'), sub: t('ISO 22301 · ISO/IEC 27001 · ISO/IEC 20000-1')},
      {label: t('2027'), sub: t('KAQA assessment · ISO 20400 · ISO 10001 · ISO 30405')},
      {label: t('2028'), sub: t('EFQM assessment')},
    ],
    // 2000 px wide so the outer stops' labels stay inside the 0.72 crane frame
    width: 2000, labelSize: 62, subSize: 34, dotR: 28,
    split: true, labelWidth: 500, subWidth: 540,
  });

  yield* caption.swap(t('Two trained on EFQM Foundation'));
  yield* all(trained().opacity(1, 0.4), settle(0.86), after(0.3, sequence(0.16, ...efqmBadges.map(b => b.pop(0.5)))));
  yield* caption.swap(t('2026: KAQA internal assessment'));
  yield* all(p10.tick(0.2, 0.26), after(0.25, kaqa.run(0.6)), pan(150, 0.85));
  yield* caption.swap(t('The road to 2028: KAQA, then EFQM'));
  yield* all(cam().centerOn([STATION_POS[9][0], 1900], 1.05, easeInOutCubic), cam().zoom(0.72, 1.05, easeInOutCubic));
  yield* road.sweep(1.15); // then the beat settles on the finished road
  yield* at(83.5);

  /* =============================================================== 11 · FINALE */
  yield* caption.hide();
  yield* all(
    cam().centerOn([-2300, WIDE_Y], 1.3, easeInOutCubic),
    cam().zoom(0.38, 1.3, easeInOutCubic),
    routeU(1, 1.3, easeInOutCubic),
    route().end(1, 1.0, easeInOutCubic),
  );
  yield* caption.swap(t('Business Excellence — 2025 delivered, 2026 in motion'));
  yield* cam().position([2400, WIDE_Y], 1.2, easeInOutCubic);
  yield* at(87.0);

  /* =============================================================== 12 · LOCKUP */
  const ground = createRef<Rect>();
  view.add(<Rect ref={ground} width={1920} height={1080} fill={DEEP} opacity={0} zIndex={-1} />);
  yield* all(caption.hide(0.6), world().opacity(0, 0.6), far().opacity(0, 0.6), ground().opacity(1, 0.6));
  yield* cam().reset(0);
  const lockup = addLockup(view, {light: true});
  yield* lockup.reveal(0.8);
  yield* at(88.4);
  yield* waitFor(1.6); // the close always holds, whatever the beats did
});
