#!/usr/bin/env node
// SubagentStop hook for the Super Agent plugin.
//
// When a `worker` subagent tries to finish inside its worktree, block the stop if
//   - it still has uncommitted changes, or
//   - its branch has no results.md under specs/tickets/ compared to the main branch.
// Anything else (other agents, no worktree, git errors, a second stop attempt) is let through,
// so this hook can never trap an agent.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const allow = () => process.exit(0);
const block = (reason) => {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
};

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  allow();
}

if (input.stop_hook_active) allow();

const agentType = String(input.agent_type || input.subagent_type || "");
if (!/(^|:)worker$/.test(agentType)) allow();

const cwd = input.cwd || process.cwd();
if (!cwd.split(/[\\/]/).join("/").includes("/.claude/worktrees/")) allow();

const git = (...args) => {
  try {
    return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15000 }).trim();
  } catch {
    return null;
  }
};

const status = git("status", "--porcelain");
if (status === null) allow();
if (status !== "") {
  block("You still have uncommitted changes. Write results.md, then commit everything on your branch (git add -A && git commit -m \"NNN: <title>\") before you report back to the router.");
}

let main = "main";
const root = git("rev-parse", "--show-toplevel");
try {
  const pm = fs.readFileSync(path.join(root || cwd, "specs", ".super-agent", "project.md"), "utf8");
  main = pm.match(/Main branch:\s*`?([\w./-]+)`?/i)?.[1] || main;
} catch {}
if (git("rev-parse", "--verify", "--quiet", main) === null) {
  if (git("rev-parse", "--verify", "--quiet", "master") !== null) main = "master";
  else allow();
}

const changed = git("diff", "--name-only", `${main}...HEAD`);
if (changed === null) allow();
if (!/(^|\n)specs\/tickets\/\d{3}-[^/]+\/results\.md(\n|$)/.test(changed)) {
  block("Your branch has no specs/tickets/NNN-slug/results.md. Write it (checks table with evidence, attempts, changes, notes for the router), commit it, then report back.");
}

allow();
