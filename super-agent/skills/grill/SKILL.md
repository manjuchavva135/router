---
name: grill
description: Interview the user round after round until there is a complete shared understanding of an idea, feature, plan or bug - nothing assumed silently. Every gap becomes either a fact you look up, a question the user answers, or an assumption the user explicitly confirms. Ends with a written record (specs/grill/<slug>.md), a fresh-eyes gap check and a play-back the user must confirm. Use when the user says "grill me", "ask me questions", "don't assume anything", "make sure you understand", before writing tickets, or whenever a request is vague, big or risky.
argument-hint: "[the idea, feature, plan or bug to understand]"
---

# Grill

Your goal: reach a state where you could explain the user's idea back to them and they would say
"yes, exactly - nothing missing, nothing added". Until then you keep asking.

Topic: $ARGUMENTS

## The one rule: no silent assumptions

Every time you notice yourself filling a gap - a default, a "probably", an "obviously", a "usually
people want" - stop. That gap goes into one of three buckets:

| Bucket | What it is | Who settles it |
|--------|------------|----------------|
| **Fact** | Something true about the code, data, tools or environment | **You.** Look it up (read files, run read-only commands, or start an Explore subagent). Never ask the user what you can find yourself. |
| **Decision** | A choice about what should happen | **The user.** Ask it. |
| **Assumption** | Something you'd otherwise take for granted | **The user.** Write it down as `A-n` and get an explicit yes or no. |

Nothing leaves the "Still unclear" list until it is in one of those buckets and settled. Words like
"probably", "I assume", "should be fine", "typically" never appear in the final record.

## How to run it

### 0. Start the record

Create `specs/grill/<slug>.md` from `${CLAUDE_SKILL_DIR}/templates/record.md` (slug = 2-5 words of the
topic). Keep it updated after every round - it's the memory of this interview, and other skills
(`/super-agent:write-tickets`) read it.

If a record for this topic already exists, read it and continue from its "Still unclear" list instead
of starting over.

### 1. Map the decision tree

Write the topic as a tree: each decision has the decisions that hang off it. Use this checklist so no
branch is forgotten - skip a branch only when it clearly doesn't apply, and say so in the record:

1. **Goal** - what problem, for whom, and how will we know it worked?
2. **Users and roles** - who does what; who must NOT be able to.
3. **Scope** - what's in, what's explicitly out, what's later.
4. **Flows** - step by step, happy path first; every screen, command or API call.
5. **States and data** - what is stored, its shape, where, how long; what happens to existing data.
6. **Rules** - limits, validation, permissions, pricing, time zones, ordering, uniqueness.
7. **Errors and edge cases** - empty, too many, duplicate, offline, slow, concurrent, partial failure.
8. **Integrations** - other services, providers, libraries, webhooks; who owns the account and keys.
9. **Non-functional** - speed, scale, security, privacy, accessibility, devices, languages.
10. **Look and words** - UI copy, messages, emails, tone, where it lives in the existing UI.
11. **Rollout** - migrations, feature flags, backwards compatibility, who is affected on day one.
12. **Done** - how it will be checked, by whom, and what counts as finished.

### 2. Find the facts first

Before the first round, look at everything you can: the codebase, existing specs and tickets, configs,
`specs/.super-agent/project.md`. Record each finding as `F-n` with its source (file path or command).
Facts you find often answer or remove questions - don't ask those.

When a question depends on a fact you're still looking up, hold back only that question; ask the rest.

### 3. Ask in rounds

A round contains every question whose prerequisites are already settled (the **frontier**). Don't ask
a question that depends on another question in the same round - it goes in a later round.

Format each round like this:

```
Round 2 - 4 questions, 3 assumptions to confirm

Q1. Who can reset a password?
    a) Anyone with access to the account's email (Recommended)
    b) Only users who have logged in at least once
    -> I recommend (a): it's the standard flow and nothing in the code limits sign-ins.

Q2. ...

Please confirm or correct:
A3. Reset links expire after 1 hour.
A4. The existing login page gets a "Forgot password?" link under the password field.
A5. No email is sent if the address isn't registered, but the page shows the same message either way.

Reply like:  1a, 2 "only admins", A3 yes, A4 no - put it in the header, A5 yes
```

- Number questions `Q1, Q2...` and assumptions `A-n` (assumption numbers keep counting across rounds).
- Give concrete options and a recommendation with a one-line reason. Word the recommendation so a
  plain "yes" accepts it.
- For 1-4 quick multiple-choice questions you may use the AskUserQuestion tool instead (recommended
  option first, labelled "(Recommended)").
- Max ~7 questions per round. Big topics take more rounds, not longer rounds.
- If an answer is vague ("whatever's best", "the usual"), turn it into a specific proposal and put it
  back as an assumption to confirm. "Whatever's best" is never a final answer.
- If two answers contradict each other, point it out and ask which wins.

### 4. Update the record after every round

Move settled items into **Decisions** (`D-n`, with the user's answer and the reason) or **Assumptions**
(mark `confirmed` or `rejected -> replaced by D-n`). Add new branches the answers opened. Recompute the
frontier. Tell the user in one line how many items are still unclear.

### 5. Fresh-eyes gap check

When the "Still unclear" list is empty, start the `super-agent:gap-finder` agent with the path of the
record. It reads the record and the code with no memory of this conversation and returns missing
branches, contradictions and hidden assumptions. Turn anything real it finds into another round.

### 6. Play it back

When the gap check comes back clean, write a **Play-back** section in the record: the whole idea in
plain language, 5-15 short lines, in the user's words where possible - what it does, for whom, what's
out of scope, how we'll know it's done. Show it to the user and ask:

"Is this exactly what you mean - nothing missing, nothing added?"

- Any correction -> another round.
- A clear yes -> set the record's status to `confirmed` and stop.

## Rules

- **Never start building** during a grill, and never treat the interview as done without the user's
  explicit yes on the play-back.
- **Ask, don't lecture.** Short questions, short reasons. No essays between rounds.
- **The user can stop at any time** ("enough", "just decide"). Then turn every remaining open item into
  an assumption with your recommended answer, list them, and ask for one yes on the whole list. Record
  which items were decided this way.
- **Facts are your job, decisions are theirs.** Never ask "what framework do you use?" when
  package.json says it. Never decide "users can delete their account" for them.
- **Keep the record honest.** It must match what was actually said.

## When the grill is done

Tell the user where the record is and what's next. If this was about something to build:

```
/super-agent:write-tickets specs/grill/<slug>.md
```
