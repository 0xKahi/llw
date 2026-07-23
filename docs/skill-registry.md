# Skill Registry

Skills are prompt files that `llw` can retrieve and inject into agent contexts via `llw skills view <name>`. This guide covers how skills are structured, how references work, and how to add a new skill.

---

## Directory layout

Skills live under `skill-data/` at the package root. Each skill is its own named folder:

```
skill-data/
  <skill-name>/
    SKILL.md              ← the skill content (required)
    sk-references/        ← optional reference files
      some-file.md
      another-file.md
```

The `skill-data/` tree is shipped with the published package so skills are available wherever `llw` is installed.

---

## SKILL.md

Every skill must have a `SKILL.md` at its folder root with a YAML frontmatter block:

```markdown
---
name: <skill-name>
description: >
  A short description of what this skill does.
---

# Skill Title

Skill content goes here...
```

The `name` field **must exactly match** the folder name and the registry key (see [Registering a skill](#registering-a-skill)).

---

## References

Skills can link to supporting files (guides, examples, templates, etc.) stored in the skill's `sk-references/` folder. References are written as ordinary markdown links:

```markdown
[Some Text](sk-references/my-file.md)
```

When the skill is retrieved via `llw skills view <name>`, every link destination that starts with `sk-references/` is rewritten to its absolute filesystem path:

```markdown
[Some Text](/absolute/path/to/skill-data/<skill-name>/sk-references/my-file.md)
```

This means the agent receiving the skill content can read the reference file directly without needing to know where the package is installed.

### Rules

- **Link destinations must start exactly with `sk-references/`** — no leading `./`. Links starting with `./`, `../`, or any other prefix are left untouched.
- **References must stay inside the skill folder** — path traversal (e.g. `sk-references/../../other`) is rejected at retrieval time.
- **Symlinks that escape the skill folder are rejected** — the physical resolved path is checked, not just the logical one.
- **Missing targets fail retrieval** — if a linked file does not exist, `llw skills view` throws rather than returning unresolved content.
- **Unlinked files are fine** — files in `sk-references/` that aren't linked from `SKILL.md` are allowed and ignored.
- **Repeated links are fine** — the same file can be linked multiple times; each link is rewritten independently.

### What is NOT rewritten

- External URLs: `[Docs](https://example.com)`
- Anchor links: `[Section](#heading)`
- Dot-prefixed paths: `[File](./sk-references/file.md)`
- Plain text containing `sk-references/` — only link destinations are matched
- Shell-style variables like `$HOME`

---

## Registering a skill

Skills are declared in `src/utils/skill-registry/registry.ts`. The entry data is private to the module; the only public surface is `getSkillEntries`:

```ts
// src/utils/skill-registry/registry.ts

const SKILL_ENTRIES: Record<string, SkillRegistryEntry> = {
  'my-skill': {
    description: 'One-line description shown in listings.',
  },
  'test-only-skill': {
    description: 'A skill only available in test mode.',
    testOnly: true,
  },
};
```

### `testOnly`

Mark a skill `testOnly: true` to exclude it from the production CLI. Test skills are still included when a `SkillRegistry` is constructed with `getSkillEntries({ testSkills: true })`, which is what the test suite does.

> **Note:** `src/constants.ts` currently uses `testSkills: true` while the only registered skill is the test fixture. Flip it to `false` once real skills are added.

---

## Adding a new skill — step by step

1. **Create the skill folder**

   ```
   skill-data/
     my-skill/
       SKILL.md
   ```

2. **Write `SKILL.md`** with a frontmatter block where `name` matches the folder name:

   ```markdown
   ---
   name: my-skill
   description: >
     Does something useful for agents.
   ---

   # My Skill

   Instructions for the agent...
   ```

3. **Add reference files** (if needed) in `sk-references/` and link to them from `SKILL.md`:

   ```markdown
   See the [full guide](sk-references/guide.md) for details.
   ```

4. **Register the skill** in `src/utils/skill-registry/registry.ts`:

   ```ts
   'my-skill': {
     description: 'Does something useful for agents.',
   },
   ```

5. **Verify** the skill retrieves cleanly:

   ```bash
   llw skills view my-skill
   llw skills view my-skill --path
   ```

6. **Run the test suite** — the parameterized integrity suite automatically picks up the new entry and validates identity, assets, and all `sk-references/` links:

   ```bash
   bun test
   ```

---

## How `SkillRegistry` works

The `SkillRegistry` class (`src/utils/skill-registry/skill-registry.ts`) is an instance-based registry built from an entries array at startup:

```ts
// src/constants.ts
export const skillRegistry = new SkillRegistry(getSkillEntries({ testSkills: false }));
```

Key methods:

| Method | Description |
|---|---|
| `has(name)` | Returns `true` if the name is a registered skill |
| `getSkill(name)` | Returns the transformed `SKILL.md` content with reference links rewritten |
| `getSkillPath(name)` | Returns the absolute path to the skill folder |
| `getSkillFilePath(name)` | Returns the absolute path to `SKILL.md` |
| `getSkillsDataPath()` | Returns the absolute path to the `skill-data/` directory |

The constructor throws if the same skill name appears twice in the entries array.

### Package-root discovery

`SkillRegistry` walks up the directory tree from its own source file until it finds a `package.json` with `"name": "@0xkahi/llm-wiki"` alongside a `skill-data/` folder. This makes skill paths stable regardless of where the CLI is invoked from.

---

## CLI reference

```bash
# Print transformed skill content to stdout
llw skills view <name>

# Print the absolute path to the skill folder (no transformation)
llw skills view <name> --path
```

Errors exit with code `1` and print to stderr:
- `Unknown skill: <name>` — not in the registry
- `Skill folder not found: <name>` — registered but folder missing
- `Skill reference file not found for skill "<name>": sk-references/...` — broken link
- `Skill reference escapes the skill folder: sk-references/...` — traversal attempt
