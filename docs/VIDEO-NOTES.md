# Video notes - "DeepSeek Super Agent" Claude Code workflow

Source: AI LABS, *Deepseek Just Released The Greatest Claude Code Workflow Ever* (14:15)
https://www.youtube.com/watch?v=3DklR44DHnM

Frames referenced below are in [`frames/`](frames/). This is my breakdown of the whole video and how
each part maps to the plugin in [`../super-agent/`](../super-agent/).

## 1. The problem (0:39)

- Running several Claude Code sessions means constantly switching between them.
- DeepSeek: a person can only keep track of **3-5 sessions** before forgetting which does what.
- Fix: **one agent you give every task to** (the "super agent"). DeepSeek runs theirs in the cloud and
  talks to it via team chat and GitHub; the video rebuilds the idea inside Claude Code.

## 2. The setup - router + workers (1:34)

- One session doing everything: knows all tasks, but works on one at a time and the details get mixed
  up. One session per task: fast, but you're back to switching. (`frames/00-one-session-many-tasks.jpg`)
- So two kinds of agent:
  - **Router** - the session you talk to. Only talks to you and hands out tasks.
  - **Workers** - do the tasks, each in its own context window; report back to the router.
- Not the same as lead agent + subagents: a lead *breaks a task into steps*. The router doesn't - it
  only tracks workers and hands out tasks.

## 3. DeepSeek's test (2:42)

- Single session that may start subagents vs router + workers, 5 runs each.
- Slowest task: **15.7 min** (router) vs **29.5 min** (single session).
- The single session kept doing the work itself, so every new message interrupted it; even when told
  to use subagents it often didn't. A single session does two jobs (talk + work) - split them.
- DeepSeek runs the router on a lighter model; it answered faster under load (6.4 s at ~1 msg/min,
  1.6 s at ~40 msg/min).

## 4. Tickets (3:32)

Workers never talk to you, so every job must be written down first. A **write-tickets skill**
(`.claude/skills/write-tickets/SKILL.md`, frames 01-04):

- Splits the request into features (one ticket per shippable feature - frame 02).
- Reads the app, then **asks questions until nothing is unclear** (frame 04 shows multiple-choice
  questions with "(Recommended)").
- Writes `specs/tickets/NNN-slug/` with two files (frame 05):
  - **rd.md** - what the feature must do: requirements (FR-n, NFR-n), affected areas (real file
    paths, frame 06), what not to touch, out of scope, every decision made.
  - **eval.md** - how to check it: automated checks, acceptance checks `E-n` with Type / Steps /
    Expected (frame 07), unusual cases, traceability table FR -> E, and **Definition of done**
    (frame 08).
- Run as `/write-tickets build password reset` (frame 03). In the video: a PRD -> **19 tickets**.
- **BOARD.md** (frame 09): `# | Title | Status | Mode | Runs`
  - Status: `draft` -> `ready` -> `done`. Every ticket starts as draft.
  - Mode: `solo` (one subagent) or `team` (Claude Code **agent teams**, experimental - turned on in
    `.claude/settings.json`). Other agents: use subagents for team tickets.
  - Runs: `alongside` or `waits for NNN: <reason>`.
- You choose what gets built by marking tickets **ready** (frame 10: "make the 001, 002 and 006 as
  ready" -> `**Status:** ready` in rd.md and on the board).

## 5. The agents (7:44)

`.claude/agents/`: checker, merger, reproducer, reviewer, router, teammate, tester, watchdog, worker
(frame 11).

| Agent | Model / effort | Key settings | Job |
|-------|----------------|--------------|-----|
| router | opus / high | tools: Read, Grep, Glob, Agent(worker, teammate, merger, checker, reproducer, watchdog), SendMessage, TaskStop | Main chat. Starts watchdog, reads BOARD.md, sends ready tickets to workers or a team, checks results against eval.md, dispatches merger/checker/reproducer. **Never builds or edits anything** (restrained by instructions, not by tools, because teammates inherit the lead's tools). Frames 12-14. |
| watchdog | sonnet / medium | maxTurns 400, autoCompactWindow 150000; tools: Read, Grep, Glob, Bash, Edit, Monitor, SendMessage, TaskStop | Background. Every 10 min runs a small script listing problems: stuck, drifting, looping, waiting on each other. Tells the router. Never fixes. Changes its own rules on request. Frames 15-16. |
| worker | sonnet / high | isolation: worktree, maxTurns 200, Stop hook; tools incl. Agent, Monitor, TodoWrite, EnterWorktree | Builds one solo ticket end to end in its own git worktree; runs tester + reviewer; writes results.md + evidence/; commits on its branch. Prompt gives ticket folder, port, test account. Frame 17. |
| teammate | sonnet | - | Member of a team ticket; team agrees a shared plan in **contract.md** (frame 21). |
| reviewer | - | - | Checks a worker's diff (started by the worker). |
| tester | sonnet | tools: Read, Grep, Glob, Bash | Runs every eval.md check exactly as written against a running dev server, PASS/FAIL per check with evidence, uses **agent-browser** (Vercel), saves screenshots to evidence/. Never fixes. Frame 26. |
| merger | sonnet | - | Merges one passed branch into main in the main checkout, lint + build, sets status `done` in rd.md and BOARD.md, commits. Doesn't push or delete worktrees. Reproducer fix branches: merge as `fix`, leave statuses. Frame 22. |
| checker | sonnet | tools: Read, Grep, Glob, Bash | After a merge, walks the feature and surrounding user flows in a real browser on the main checkout (port 3000) as a first-time user. Reports only bugs reproduced twice. Read-only. Frame 23. |
| reproducer | sonnet / high | isolation: worktree, maxTurns 120; own port 3090 + account t090 | Reproduces a bug twice in a browser, fixes it on its own branch if small and local, else reports. Quiet: only output is the final reply. Frames 25, 27. |

The router checks the work itself: when a worker says done it opens the results and checks them
against eval.md (frame 14), and sends fixes back to **the same worker** (it still remembers the ticket).
It only comes to you when there is a choice to make.

## 6. Building (10:07)

```
claude --agent router --name router --permission-mode auto      (frame 18)
> start with 001
```

- Router first starts the watchdog in the background, then - 001 being a team ticket - launches three
  teammates `@schema`, `@mailer`, `@events` that share the dev server on port 3000 (frame 19).
- When an agent needed a decision, the router asked with options **A) / B)**; the user typed `a`; the
  router passed it on (frame 20).
- Agents write notes into the ticket folder: `contract.md`, `results.md`, `evidence/` screenshots.
- Worker code lives in separate worktrees -> **merger** combines it into main -> **checker** tests in
  the browser.
- Board said 002 and 006 both waited only on 001 and were ready -> router started two workers at once
  (frame 24).
- The checker found a bug that existed before any ticket; the **reproducer** fixed it, and the router
  only told the user once it was fixed.

## 7. Results and cost (12:42)

- About an hour, three tickets: team ticket 26 min (stopped and merged), two solo tickets in parallel,
  11 and 17 min.
- ~230K tokens written, ~32.7M read (mostly cached re-reads, much cheaper).
- More tokens than one session, but better app quality and no juggling of sessions.
- Not rebuilt: DeepSeek's version runs in the cloud. Alternatives: Claude Code remote sessions, or a
  phone app to check on agents.

## How the plugin maps to this

| Video | Plugin |
|-------|--------|
| `.claude/skills/write-tickets/SKILL.md` | `super-agent/skills/write-tickets/` (+ templates for rd.md, eval.md, BOARD.md) |
| "make 001, 002, 006 ready" | `super-agent/skills/mark-ready/` |
| setting up settings.json / ports / test accounts | `super-agent/skills/setup/` (writes `specs/.super-agent/project.md`) |
| 9 agents in `.claude/agents/` | `super-agent/agents/*.md` - same names, models, effort, isolation, turn limits |
| watchdog's 10-minute script | `super-agent/skills/setup/scripts/watchdog-scan.mjs` (copied into the project by setup) |
| worker's Stop hook | `super-agent/hooks/worker-stop-check.mjs` (plugin-level SubagentStop hook) |
| `claude --agent router ...` | `claude --agent super-agent:router --name router --permission-mode auto` |
