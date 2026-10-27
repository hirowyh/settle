"""Run the eval requests through `claude -p` and keep what each run builds.

Each request runs in its own new git folder outside this repo, so settle's
CLAUDE.md and AGENTS.md stay out of it. Three arms:

  baseline  the bare model. --setting-sources project drops the user's
            settings, CLAUDE.md, hooks and plugin settings; --strict-mcp-config
            drops MCP servers; --disable-slash-commands drops every skill. It
            can only read and write files, with edits accepted inside its own
            folder.
  skill     the same, with settle installed as a project skill: skills/settle/
            is copied to .claude/skills/settle/ and .claude/settings.json
            switches every other skill off (skillOverrides). It leaves out
            --disable-slash-commands, which would drop settle too; project
            skills still load because "project" stays in --setting-sources.
            After the run the init message in the transcript is checked, and a
            row whose error reads "extra skills: a, b" means those skills
            loaded: add them to SKILL_OFF below and run it again.
  project   skill, run inside a copy of _local/evals/fixtures/<name>/ (--fixture
            is required). The copy is `cp -cR` (an APFS clone, no data copied),
            committed in the scratch git, and only what the run added or
            changed is kept (git status against that commit; .claude/ and
            .next/ left out). A request that names its own "fixture" runs in
            this arm in that fixture, whatever --arm says, so one round can
            mix both.

The skill and project arms get the whole shell in their folder (--allowedTools
Bash), as the maintainer agreed for the eval on 2026-10-19. In round 1 a narrow
allowlist refused everyday commands (a cd chain, echo, node -e, a variable set
before a command), and one refusal makes a run drop the shell, checks included.
What stays refused is installing or downloading and starting another browser:
--disallowedTools REFUSED, and npm_config_yes=false so npx never fetches a
package the project lacks. Each run is also told the maintainer's rule that ego
lite is the only browser (BROWSER), and a run whose shell named Chrome,
Chromium, Playwright or Puppeteer is marked in its row (round 1's Vue rerun
started headless Chrome itself).
Anything else that would need a prompt is denied (--permission-prompts none).
The claude process group is killed after the run, so a dev server cannot
outlive it unless it detaches itself, as `astro dev --background` does.

    python3 evals/run.py --arm baseline                    # all 24
    python3 evals/run.py --arm baseline --only comp-1,chart-3
    python3 evals/run.py --arm skill --only widget-2
    python3 evals/run.py --arm project --fixture next-app --only comp-6
    python3 evals/run.py --arm skill --only widget-2 --dry-run   # no claude call
    python3 evals/run.py --arm skill --requests evals/pilot.json --out _local/evals/pilot

Each run's files, transcript and stderr land in _local/evals/<arm>/<id>/, and
_local/evals/<arm>/summary.csv lists time, turns and cost per run.
"""
import argparse
import concurrent.futures
import csv
import json
import os
import pathlib
import re
import shlex
import signal
import shutil
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODEL = "claude-opus-5-5"
EFFORT = "high"
# -p runs cannot ask questions. Only the baseline is told where the piece goes;
# with the skill, settle decides.
NOTE = "Nobody is available to answer questions during this task, so make your own choices."
# The maintainer's rule for this Mac, which runs don't load with their settings: ego lite is the only browser.
BROWSER = " The only browser on this machine for checking your work is ego lite, which settle's scripts/snap.mjs drives; never start Google Chrome, Chromium, Playwright or Puppeteer yourself."
NOTES = {
    "baseline": NOTE + " Save what you build as one HTML file in the current folder.",
    "skill": NOTE + BROWSER,
    "project": NOTE + " The current folder is the user's project." + BROWSER,
}
BASE = ["--setting-sources", "project", "--strict-mcp-config"]
FLAGS = {
    "baseline": BASE + ["--disable-slash-commands"],
    "skill": BASE,
    "project": BASE,
}
TOOLS = {
    "baseline": "Read,Write,Edit,Glob,Grep",
    "skill": "Read,Write,Edit,Glob,Grep,Skill,Bash",
    "project": "Read,Write,Edit,Glob,Grep,Skill,Bash",
}
# What a run's shell still refuses: anything that installs or downloads, and starting another browser.
REFUSED = ["Bash(npm install:*)", "Bash(npm i:*)", "Bash(npm add:*)", "Bash(npm ci:*)", "Bash(npm update:*)",
              "Bash(pnpm:*)", "Bash(yarn:*)", "Bash(bun:*)", "Bash(pip:*)", "Bash(pip3:*)", "Bash(python3 -m pip:*)",
              "Bash(brew:*)", "Bash(wget:*)", "Bash(git clone:*)", "Bash(npx playwright:*)", "Bash(npx puppeteer:*)",
           "Bash(open -a:*)", "Bash(/Applications/Google Chrome.app/Contents/MacOS/Google Chrome:*)",
           'Bash("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome":*)']
# Every skill a run could find besides settle: the user-level ones on this machine, read from disk, then any a failed row lists.
USER_SKILLS = pathlib.Path.home() / ".claude" / "skills"
SKILL_OFF = sorted(p.name for p in USER_SKILLS.iterdir() if p.is_dir()) if USER_SKILLS.is_dir() else []
SKILL_OFF += [  # built into Claude Code 2.1.296, listed by the first skill run's init message on 2026-10-20
             "design", "slides", "design-sync", "dataviz", "artifact-diagramming", "artifact-capabilities",
             "update-config", "verify", "debug", "code-review", "simplify", "batch", "fewer-permission-prompts",
             "doctor", "loop", "schedule", "claude-api", "run", "run-skill-generator", "plugin-authoring"]
FIXTURES = ROOT / "_local" / "evals" / "fixtures"
TIMEOUT_S = 25 * 60


def command(arm, request):
    shell = ["--allowedTools", "Bash", "--disallowedTools", *REFUSED] if "Bash" in TOOLS[arm] else []
    return ["claude", "-p", request,
            "--model", MODEL, "--effort", EFFORT,
            *FLAGS[arm],
            "--tools", TOOLS[arm], *shell,
            "--permission-mode", "acceptEdits", "--permission-prompts", "none",
            "--append-system-prompt", NOTES[arm],
            "--output-format", "stream-json", "--verbose",
            "--no-session-persistence"]


def prepare(arm, work, fixture):
    """Build the scratch folder; return the fixture-copy git state for the project arm."""
    if work.exists():
        shutil.rmtree(work)
    if arm == "project":
        work.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["cp", "-cR", str(FIXTURES / fixture), str(work)], check=True)
        if not (work / ".git").exists():
            subprocess.run(["git", "init", "-q"], cwd=work, check=True)
        subprocess.run(["git", "add", "-A"], cwd=work, check=True)
        subprocess.run(["git", "-c", "user.name=eval", "-c", "user.email=eval@localhost",
                        "commit", "-q", "--allow-empty", "-m", "fixture"], cwd=work, check=True)
    else:
        work.mkdir(parents=True)
        subprocess.run(["git", "init", "-q"], cwd=work, check=True)
    if arm != "baseline":
        shutil.copytree(ROOT / "skills" / "settle", work / ".claude" / "skills" / "settle")
        (work / ".claude" / "settings.json").write_text(json.dumps(
            {"skillOverrides": {name: "off" for name in SKILL_OFF}}, indent=2) + "\n")


def kept_files(arm, work):
    """Paths the run left behind: everything for the baseline, else what it added or changed."""
    if arm == "baseline":
        return [p.relative_to(work) for p in sorted(work.rglob("*"))
                if p.is_file() and ".git" not in p.relative_to(work).parts]
    out = subprocess.run(["git", "status", "--porcelain", "-uall", "--no-renames"], cwd=work,
                         capture_output=True, text=True, check=True).stdout
    paths = [pathlib.Path(line[3:].strip('"')) for line in out.splitlines()]
    return [p for p in paths if (work / p).is_file() and p.parts[0] not in (".claude", ".next", "node_modules")]


def extra_skills(transcript):
    for line in transcript.read_text().splitlines():
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        if msg.get("type") == "system" and msg.get("subtype") == "init":
            skills = [s.split(":")[-1] for s in msg.get("skills", [])]
            return [s for s in skills if s != "settle"], "settle" in skills
    return [], False


def other_browser(transcript):
    for line in transcript.read_text().splitlines():
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        for c in (msg.get("message") or {}).get("content") or [] if isinstance(msg.get("message"), dict) else []:
            if isinstance(c, dict) and c.get("name") == "Bash" and re.search(r"chrome|chromium|playwright|puppeteer", c["input"].get("command", ""), re.I):
                return True
    return False


def run_one(arm, item, runs_dir, out_dir, fixture, dry_run):
    if item.get("fixture"):
        arm, fixture = "project", item["fixture"]
    work = runs_dir / arm / item["id"]
    keep = out_dir / arm / item["id"]
    prepare(arm, work, fixture)
    if dry_run:
        print(f"cd {shlex.quote(str(work))} && {shlex.join(command(arm, item['request']))}")
        return None
    shutil.rmtree(keep, ignore_errors=True)  # a rerun replaces what the last attempt left
    keep.mkdir(parents=True, exist_ok=True)

    start = time.time()
    with open(keep / "transcript.jsonl", "w") as out, open(keep / "stderr.log", "w") as err:
        proc = subprocess.Popen(command(arm, item["request"]), cwd=work, stdout=out,
                                stderr=err, start_new_session=True,
                                env={**os.environ, "npm_config_yes": "false"})
        try:
            proc.wait(timeout=TIMEOUT_S)
            timed_out = False
        except subprocess.TimeoutExpired:
            timed_out = True
        try:
            os.killpg(proc.pid, signal.SIGKILL)  # a backgrounded dev server dies with the run
        except ProcessLookupError:
            pass
        proc.wait()

    files = []
    for rel in kept_files(arm, work):
        target = keep / "files" / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(work / rel, target)
        files.append(str(rel))

    result = {}
    for line in (keep / "transcript.jsonl").read_text().splitlines():
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        if msg.get("type") == "result":
            result = msg
    error = timed_out or result.get("is_error", True)
    if arm != "baseline":
        extra, has_settle = extra_skills(keep / "transcript.jsonl")
        if extra:
            error = "extra skills: " + ", ".join(extra)
        elif not has_settle:
            error = "settle skill did not load"
        elif other_browser(keep / "transcript.jsonl"):
            error = "its shell named another browser than ego lite"
    return {
        "id": item["id"], "kind": item["kind"], "arm": arm,
        "seconds": round(time.time() - start),
        "turns": result.get("num_turns"),
        "cost_usd": result.get("total_cost_usd"),
        "error": error,
        "timed_out": timed_out,
        "files": " ".join(files),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--arm", choices=sorted(FLAGS), required=True)
    parser.add_argument("--only", default="")
    parser.add_argument("--requests", default=str(ROOT / "evals" / "requests.json"), help="a request file; evals/pilot.json for the pilot")
    parser.add_argument("--fixture", default="", help="project arm: folder under _local/evals/fixtures/")
    parser.add_argument("--dry-run", action="store_true", help="build the folders and print the commands")
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--runs-dir", default="/private/tmp/settle-evals")
    parser.add_argument("--out", default=str(ROOT / "_local" / "evals"))
    args = parser.parse_args()

    requests = json.loads(pathlib.Path(args.requests).read_text())["requests"]
    items = requests
    if args.only:
        wanted = set(args.only.split(","))
        items = [i for i in requests if i["id"] in wanted]
    runs_dir, out_dir = pathlib.Path(args.runs_dir), pathlib.Path(args.out)
    if args.arm == "project" and not (FIXTURES / args.fixture).is_dir():
        parser.error(f"--fixture needs a folder under {FIXTURES}")
    missing = sorted({i["fixture"] for i in items if i.get("fixture") and not (FIXTURES / i["fixture"]).is_dir()})
    if missing:
        parser.error(f"no folder under {FIXTURES} for: {', '.join(missing)}")
    if args.dry_run:
        for i in items:
            run_one(args.arm, i, runs_dir, out_dir, args.fixture, True)
        return
    (out_dir / args.arm).mkdir(parents=True, exist_ok=True)
    version = subprocess.run(["claude", "--version"], capture_output=True, text=True).stdout.strip()
    (out_dir / args.arm / "run.json").write_text(json.dumps({
        "claude_version": version, "started": time.strftime("%Y-%m-%d %H:%M:%S"),
        "command": command(args.arm, "<request>")}, indent=2) + "\n")

    rows = []
    with concurrent.futures.ThreadPoolExecutor(args.jobs) as pool:
        futures = [pool.submit(run_one, args.arm, i, runs_dir, out_dir, args.fixture, False) for i in items]
        for future in concurrent.futures.as_completed(futures):
            row = future.result()
            rows.append(row)
            print(json.dumps(row), flush=True)

    summary = out_dir / args.arm / "summary.csv"
    done = {}
    if summary.exists():
        done = {r["id"]: r for r in csv.DictReader(summary.open())}
    done.update({r["id"]: r for r in rows})
    with summary.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ["id"])
        writer.writeheader()
        for item in requests:
            if item["id"] in done:
                writer.writerow(done[item["id"]])


if __name__ == "__main__":
    main()
