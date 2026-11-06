---
name: mark-ready
description: Mark one or more tickets in specs/tickets/ as ready (or back to draft) so the router agent can pick them up. Use when the user says "mark 001 and 002 ready", "make 003 ready", "set 004 back to draft", or asks what is on the board.
argument-hint: "<ticket ids, e.g. 001 002 006> [draft]"
---

# Mark tickets ready

Arguments: $ARGUMENTS

The board is `specs/tickets/BOARD.md`. Each ticket folder is `specs/tickets/NNN-slug/` and its
`rd.md` has a `**Status:**` line near the top. Both must always agree.

## Steps

1. Parse the ticket IDs from the arguments (accept `1`, `01`, `001`, `#1`; pad to three digits).
   If the last word is `draft`, set them back to draft instead of ready. With no IDs, just show the
   board and stop.
2. For each ID find the folder `specs/tickets/NNN-*`. If none, say so and skip it.
3. Before marking a ticket **ready**, check it is buildable:
   - rd.md has no open questions (the "Open questions" section is empty or says "None").
   - eval.md exists and has at least one acceptance check and a "Definition of done".
   - If it waits for another ticket, mention that ticket's status. Waiting on a `draft` ticket is
     allowed but warn the user it won't start until that one is ready and done.
   If a check fails, don't mark it - tell the user what's missing.
4. Change `**Status:** draft` to `**Status:** ready` in rd.md (or the reverse) and change the Status
   cell of that ticket's row in BOARD.md. Touch nothing else. Never change a `done` ticket.
5. Show the updated rows of the board and, if the router isn't running yet, the start command:

   ```
   claude --agent super-agent:router --name router --permission-mode auto
   ```
