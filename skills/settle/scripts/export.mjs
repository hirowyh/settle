#!/usr/bin/env node
// Render a reel to MP4, and to a GIF beside it.
//
//   node export.mjs <reel.html> [--out reel.mp4] [--size WxH] [--fps 60] [--gif] [--once]
//                   [--samples 4 --shutter 0.5] [--master]
//
// The video takes the reel's own shape, 1080 px on its short side: a 16:9 reel comes out 1920x1080, a square one
// 1080x1080, a 9:16 one 1080x1920; --size overrides it. The reel is rendered once into a lossless master, and ffmpeg
// makes the copies from it: an H.264 MP4 and, with --gif, a 30 fps GIF at most 720 px wide that loops (--once plays
// it once and holds the last frame). --master keeps the master beside them as .mkv.
// --samples 4 averages four sub-frames spread over --shutter of the frame interval (0.5 by default) for motion blur,
// like a film camera's 180° shutter; it takes four times as long.
// Needs snap.mjs beside this file, its browser and ffmpeg.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const flags = ["--gif", "--once", "--master"];
const reel = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1]?.startsWith("--") && !flags.includes(argv[i - 1])));
if (!reel) {
  console.error("usage: node export.mjs <reel.html> [--out reel.mp4] [--size WxH] [--fps 60] [--gif] [--once] [--samples 4 --shutter 0.5] [--master]");
  process.exit(2);
}
const gif = argv.includes("--gif"), once = argv.includes("--once"), keepMaster = argv.includes("--master");
const base = opt("out", "reel.mp4").replace(/\.(mp4|gif|mkv)$/i, "");
const fps = Number(opt("fps", 60));
const samples = Math.max(1, Number(opt("samples", 1))), shutter = Number(opt("shutter", 0.5));
const snap = join(dirname(fileURLToPath(import.meta.url)), "snap.mjs");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr || r.stdout}`);
  return r.stdout;
};
const mb = (f) => (statSync(f).size / 1e6).toFixed(1) + " MB";

// One probe reads the length (the reel shell sets the scrubber's max to DURATION) and the stage's shape.
const probe = `(() => { const s = document.getElementById("stage"), a = parseFloat(getComputedStyle(s).getPropertyValue("--aspect")), r = s.getBoundingClientRect();
  return [window.reel.duration || +(document.getElementById("scrub")?.max) || 0, a > 0 ? a : r.width / r.height]; })()`;
const [probed, aspect] = JSON.parse(/eval: (.*)/.exec(run("node", [snap, reel, "--out", join(tmpdir(), "settle-export-probe"), "--size", "1200x1200", "--times", "0", "--frames-only", "--eval", probe]))[1]);
const duration = Number(opt("duration", 0)) || probed;
if (!(duration > 0)) throw new Error("could not read the reel's DURATION; pass --duration");
const even = (n) => 2 * Math.round(n / 2);
const size = opt("size", aspect >= 1 ? `${even(1080 * aspect)}x1080` : `1080x${even(1080 / aspect)}`);

const frames = Math.round(duration * fps), times = [];
for (let f = 0; f < frames; f++)
  for (let k = 0; k < samples; k++) times.push(((f + (samples > 1 ? (k * shutter) / (samples - 1) : 0)) / fps).toFixed(5));

mkdirSync(dirname(base), { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "settle-export-"));
try {
  const start = Date.now(), secs = (t) => `${Math.round((Date.now() - t) / 1000)} s`;
  console.log(`rendering ${frames} frames${samples > 1 ? ` x ${samples} sub-frames` : ""} of ${reel} at ${size}`);
  run("node", [snap, reel, "--out", dir, "--size", size, "--stage", "--frames-only", "--times", times.join(",")]);
  const encode = Date.now();
  // The master: every frame, blended when there are sub-frames, in lossless RGB.
  const blend = samples > 1 ? `tmix=frames=${samples}:weights=${Array(samples).fill(1).join(" ")},select='eq(mod(n\\,${samples})\\,${samples - 1})',` : "";
  const master = join(dir, "master.mkv");
  run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps * samples), "-i", join(dir, "f_%04d.png"),
    "-vf", `${blend}setpts=N/(${fps}*TB)`, "-r", String(fps), "-c:v", "libx264rgb", "-qp", "0", "-preset", "veryfast", master]);
  // H.264 in 4:2:0 with BT.709 colour, tagged, so players don't shift the palette; the index up front so it streams.
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-vf", "scale=out_color_matrix=bt709:out_range=tv,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv",
    "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`]);
  const wrote = [`${base}.mp4 (${mb(`${base}.mp4`)})`];
  if (gif) {
    run("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-vf", "fps=30,scale='min(720,iw)':-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a",
      "-loop", once ? "-1" : "0", `${base}.gif`]);
    wrote.push(`${base}.gif (${mb(`${base}.gif`)}${once ? ", plays once" : ""})`);
  }
  if (keepMaster) { copyFileSync(master, `${base}.mkv`); wrote.push(`${base}.mkv (${mb(`${base}.mkv`)}, lossless)`); }
  console.log(`wrote ${wrote.join(", ")}: ${duration} s at ${fps} fps, ${size}${samples > 1 ? `, ${samples} sub-frames over ${shutter} of a frame` : ""}`);
  console.log(`took ${secs(start)}: ${Math.round((encode - start) / 1000)} s rendering, ${secs(encode)} encoding`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
