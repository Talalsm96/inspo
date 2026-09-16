/* Tasheer house style for Motion Canvas — tokens + reusable house moves.
   Strict monochromatic navy on white. No red, green, or gold anywhere. */
import {Circle, Img, Layout, Line, Node, Rect, Txt, TxtProps, View2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  Reference,
  SimpleSignal,
  ThreadGenerator,
  tween,
  waitFor,
} from '@motion-canvas/core';

export const NAVY = '#17458C';
export const NAVY_70 = '#5D7DAF';
export const NAVY_50 = '#8BA2C5';
export const NAVY_30 = '#B9C7DC';
export const NAVY_10 = '#E7ECF3';
export const DEEP = '#103062';
export const INK = '#333333';
export const WHITE = '#FFFFFF';
export const FONT = 'Cairo';

export const W = 1920;
export const H = 1080;

/* Text direction for the whole film. Set it once, before any node is built:
   the Arabic cut is the same scene with the same beats, read right to left. */
let RTL = false;
export function setRtl(value: boolean) {
  RTL = value;
}
export function isRtl() {
  return RTL;
}
/** -1 in an RTL cut, so a mirrored layout is `x * mirror()`. */
export function mirror() {
  return RTL ? -1 : 1;
}

/** Base text props every Txt should start from. */
export const txt = (over: TxtProps = {}): TxtProps => ({
  fontFamily: FONT,
  fontWeight: 600,
  fill: NAVY,
  ...(RTL ? {textDirection: 'rtl' as const} : {}),
  ...over,
});

/* ---------------------------------------------------------------- captions */

export interface CaptionBar {
  node: Reference<Txt>;
  /** Fade the current caption out, swap text, fade in. Never call mid camera travel. */
  swap(text: string, seconds?: number): ThreadGenerator;
  hide(seconds?: number): ThreadGenerator;
}

/** One caption at a time, bottom-centre, ≥ 46 px. Lives OUTSIDE the camera. */
export function addCaptionBar(view: View2D, opts: {rtl?: boolean; size?: number} = {}): CaptionBar {
  const node = createRef<Txt>();
  const baseY = H / 2 - 96;
  view.add(
    <Txt
      ref={node}
      {...txt({fontSize: opts.size ?? 48, fontWeight: 500, fill: INK})}
      textDirection={opts.rtl ? 'rtl' : 'ltr'}
      textAlign={'center'}
      y={baseY}
      opacity={0}
      text={''}
    />,
  );
  return {
    node,
    *swap(text, seconds = 0.35) {
      if (node().opacity() > 0) {
        yield* all(node().opacity(0, seconds, easeInOutCubic), node().position.y(baseY - 12, seconds));
      }
      node().text(text);
      node().position.y(baseY + 16);
      yield* all(
        node().opacity(1, seconds, easeInOutCubic),
        node().position.y(baseY, seconds, easeOutCubic),
      );
    },
    *hide(seconds = 0.35) {
      yield* node().opacity(0, seconds);
    },
  };
}


/* ---------------------------------------------------------- wrapped text ---
   Motion Canvas's own `textWrap` mis-places wrapped Arabic: the whole block
   lands about one line-width to the right of its anchor (single-line text is
   fine, and so is English). So the RTL cut breaks the lines itself and stacks
   single-line Txt nodes, which anchor correctly. The LTR cut keeps the native
   path, so the English film renders exactly as before. */

/** Break a string to a pixel width. Cairo averages ~0.5em per glyph in both scripts. */
export function breakLines(text: string, width: number, fontSize: number): string[] {
  const max = Math.max(1, Math.floor(width / (fontSize * 0.5)));
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface WrapTxtProps {
  text: string;
  width: number;
  fontSize: number;
  fontWeight?: number;
  fill?: string;
  x?: number;
  y?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'right' | 'center';
}

/** A wrapped block of text that anchors the same way in both cuts. */
export function wrapTxt(o: WrapTxtProps) {
  const lh = o.lineHeight ?? o.fontSize + 5;
  const base = txt({fontSize: o.fontSize, fontWeight: o.fontWeight ?? 500, fill: o.fill ?? INK});
  if (!RTL) {
    return (
      <Txt
        {...base}
        x={o.x ?? 0}
        y={o.y ?? 0}
        width={o.width}
        textWrap
        textAlign={o.textAlign ?? 'center'}
        lineHeight={lh}
        text={o.text}
      />
    );
  }
  const lines = breakLines(o.text, o.width, o.fontSize);
  const y0 = (o.y ?? 0) - ((lines.length - 1) * lh) / 2;
  return (
    <Node x={o.x ?? 0}>
      {lines.map((line, i) => (
        <Txt {...base} y={y0 + i * lh} text={line} />
      ))}
    </Node>
  );
}

/* ------------------------------------------------------------------ counter */

/** Count-up that lands EXACTLY on `target`. Returns the signal driving the text. */
export function counter(view: Node, props: TxtProps & {target: number; suffix?: string; decimals?: number}) {
  const {target, suffix = '', decimals = 0, ...rest} = props;
  const value = createSignal(0);
  const node = createRef<Txt>();
  view.add(
    <Txt
      ref={node}
      {...txt({fontSize: 160, fontWeight: 700})}
      {...rest}
      text={() => value().toFixed(decimals) + suffix}
    />,
  );
  return {
    node,
    value,
    *run(seconds = 1.6): ThreadGenerator {
      yield* value(target, seconds, easeOutCubic);
      value(target); // guarantee the true value on the final frame
    },
  };
}

/* ------------------------------------------------------------------- bars */

export interface BarSpec {
  label: string;
  value: number;
}

/** Simple vertical bar group, axis from 0, identical scale for every bar.
    `max` should come from a niceMax() of the real data, never eyeballed. */
export function barGroup(
  parent: Node,
  bars: BarSpec[],
  opts: {max: number; height?: number; width?: number; gap?: number; target?: number; labelSize?: number; valueSize?: number},
) {
  const valueSize = opts.valueSize ?? 40;
  const height = opts.height ?? 420;
  const width = opts.width ?? 120;
  const gap = opts.gap ?? 70;
  const total = bars.length * width + (bars.length - 1) * gap;
  const x0 = -total / 2 + width / 2;
  const scale = height / opts.max;
  const progress: SimpleSignal<number>[] = [];
  const group = createRef<Node>();
  parent.add(<Node ref={group} />);

  // baseline
  group().add(<Line points={[[-total / 2 - 30, 0], [total / 2 + 30, 0]]} stroke={NAVY_30} lineWidth={3} />);

  bars.forEach((b, i) => {
    const p = createSignal(0);
    progress.push(p);
    const x = x0 + i * (width + gap);
    group().add(
      <>
        {b.value === 0 ? (
          // a zero is a mark on the baseline — never invented height
          <Line points={[[x - width / 2, 0], [x + width / 2, 0]]} stroke={NAVY} lineWidth={8} opacity={() => p()} />
        ) : (
          <Rect
            x={x}
            width={width}
            height={() => b.value * scale * p()}
            fill={NAVY}
            bottom={() => [x, 0]}
          />
        )}
        <Txt
          {...txt({fontSize: opts.labelSize ?? 34, fontWeight: 500, fill: INK})}
          x={x}
          y={52}
          text={b.label}
        />
        <Txt
          {...txt({fontSize: valueSize, fontWeight: 700})}
          x={x}
          y={() => -b.value * scale * p() - valueSize * 0.7 - 10}
          opacity={() => Math.min(1, p() * 3)}
          text={() => Math.round(b.value * p()).toString()}
        />
      </>,
    );
  });

  // dashed target line: judgment lives here, never in colour
  if (opts.target !== undefined) {
    const ty = -opts.target * scale;
    group().add(
      <Line
        points={[[-total / 2 - 30, ty], [total / 2 + 30, ty]]}
        stroke={NAVY_70}
        lineWidth={3}
        lineDash={[14, 12]}
      />,
    );
  }

  return {
    group,
    *reveal(seconds = 1.2, stagger = 0.15): ThreadGenerator {
      yield* all(...progress.map((p, i) => delayed(i * stagger, p(1, seconds, easeOutCubic))));
      progress.forEach(p => p(1));
    },
  };
}

function* delayed(seconds: number, task: ThreadGenerator): ThreadGenerator {
  yield* waitFor(seconds);
  yield* task;
}

/* -------------------------------------------------------------- lockup */

/** Tasheer lockup close: chevron-shield + wordmark, navy on white.
    If an official logo file is available, pass `src` and it replaces the drawn mark. */
export function addLockup(view: View2D, opts: {src?: string; scale?: number; light?: boolean} = {}) {
  const root = createRef<Layout>();
  const s = opts.scale ?? 1;
  const mark = opts.light ? WHITE : NAVY;
  const cut = opts.light ? DEEP : WHITE;
  view.add(
    <Layout ref={root} opacity={0} scale={s}>
      {opts.src ? (
        <Img src={opts.src} height={220} y={-60} />
      ) : (
        <Node y={-60}>
          <Line
            points={[[-90, -110], [0, -150], [90, -110], [90, 40], [0, 110], [-90, 40]]}
            closed
            fill={mark}
          />
          <Line points={[[-46, -40], [0, 6], [46, -40]]} stroke={cut} lineWidth={22} lineJoin={'round'} lineCap={'round'} />
          <Line points={[[-46, 10], [0, 56], [46, 10]]} stroke={cut} lineWidth={22} lineJoin={'round'} lineCap={'round'} />
        </Node>
      )}
      <Txt {...txt({fontSize: 76, fontWeight: 700, fill: opts.light ? WHITE : NAVY})} y={130} text={'Tasheer'} />
      <Txt
        {...txt({fontSize: 46, fontWeight: 500, fill: opts.light ? NAVY_30 : NAVY_70})}
        y={205}
        textDirection={'rtl'}
        text={'تاشير'}
      />
    </Layout>,
  );
  return {
    root,
    *reveal(seconds = 0.8): ThreadGenerator {
      yield* root().opacity(1, seconds, easeInOutCubic);
    },
  };
}

/* ------------------------------------------------------------- station */

/** A world station: enclosure + heading + detail lines, sized for the camera grammar.
    Heading reads at pull-back (zoom 0.55), detail reads at push-in (zoom 1.55). */
export function station(
  parent: Node,
  props: {x: number; y?: number; title: string; lines: string[]; icon?: Node},
) {
  const root = createRef<Node>();
  parent.add(
    <Node ref={root} x={props.x} y={props.y ?? 0}>
      <Rect width={1400} height={760} stroke={NAVY_30} lineWidth={7} radius={40} />
      <Txt {...txt({fontSize: 58, fontWeight: 700})} y={-300} text={props.title} />
      <Node y={-150}>{props.icon}</Node>
      <Layout layout direction={'column'} gap={18} y={150} alignItems={'center'}>
        {props.lines.map(l => (
          <Txt {...txt({fontSize: 25, fontWeight: 500, fill: INK})} text={l} />
        ))}
      </Layout>
    </Node>,
  );
  return root;
}

/* ================================================================================
   Business Excellence film — object grammar
   Added for the 2025→2026 achievement film. Everything here is flat navy on white:
   strokes, outlines and tints only. No gradients, shadows, faces, 3D, and nothing
   red, green or gold — judgment is always position against a dashed target.
   ================================================================================ */

import {chain, sequence, useTime} from '@motion-canvas/core';

/** Wait until an absolute scene time, so the beat sheet is the contract.
    A no-op if the beat already overran — the frame count tells on us either way. */
export function* at(seconds: number): ThreadGenerator {
  const now = useTime();
  if (seconds > now) yield* waitFor(seconds - now);
}

/** Run `task` after a delay — the stagger primitive used by every reveal below. */
export function* after(seconds: number, task: ThreadGenerator): ThreadGenerator {
  yield* waitFor(seconds);
  yield* task;
}

/** Round a data maximum up to a clean tick so headroom is honest and shared. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (value <= step * mag) return step * mag;
  }
  return 10 * mag;
}

/* ------------------------------------------------------------------ icons ---
   Drawn originals, 8 px navy strokes, nominal 120 px box, scaled by `size`.   */

export interface IconOpts {
  size?: number;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
}

const ink = (o: IconOpts = {}) => ({
  stroke: o.stroke ?? NAVY,
  lineWidth: o.lineWidth ?? 8,
  lineJoin: 'round' as const,
  lineCap: 'round' as const,
});

const box = (o: IconOpts = {}, children: any) => (
  <Node scale={(o.size ?? 120) / 120} opacity={o.opacity ?? 1}>
    {children}
  </Node>
);

export function drawDocument(o: IconOpts & {ribbon?: boolean} = {}) {
  return box(
    o,
    <>
      <Rect width={76} height={100} radius={8} {...ink(o)} />
      <Line points={[[-22, -22], [22, -22]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-22, 2], [22, 2]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-22, 26], [4, 26]]} {...ink(o)} lineWidth={6} />
      {o.ribbon ? (
        <Line points={[[30, -50], [30, 8], [14, -6], [-2, 8], [-2, -50]]} closed {...ink(o)} lineWidth={6} x={16} />
      ) : null}
    </>,
  );
}

/** SVG path pair for the "plain page → page with a policy ribbon" morph. */
export const DOC_PLAIN =
  'M -38 -50 L 38 -50 L 38 50 L -38 50 Z ' +
  'M -22 -22 L 22 -22 ' +
  'M -22 2 L 22 2 ' +
  'M -22 26 L 4 26 ' +
  'M 38 -50 L 38 -50 L 38 -50 L 38 -50 L 38 -50 Z';
export const DOC_RIBBON =
  'M -38 -50 L 38 -50 L 38 50 L -38 50 Z ' +
  'M -22 -22 L 6 -22 ' +
  'M -22 2 L 6 2 ' +
  'M -22 26 L 4 26 ' +
  'M 14 -50 L 46 -50 L 46 8 L 30 -6 L 14 8 Z';

export function drawDocStack(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={70} height={92} radius={8} {...ink(o)} x={-16} y={-10} />
      <Rect width={70} height={92} radius={8} {...ink(o)} x={4} y={4} fill={WHITE} />
      <Line points={[[-20, -14], [24, -14]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-20, 8], [24, 8]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-20, 30], [6, 30]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

function gear(o: IconOpts, r: number, teeth = 8) {
  const ticks = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    ticks.push(
      <Line
        points={[[Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a) * (r + 12), Math.sin(a) * (r + 12)]]}
        {...ink(o)}
      />,
    );
  }
  return (
    <>
      <Circle size={r * 2} {...ink(o)} />
      <Circle size={r * 0.7} {...ink(o)} lineWidth={6} />
      {ticks}
    </>
  );
}

export function drawGearsPair(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Node x={-22} y={-10}>{gear(o, 32, 8)}</Node>
      <Node x={30} y={26}>{gear({...o, lineWidth: 6}, 20, 7)}</Node>
    </>,
  );
}

export function drawMagnifier(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={76} {...ink(o)} x={-8} y={-10} />
      <Line points={[[22, 20], [50, 48]]} {...ink(o)} lineWidth={(o.lineWidth ?? 8) + 3} />
    </>,
  );
}

export function drawClipboard(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={80} height={104} radius={10} {...ink(o)} />
      <Rect width={40} height={22} radius={6} {...ink(o)} y={-52} fill={WHITE} />
      <Line points={[[-24, -14], [24, -14]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-24, 10], [24, 10]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-24, 34], [6, 34]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawCycleArrows(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={104} {...ink(o)} startAngle={-160} endAngle={-20} endArrow arrowSize={14} />
      <Circle size={104} {...ink(o)} startAngle={20} endAngle={160} endArrow arrowSize={14} />
    </>,
  );
}

export function drawLightbulb(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={64} {...ink(o)} y={-16} />
      <Line points={[[-14, 18], [14, 18]]} {...ink(o)} />
      <Line points={[[-14, 34], [14, 34]]} {...ink(o)} />
      <Line points={[[-8, 50], [8, 50]]} {...ink(o)} />
      <Line points={[[-46, -52], [-34, -42]]} {...ink(o)} lineWidth={6} />
      <Line points={[[46, -52], [34, -42]]} {...ink(o)} lineWidth={6} />
      <Line points={[[0, -66], [0, -54]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawCreditCard(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={110} height={74} radius={10} {...ink(o)} />
      <Line points={[[-55, -12], [55, -12]]} {...ink(o)} lineWidth={10} />
      <Rect width={22} height={16} radius={4} {...ink(o)} lineWidth={5} x={-30} y={14} />
    </>,
  );
}

export function drawStopwatch(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={92} {...ink(o)} y={8} />
      <Line points={[[-14, -46], [14, -46]]} {...ink(o)} />
      <Line points={[[0, -46], [0, -38]]} {...ink(o)} />
      <Line points={[[0, 8], [0, -22]]} {...ink(o)} lineWidth={6} />
      <Line points={[[0, 8], [24, 20]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawBell(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Line
        points={[[-40, 30], [-32, 30], [-32, -8], [0, -44], [32, -8], [32, 30], [40, 30]]}
        {...ink(o)}
      />
      <Line points={[[-40, 30], [40, 30]]} {...ink(o)} />
      <Circle size={16} {...ink(o)} lineWidth={6} y={44} />
      <Line points={[[0, -44], [0, -56]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawDashboard(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={112} height={84} radius={10} {...ink(o)} />
      <Circle size={44} {...ink(o)} lineWidth={6} x={-28} y={4} startAngle={-200} endAngle={20} />
      <Line points={[[-28, 4], [-14, -10]]} {...ink(o)} lineWidth={5} />
      <Line points={[[22, 22], [22, -4]]} {...ink(o)} lineWidth={6} />
      <Line points={[[40, 22], [40, -20]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawTarget(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={104} {...ink(o)} />
      <Circle size={64} {...ink(o)} lineWidth={6} />
      <Circle size={22} fill={o.stroke ?? NAVY} />
    </>,
  );
}

export function drawLaptop(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={100} height={68} radius={8} {...ink(o)} y={-12} />
      <Line points={[[-60, 30], [60, 30]]} {...ink(o)} />
      <Line points={[[-50, 22], [50, 22]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawCheckCircle(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={104} {...ink(o)} />
      <Line points={[[-26, 2], [-6, 24], [28, -20]]} {...ink(o)} />
    </>,
  );
}

export function drawCertificate(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={108} height={78} radius={8} {...ink(o)} y={-14} />
      <Line points={[[-36, -32], [36, -32]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-36, -12], [10, -12]]} {...ink(o)} lineWidth={6} />
      <Circle size={34} {...ink(o)} lineWidth={6} x={30} y={28} />
      <Line points={[[22, 42], [16, 60], [30, 52], [44, 60], [38, 42]]} {...ink(o)} lineWidth={5} />
    </>,
  );
}

export function drawShieldCheck(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Line points={[[-44, -46], [0, -60], [44, -46], [44, 12], [0, 58], [-44, 12]]} closed {...ink(o)} />
      <Line points={[[-20, -4], [-4, 14], [24, -20]]} {...ink(o)} />
    </>,
  );
}

export function drawPin(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Line points={[[0, 56], [-34, 0], [-34, -22], [0, -54], [34, -22], [34, 0]]} closed {...ink(o)} radius={26} />
      <Circle size={26} {...ink(o)} lineWidth={6} y={-16} />
    </>,
  );
}

export function drawBriefcase(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={110} height={74} radius={8} {...ink(o)} y={10} />
      <Line points={[[-22, -27], [-22, -44], [22, -44], [22, -27]]} {...ink(o)} />
      <Line points={[[-55, 10], [55, 10]]} {...ink(o)} lineWidth={6} />
    </>,
  );
}

export function drawEnvelope(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={112} height={78} radius={8} {...ink(o)} />
      <Line points={[[-56, -39], [0, 6], [56, -39]]} {...ink(o)} />
    </>,
  );
}

export function drawCalendar(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={104} height={94} radius={8} {...ink(o)} y={6} />
      <Line points={[[-52, -18], [52, -18]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-28, -41], [-28, -58]]} {...ink(o)} lineWidth={6} />
      <Line points={[[28, -41], [28, -58]]} {...ink(o)} lineWidth={6} />
      <Circle size={12} fill={o.stroke ?? NAVY} x={-26} y={8} />
      <Circle size={12} fill={o.stroke ?? NAVY} x={0} y={8} />
      <Circle size={12} fill={o.stroke ?? NAVY} x={26} y={8} />
      <Circle size={12} fill={o.stroke ?? NAVY} x={-26} y={34} />
    </>,
  );
}

/** A person: head + shoulders. No faces, ever. */
export function drawPerson(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Circle size={40} {...ink(o)} y={-34} />
      <Line points={[[-36, 46], [-36, 18], [0, -4], [36, 18], [36, 46]]} {...ink(o)} radius={22} />
    </>,
  );
}

export function drawPeopleGroup(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Node x={-34} y={6} scale={0.78}>{drawPerson(o)}</Node>
      <Node x={34} y={6} scale={0.78}>{drawPerson(o)}</Node>
      <Node y={-6}>{drawPerson(o)}</Node>
    </>,
  );
}

export function drawNotebook(o: IconOpts = {}) {
  return box(
    o,
    <>
      <Rect width={84} height={104} radius={8} {...ink(o)} x={8} />
      <Line points={[[-34, -44], [-34, 44]]} {...ink(o)} lineWidth={6} />
      <Line points={[[-40, -34], [-22, -34]]} {...ink(o)} lineWidth={5} />
      <Line points={[[-40, 0], [-22, 0]]} {...ink(o)} lineWidth={5} />
      <Line points={[[-40, 34], [-22, 34]]} {...ink(o)} lineWidth={5} />
      <Line points={[[-8, -20], [36, -20]]} {...ink(o)} lineWidth={5} />
      <Line points={[[-8, 4], [36, 4]]} {...ink(o)} lineWidth={5} />
      <Line points={[[-8, 28], [18, 28]]} {...ink(o)} lineWidth={5} />
    </>,
  );
}

/* --------------------------------------------------------- station: 2 panels ---
   The recurring object of the film. 1400×760 enclosure, 58 px heading, an icon slot
   above the connector, and a two-panel interior: left = 2025 Achieved (solid navy
   objects), right = 2026 Plan (NAVY_50 outline objects). Done vs next reads by fill,
   never by colour. Panel-local space is x ∈ [-285, 285], y ∈ [-190, 195]. */

export interface PanelStation {
  root: Reference<Node>;
  head: Reference<Node>;
  left: Reference<Node>;
  right: Reference<Node>;
  frame: Reference<Rect>;
}

export const PANEL_HALF_W = 285;
export const PANEL_TOP = -190;
export const PANEL_BOTTOM = 195;

export function panelStation(
  parent: Node,
  props: {
    x: number;
    y?: number;
    title: string;
    icon?: Node;
    leftLabel?: string;
    rightLabel?: string;
  },
): PanelStation {
  const root = createRef<Node>();
  const head = createRef<Node>();
  const left = createRef<Node>();
  const right = createRef<Node>();
  const frame = createRef<Rect>();
  const lx = -318 * mirror();
  const rx = 318 * mirror();
  parent.add(
    <Node ref={root} x={props.x} y={props.y ?? 0} opacity={0}>
      <Rect ref={frame} width={1400} height={760} opacity={0} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <Line
          points={[[sx * 700 - sx * 96, sy * 380], [sx * 700, sy * 380], [sx * 700, sy * 380 - sy * 76]]}
          stroke={NAVY_30}
          lineWidth={5}
          lineCap={'square'}
        />
      ))}
      <Txt {...txt({fontSize: 58, fontWeight: 700})} y={-305} text={props.title} />
      <Node ref={head} y={-218}>
        {props.icon}
      </Node>
      <Txt
        {...txt({fontSize: 28, fontWeight: 700, fill: NAVY})}
        x={lx}
        y={-150}
        text={props.leftLabel ?? '2025 — Achieved'}
      />
      <Txt
        {...txt({fontSize: 28, fontWeight: 700, fill: NAVY_50})}
        x={rx}
        y={-150}
        text={props.rightLabel ?? '2026 — Plan'}
      />
      <Node ref={left} x={lx} y={52} />
      <Node ref={right} x={rx} y={52} />
    </Node>,
  );
  return {root, head, left, right, frame};
}

/* ------------------------------------------------------------- small pieces --- */

/** A counter with its measurement line beneath it — the KPI unit inside a panel. */
export function statCounter(
  parent: Node,
  o: {
    target: number;
    label: string;
    x?: number;
    y?: number;
    size?: number;
    labelSize?: number;
    labelWidth?: number;
    suffix?: string;
    decimals?: number;
  },
) {
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} />);
  const c = counter(root(), {
    target: o.target,
    suffix: o.suffix ?? '',
    decimals: o.decimals ?? 0,
    fontSize: o.size ?? 86,
    fontWeight: 700,
    y: -18,
  });
  root().add(
    wrapTxt({
      text: o.label,
      width: o.labelWidth ?? 240,
      fontSize: o.labelSize ?? 20,
      y: (o.size ?? 86) / 2 + 12,
    }),
  );
  return {
    root,
    node: c.node,
    *run(seconds = 1.6): ThreadGenerator {
      yield* all(root().opacity(1, 0.3), c.run(seconds));
    },
  };
}

/** One line of the plan: text that rises in over a rule drawn from its centre. */
function makePlanLine(
  parent: Node,
  o: {text: string; width: number; height: number; y: number; size: number},
) {
  const root = createRef<Node>();
  const rule = createRef<Line>();
  parent.add(
    <Node ref={root} y={o.y + 18} opacity={0}>
      {wrapTxt({
        text: o.text,
        width: o.width - 40,
        fontSize: o.size,
        fill: INK,
        y: -6,
        lineHeight: o.size + 6,
      })}
      <Line
        ref={rule}
        points={[[-o.width / 2, o.height / 2 - 4], [o.width / 2, o.height / 2 - 4]]}
        stroke={NAVY_30}
        lineWidth={2}
        start={0.5}
        end={0.5}
      />
    </Node>,
  );
  return {root, rule, y: o.y};
}

/** The 2026 side of every station: plan lines that rise in one after another. */
export function checklistPills(
  parent: Node,
  o: {items: string[]; width?: number; height?: number; gap?: number; size?: number; y0?: number},
) {
  const width = o.width ?? 548;
  const height = o.height ?? 76;
  const gap = o.gap ?? 16;
  const size = o.size ?? 23;
  const y0 = o.y0 ?? PANEL_TOP + 20 + height / 2;
  const pills = o.items.map((text, i) =>
    makePlanLine(parent, {text, width, height, size, y: y0 + i * (height + gap)}),
  );
  return {
    pills,
    *tick(stagger = 0.25, dur = 0.34): ThreadGenerator {
      yield* sequence(
        stagger,
        ...pills.map(p =>
          all(
            p.root().opacity(1, dur),
            p.root().position.y(p.y, dur + 0.18, easeOutCubic),
            p.rule().start(0, dur + 0.3, easeOutCubic),
            p.rule().end(1, dur + 0.3, easeOutCubic),
          ),
        ),
      );
    },
  };
}

/* ------------------------------------------------------------------- gauge --- */

/** 270° gauge. The only judgment on screen is the dashed target arc and its tick. */
export function gaugeArc(
  parent: Node,
  o: {
    value: number;
    max?: number;
    target?: number;
    label: string;
    size?: number;
    decimals?: number;
    suffix?: string;
    x?: number;
    y?: number;
    labelSize?: number;
    labelWidth?: number;
  },
) {
  const max = o.max ?? 100;
  const size = o.size ?? 210;
  const r = size / 2;
  const frac = Math.max(0, Math.min(1, o.value / max));
  const p = createSignal(0);
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} />);

  root().add(
    <>
      <Circle size={size} stroke={NAVY_10} lineWidth={20} startAngle={-225} endAngle={45} />
      <Circle
        size={size}
        stroke={NAVY}
        lineWidth={20}
        lineCap={'round'}
        startAngle={-225}
        endAngle={() => -225 + 270 * frac * p()}
      />
      <Txt
        {...txt({fontSize: Math.round(size * 0.24), fontWeight: 700})}
        y={-6}
        text={() => (o.value * p()).toFixed(o.decimals ?? 0) + (o.suffix ?? '%')}
      />
      {wrapTxt({
        text: o.label,
        width: o.labelWidth ?? size + 90,
        fontSize: o.labelSize ?? 19,
        y: r + 34,
        lineHeight: (o.labelSize ?? 19) + 6,
      })}
    </>,
  );

  if (o.target !== undefined) {
    const a = ((-225 + 270 * (o.target / max)) * Math.PI) / 180;
    root().add(
      <>
        <Circle
          size={size + 40}
          stroke={NAVY_70}
          lineWidth={3}
          lineDash={[10, 10]}
          startAngle={-225}
          endAngle={-225 + 270 * (o.target / max)}
        />
        <Line
          points={[[Math.cos(a) * (r - 14), Math.sin(a) * (r - 14)], [Math.cos(a) * (r + 26), Math.sin(a) * (r + 26)]]}
          stroke={NAVY_70}
          lineWidth={5}
        />
        <Txt
          {...txt({fontSize: 18, fontWeight: 600, fill: NAVY_70})}
          x={Math.cos(a) * (r + 52)}
          y={Math.sin(a) * (r + 52)}
          text={`${o.target}%`}
        />
      </>,
    );
  }

  return {
    root,
    *run(seconds = 1.4): ThreadGenerator {
      yield* all(root().opacity(1, 0.3), p(1, seconds, easeInOutCubic));
      p(1);
    },
  };
}

/* ------------------------------------------------------------- ranked bars --- */

/** Horizontal ranked bar list: one scale, axis from 0, value rides the bar end.
    A zero value renders as a baseline tick — never as invented height. */
export function rankedBars(
  parent: Node,
  o: {
    items: BarSpec[];
    max: number;
    width?: number;
    barH?: number;
    gap?: number;
    labelW?: number;
    labelSize?: number;
    valueSize?: number;
    x?: number;
    y0?: number;
  },
) {
  const width = o.width ?? 560;
  const barH = o.barH ?? 24;
  const gap = o.gap ?? 10;
  const labelW = o.labelW ?? 178;
  const labelSize = o.labelSize ?? 20;
  const valueSize = o.valueSize ?? 20;
  const x0 = -width / 2 + labelW + 12;
  const span = width / 2 - 56 - x0;
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} opacity={0} />);
  const progress: SimpleSignal<number>[] = [];

  o.items.forEach((b, i) => {
    const p = createSignal(0);
    progress.push(p);
    const y = (o.y0 ?? 0) + i * (barH + gap);
    const len = (b.value / o.max) * span;
    root().add(
      <>
        <Txt
          {...txt({fontSize: labelSize, fontWeight: 500, fill: INK})}
          x={x0 - 14}
          y={y}
          offsetX={1}
          text={b.label}
        />
        {b.value === 0 ? (
          <Line points={[[x0, y - barH / 2], [x0, y + barH / 2]]} stroke={NAVY} lineWidth={6} opacity={() => p()} />
        ) : (
          <Rect height={barH} width={() => len * p()} fill={NAVY} left={() => [x0, y]} radius={3} />
        )}
        <Txt
          {...txt({fontSize: valueSize, fontWeight: 700})}
          x={() => x0 + len * p() + 16}
          y={y}
          offsetX={-1}
          opacity={() => Math.min(1, p() * 3)}
          text={b.value.toString()}
        />
      </>,
    );
  });

  // axis from zero
  const top = (o.y0 ?? 0) - barH / 2 - 8;
  const bottom = (o.y0 ?? 0) + (o.items.length - 1) * (barH + gap) + barH / 2 + 8;
  root().add(<Line points={[[x0, top], [x0, bottom]]} stroke={NAVY_30} lineWidth={3} />);

  return {
    root,
    *reveal(seconds = 1.2, stagger = 0.12): ThreadGenerator {
      yield* all(
        root().opacity(1, 0.3),
        ...progress.map((p, i) => after(i * stagger, p(1, seconds, easeOutCubic))),
      );
      progress.forEach(p => p(1));
    },
  };
}

/* ------------------------------------------------------------ counter grid --- */

export type CellKind = 'doc' | 'gear' | 'envelope';

/** N outline cells that fill navy in a diagonal wave, beside the counter they prove. */
export function counterGrid(
  parent: Node,
  o: {count: number; cols: number; cw?: number; ch?: number; gx?: number; gy?: number; x?: number; y?: number; kind?: CellKind},
) {
  const cw = o.cw ?? 22;
  const ch = o.ch ?? 26;
  const gx = o.gx ?? 6;
  const gy = o.gy ?? 6;
  const rows = Math.ceil(o.count / o.cols);
  const totalW = o.cols * cw + (o.cols - 1) * gx;
  const totalH = rows * ch + (rows - 1) * gy;
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} />);
  const fills: {sig: SimpleSignal<number>; d: number}[] = [];
  const kind = o.kind ?? 'doc';

  for (let i = 0; i < o.count; i++) {
    const c = i % o.cols;
    const r = Math.floor(i / o.cols);
    const x = -totalW / 2 + cw / 2 + c * (cw + gx);
    const y = -totalH / 2 + ch / 2 + r * (ch + gy);
    const sig = createSignal(0);
    fills.push({sig, d: c + r});
    if (kind === 'gear') {
      root().add(
        <>
          <Circle size={Math.min(cw, ch)} stroke={NAVY_50} lineWidth={2} x={x} y={y} />
          <Circle size={Math.min(cw, ch)} fill={NAVY} x={x} y={y} opacity={sig} />
        </>,
      );
    } else if (kind === 'envelope') {
      root().add(
        <>
          <Rect width={cw} height={ch} radius={2} stroke={NAVY_50} lineWidth={2} x={x} y={y} />
          <Line
            points={[[-cw / 2, -ch / 2], [0, 0], [cw / 2, -ch / 2]]}
            stroke={NAVY_50}
            lineWidth={2}
            x={x}
            y={y}
          />
          <Rect width={cw} height={ch} radius={2} fill={NAVY} x={x} y={y} opacity={sig} />
        </>,
      );
    } else {
      root().add(
        <>
          <Rect width={cw} height={ch} radius={2} stroke={NAVY_50} lineWidth={2} x={x} y={y} />
          <Rect width={cw} height={ch} radius={2} fill={NAVY} x={x} y={y} opacity={sig} />
        </>,
      );
    }
  }

  const maxD = Math.max(...fills.map(f => f.d)) || 1;
  return {
    root,
    /** Diagonal wave: every cell lands solid, so the count on screen is the count drawn. */
    *fill(seconds = 1.2): ThreadGenerator {
      const cell = 0.26;
      const step = Math.max(0.01, (seconds - cell) / maxD);
      yield* all(
        root().opacity(1, 0.25),
        ...fills.map(f => after(f.d * step, f.sig(1, cell, easeOutCubic))),
      );
      fills.forEach(f => f.sig(1));
    },
  };
}

/* ------------------------------------------------------------ timeline band --- */

export interface TimelineStop {
  label: string;
  sub?: string;
  solid?: boolean;
}

/** A band of dated stops with a navy marker sweeping left to right; dots pop as passed. */
export function timelineBand(
  parent: Node,
  o: {
    stops: TimelineStop[];
    width: number;
    x?: number;
    y?: number;
    labelSize?: number;
    subSize?: number;
    dotR?: number;
    labelAbove?: boolean;
    labelWidth?: number;
    subWidth?: number;
    split?: boolean;
  },
) {
  const labelSize = o.labelSize ?? 20;
  const subSize = o.subSize ?? 16;
  const dotR = o.dotR ?? 13;
  const n = o.stops.length;
  const step = o.width / (n - 1);
  const xs = o.stops.map((_, i) => (-o.width / 2 + i * step) * mirror());
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} />);
  const line = createRef<Line>();
  root().add(
    <Line
      ref={line}
      points={[[xs[0], 0], [xs[n - 1], 0]]}
      stroke={NAVY_30}
      lineWidth={4}
      end={0}
    />,
  );

  const labelW = o.labelWidth ?? step * 1.35;
  const subW = o.subWidth ?? step * 1.5;
  const dots: Reference<Node>[] = [];
  o.stops.forEach((s, i) => {
    const d = createRef<Node>();
    const up = o.split ? true : (o.labelAbove ?? i % 2 === 0);
    const subY = o.split
      ? dotR + 26 + subSize * 0.6
      : up
        ? -(dotR + 26 + labelSize * 2.2 + 14)
        : dotR + 28 + labelSize * 2.2 + 14;
    root().add(
      <Node ref={d} x={xs[i]} opacity={0}>
        <Circle
          size={dotR * 2}
          fill={s.solid ? NAVY : WHITE}
          stroke={s.solid ? NAVY : NAVY_50}
          lineWidth={4}
        />
        {wrapTxt({
          text: s.label,
          width: labelW,
          fontSize: labelSize,
          fontWeight: 700,
          fill: s.solid ? NAVY : NAVY_70,
          y: up ? -dotR - 22 - labelSize * 0.3 : dotR + 24 + labelSize * 0.3,
          lineHeight: labelSize + 4,
        })}
        {s.sub ? (
          wrapTxt({
            text: s.sub,
            width: subW,
            fontSize: subSize,
            y: subY,
            lineHeight: subSize + 4,
          })
        ) : null}
      </Node>,
    );
    dots.push(d);
  });

  const marker = createRef<Node>();
  root().add(
    <Node ref={marker} x={xs[0]} opacity={0}>
      <Line points={[[-13, -20], [13, -20], [0, -2]]} closed fill={NAVY} />
    </Node>,
  );

  return {
    root,
    marker,
    dots,
    *sweep(seconds = 1.8): ThreadGenerator {
      const leg = seconds / Math.max(1, n - 1);
      yield* all(root().opacity(1, 0.25), line().end(1, 0.5), marker().opacity(1, 0.25));
      yield* dots[0]().opacity(1, 0.22);
      for (let i = 1; i < n; i++) {
        yield* all(
          marker().position.x(xs[i], leg, easeInOutCubic),
          after(leg * 0.5, dots[i]().opacity(1, Math.min(0.22, leg * 0.5))),
        );
      }
    },
  };
}

/* --------------------------------------------------------------- hub & spoke --- */

/** Hub with satellites on a fan; spokes draw on by dash-offset, then drift inward. */
export function hubSpoke(
  parent: Node,
  o: {
    hub: string;
    satellites: {label: string; sub: string}[];
    x?: number;
    y?: number;
    hubR?: number;
    radius?: number;
    satR?: number;
    subSide?: boolean;
    subWidth?: number;
  },
) {
  const hubR = o.hubR ?? 62;
  const radius = o.radius ?? 196;
  const satR = o.satR ?? 54;
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={o.x ?? 0} y={o.y ?? 0} opacity={0} />);
  const hubX = (-radius / 2 - 44) * mirror();
  root().add(
    <>
      <Circle size={hubR * 2} fill={NAVY} x={hubX} />
      {wrapTxt({
        text: o.hub,
        width: hubR * 1.9,
        fontSize: 19,
        fontWeight: 700,
        fill: WHITE,
        x: hubX,
        lineHeight: 22,
      })}
    </>,
  );

  const angles = [-52, 0, 52];
  const spokes: Reference<Line>[] = [];
  const sats: Reference<Node>[] = [];
  o.satellites.forEach((s, i) => {
    const a = (angles[i % 3] * Math.PI) / 180;
    const sx = hubX + Math.cos(a) * radius * mirror();
    const sy = Math.sin(a) * radius;
    const sp = createRef<Line>();
    const sn = createRef<Node>();
    root().add(
      <>
        <Line
          ref={sp}
          points={[[hubX + Math.cos(a) * (hubR + 6) * mirror(), Math.sin(a) * (hubR + 6)], [sx - Math.cos(a) * (satR + 6) * mirror(), sy - Math.sin(a) * (satR + 6)]]}
          stroke={NAVY_30}
          lineWidth={4}
          lineDash={[12, 10]}
          end={0}
        />
        <Node ref={sn} x={sx} y={sy} opacity={0}>
          <Circle size={satR * 2} stroke={NAVY_50} lineWidth={5} />
          {wrapTxt({
            text: s.label,
            width: satR * 1.9,
            fontSize: 20,
            fontWeight: 700,
            fill: NAVY_70,
            lineHeight: 23,
          })}
          {wrapTxt({
            text: s.sub,
            width: o.subWidth ?? 230,
            fontSize: 16,
            x: o.subSide ? (satR + 12 + (o.subWidth ?? 230) / 2) * mirror() : 0,
            y: o.subSide ? 0 : satR + 20,
            lineHeight: 19,
          })}
        </Node>
      </>,
    );
    spokes.push(sp);
    sats.push(sn);
  });

  return {
    root,
    *draw(seconds = 1.2, stagger = 0.3): ThreadGenerator {
      yield* root().opacity(1, 0.3);
      yield* sequence(
        stagger,
        ...spokes.map((sp, i) => all(sp().end(1, seconds * 0.6), sats[i]().opacity(1, seconds * 0.5))),
      );
    },
    /** Integration hint: the satellites drift toward the hub and settle. One system. */
    *merge(seconds = 1.4, distance = 40): ThreadGenerator {
      yield* all(
        ...sats.map((s, i) => {
          const a = (angles[i % 3] * Math.PI) / 180;
          return s().position(
            [s().position.x() - Math.cos(a) * distance * mirror(), s().position.y() - Math.sin(a) * distance],
            seconds,
            easeInOutCubic,
          );
        }),
      );
    },
  };
}

/* ------------------------------------------------------------ flow between --- */

/** Dots travel from one party to another and are absorbed; the target pulses 1.06×. */
export function flowBetween(
  parent: Node,
  o: {
    from: [number, number];
    to: [number, number];
    fromIcon: Node;
    toIcon: Node;
    fromLabel?: string;
    toLabel?: string;
    dots?: number;
    labelSize?: number;
    dotFill?: string;
    dotSize?: number;
  },
) {
  const nDots = o.dots ?? 4;
  const from: [number, number] = [o.from[0] * mirror(), o.from[1]];
  const to: [number, number] = [o.to[0] * mirror(), o.to[1]];
  const root = createRef<Node>();
  const src = createRef<Node>();
  const dst = createRef<Node>();
  parent.add(<Node ref={root} opacity={0} />);
  root().add(
    <>
      <Line points={[from, to]} stroke={NAVY_30} lineWidth={3} lineDash={[10, 9]} />
      <Node ref={src} x={from[0]} y={from[1]}>
        {o.fromIcon}
      </Node>
      <Node ref={dst} x={to[0]} y={to[1]}>
        {o.toIcon}
      </Node>
    </>,
  );
  if (o.fromLabel) {
    root().add(
      wrapTxt({
        text: o.fromLabel,
        width: 200,
        fontSize: o.labelSize ?? 17,
        fontWeight: 600,
        fill: NAVY_70,
        x: from[0],
        y: from[1] + 58,
        lineHeight: 20,
      }),
    );
  }
  if (o.toLabel) {
    root().add(
      wrapTxt({
        text: o.toLabel,
        width: 200,
        fontSize: o.labelSize ?? 17,
        fontWeight: 600,
        fill: NAVY_70,
        x: to[0],
        y: to[1] + 58,
        lineHeight: 20,
      }),
    );
  }

  const dots: Reference<Circle>[] = [];
  for (let i = 0; i < nDots; i++) {
    const d = createRef<Circle>();
    root().add(<Circle ref={d} size={o.dotSize ?? 16} fill={o.dotFill ?? NAVY} x={from[0]} y={from[1]} opacity={0} />);
    dots.push(d);
  }

  return {
    root,
    *run(seconds = 1.4): ThreadGenerator {
      yield* root().opacity(1, 0.3);
      const stagger = seconds / (nDots + 1);
      yield* sequence(
        stagger,
        ...dots.map(d =>
          chain(
            d().opacity(1, 0.12),
            d().position(to, seconds * 0.55, easeInOutCubic),
            all(d().opacity(0, 0.14), d().size(6, 0.14), dst().scale(1.06, 0.1).to(1, 0.12)),
          ),
        ),
      );
    },
  };
}

/* ------------------------------------------------------- funnel → stacked bar --- */

/** Three bars on one scale that BECOME a single 100 % stacked bar, point order kept:
    bar 0 → segment 0, bar 1 → segment 1, bar 2 → segment 2, then 3 and 4 grow on. */
export function funnelToStack(
  parent: Node,
  o: {
    funnel: BarSpec[];
    max: number;
    segments: BarSpec[];
    width?: number;
    labelW?: number;
    barH?: number;
    gap?: number;
    yFunnel?: number;
    yStack?: number;
    labelSize?: number;
    x?: number;
  },
) {
  const width = o.width ?? 560;
  const labelW = o.labelW ?? 190;
  const barH = o.barH ?? 40;
  const gap = o.gap ?? 22;
  const yFunnel = o.yFunnel ?? -110;
  const yStack = o.yStack ?? -60;
  const labelSize = o.labelSize ?? 20;
  const x0 = -width / 2 + labelW;
  const span = width / 2 - 52 - x0;
  const tints = [NAVY, NAVY_70, NAVY_50, NAVY_30, NAVY_10];

  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} opacity={0} />);

  const total = o.segments.reduce((a, b) => a + b.value, 0);
  const segW = o.segments.map(s => (s.value / total) * span);
  const segX: number[] = [];
  segW.reduce((acc, w, i) => {
    segX[i] = x0 + acc;
    return acc + w;
  }, 0);

  const w = o.funnel.map(() => createSignal(0));
  const bars: Reference<Rect>[] = [];
  const funnelText: Reference<Node>[] = [];

  o.funnel.forEach((b, i) => {
    const y = yFunnel + i * (barH + gap);
    const bar = createRef<Rect>();
    const ft = createRef<Node>();
    root().add(
      <>
        <Rect ref={bar} x={x0} y={y} offsetX={-1} height={barH} width={w[i]} fill={NAVY} radius={4} />
        <Node ref={ft}>
          {wrapTxt({
            text: b.label,
            width: labelW - 20,
            fontSize: labelSize,
            x: x0 - 14 - (labelW - 20) / 2,
            y,
            lineHeight: labelSize + 4,
            textAlign: 'right',
          })}
          <Txt
            {...txt({fontSize: labelSize + 4, fontWeight: 700})}
            x={() => x0 + w[i]() + 14}
            y={y}
            offsetX={-1}
            text={b.value.toString()}
          />
        </Node>
      </>,
    );
    bars.push(bar);
    funnelText.push(ft);
  });

  // axis from zero
  root().add(
    <Line
      points={[[x0, yFunnel - barH / 2 - 10], [x0, yFunnel + 2 * (barH + gap) + barH / 2 + 10]]}
      stroke={NAVY_30}
      lineWidth={3}
    />,
  );

  // the two segments that are not carried over from a funnel bar
  const extra: Reference<Rect>[] = [];
  const extraW = o.segments.slice(3).map(() => createSignal(0));
  o.segments.slice(3).forEach((s, j) => {
    const r = createRef<Rect>();
    root().add(
      <Rect
        ref={r}
        x={segX[3 + j]}
        y={yStack}
        offsetX={-1}
        height={barH}
        width={extraW[j]}
        fill={tints[3 + j]}
        opacity={0}
      />,
    );
    extra.push(r);
  });

  // weights ride their segment; the names sit in a legend beneath
  const stackText = createRef<Node>();
  root().add(<Node ref={stackText} opacity={0} />);
  o.segments.forEach((s, i) => {
    const cx = segX[i] + segW[i] / 2;
    const inside = segW[i] > 90;
    stackText().add(
      <Txt
        {...txt({fontSize: 22, fontWeight: 700, fill: inside ? WHITE : NAVY})}
        x={cx}
        y={inside ? yStack : yStack - barH / 2 - 18}
        text={s.value.toString()}
      />,
    );
  });
  o.segments.forEach((s, i) => {
    const row = i < 3 ? 0 : 1;
    const col = i < 3 ? i : i - 3;
    const perRow = row === 0 ? 3 : 2;
    const cellW = width / perRow;
    const lx = (-width / 2 + cellW * col + 14) * mirror();
    const ly = yStack + barH / 2 + 34 + row * 30;
    const textW = cellW - 44;
    stackText().add(
      <>
        <Rect width={18} height={18} radius={3} fill={tints[i]} stroke={NAVY_30} lineWidth={2} x={lx} y={ly} />
        <Txt
          {...txt({fontSize: 17, fontWeight: 500, fill: INK})}
          x={lx + (16 + textW / 2) * mirror()}
          y={ly}
          width={textW}
          textAlign={isRtl() ? 'right' : 'left'}
          text={s.label}
        />
      </>,
    );
  });

  return {
    root,
    *revealFunnel(seconds = 1.2, stagger = 0.15): ThreadGenerator {
      yield* all(
        root().opacity(1, 0.3),
        ...w.map((sig, i) => after(i * stagger, sig((o.funnel[i].value / o.max) * span, seconds, easeOutCubic))),
      );
      w.forEach((sig, i) => sig((o.funnel[i].value / o.max) * span));
    },
    /** Bars become segments in place — same order, no random stagger. */
    *morph(seconds = 1.6): ThreadGenerator {
      yield* all(...funnelText.map(t => t().opacity(0, seconds * 0.3)));
      yield* all(
        ...bars.map((b, i) =>
          all(
            b().position.y(yStack, seconds, easeInOutCubic),
            b().position.x(segX[i], seconds, easeInOutCubic),
            b().fill(tints[i], seconds, easeInOutCubic),
            w[i](segW[i], seconds, easeInOutCubic),
          ),
        ),
      );
      yield* all(
        ...extra.map((r, j) =>
          all(r().opacity(1, 0.2), extraW[j](segW[3 + j], 0.5, easeOutCubic)),
        ),
        stackText().opacity(1, 0.5),
      );
    },
  };
}

/* ------------------------------------------------------------------ pieces --- */

/** Plan · Do · Check · Act as a ring with spokes that draw on. */
export function pdcaRing(
  parent: Node,
  o: {x?: number; y?: number; r?: number; labels?: string[]; nodeR?: number},
) {
  const r = o.r ?? 88;
  const nodeR = o.nodeR ?? 30;
  const labels = o.labels ?? ['P', 'D', 'C', 'A'];
  const root = createRef<Node>();
  parent.add(<Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} />);
  const ring = createRef<Circle>();
  root().add(<Circle ref={ring} size={r * 2} stroke={NAVY_30} lineWidth={4} lineDash={[12, 10]} end={0} />);
  const nodes: Reference<Node>[] = [];
  labels.forEach((l, i) => {
    const a = (-90 + i * 90) * (Math.PI / 180);
    const n = createRef<Node>();
    root().add(
      <Node ref={n} x={Math.cos(a) * r} y={Math.sin(a) * r} opacity={0}>
        <Circle size={nodeR * 2} fill={WHITE} stroke={NAVY_50} lineWidth={4} />
        <Txt {...txt({fontSize: 26, fontWeight: 700, fill: NAVY_70})} text={l} />
      </Node>,
    );
    nodes.push(n);
  });
  return {
    root,
    *draw(seconds = 1.2): ThreadGenerator {
      yield* all(
        root().opacity(1, 0.3),
        ring().end(1, seconds, easeInOutCubic),
        ...nodes.map((n, i) => after(0.18 + i * (seconds / 5), n().opacity(1, 0.28))),
      );
    },
  };
}

/** An outline badge circle: a standard not yet held, with its plan beneath. */
export function outlineBadge(
  parent: Node,
  o: {x?: number; y?: number; r?: number; title: string; sub?: string; solid?: boolean},
) {
  const r = o.r ?? 56;
  const root = createRef<Node>();
  parent.add(
    <Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} scale={0.7}>
      <Circle size={r * 2} stroke={o.solid ? NAVY : NAVY_50} lineWidth={5} fill={o.solid ? NAVY_10 : null} />
      <Circle size={r * 2 - 18} stroke={o.solid ? NAVY_50 : NAVY_30} lineWidth={2} />
      {wrapTxt({
        text: o.title,
        width: r * 1.8,
        fontSize: 19,
        fontWeight: 700,
        fill: o.solid ? NAVY : NAVY_70,
        lineHeight: 22,
      })}
      {o.sub ? (
        wrapTxt({text: o.sub, width: r * 3, fontSize: 16, y: r + 20, lineHeight: 19})
      ) : null}
    </Node>,
  );
  return {
    root,
    *pop(seconds = 0.6): ThreadGenerator {
      yield* all(root().opacity(1, seconds * 0.5), root().scale(1, seconds, easeOutCubic));
    },
  };
}

/** A small dated pill — the date is data, so it gets its own object. */
export function datePill(
  parent: Node,
  o: {x?: number; y?: number; text: string; size?: number; solid?: boolean; width?: number},
) {
  const size = o.size ?? 20;
  const width = o.width ?? 240;
  const root = createRef<Node>();
  parent.add(
    <Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0} scale={0.8}>
      <Rect
        width={width}
        height={size + 22}
        radius={(size + 22) / 2}
        fill={o.solid ? NAVY : null}
        stroke={o.solid ? NAVY : NAVY_50}
        lineWidth={3}
      />
      <Txt {...txt({fontSize: size, fontWeight: 600, fill: o.solid ? WHITE : NAVY_70})} text={o.text} />
    </Node>,
  );
  return {
    root,
    *pop(seconds = 0.45): ThreadGenerator {
      yield* all(root().opacity(1, seconds * 0.6), root().scale(1, seconds, easeOutCubic));
    },
  };
}

/** A clock whose hand sweeps whole turns and meets a dashed deadline tick. */
export function clockSweep(parent: Node, o: {x?: number; y?: number; size?: number; deadline?: number}) {
  const size = o.size ?? 120;
  const r = size / 2;
  const root = createRef<Node>();
  const hand = createRef<Line>();
  const deadline = o.deadline ?? -60; // degrees from 12 o'clock
  const a = ((deadline - 90) * Math.PI) / 180;
  parent.add(
    <Node ref={root} x={(o.x ?? 0) * mirror()} y={o.y ?? 0} opacity={0}>
      <Circle size={size} stroke={NAVY} lineWidth={7} />
      <Line
        points={[[Math.cos(a) * (r - 12), Math.sin(a) * (r - 12)], [Math.cos(a) * (r + 14), Math.sin(a) * (r + 14)]]}
        stroke={NAVY_70}
        lineWidth={5}
        lineDash={[6, 5]}
      />
      <Line ref={hand} points={[[0, 0], [0, -r + 18]]} stroke={NAVY} lineWidth={6} lineCap={'round'} />
      <Circle size={12} fill={NAVY} />
    </Node>,
  );
  return {
    root,
    *run(turns = 2, seconds = 1.2): ThreadGenerator {
      yield* all(root().opacity(1, 0.3), hand().rotation(360 * turns + deadline, seconds, easeInOutCubic));
    },
  };
}
