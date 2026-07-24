# Proposal: add-skill-alias

## Why

Skill entries in the registry already carry an optional `alias` field (e.g. `llw-okf` declares `alias: 'core'`), but nothing resolves it — `llw skills view core` fails with "Unknown skill" and users must type the full skill name. Aliases need to become first-class lookup identifiers so short, memorable names work everywhere a skill name does.

## What Changes

- `SkillRegistry` builds a separate alias → skillName map at construction, derived from each entry's optional `alias` field.
- All public lookup methods (`has`, `getSkill`, `getSkillPath`, `getSkillFilePath`) resolve input through the alias map first (`alias.get(input) ?? input`), so aliases behave identically to skill names.
- Construction-time validation enforces global uniqueness: an alias MUST NOT collide with another alias or with any registered skill name, and MUST NOT equal its own skill's name. Violations throw at construction, like duplicate skill entries do today.
- No CLI surface changes: `llw skills view <name>` already accepts `<name>`; it now transparently accepts aliases too.

## Capabilities

### New Capabilities

### Modified Capabilities
- `skill-registry-integrity`: new requirement that aliases are globally unique — no alias collides with another alias, with any skill name, or with its own skill name — and that violations fail at registry construction.
- `skill-content-retrieval`: `llw skills view <name>` (and `--path` mode) SHALL accept a registered alias in place of the skill name and resolve it to the same skill.

## Impact

- **Code**: `src/utils/skill-registry/skill-registry.ts` (alias map + resolution + validation), `src/utils/skill-registry/registry.ts` (no change needed — `alias` field already exists on `SkillRegistryEntry`).
- **Tests**: `test/skill-registry.test.ts` (alias resolution, collision validation), `test/skills-command.test.ts` (view by alias).
- **APIs**: `SkillRegistry` public methods accept aliases; no signature changes.
- **Consumers**: none breaking — existing lookups by skill name are unchanged.
