# Tasks: add-skill-alias

## 1. Registry Implementation

- [x] 1.1 In `src/utils/skill-registry/skill-registry.ts`, add a private `aliases: ReadonlyMap<string, string>` (alias → skillName) built in the constructor from each entry's `alias` field
- [x] 1.2 Add constructor validation that throws a descriptive error when an alias equals its own skill name, equals another registered skill name, or is declared by two different skills
- [x] 1.3 Add a private `resolveSkillName(input)` helper (`aliases.get(input) ?? input`) and route all public lookups (`has`, `getSkill`, `getSkillPath`, `getSkillFilePath`) through it, keeping the original input in `Unknown skill` error messages

## 2. Tests

- [x] 2.1 Add `test/skill-registry.test.ts` cases: lookups by alias (`has`, `getSkill`, `getSkillPath`) resolve to the canonical skill (use `llw-okf`/`core`)
- [x] 2.2 Add `test/skill-registry.test.ts` cases: construction throws for alias = own skill name, alias = another skill name, and duplicate alias across skills
- [x] 2.3 Add `test/skills-command.test.ts` case: `llw skills view core` prints the same content as `llw skills view llw-okf`, and `llw skills view core --path` prints the canonical folder path

## 3. Verification

- [x] 3.1 Run `bun test` — all tests pass
- [x] 3.2 Run `bun run type-check` and `bun run lint` — no errors
- [x] 3.3 Manually verify `bun run src/index.ts skills view core` outputs the `llw-okf` skill content
- [x] 3.4 Run `openspec validate add-skill-alias` — delta specs parse cleanly
