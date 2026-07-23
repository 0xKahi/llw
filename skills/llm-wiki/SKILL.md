---
name: llm-wiki 
description: >
  Create, Update and Manage llm-wiki Knowledge Base - an obsidian vault that stores knowledge/notes/plans as markdown files with YAML
  frontmatter. Use when the user mentions "knowledge bundle" 'OKF', 'Open Knowledge Format',
  'knowledge bundle', 'OKF bundle', 'create a knowledge base for agents',
  'validate OKF', 'convert to OKF', 'enrich knowledge docs', 'agent-readable knowledge', 'LLM wiki', 'knowledge catalog', 'kcmd'.
---

# LLM WIKI

`llw` A Custom Obsidian Vault Cli for agents to manage the `llm-wiki` vault, which stores markdown files representing different types of knowledge that  
users/agents can reference. the `llm-wiki` vault have different distinct categories for storing knowledge, each having its own structure and rules/guides to follow.
Each category comes with it own dedicated skill to manage the knowledge in that category. 

**Guards**
- you should only ever view/update/edit one category at a time
- if unsure on which category to use, ask the user for clarification 

## Common Commands

**To Get Full Vault Path** 
mainly usefull when you want to read or edit files in the vault

```bash
# returns full-path to vault
llw vault path
```

## Skills 

The CLI serves skill content that always matches the installed version, so instructions never go stale. The content in this stub cannot change between releases, which is why it just points at `skills view <name>`.

### llw-okf 

the core skill of the llm-wiki vault, it is a custom variation of the Open Knowledge Format (OKF) bundles - that is optimized for obsidian supported mono-repo knowlegebases.
It categorizes organizational knowledge as bundles & concepts stored in the `bundles` folder at the root of the vault 

this is the default skill to use and default category to store knowledge, when user does not specify a category. 
etc. "add this to my wiki", "look at my wiki/knowledge base for xyz". assume the user is referring to the llw-okf category unless they specify otherwise 

**Load Skill**
```bash
llw skills view llw-okf 
```

**Trigger Key Words**
- 'okf'
- 'bundle'
- 'concept'

### Pending
... pending more skills

