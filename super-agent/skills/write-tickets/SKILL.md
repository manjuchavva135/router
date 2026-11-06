---
name: write-tickets
description: Turn a feature request, a PRD, a confirmed grill record (specs/grill/*.md) or a list of ideas into build-ready tickets - one folder per feature under specs/tickets/ holding rd.md (what to build) and eval.md (how to prove it is built right), plus a BOARD.md that tracks status (draft/ready/done), mode (solo/team) and what each ticket waits on. Use when the user wants things built later by the router and worker agents, says "write tickets", "make tickets", "turn this PRD into tickets", or describes features they want written down rather than coded right away.
argument-hint: "[what to build, or a path to a PRD]"
---

# Write Tickets

Turn each feature the user asks for into a ticket: a folder holding two files.

- **rd.md** - the requirements. What to build and why, specific enough that someone could build it
  without asking a single follow-up question.
- **eval.md** - the check. Concrete steps that anyone, human or agent, can run on the finished work to
  get a clear PASS or FAIL on every requirement, without having to judge for themselves.

The two files work as a pair. rd.md says what "done" means. eval.md proves it. Every requirement in
rd.md is covered by at least one check in eval.md, and every check points back to the requirements it
covers.

Why this matters: the worker agents that build these tickets **never talk to the user**. Anything
left vague becomes a guess, and a guess becomes a bug or a wasted run. The router can only check a
worker's result against what is written in eval.md. So every question gets answered here, before any
work starts.

Request from the user: $ARGUMENTS

## Where tickets live

```
specs/
  tickets/
    BOARD.md                      <- one row per ticket
    001-short-slug/
      rd.md                       <- written by this skill
      eval.md                     <- written by this skill
      contract.md                 <- written later by a team (team tickets only)
      results.md                  <- written later by the worker
      evidence/                   <- screenshots and logs written later by the tester
    002-another-slug/
      ...
```

- The number in front of each folder name is the ticket **ID**. Three digits, zero padded, never reused.
- Continue numbering after the highest existing ID. Never renumber existing tickets.
- The slug is 2-5 lowercase words joined by `-`.

Templates for all three files are next to this skill: `${CLAUDE_SKILL_DIR}/templates/rd.md`,
`${CLAUDE_SKILL_DIR}/templates/eval.md` and `${CLAUDE_SKILL_DIR}/templates/BOARD.md`. Read them
before writing anything and keep their headings, in the same order.

## Workflow

### 1. Split the request into features

One ticket per feature. A feature is the smallest piece that can be shipped and checked on its own
and that is worth something to a user.

- "Add auth and a dashboard" is two tickets.
- "Add a button, and make the button save the form" is one ticket, because the button is useless
  without the saving.
- A large epic ("build a CRM") becomes several tickets. Tell the user how you split it, so they can
  merge or split tickets differently if they want.

If one ticket needs another to be done first, note it now - it becomes the **Runs** column on the board.

If the user points at a PRD or spec file, read the whole file and take the features from it.

### 2. Read the codebase before asking anything

Look at how the app actually works before you ask the user a single question - don't ask what you can
find out yourself.

- Stack, framework, folder layout, how the app is started, which port, how tests/lint/build run.
- The files each feature will touch. Name real paths in "Affected areas".
- Existing patterns to reuse (auth helpers, DB layer, components, API style).
- Existing tickets in `specs/tickets/` - don't duplicate them, and spot dependencies on them.
- `specs/.super-agent/project.md` if it exists (dev command, ports, test accounts).

### 3. Grill until nothing is unclear

This is the most important step. Workers will build exactly what is written - anything you assume
becomes their guess.

- **If the user passed a confirmed grill record** (`specs/grill/<slug>.md` with
  `**Status:** confirmed`), use it as the source of truth: every Decision, confirmed Assumption and
  Out-of-scope item goes into the matching tickets. Then grill only what is still open **per ticket**
  (exact messages, file paths, edge cases the record didn't need).
- **Otherwise run the `/super-agent:grill` skill** (with the Skill tool) on the whole request and
  follow it to the end - rounds of questions, facts looked up instead of asked, every assumption
  confirmed, the gap-finder check and the user's yes on the play-back. Then come back here.

Either way, for every feature you need answers to: behaviour, edge cases, data shape, exact error
messages, limits, which provider or library, what happens to existing data, what is out of scope.
Record every answer in that ticket's "Decisions" section with the reason. Never write a default you
picked yourself unless the user confirmed it as an assumption.

### 4. Write each ticket

For each feature create `specs/tickets/NNN-slug/` with `rd.md` and `eval.md` from the templates.

rd.md must have:
- `**Status:** draft`, `**Mode:**` and `**Runs:**` lines at the top (same values as the board).
- Numbered functional requirements `FR-1`, `FR-2`, ... and non-functional ones `NFR-1`, ...
  Each one is testable: a number, a message, a state, a file - never "fast" or "nice".
- **Affected areas** - every file or module it will add or change, with real paths.
- **Don't touch** - files and behaviour that must stay as they are.
- **Out of scope** - things that sound related but are not part of this ticket.
- **Decisions** - every choice made in step 3, with the reason.
- **Open questions** - must be empty. A ticket with open questions cannot be marked ready.

eval.md must have:
- **Setup** - how to start the app for checking, which port, which test account, seed data.
- **Automated checks** - commands that must exit 0 (build, lint, typecheck, unit tests).
- **Acceptance checks** `E-1`, `E-2`, ... each with `Covers:` (FR/NFR ids), `Type:` (CLI, API or
  Browser), numbered `Steps:` that can be run exactly as written, and `Expected:` results that are
  unambiguous. Browser checks are written for `agent-browser` (open URL, click, fill, read text,
  screenshot).
- **Edge cases** - the unusual cases that could go wrong, each as a check.
- **Traceability** - a table mapping every FR/NFR to the checks that cover it. No requirement may be
  uncovered.
- **Definition of done** - a checklist: all automated checks pass, all acceptance checks pass, nothing
  from "Out of scope" was built, evidence saved in `evidence/`.

### 5. Choose mode and runs, and update the board

**Mode**
- `solo` - one worker builds it end to end in its own git worktree. Default. Use it whenever the
  feature does not need back-and-forth between parts.
- `team` - several teammates build it together and talk to each other (Claude Code agent teams). Use
  it only when the feature has 2-4 clearly separate parts that must agree on a shared shape (for
  example schema + mailer + events, or API + UI that share types). Name the parts in rd.md under
  "Team split" so the router knows how many teammates to start.

**Runs**
- `alongside` - can be built at the same time as any other ticket.
- `waits for NNN: <reason>` - must wait until ticket NNN is done. Give the real reason (shared file,
  needs its table, needs its API). Two tickets that edit the same core file should not run at the
  same time - make one wait for the other.

Then create or update `specs/tickets/BOARD.md` from the template - one row per ticket, sorted by ID:

```
| # | Title | Status | Mode | Runs |
|---|-------|--------|------|------|
| 001 | v0.2 foundations (schema, mailer, rate limits) | draft | team | alongside |
| 002 | Password reset by email | draft | solo | waits for 001: needs the mailer and tokens table |
```

Every new ticket starts as **draft**. Never mark a ticket ready yourself - the user decides what gets
built (`/super-agent:mark-ready`).

### 6. Gap check every ticket

Start one `super-agent:gap-finder` per ticket folder (in parallel, in the background) with the prompt
"Check the ticket in specs/tickets/NNN-slug/ (rd.md and eval.md)". For each real gap it reports:

- if the answer is a fact, look it up and fix the ticket;
- if it is a decision, ask the user (one combined round for all tickets) and fix the ticket.

A ticket is finished only when its gap check finds nothing real and "Open questions" says None.

### 7. Report

Tell the user, briefly:
- how many tickets you wrote, with ID, title, mode and what each waits on;
- how you split any large request;
- that every ticket is a draft, and how to start building:
  1. `/super-agent:mark-ready 001 002` (or ask any session to mark them ready)
  2. `claude --agent super-agent:router --name router --permission-mode auto`
  3. tell the router: `start with 001`

## Rules

- Never write code in this skill. Only `specs/tickets/**`.
- Never leave an open question in a ticket. If the user won't decide, pick the safest option, write it
  as a decision and say so.
- Keep each rd.md self-contained: a worker reads only its own ticket folder plus the code.
- Prefer more, smaller tickets over a few huge ones. A ticket a worker can't finish in ~30 minutes is
  probably two tickets.
- If you use a different agent than Claude Code and it has no agent teams, team tickets are still fine:
  the router will run their parts as parallel subagents that share `contract.md`.
