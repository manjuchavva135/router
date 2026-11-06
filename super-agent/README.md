# Super Agent - a router + workers plugin for Claude Code

Stop juggling five Claude Code sessions. Talk to **one router agent**. It reads your ticket board,
hands every ready ticket to a worker in its own git worktree (or to a team of agents), checks the
results against each ticket's `eval.md`, merges what passes, tests the app in a real browser, and only
comes to you when there's a choice to make.

Based on DeepSeek's "super agent" harness as rebuilt in Claude Code by AI LABS
([video](https://www.youtube.com/watch?v=3DklR44DHnM)). Full breakdown: [`../docs/VIDEO-NOTES.md`](../docs/VIDEO-NOTES.md).

```
                you
                 |  (only choices: "A or B?")
              router  (sonnet, high effort, never edits code)
     ____________|_______________________________________
    |            |            |          |               |
 watchdog     worker       worker      team           merger -> checker
 (every 10m)  ticket 002   ticket 006  (teammates      (merge, lint,  (browser walk
  stuck?       worktree     worktree    + contract.md)  build, done)   of main)
  looping?     tester       tester                                       |
  waiting?     reviewer     reviewer                                reproducer
                                                                   (fix bugs on own branch)
```

## What's inside

| Part | Name | What it does |
|------|------|--------------|
| Skill | `/super-agent:setup` | One-time project setup: `specs/tickets/`, `BOARD.md`, `specs/.super-agent/project.md` (commands, ports, test accounts), watchdog script, agent teams on, `.claude/worktrees/` git-ignored, checks git + agent-browser. |
| Skill | `/super-agent:grill` | Interviews you in rounds until nothing is assumed: facts it looks up itself, decisions it asks you, assumptions it lists for your yes/no. Fresh-eyes gap check, then a play-back you must confirm. Saves `specs/grill/<slug>.md`. |
| Skill | `/super-agent:write-tickets` | Turns a request, PRD or grill record into tickets. Splits into features, reads the code, **grills until nothing is unclear**, gap-checks every ticket, writes `specs/tickets/NNN-slug/rd.md` + `eval.md`, updates `BOARD.md` (status / mode / runs). |
| Skill | `/super-agent:mark-ready` | `001 002 006` -> ready (checks they're buildable first). `004 draft` -> back to draft. No arguments -> shows the board. |
| Agent | `router` | The main chat. Starts the watchdog, dispatches tickets, checks results vs eval.md, sends fixes back to the same worker, runs merger/checker/reproducer. Never edits code. |
| Agent | `watchdog` | Background. Runs `watchdog-scan.mjs` every 10 min via Monitor; tells the router about quiet, looping, blocked or waiting agents. Never fixes. |
| Agent | `worker` | Builds one solo ticket end to end in its own worktree; runs tester + reviewer; writes `results.md` + `evidence/`; commits on `ticket/NNN-slug`. |
| Agent | `teammate` | One part of a team ticket; agrees the shared shape in `contract.md`; works in the main checkout. |
| Agent | `tester` | Runs every eval.md check exactly as written; PASS/FAIL with evidence; browser checks with `agent-browser`. |
| Agent | `reviewer` | Reviews a ticket's diff against rd.md (requirements, scope, don't-touch, bugs, security). |
| Agent | `merger` | Merges a passed branch into main (`--no-ff`), lint + build, sets the ticket `done`, commits. |
| Agent | `checker` | After each merge, walks the feature and surrounding flows in a browser as a first-time user; reports only bugs reproduced twice. |
| Agent | `reproducer` | Reproduces a bug twice in its own worktree, fixes it on `fix/<slug>` if small and local. |
| Agent | `gap-finder` | Reads a grill record or a ticket with no memory of the conversation and lists missing branches, contradictions, vague words and hidden assumptions. Read-only. |
| Hook | SubagentStop | A worker can't finish with uncommitted changes or without `results.md` on its branch. |

## Models

Set in the `model:` / `effort:` lines of each file in [`agents/`](agents/). `opus` and `sonnet` always
mean the latest version of each.

| Agent | Model | Effort | Why |
|-------|-------|--------|-----|
| router | sonnet | high | Its job is dispatching and checking against eval.md - simpler than it looks (DeepSeek also runs its router on a lighter model). |
| reviewer | **opus** | high | Finding real bugs and security holes in a diff needs the strongest model. |
| reproducer | **opus** | high | Root-causing unknown bugs is the hardest reasoning job in the system. |
| gap-finder | **opus** | high | Spotting what's missing from a spec needs careful reasoning; it runs briefly and rarely. |
| worker | sonnet | high | The ticket already spells out exactly what to build. |
| teammate | sonnet | high | Same as worker. |
| tester | sonnet | default | Runs written steps and compares output. |
| merger | sonnet | medium | Mechanical git work. |
| checker | sonnet | medium | Walks the app and reports. |
| watchdog | sonnet | medium | Runs a script and reads its output; 150K compact window to save usage. |

Which model a subagent actually gets, in order: a `model` passed when it is started (the router doesn't
pass one) -> the `model:` line in its file -> your default subagent model, if you set one -> the model
of the agent that started it.

---

## Command reference

### 1. Install the requirements (once per machine)

```bash
git --version
```
```bash
node --version
```
```bash
npm install -g agent-browser
```
```bash
agent-browser install
```
```bash
agent-browser --version
```

Node 18+ is needed for the watchdog script and the stop hook. `agent-browser` is only needed for web
apps (tester, checker and reproducer drive a real browser with it).

### 2. Install the plugin (once per machine)

From GitHub ([manjuchavva135/router](https://github.com/manjuchavva135/router), private - uses your
saved git login), inside Claude Code:

```
/plugin marketplace add manjuchavva135/router
/plugin install super-agent@super-agent-marketplace
```

Same thing from a terminal:

```bash
claude plugin marketplace add manjuchavva135/router
```
```bash
claude plugin install super-agent@super-agent-marketplace
```

From the local folder instead (for editing the plugin itself):

```bash
claude plugin marketplace add C:\Users\wicon_user\Desktop\deepseek
```

After you push changes to GitHub, pull them into Claude Code:

```bash
claude plugin marketplace update super-agent-marketplace
```

Try it for one session without installing:

```bash
claude --plugin-dir C:\Users\wicon_user\Desktop\deepseek\super-agent
```

### 3. Manage the plugin

```
/plugin                                                   open the plugin manager
/plugin marketplace update super-agent-marketplace        pick up edits you made to the plugin files
/plugin disable super-agent@super-agent-marketplace
/plugin enable super-agent@super-agent-marketplace
/plugin uninstall super-agent@super-agent-marketplace
/plugin marketplace remove super-agent-marketplace
```

Check the plugin files after editing them:

```bash
claude plugin validate C:\Users\wicon_user\Desktop\deepseek\super-agent
```
```bash
claude plugin validate C:\Users\wicon_user\Desktop\deepseek
```

### 4. Prepare a project (once per project)

Workers build in git worktrees, so the project needs git with at least one commit:

```bash
git init
```
```bash
git add -A
```
```bash
git commit -m "initial commit"
```

Then, inside Claude Code in the project folder:

```
/super-agent:setup
```

It writes `specs/.super-agent/project.md`, copies the watchdog script, and turns on agent teams in
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 5. Grill an idea (nothing assumed)

```
/super-agent:grill build password reset and email verification
/super-agent:grill PRD.md
/super-agent:grill users say checkout is slow on mobile
```

It looks up facts itself, asks you decisions in numbered rounds, and lists every assumption as `A-n`
for you to confirm or correct. Answer a round like:

```
1a, 2 "only admins", A3 yes, A4 no - put it in the header, A5 yes
```

Type `enough` or `just decide` to finish early - it turns what's left into one list of assumptions for
a single yes. It ends with a gap check and a play-back you must confirm. The record is saved to
`specs/grill/<slug>.md`; run the same command again to continue an unfinished grill.

### 6. Write tickets

```
/super-agent:write-tickets specs/grill/password-reset.md
/super-agent:write-tickets build password reset and email verification
/super-agent:write-tickets turn PRD.md into tickets
```

Given a confirmed grill record it only asks what's still open per ticket; given anything else it runs
the grill first. Then it writes `specs/tickets/NNN-slug/rd.md`, `eval.md` and `BOARD.md`, and
gap-checks every ticket. Every ticket starts as **draft**.

### 7. Choose what gets built

```
/super-agent:mark-ready 001 002 006        mark tickets ready
/super-agent:mark-ready 004 draft          set a ticket back to draft
/super-agent:mark-ready                    show the board
```

### 8. Start the router

```bash
claude --agent super-agent:router --name router --permission-mode auto
```

`--agent` makes the whole session run as the router, `--name` lets other agents message it as
`router`, `--permission-mode auto` stops it asking you before every command.

### 9. Talk to the router

| You type | What happens |
|----------|--------------|
| `start with 001` | Starts the watchdog (first time), then ticket 001 - a worker for solo, teammates for team. |
| `start everything that's ready` | Starts every ready ticket whose dependencies are done. |
| `a` / `b` | Answers a choice the router put to you as `A) ... / B) ...`. |
| `what's running right now?` | Each running agent, its ticket, how long, last report. |
| `show the board` | Ready / draft / done counts and what's next. |
| `run up to 5 workers` | Changes how many workers run at once (default 3). |
| `start 004` (a draft) | Router asks to mark it ready first; on `yes` the merger flips the status. |
| `there's a bug: <steps>` | Starts the reproducer with your exact description. |
| `also add <new feature>` | Router won't build untracked work; tells you to grill + write tickets for it first. |
| `stop 006` | Stops that ticket's worker. |
| `why did 002 fail?` | Router asks the watchdog / reads results.md and evidence. |
| `watchdog: check every 5 minutes` | Watchdog edits its rules (`interval_seconds: 300`). |
| `watchdog: ignore 004` | Watchdog stops reporting on ticket 004. |
| `watchdog: stale after 30 minutes` | Watchdog edits `stale_minutes: 30`. |

### 10. Watchdog script (you can run it yourself)

From the project root:

```bash
node specs/.super-agent/watchdog-scan.mjs --once
```
```bash
node specs/.super-agent/watchdog-scan.mjs --once --json
```
```bash
node specs/.super-agent/watchdog-scan.mjs --watch
```
```bash
node specs/.super-agent/watchdog-scan.mjs --once --root C:\path\to\project
```
```bash
node specs/.super-agent/watchdog-scan.mjs --help
```

It reports: `went-quiet`, `awaiting-merge`, `possible-loop`, `cycle`, `blocked`, `board-mismatch`,
`main-app-down`. Rules live in `specs/.super-agent/watchdog-rules.md`:

```
interval_seconds: 600
stale_minutes: 20
loop_attempts: 3
base_port: 3000
check_main_app: yes
ignore: 004, 007
```

Every scan appends a line to `specs/.super-agent/watchdog.log`.

### 11. Git housekeeping

The merger never deletes branches or worktrees. Clean up when you're done:

```bash
git worktree list
```
```bash
git branch --list "ticket/*" "fix/*"
```
```bash
git log --oneline --merges -10
```
```bash
git worktree remove .claude/worktrees/<name>
```
```bash
git worktree prune
```
```bash
git branch -d ticket/002-password-reset
```

---

## Files it creates in your project

```
specs/
  .super-agent/
    project.md            commands, ports, test accounts (read by every agent)
    watchdog-scan.mjs     the watchdog's scan script
    watchdog-rules.md     thresholds the watchdog can change on request
    watchdog.log          one line per scan
  grill/
    password-reset.md     grill record: facts, decisions, assumptions, play-back
  tickets/
    BOARD.md
    001-v02-foundations/
      rd.md  eval.md  contract.md  results.md  evidence/
.claude/
  settings.json           env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  worktrees/              one worktree per worker (git-ignored)
```

## Notes

- Plugin agents are namespaced: start them as `super-agent:router`, `super-agent:worker`, and so on.
- **No agent teams?** Skip that step in setup. Team tickets then run as parallel subagents that share
  `contract.md` instead of messaging each other.
- **Other coding agents**: the tickets are plain Markdown. Run the write-tickets steps in any agent;
  if it has no agent teams, use subagents for team tickets.
- `--permission-mode auto` lets the router and workers run without asking you for every command. Use
  it in a project you trust, with everything committed first.
- Expect more tokens than a single session (each worker has its own context), mostly cheap cached
  reads - in exchange for faster, better-checked work and no session juggling.
