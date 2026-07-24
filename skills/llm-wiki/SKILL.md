---
name: llm-wiki 
description: >
  Create, Update and Manage llm-wiki Knowledge Base - an obsidian vault that stores knowledge/notes/plans as markdown files with YAML
  frontmatter. Use when the user mentions 'OKF', 'Open Knowledge Format',
  'knowledge bundle', 'OKF bundle', 'create a knowledge base for agents',
  'convert to OKF', 'enrich knowledge docs', 'LLM wiki', 'knowledge catalog', 'kcmd'.
---

# LLM WIKI

An Opinionated Obsidian Vault, that functions as a global persistent Knowledge Base for agents to manage, store, and reference knowledge. 
The vault, has strict formats and guidelines and is managed entirely through the `llw` CLI tool (unless specified otherwise).

The `llw` CLI tool, provides a set of workflows/skills for managing the vault, and are the only supported way to create, update or find knowledge in the vault. 
Provided workflows/skills are mutually exclusive from each other, and are designed to be used one at a time, having its own set of rules and guidelines
on managing specific sections of the vault.

**Guardrails**
- Vault Management **SHOULD ONLY** be done by following one of the provided workflows.
- **DO NOT** cross contaminate different workflows instructions, only 1 should be strictly followed at a time.
- This file is a discovery stub, not the usage guide. Always match user request to one of the workflows, load the actual workflow/skill content from the CLI before fulfilling the request.

## Common Commands

**To Get Full Vault Path** 
```bash
llw vault path
```

## Skills & Workflows 

The CLI serves skill content that always matches the installed version, so instructions never go stale. The content in this stub cannot change between releases, which is why it just points at `skills view <name>`.

### llw-okf 

This is the core workflow for managing the `llm-wiki` vault, it stores and organizes knowledge in bundles and concepts based on the Open Knowledge Format (OKF) specification. 
Unless user specifies a specific workflow, This workflow should be used as the default for adding, updating, and searching knowledge in the vault. 

```bash
llw skills view llw-okf 
```

**Trigger KeyWords**
- 'okf'
- 'bundle'
- 'concept'

### Pending
...pending more skills

