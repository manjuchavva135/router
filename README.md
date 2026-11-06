# Super Agent marketplace

A Claude Code plugin marketplace with one plugin: **[super-agent](super-agent/)** - a router + workers
workflow. You talk to one router agent; it hands ready tickets to worker agents in their own git
worktrees, checks their results against each ticket's `eval.md`, merges what passes, and only comes to
you when there's a choice to make.

Install from Claude Code:

```
/plugin marketplace add manjuchavva135/router
/plugin install super-agent@super-agent-marketplace
```

Full guide and every command: [super-agent/README.md](super-agent/README.md).
Video breakdown it is based on: [docs/VIDEO-NOTES.md](docs/VIDEO-NOTES.md).
