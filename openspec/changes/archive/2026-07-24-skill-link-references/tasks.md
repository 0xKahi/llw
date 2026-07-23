## 1. Registry Module Refactor

- [x] 1.1 In `src/utils/skill-registry/registry.ts`, make the skill entry data module-private (`{ description, testOnly? }` per skill), removing the `SKILLS`, `SKILL_REGISTRY`, `REFERENCE_PLACEHOLDER_*`, and `ReferencePlaceholder` exports
- [x] 1.2 Add `getSkillEntries({ testSkills: boolean })` to `registry.ts`, returning `{ skillName, entry }[]` with `testOnly` entries filtered out unless requested

## 2. SkillRegistry Class

- [x] 2.1 Rewrite `src/utils/skill-registry/skill.util.ts` as a `SkillRegistry` class whose constructor takes `{ skillName, entry }[]`, builds a private readonly map, and throws on duplicate skill names
- [x] 2.2 Port lookup and path methods (`has`, `getSkillPath`, `getSkillFilePath`, `getSkillsDataPath`, package-root discovery) to instance/module level with string-typed skill names
- [x] 2.3 Implement link rewriting in `getSkill`: replace the destination of every markdown link whose target starts exactly with `sk-references/` with the raw absolute path (no angle brackets), leaving all other content unchanged
- [x] 2.4 Enforce safety on each matched link: resolve against the skill folder, reject resolution outside the skill folder (including via `realpathSync` symlink checks), and throw when the target file does not exist

## 3. CLI Wiring

- [x] 3.1 Add `export const skillRegistry = new SkillRegistry(getSkillEntries({ testSkills: true }))` to `src/constants.ts` (stays `true` until real skills ship)
- [x] 3.2 Update `src/commands/skills/get.ts` to consume the composed `skillRegistry` instance instead of the static `SkillUtil`

## 4. Skill Asset Migration

- [x] 4.1 Rename `skill-data/test-skill/references/` to `skill-data/test-skill/sk-references/`
- [x] 4.2 Update `skill-data/test-skill/SKILL.md` to replace `$REF_*` placeholders with `sk-references/` markdown links

## 5. Tests

- [x] 5.1 Rewrite `test/skill.util.test.ts` as `SkillRegistry` instance tests covering link rewriting (multiple, repeated), non-reference content preservation, broken-link failure, and traversal/symlink rejection
- [x] 5.2 Rewrite `test/skill-registry.integrity.test.ts` to iterate `getSkillEntries({ testSkills: true })`, validating identity, assets, and that every `sk-references/` link resolves to an existing file within the skill folder (orphan files allowed)
- [x] 5.3 Update `test/skills-command.test.ts` for instance-based retrieval
- [x] 5.4 Update `test/package-content.test.ts` to derive expected skill assets (SKILL.md plus linked `sk-references/` files) from `getSkillEntries`

## 6. Verification

- [x] 6.1 Run `bun run lint`, `bun run type-check`, and the full test suite; all pass
- [x] 6.2 Manually verify `llw skills get test-skill` prints rewritten absolute `sk-references/` paths and `llw skills get test-skill --path` still works
