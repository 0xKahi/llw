# Tasks: rename-skills-get-to-view

## 1. Rename the Command

- [x] 1.1 Rename `src/commands/skills/get.ts` to `src/commands/skills/view.ts` and rename the class `SkillsGetCommand` to `SkillsViewCommand`
- [x] 1.2 Change the command `config.name` from `'get'` to `'view'` (keep description, args, options, and execute logic unchanged)
- [x] 1.3 Update `src/commands/skills/index.ts` to import `SkillsViewCommand` from `./view` and register it in `subCommands`

## 2. Update Tests

- [x] 2.1 Update `test/skills-command.test.ts` to invoke `skills view` (describe block and all `runCli` calls)
- [x] 2.2 Add a test asserting `llw skills get test-skill` exits unsuccessfully (old name no longer accepted)

## 3. Update Docs

- [x] 3.1 Replace all `llw skills get` references in `docs/skill-registry.md` with `llw skills view` (including `--path` examples)
- [x] 3.2 Run `rg -n "skills get" src test docs openspec` and fix any remaining stale references outside archived changes

## 4. Verify

- [x] 4.1 Run `bun run check` (lint + type-check) with no errors
- [x] 4.2 Run `bun test` — all tests pass, including the updated skills command tests
- [x] 4.3 Manually smoke-test `bun src/index.ts skills view test-skill` and `bun src/index.ts skills view test-skill --path`
