# Proposal: rename-skills-get-to-view

## Why

The CLI's read-only commands use `view` everywhere (`llw concept view`, `llw bundle view`) except for skills, which uses `get` (`llw skills get`). This inconsistency makes the command surface harder to learn and document. Renaming the skills command to `view` unifies the read-command vocabulary before the CLI's interface stabilizes.

## What Changes

- **BREAKING**: Rename the `skills` subcommand from `get` to `view`: `llw skills view <name>` prints transformed skill content, `llw skills view <name> --path` prints the installed skill folder path.
- **BREAKING**: Remove the `get` command name — no alias is retained (the package is pre-1.0).
- Rename the command class/file (`SkillsGetCommand` → `SkillsViewCommand`, `src/commands/skills/get.ts` → `view.ts`) to match the convention used by `concept` and `bundle` commands.
- Update CLI tests and user docs (`docs/skill-registry.md`) to use the new command name.
- Behavior (content retrieval, reference rewriting, `--path` mode, error handling) is unchanged — only the command name changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `skill-content-retrieval`: Requirements that name `llw skills get <name>` / `llw skills get <name> --path` are updated to the `llw skills view` command name; retrieval, rewriting, and path-resolution behavior stays the same.

## Impact

- **Code**: `src/commands/skills/get.ts` (renamed), `src/commands/skills/index.ts` (registration).
- **Tests**: `test/skills-command.test.ts` invokes `skills get`; updated to `skills view`.
- **Docs**: `docs/skill-registry.md` references `llw skills get` in several places.
- **Consumers**: Any scripts or agent configs calling `llw skills get` must switch to `llw skills view` (breaking, acceptable pre-1.0).
- No dependency, build, or packaging changes.
