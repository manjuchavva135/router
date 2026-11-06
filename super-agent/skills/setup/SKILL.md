---
name: setup
description: Prepare the current project for the Super Agent workflow - create specs/tickets/ and BOARD.md, write specs/.super-agent/project.md (dev command, ports, test accounts), copy the watchdog scan script, turn on Claude Code agent teams, ignore worktrees in git, and check that git and agent-browser are ready. Use once per project before writing tickets or starting the router, or when the user says "set up super agent".
disable-model-invocation: false
---

# Super Agent setup

Run these steps in the project root (the folder the user is working in). Say what you changed at the
end. Ask before any step that changes user-level config; project files you may create directly.

## 1. Git must be ready

Workers build in git worktrees, so the project needs git with at least one commit on a main branch.

- `git rev-parse --is-inside-work-tree` - if this fails, ask the user whether to run `git init` and
  make a first commit.
- `git branch --show-current` - note the main branch name (`main` or `master`). Write it into
  project.md below.
- Add `.claude/worktrees/` to `.gitignore` if it isn't there.

## 2. Ticket folders

Create, only if missing:

- `specs/tickets/BOARD.md` - copy of `${CLAUDE_SKILL_DIR}/../write-tickets/templates/BOARD.md`.
- `specs/.super-agent/` - holds project.md, the watchdog script, the watchdog's rules and log.

## 3. Project facts for the agents

Workers never talk to the user, so the facts they need must be written down. Look at the project
(package.json scripts, README, framework config, .env.example) and fill in
`specs/.super-agent/project.md` from `${CLAUDE_SKILL_DIR}/templates/project.md`:

- how to install, start (with a custom port), build, lint and test;
- the main branch name;
- port plan: main checkout (team tickets and the checker) on the base port, e.g. 3000; workers on
  base+1, base+2, ...; reproducer on base+90;
- test accounts (look in seed files, fixtures or .env.example - never invent real credentials; if
  none exist, write "create a fresh account per run" and the sign-up path);
- anything special (needs a DB file, a docker service, env vars to copy into each worktree).

If something can't be found, ask the user with AskUserQuestion rather than guess.

## 4. Watchdog script

Copy `${CLAUDE_SKILL_DIR}/scripts/watchdog-scan.mjs` to `specs/.super-agent/watchdog-scan.mjs`
(overwrite if it exists - it's tool code, not user data). Then run it once:

```
node specs/.super-agent/watchdog-scan.mjs --once
```

It should print `watchdog: no problems` or a list of problems. Node 18+ is required.

## 5. Agent teams (for team tickets)

Team tickets use Claude Code's experimental **agent teams**. Turn it on in the project's
`.claude/settings.json` (create the file if missing, keep every other key):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

If the user doesn't want experimental features, skip this - the router then runs team tickets as
parallel subagents that share `contract.md`.

## 6. Browser testing

The tester, checker and reproducer drive a real browser with Vercel's `agent-browser` CLI.

- Check: `agent-browser --version`
- If missing, tell the user the install commands and ask before running them:
  `npm install -g agent-browser` then `agent-browser install`

If the project has no web UI, write "no browser checks" in project.md.

## 7. Done - tell the user the workflow

```
1. /super-agent:write-tickets <what to build, or path to a PRD>
2. /super-agent:mark-ready 001 002
3. claude --agent super-agent:router --name router --permission-mode auto
4. tell the router:  start with 001
```
