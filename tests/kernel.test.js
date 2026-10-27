// Run with: node --test tests/kernel.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const k = require("../skills/settle/assets/kernel.js").default; // the kernel is an ES module; checked on Node 24

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test("spring matches known values", () => {
  // [t, duration, bounce, from, to, velocity, expected]
  for (const [t, d, b, from, to, v, want] of [
    [0.1, 0.365, 0.185, 644, 225, 0, 402.60602],
    [0.25, 0.24, 0.125, 515, 900, 0, 901.314752],
    [0.05, 0.42, 0.16, 509, 922, 600, 600.468242],
    [0.3, 0.3, 0.0, 0, 1, 0, 0.986399],
  ]) near(k.spring(t, { duration: d, bounce: b }, from, to, v), want, 1e-5, `t=${t}`);
});

test("springVelocity is the spring's slope", () => {
  const p = k.presets.morph;
  for (const t of [0, 0.05, 0.2]) {
    const h = 1e-6;
    const slope = (k.spring(t + h, p, 3, 10, 40) - k.spring(Math.max(t - h, 0), p, 3, 10, 40)) / (t ? 2 * h : h);
    near(k.springVelocity(t, p, 3, 10, 40), slope, 1e-3, `t=${t}`);
  }
});

test("presets settle in their target times", () => {
  // Settled within 2 % of the distance.
  const settle = (p) => {
    let last = 0;
    for (let t = 0; t < 2; t += 1 / 600) if (Math.abs(k.spring(t, p, 0, 1) - 1) > 0.02) last = t;
    return last;
  };
  near(settle(k.presets.front), 0.17, 0.02, "front edge");
  near(settle(k.presets.back), 0.275, 0.03, "back edge");
  near(settle(k.presets.morph), 0.23, 0.03, "state to state");
  assert.ok(settle(k.presets.front) < settle(k.presets.back), "the front edge settles first");
});

test("track keeps its position and speed when the target moves mid-flight", () => {
  const tr = k.track(0).set(100, 0);
  tr.set(300, 0.1);
  const h = 1e-7;
  near(tr.value(0.1 + h), tr.value(0.1 - h), 0.01, "no jump in position");
  near(tr.velocity(0.1 + h), tr.velocity(0.1 - h), 2, "no jump in speed");
  near(tr.value(3), 300, 1e-6, "arrives at the last target");
});

test("track follows the hand exactly, then springs from where it was let go", () => {
  const tr = k.track(0);
  tr.hold(10, 0).hold(30, 0.1);
  assert.equal(tr.value(0.1), 30);
  tr.release(0.1, 0);
  near(tr.value(0.1), 30, 1e-9, "starts where the hand let go");
  near(tr.velocity(0.1), 200, 1e-9, "with the hand's speed");
  near(tr.value(3), 0, 1e-6, "and settles at the target");
});

test("stretch: the front edge leads, then the pill returns to its width", () => {
  const s = k.stretch(160, 515).set(545, 900, 0);
  const [lo, hi] = s.value(0.08);
  assert.ok((hi - 515) / 385 > (lo - 160) / 385, "front edge has gone further");
  assert.ok(hi - lo > 355, "the pill is wider mid-move");
  const [lo2, hi2] = s.value(3);
  near(hi2 - lo2, 355, 1e-6, "back to its width at rest");
});

test("rubber follows one to one at first and never passes its limit", () => {
  near(k.rubber(1, 200), 1, 0.01, "small pulls");
  assert.ok(k.rubber(1e6, 200) <= 200);
  assert.equal(k.rubber(-50, 200), -k.rubber(50, 200));
});

test("glide is cubic-bezier(.45,0,.15,1)", () => {
  near(k.glide(0.5), 0.791245, 1e-4, "midway");
  near(k.glide(0.25), 0.206806, 1e-4, "a quarter in");
});

test("odometer columns rest on whole digits and roll from the right", () => {
  assert.deepEqual(k.odometer(84320, 5), [8, 4, 3, 2, 0]);
  const rolling = k.odometer(84319.5, 5);
  near(rolling[3], 1.5, 1e-9, "tens column turns while the ones roll past 9");
  assert.equal(rolling[2], 3, "hundreds wait");
});
