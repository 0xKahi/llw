## Why

Skill references are currently declared twice: as `$REF_*` placeholders in `SKILL.md` and again as placeholder-to-path mappings in the skill registry. This makes authored skills hard to read (the on-disk file contains unresolved tokens instead of working links) and makes the registry tedious to maintain (every reference must be kept in sync in two places, enforced by runtime and test validation).

Markdown already has a native mechanism for this — the link destination. Making `SKILL.md` the single source of truth removes the indirection entirely.

## What Changes

- Replace `$REF_*` placeholder transformation with markdown link rewriting: authored links of the form `[text](sk-references/<file>)` are rewritten at retrieval time to the raw absolute path of the target file. **BREAKING** for skill authors: `$REF_*` syntax is no longer recognized.
- References live in a `sk-references/` folder at the root of each skill folder. The uncommon name makes accidental matches in ordinary prose effectively impossible.
- Strict containment: reference links must resolve to an existing file inside the skill's own folder. Shared cross-skill references are no longer supported. Path traversal and symlink escapes are rejected.
- Broken links fail retrieval at runtime (an `sk-references/` link whose target does not exist throws). Orphan files (unlinked files in `sk-references/`) are allowed and not checked.
- Rewrite emits the raw absolute path with no angle-bracket wrapping; output is agent-facing, not CommonMark-guaranteed.
- The registry sheds all reference knowledge. Entries become `{ description, testOnly? }` only; the `SKILLS` / `SKILL_REGISTRY` exports and `$REF_*` patterns are removed.
- Refactor the static `SkillUtil` into an instance class `SkillRegistry` built from `getSkillEntries({ testSkills })`. The CLI composes its instance in `src/constants.ts`; tests build their own instances with test skills included. Skill names are plain strings validated at runtime (no compile-time literal union).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `skill-content-retrieval`: The reference transformation requirement changes from declared `$REF_*` placeholder replacement to `sk-references/` markdown link rewriting; the preservation scenario changes from `$REF_*`-namespace exclusion to non-`sk-references` links being left untouched; broken-link failure semantics are retained under the new mechanism.
- `skill-registry-integrity`: The reference declaration requirements (standardized `$REF_*` keys, declaration/placeholder synchronization, shared-reference resolution) are removed and replaced with link-integrity requirements (every `sk-references/` link in `SKILL.md` resolves to an existing file within the skill folder).

## Impact

- **Code**: `src/utils/skill-registry/registry.ts` (private entry data, `getSkillEntries`), `src/utils/skill-registry/skill.util.ts` (becomes `SkillRegistry` class with link rewriting), `src/constants.ts` (composes the CLI instance), `src/commands/skills/get.ts` (consumes the instance).
- **Specs**: `skill-content-retrieval`, `skill-registry-integrity` (delta specs in this change).
- **Tests**: all four existing skill-related test files are reworked around instances and link integrity.
- **Skill assets**: `skill-data/test-skill/SKILL.md` migrates from `$REF_*` to `sk-references/` links; its `references/` folder is renamed `sk-references/`.
- **Behavioral**: CLI surface (`llw skills get <name> [--path]`) is unchanged; `testSkills` is set to `true` for both CLI and tests until real skills ship, then flipped to `false`.
