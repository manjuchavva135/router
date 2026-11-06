# NNN: <Ticket title> - Evaluation

## Setup

- Start: `<dev command, e.g. PORT=<port> npm run dev>` - the router gives each worker its own port.
- Base URL: `http://localhost:<port>`
- Test account: `<from specs/.super-agent/project.md, or "create one in E-1">`
- Seed / reset: `<command or "none">`

## Automated checks

- `npm run build` exits 0
- `npm run lint` exits 0
- `<unit test command>` exits 0

## Acceptance checks

### E-1: <What this check proves> (covers FR-1, FR-2)

- **Type:** Browser
- **Steps:**
  1. `agent-browser open http://localhost:<port>/<path>`
  2. `agent-browser fill "<selector or label>" "<value>"`
  3. `agent-browser click "<button text>"`
  4. `agent-browser screenshot evidence/E-1.png`
- **Expected:** <Exact text, URL, status code or state - something a tester can compare without
  judgement.>

### E-2: <...> (covers FR-3)

- **Type:** CLI
- **Steps:**
  1. `<command>`
- **Expected:** prints `<exact output>` / exits 0

### E-3: <...> (covers NFR-1)

- **Type:** API
- **Steps:**
  1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/<path>`
- **Expected:** `200`

## Edge cases

### E-4: <Unusual case that could go wrong> (covers FR-2)

- **Type:** Browser
- **Steps:**
  1. <...>
- **Expected:** <...>

## Traceability

| Requirement | Checks |
|-------------|--------|
| FR-1 | E-1 |
| FR-2 | E-1, E-4 |
| FR-3 | E-2 |
| NFR-1 | E-3 |

## Definition of done

- [ ] All automated checks pass
- [ ] All acceptance checks E-1...E-N pass
- [ ] All edge-case checks pass
- [ ] No items from "Out of scope" were built
- [ ] Nothing listed under "Don't touch" changed
- [ ] Evidence (screenshots, logs) saved in `evidence/` and listed in `results.md`
