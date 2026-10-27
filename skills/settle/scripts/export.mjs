#!/usr/bin/env node
// Render a reel to MP4 or GIF with motion blur.
//
//   node export.mjs <reel.html> [--out reel.mp4] [--size 1080x1080] [--fps 60] [--samples 4] [--shutter 0.5] [--gif]
//
// Each output frame averages `samples` sub-frames spread over `shutter` of the frame interval: with
// the defaults, a fast edge steps down in quarters across half a frame, like a film camera's 180° shutter.
// --gif writes a 30 fps GIF at most 720px wide. Needs snap.mjs beside this file, its browser and ffmpeg.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const reel = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1]?.startsWith("--") && argv[i - 1] !== "--gif"));
if (!reel) {
  console.error("usage: node export.mjs <reel.html> [--out reel.mp4] [--size 1080x1080] [--fps 60] [--samples 4] [--shutter 0.5] [--gif]");
  process.exit(2);
}
const gif = argv.includes("--gif");
const out = opt("out", gif ? "reel.gif" : "reel.mp4");
const size = opt("size", "1080x1080"), fps = Number(opt("fps", 60));
const samples = Math.max(1, Number(opt("samples", 4))), shutter = Number(opt("shutter", 0.5));
const snap = join(dirname(fileURLToPath(import.meta.url)), "snap.mjs");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr || r.stdout}`);
  return r.stdout;
};

// The reel shell sets the scrubber's max to DURATION.
const duration = Number(opt("duration", 0)) ||
  JSON.parse(/eval: (.*)/.exec(run("node", [snap, reel, "--out", join(tmpdir(), "settle-export-probe"), "--size", size, "--times", "0", "--eval", "+document.getElementById('scrub').max"]))[1]);
if (!(duration > 0)) throw new Error("could not read the reel's DURATION; pass --duration");

const frames = Math.round(duration * fps), times = [];
for (let f = 0; f < frames; f++)
  for (let k = 0; k < samples; k++) times.push(((f + (samples > 1 ? (k * shutter) / (samples - 1) : 0)) / fps).toFixed(5));

const dir = mkdtempSync(join(tmpdir(), "settle-export-"));
try {
  console.log(`rendering ${frames} frames x ${samples} sub-frames of ${reel}`);
  run("node", [snap, reel, "--out", dir, "--size", size, "--stage", "--times", times.join(",")]);
  const blend = samples > 1 ? `tmix=frames=${samples}:weights=${Array(samples).fill(1).join(" ")},select='eq(mod(n\\,${samples})\\,${samples - 1})',` : "";
  const base = `${blend}setpts=N/(${fps}*TB)`;
  const args = ["-y", "-loglevel", "error", "-framerate", String(fps * samples), "-i", join(dir, "f_%04d.png")];
  if (gif) args.push("-vf", `${base},fps=30,scale='min(720,iw)':-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a`, "-loop", "0", out);
  else args.push("-vf", base, "-r", String(fps), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out);
  run("ffmpeg", args);
  console.log(`wrote ${out}: ${duration} s at ${fps} fps, ${samples} sub-frames over ${shutter} of a frame`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
