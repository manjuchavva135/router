# Project facts for the Super Agent

Every agent reads this file. Keep it short and exact.

## Basics

- Name: <app name>
- Stack: <e.g. Next.js 15, SQLite, Tailwind>
- Main branch: main
- Install: `npm install`
- Start on a port: `PORT=<port> npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test`

## Ports

| Who | Port |
|-----|------|
| Main checkout (team tickets, checker) | 3000 |
| Worker 1 / 2 / 3 / ... | 3001 / 3002 / 3003 / ... |
| Reproducer | 3090 |

## Test accounts

| Account | How to get it | Used by |
|---------|---------------|---------|
| <e.g. base001> | <seed command or sign-up path> | checker |
| <e.g. t001..t089> | <create a fresh one per worker> | workers |
| <e.g. t090> | <...> | reproducer |

## Per-worktree setup

- <e.g. copy `.env.local` from the main checkout, run `npm install`, run migrations>

## Notes

- <Anything an agent would otherwise trip over.>
