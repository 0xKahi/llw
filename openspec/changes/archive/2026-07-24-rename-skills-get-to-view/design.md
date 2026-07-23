# Design: rename-skills-get-to-view

## Context

The `llw` CLI groups commands by domain (`bundle`, `concept`, `skills`, `vault`), each implemented as a `CommandStrategy` class registered in an `index.ts` (`src/commands/<domain>/index.ts`). Read commands are named `view` in `bundle` and `concept`, but the skills read command is `get` (`src/commands/skills/get.ts`, class `SkillsGetCommand`). The command's behavior — printing transformed `SKILL.md` content or the installed folder path via `--path` — is covered by the `skill-content-retrieval` spec and `test/skills-command.test.ts`.

## Goals / Non-Goals

**Goals:**
- Expose the skills read command as `llw skills view <name>` (with `--path` mode), matching the `concept view` / `bundle view` convention.
- Rename implementation artifacts (file, class) to `view` naming for consistency.
- Keep all retrieval, reference-rewriting, and error behavior identical.

**Non-Goals:**
- No changes to skill registry internals, reference rewriting, or output content.
- No new options or output formats for the command.
- No backwards-compatibility alias for `get`.

## Decisions

- **Hard rename, no `get` alias.** The package is pre-1.0 (`0.0.0`), so a clean break is acceptable and avoids maintaining two names. Alternative considered: keep `get` as a hidden alias — rejected as unnecessary surface area at this stage.
- **Rename file and class**: `src/commands/skills/get.ts` → `src/commands/skills/view.ts`, `SkillsGetCommand` → `SkillsViewCommand`, and update the registration in `src/commands/skills/index.ts`. This mirrors `concept/view.ts` (`ConceptViewCommand`) and `bundle/view.ts`.
- **Update the command `config.name` to `'view'`** and keep the description text ("Output a bundled skill or its installed folder path") unchanged since behavior does not change.
- **Docs and tests move together**: `docs/skill-registry.md` and `test/skills-command.test.ts` are updated in the same change so no stale `skills get` references remain.

## Risks / Trade-offs

- [External scripts or agent configs calling `llw skills get` break after upgrade] → Documented as **BREAKING** in the proposal; acceptable pre-1.0, and the fix for consumers is a mechanical rename.
- [Missed stale references to the old command name] → `rg "skills get"` sweep across `src/`, `test/`, `docs/`, and `openspec/` as part of implementation; archive step updates the `skill-content-retrieval` spec.
