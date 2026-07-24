# Design: add-skill-alias

## Context

`SkillRegistryEntry` in `src/utils/skill-registry/registry.ts` already declares an optional `alias?: string` field, and `llw-okf` ships with `alias: 'core'`. However, `SkillRegistry` (`src/utils/skill-registry/skill-registry.ts`) keys everything off `skillName` only — `has`, `getSkill`, `getSkillPath`, and `getSkillFilePath` all consult a single `Map<skillName, entry>`. Passing an alias today throws `Unknown skill: core`. The CLI (`SkillsViewCommand`) passes user input straight to the registry, so alias support belongs entirely inside the registry.

## Goals / Non-Goals

**Goals:**
- Any registry lookup accepts a registered alias exactly as if it were the skill name.
- Alias collisions (with skill names or other aliases) are impossible by construction — validated eagerly when the `SkillRegistry` is constructed.
- Resolution is a pure input normalization step: `const skillName = aliases.get(input) ?? input`.

**Non-Goals:**
- Multiple aliases per skill (the data model supports one; can be revisited later).
- Listing/searching aliases in CLI output (no `skills list` command exists yet).
- Case-insensitive or fuzzy matching.
- Changing the `alias` field on `SkillRegistryEntry` (already exists).

## Decisions

### Decision: Separate alias → skillName map, normalized at lookup time
Maintain a second `ReadonlyMap<string, string>` (`alias` → `skillName`) built in the constructor alongside the existing entries map. Every public method resolves its argument through a single private `resolveSkillName(input)` helper (`aliases.get(input) ?? input`) before touching the entries map.

*Alternatives considered:*
- *Store alias keys in the same entries map pointing at the same entry* — rejected: pollutes iteration semantics (`entries` is used to enumerate skills; aliases are not skills) and makes "unknown skill" errors ambiguous.
- *Resolve aliases in the CLI layer* — rejected: aliases are a registry concern; resolving in the registry makes them work for every current and future consumer (tests, path helpers, future commands) with zero duplication.

### Decision: Eager collision validation at construction
In the constructor, after building the entries map, validate each alias:
1. Alias MUST NOT equal its own skill's name (redundant, likely a mistake).
2. Alias MUST NOT equal any other registered skill name.
3. Alias MUST NOT be claimed by two different skills.

Throw a descriptive `Error` on violation, matching the existing `Duplicate skill entry` behavior. Failing fast at module load (the registry is a singleton in `src/constants.ts`) means a bad alias can never ship silently.

*Alternatives considered:*
- *Validate in the integrity test suite only* — rejected: tests catch it in CI but a constructed registry could still behave ambiguously at runtime; construction-time throws are strictly safer and keep the test simple (`expect(() => new SkillRegistry(...)).toThrow(...)`).

### Decision: Internal methods operate on canonical names only
`getSkillPath`, `getSkillFilePath`, `getEntry`, and reference resolution continue to receive canonical skill names. Public entry points normalize first, so folder paths, error messages (e.g. `Unknown skill: <input>`), and `skills-data/<skillName>` semantics are unchanged. `getSkillPath('core')` returns the `skills-data/llw-okf` folder — canonical on disk, alias only at the API surface.

## Risks / Trade-offs

- [Alias squatting on a future skill name] → An alias registered today could block a future skill from using that name; acceptable — the construction-time collision error surfaces the conflict immediately and forces an explicit rename decision.
- [Two maps to keep consistent] → Both maps are built once in the constructor from the same input array and frozen as `readonly`; no mutation paths exist.
- [Error messages may show the alias instead of canonical name] → Keep original user input in `Unknown skill` errors for clarity; canonical name is used for filesystem errors where the folder matters.
