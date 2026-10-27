/* settle kernel: the motion maths every settle piece shares.
 *
 * An ES module. In a standalone file, paste it whole at the top of the piece's <script type="module">;
 * in a project, import it: `import settle from "./settle.js"`. Either way it also sets globalThis.settle,
 * which snap.mjs looks for. Every value is a formula of time, so a live piece and a self-playing reel use
 * the same maths: a reel can seek to any frame.
 *
 * Springs are set by duration and bounce, as in SwiftUI and Motion: duration is the undamped period in
 * seconds, bounce is 1 - damping ratio. A curve preset, { duration, curve: [x1, y1, x2, y2] }, eases
 * along that cubic-bezier instead.
 */
const settle = (() => {
  // Motion registers. A look deals one register;
  // the craft rules hold in all of them. Moves (morph, fold, front, back, pop, throw) may overshoot a
  // little; colour and opacity (fade) and shown values (count) never do, after Material's split of
  // spatial and effects springs.
  const EASED = [0.45, 0, 0.15, 1]; // the eased glide: a soft start, a long soft landing
  const registers = {
    crisp: { // quick springs on every move, overshooting slightly
      morph: { duration: 0.365, bounce: 0.185 }, // one state growing into the next
      fold: { duration: 0.365, bounce: 0.185 }, // a state folding back
      front: { duration: 0.24, bounce: 0.125 }, // a moving indicator's front edge
      back: { duration: 0.42, bounce: 0.16 }, // its back edge
      pop: { duration: 0.3, bounce: 0.05 }, // something appearing; a mask rise
      fade: { duration: 0.15, bounce: 0 }, // colour and opacity inside a control
      count: { duration: 0.5, bounce: 0 }, // a number on its way to a new value: about half a second, never past it
      throw: { duration: 0.365, bounce: 0.185 }, // a value the hand lets go
    },
    soft: { // eased moves near 0.5 s that start slowly; arrivals glide, none spring
      morph: { duration: 0.49, curve: EASED },
      fold: { duration: 0.49, curve: EASED },
      front: { duration: 0.32, curve: EASED }, // derived: front and back keep crisp's ratios to its morph
      back: { duration: 0.56, curve: EASED }, // derived, as front
      pop: { duration: 0.25, curve: EASED }, // a caption gliding to its place
      fade: { duration: 0.12, curve: [0.42, 0, 0.58, 1] }, // a flood, soft at the start
      count: { duration: 0.49, curve: EASED },
      throw: { duration: 0.45, bounce: 0.11 },
    },
    smooth: { // long eased grows; folds and arrivals settle on springs
      morph: { duration: 0.71, curve: EASED },
      fold: { duration: 0.72, bounce: 0.21 },
      front: { duration: 0.47, curve: EASED }, // derived, as soft
      back: { duration: 0.82, curve: EASED }, // derived, as soft
      pop: { duration: 0.3, bounce: 0.05 },
      fade: { duration: 0.3, curve: EASED }, // a flood across the page
      count: { duration: 0.8, curve: EASED }, // a temperature counting up
      throw: { duration: 0.67, bounce: 0.14 }, // a knob let go after a drag
    },
  };
  const INSTANT = { duration: 0.001, bounce: 0 };
  // Reduced motion: every move lands at once; colour and opacity keep a short fade.
  registers.calm = Object.fromEntries(Object.keys(registers.crisp).map((k) => [k, k === "fade" ? registers.crisp.fade : INSTANT]));
  const presets = registers.crisp;
  const gaps = { row: 0.037, label: 0.067 }; // stagger between list rows, between tab labels (s)
  const HAND = 0.1; // a drag's speed comes from its last 0.1 s of samples, as Emil Kowalski's apple-design skill advises (s)
  let dealt = presets;

  const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = () => (reduced() ? registers.calm : dealt);

  /** The presets to move with. A name deals that register; the calm one stands in when the system asks for reduced motion. */
  function register(name) {
    if (name) dealt = registers[name] || presets;
    return current();
  }

  /** Seconds on the page clock. Read time only here: snap.mjs sets window.settleTime to step a piece frame by frame. */
  function now() {
    return typeof globalThis.settleTime === "number" ? globalThis.settleTime : performance.now() / 1000;
  }

  function terms(p) {
    const w0 = (2 * Math.PI) / p.duration;
    const zeta = 1 - Math.min(Math.max(p.bounce || 0, 0), 0.99);
    return { w0, zeta, sigma: zeta * w0, wd: w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta)) };
  }

  /** Position t seconds after a spring is let go at `from` with speed `velocity`, heading to `to`. */
  function spring(t, p, from, to, velocity = 0) {
    if (t <= 0) return from;
    const { w0, zeta, sigma, wd } = terms(p);
    const a = from - to;
    if (zeta < 1) {
      return to + Math.exp(-sigma * t) * (a * Math.cos(wd * t) + ((velocity + sigma * a) / wd) * Math.sin(wd * t));
    }
    return to + Math.exp(-w0 * t) * (a + (velocity + w0 * a) * t);
  }

  /** Speed of the same spring at time t. */
  function springVelocity(t, p, from, to, velocity = 0) {
    if (t <= 0) return velocity;
    const { w0, zeta, sigma, wd } = terms(p);
    const a = from - to;
    if (zeta < 1) {
      const b = (velocity + sigma * a) / wd;
      return Math.exp(-sigma * t) * ((-sigma * a + wd * b) * Math.cos(wd * t) - (sigma * b + wd * a) * Math.sin(wd * t));
    }
    const b = velocity + w0 * a;
    return Math.exp(-w0 * t) * (b - w0 * (a + b * t));
  }

  /** CSS cubic-bezier as a function of progress u in [0, 1]. */
  function bezier(p1x, p1y, p2x, p2y) {
    return function (u) {
      if (u <= 0) return 0;
      if (u >= 1) return 1;
      let lo = 0, hi = 1, s = u;
      for (let i = 0; i < 32; i++) {
        s = (lo + hi) / 2;
        const x = 3 * (1 - s) * (1 - s) * s * p1x + 3 * (1 - s) * s * s * p2x + s * s * s;
        if (x < u) lo = s; else hi = s;
      }
      return 3 * (1 - s) * (1 - s) * s * p1y + 3 * (1 - s) * s * s * p2y + s * s * s;
    };
  }
  const glide = bezier(...EASED); // scripted growth, typically over 0.5-0.85 s
  const curves = new WeakMap();
  const curveOf = (p) => curves.get(p) || curves.set(p, bezier(...p.curve)).get(p);

  /** How much of a unit move under preset p is still to go, t seconds after it starts: 1, falling to 0. */
  function remain(p, t) {
    if (t <= 0) return 1;
    return p.curve ? 1 - curveOf(p)(t / p.duration) : spring(t, p, 1, 0);
  }
  function remainVelocity(p, t) {
    if (!p.curve) return springVelocity(t, p, 1, 0);
    if (t <= 0 || t >= p.duration) return 0;
    const h = Math.min(1e-4, t, p.duration - t);
    return (remain(p, t + h) - remain(p, t - h)) / (2 * h);
  }

  /** Where a move under preset p from `from` to `to` is, t seconds after it starts. */
  function move(t, p, from, to) {
    return to + (from - to) * remain(p, t);
  }

  /**
   * A value that moves to each new target and keeps its speed when the target moves mid-flight. Each
   * change adds one move's step response, so value(t) depends on t alone: record changes in
   * time order. While the hand holds the value, it follows the pointer exactly.
   */
  function track(initial, preset = current().morph) {
    let base = { t: -Infinity, from: initial, to: initial, v: 0, p: preset };
    let changes = [];
    let target = initial;
    let held = null;
    // Changes before `done` had come to rest by `doneAt` and add their whole step, so a piece that sets targets for hours
    // still works through only its moves in flight each frame. A seek back counts again from the start.
    let done = 0, doneSum = 0, doneAt = -Infinity;
    const restAt = (c) => c.t + (c.p.curve ? c.p.duration : 30 / terms(c.p).sigma); // a spring keeps under 1e-9 of its step from here
    const advance = (t) => {
      if (t < doneAt) { done = 0; doneSum = 0; }
      while (done < changes.length && restAt(changes[done]) <= t) doneSum += changes[done++].d;
      doneAt = t;
    };
    const api = {
      get target() { return target; },
      get held() { return held !== null; },
      set(to, t, p = preset) {
        if (to !== target) changes.push({ t, d: to - target, p });
        target = to;
        return api;
      },
      value(t) {
        if (held) return held.x;
        advance(t);
        let x = (base.t === -Infinity ? base.from : spring(t - base.t, base.p, base.from, base.to, base.v)) + doneSum;
        for (let k = done; k < changes.length; k++) { const c = changes[k]; if (t > c.t) x += c.d * (1 - remain(c.p, t - c.t)); }
        return x;
      },
      velocity(t) {
        if (held) return t - held.t > HAND ? 0 : held.v; // no sample for a while: the hand is still
        advance(t);
        let v = base.t === -Infinity ? 0 : springVelocity(t - base.t, base.p, base.from, base.to, base.v);
        for (let k = done; k < changes.length; k++) { const c = changes[k]; if (t > c.t) v -= c.d * remainVelocity(c.p, t - c.t); }
        return v;
      },
      /** The hand has the value: it is exactly x until release. Its speed spans the last HAND seconds of samples. */
      hold(x, t) {
        const s = (held ? held.s : []).filter((q) => t - q.t <= HAND);
        s.push({ x, t });
        held = { x, t, s, v: t > s[0].t ? (x - s[0].x) / (t - s[0].t) : 0 };
        target = x;
        return api;
      },
      /** Let go: spring from where the hand left it, at its speed, to `to`. Only a spring carries speed, so a curve preset hands over to the register's throw. */
      release(t, to = target, p = preset) {
        const from = held ? held.x : api.value(t);
        const v = api.velocity(t);
        base = { t, from, to, v, p: p.curve ? current().throw : p };
        changes = [];
        done = 0; doneSum = 0; doneAt = -Infinity;
        target = to;
        held = null;
        return api;
      },
    };
    return api;
  }

  /**
   * One track per edge: the edge in front of the move runs on the faster spring, so a moving pill
   * stretches and then settles.
   */
  function stretch(start, end, front = current().front, back = current().back) {
    const lo = track(start, back);
    const hi = track(end, back);
    return {
      set(start2, end2, t) {
        const right = start2 + end2 > lo.target + hi.target;
        hi.set(end2, t, right ? front : back);
        lo.set(start2, t, right ? back : front);
        return this;
      },
      value(t) { return [lo.value(t), hi.value(t)]; },
    };
  }

  /** Past a limit, how far the shape follows: one to one at first, never more than `limit`. */
  function rubber(over, limit) {
    return Math.sign(over) * limit * Math.tanh(Math.abs(over) / limit);
  }

  /** Delay for the i-th item of a group that arrives in order. */
  function stagger(i, gap = gaps.row) {
    return i * gap;
  }

  /**
   * Odometer columns for a number on its way somewhere: one float per place, most significant first.
   * A column turns only while the one to its right rolls past 9, so digits come to rest from left to right.
   */
  function odometer(value, places) {
    const out = [];
    let lower = Math.abs(value) % 10;
    out.push(lower);
    for (let k = 1; k < places; k++) {
      const pos = (Math.floor(Math.abs(value) / Math.pow(10, k)) % 10) + Math.max(0, lower - 9);
      out.push(pos);
      lower = pos;
    }
    return out.reverse();
  }

  /**
   * Radius of a flood at progress p: sqrt(p) makes the covered area grow at a steady rate. The first 0.2 % counts
   * as closed, so a spring's long tail doesn't leave a dot behind when a flood drains.
   */
  function flood(p, maxRadius) {
    return maxRadius * Math.sqrt(Math.max(0, (Math.min(p, 1) - 0.002) / 0.998));
  }

  /** Styles for a blur swap at progress p: the old content blurs out, then the new blurs in. Blur stays at 6 px or less;
   * draw it with blur(). */
  function blurSwap(p, maxBlur = 6) {
    const q = Math.min(Math.max(p, 0), 1);
    return {
      out: { opacity: 1 - Math.min(1, q * 2), blur: maxBlur * Math.min(1, q * 2) },
      in: { opacity: Math.max(0, q * 2 - 1), blur: maxBlur * (1 - Math.max(0, q * 2 - 1)) },
    };
  }

  /** Blurs an element by px, and clears the blur at 0 and under reduced motion. Every blur goes through here: the element
   * rides a layer of its own while it is blurred, because Safari on iPhone draws a stray purple line along a blur it
   * paints in place (seen on iOS 27). */
  function blur(el, px) {
    const on = px > 0.05 && !reduced();
    el.style.filter = on ? `blur(${px}px)` : "none";
    el.style.willChange = on ? "filter" : "";
  }

  /**
   * When each character of `text` appears, in seconds from the start: quick runs inside words, short
   * pauses at spaces, longer ones after punctuation.
   */
  function typeTimes(text, { rate = 22, seed = 7 } = {}) {
    let s = seed, t = 0;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from(text, (ch, i) => {
      const prev = text[i - 1];
      t += (0.6 + rand() * 0.8) / rate;
      if (prev === " ") t += 1.5 / rate;
      if (prev && ".,!?:;".includes(prev)) t += 6 / rate;
      return t;
    });
  }

  /**
   * Drives a reel: calls render(t) every frame with t looping over `duration`.
   * seek(t) shows any frame; with reduced motion it starts paused on frame 0. stop() ends its frame loop,
   * for a component that unmounts.
   */
  function timeline(duration, render, { loop = true } = {}) {
    let playing = !reduced(), at = 0, last = null, raf = 0;
    function frame(now) {
      if (playing) {
        if (last !== null) at += (now - last) / 1000;
        if (at >= duration) at = loop ? at % duration : duration;
      }
      last = now;
      render(at);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      get time() { return at; },
      get duration() { return duration; },
      get playing() { return playing; },
      play() { playing = true; },
      pause() { playing = false; },
      seek(t) { at = Math.min(Math.max(t, 0), duration); render(at); },
      stop() { cancelAnimationFrame(raf); },
    };
  }

  return {
    presets, registers, register, gaps, now, spring, springVelocity, move, track, stretch, rubber, bezier, glide,
    stagger, odometer, flood, blurSwap, blur, typeTimes, timeline,
    get calm() { return reduced(); },
  };
})();
globalThis.settle = settle;
export default settle;
