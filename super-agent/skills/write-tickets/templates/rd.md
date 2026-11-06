# NNN: <Ticket title>

**Status:** draft
**Mode:** solo
**Runs:** alongside

## Summary

<Two to four sentences: what the user gets when this ticket is done, and why it matters.>

## Functional requirements

- **FR-1** - <One testable behaviour. Name the exact route, button, message, field or state.>
- **FR-2** - <...>

## Non-functional requirements

- **NFR-1** - <A measurable limit: time, size, rate, security rule, accessibility rule.>

## Team split

<Team tickets only - delete this section for solo tickets.>

| Teammate name | Owns | Must agree with |
|---------------|------|-----------------|
| schema | `lib/db.ts`, migrations | mailer, events |
| mailer | `lib/mailer.ts` | schema |

## Affected areas

- `path/to/file.ts` - <what changes here> (new | changed)
- `path/to/other.tsx` - <...>

## Don't touch

- `path/to/stable-file.ts` - <why it must stay as it is>
- <Behaviour that must not change, e.g. "existing login flow and its cookies">

## Out of scope

- <Things that sound related but belong to another ticket or to no ticket.>

## Decisions

| # | Question | Decision | Why |
|---|----------|----------|-----|
| D-1 | <What would a builder otherwise have to guess?> | <The answer> | <Reason, or "user chose"> |

## Open questions

None.
