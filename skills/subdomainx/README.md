# SubdomainX Agent Skill

A reference [Agent Skill](https://docs.claude.com/en/docs/claude-code/skills)
that teaches an AI coding agent how to use the SubdomainX CLI — its flags, API
keys, config format, and output formats — so it can drive the tool correctly.

This is **documentation for an agent**, not a program. It contains no code and
runs nothing on its own.

## Install (Claude Code)

Copy the `subdomainx/` folder into your skills directory:

```bash
# Project-scoped (only this repo)
mkdir -p .claude/skills && cp -r skills/subdomainx .claude/skills/

# Or user-scoped (all your projects)
mkdir -p ~/.claude/skills && cp -r skills/subdomainx ~/.claude/skills/
```

The agent will load `SKILL.md` on demand when a task involves running
subdomainx.

## Use with other agents / LLMs

`SKILL.md` is plain Markdown. For any other agent framework, paste its contents
into the system prompt or attach it as a reference document / tool description.

## Note

SubdomainX is a reconnaissance tool for **authorized security testing only**.
The skill instructs the agent to confirm target authorization before scanning.
See the repository's [SECURITY.md](../../SECURITY.md) and
[AI_USAGE_POLICY.md](../../AI_USAGE_POLICY.md).
