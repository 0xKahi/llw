## Context

Skills ship in `skill-data/<name>/SKILL.md` and are retrieved via `llw skills get <name>`. Today, references use a two-sided declaration: `$REF_*` placeholders in the authored file, plus a placeholder→path mapping in `SKILL_REGISTRY`. Runtime code (`SkillUtil.getSkill`) validates that the two sides are perfectly synchronized and string-replaces placeholders with absolute paths.

Notably, placeholders already live *inside* markdown link syntax (`[Text]($REF_EXAMPLE)`), so the registry mapping is pure path indirection — markdown's link destination already carries the same information. The indirection buys nothing and costs readability (the on-disk file is not valid, browsable markdown) and maintenance (double declaration).

## Goals / Non-Goals

**Goals:**
- `SKILL.md` is the single source of truth for references; authored files are valid, browsable markdown
- Registry entries contain no reference knowledge
- Preserve existing safety invariants: containment within bundled assets, symlink-escape rejection, fail-on-broken-reference at retrieval time
- Make the registry instantiable so tests and CLI compose their own views (test skills included or excluded)

**Non-Goals:**
- No markdown parsing (no remark/AST dependency) — rewriting is pattern-based
- No orphan-file detection (unlinked files in `sk-references/` are allowed)
- No CommonMark-guaranteed output (no angle-bracket wrapping; output is agent-facing raw text)
- No support for shared cross-skill references
- No generalization to arbitrary relative links (`scripts/`, `assets/`, etc.) — only `sk-references/`

## Decisions

### 1. References are markdown links into `sk-references/`

Authored form: `[Some Text](sk-references/example.md)`. At retrieval, the destination of every link whose target starts exactly with `sk-references/` is rewritten to the raw absolute path of the resolved file.

- **Why `sk-references/` and not `references/`**: the uncommon name makes accidental pattern matches in ordinary prose effectively impossible. (A link to `sk-references/...` inside a fenced code block would still be rewritten — accepted; only a skill documenting its own convention hits this.)
- **Why not `./sk-references/`**: the convention requires the bare prefix so the match is unambiguous. Links not starting exactly with `sk-references/` (external URLs, anchors, `./`-prefixed, other relative paths) are left untouched.
- **Alternative considered**: generalized relative-link resolution (any relative link resolving inside the skill folder). Rejected for now — strict prefix is simpler to validate and reason about; can be generalized later if real skills need it.

### 2. Strict containment, rooted at the skill folder

Each matched link is resolved against the skill folder and MUST stay inside it — both logically (`resolve` + relative check) and physically (`realpathSync`, rejecting symlink escapes). This kills the previously-spec'd shared cross-skill reference capability; nothing uses it today.

### 3. Broken links throw at retrieval time

If a matched link's target does not exist, `getSkill` throws rather than returning content with unresolved references. Tests also assert link integrity, but runtime validation defends against stale or corrupt installs. Existence is checked in the link→file direction only; orphan files are not checked.

### 4. Raw path output, no angle brackets

Rewritten destinations are emitted as bare absolute paths. Output is consumed by agents reading raw text, not by CommonMark-strict renderers. (Trade-off: an install path containing spaces would break a strict markdown parse of the output — accepted.)

### 5. Registry data becomes private; `getSkillEntries({ testSkills })` is the only export

The entry data moves behind a module-private constant. `getSkillEntries({ testSkills: boolean })` returns `{ skillName, entry }[]`, filtering out `testOnly` entries unless requested. This gives the previously-declared-but-never-enforced `testOnly` flag teeth for the first time. Entries are `{ description, testOnly? }` — all reference knowledge, the `SKILLS`/`SKILL_REGISTRY` exports, and the `$REF_*` patterns are removed.

### 6. `SkillUtil` (static) → `SkillRegistry` (instance), string-typed

The class takes entries in its constructor, builds a private readonly map (throwing on duplicate names), and owns lookup, path resolution, link rewriting, and validation. `getPackageRoot` stays module-level — it is package discovery, not registry state.

- **Why string-typed (option B) over a generic `SkillRegistry<T>` (option A)**: the only production call site is the CLI, where the name arrives from `argv` as a runtime string — compile-time literal types never protected that path. Preserving literals would require fighting `Object.entries` key-widening with assertions or `as const` arrays, a permanent generics tax for call sites that don't exist. Runtime `has()`/throw is honest and sufficient. Reversible if programmatic consumers ever appear.

### 7. Composition in `src/constants.ts`

```ts
export const skillRegistry = new SkillRegistry(getSkillEntries({ testSkills: true }));
```

Tests construct their own instances with `testSkills: true`. **Both are `true` for now** so the test skill remains visible while real skills are authored; the CLI constant flips to `false` once non-test skills exist (follow-up, outside this change).

## Risks / Trade-offs

- [Regex rewriting also matches links inside code blocks] → Accepted; `sk-references/` naming makes real collisions practically impossible, and only convention-documentation content would ever hit it
- [Install path with spaces breaks strict markdown parsing of output] → Accepted; consumers are agents reading raw text, not CommonMark renderers
- [Authors writing `./sk-references/...` get silently unrewritten links] → Documented convention; the bare-prefix form is the only recognized one, and broken relative output is visible on first retrieval
- [Removing shared cross-skill references reduces capability] → Nothing uses it; the strict model can be relaxed later without breaking existing skills
- [Losing compile-time `SkillName` literals lets typos compile] → Runtime throw covers it; the CLI path was always runtime-checked anyway

## Migration Plan

Single atomic change — no staged rollout:

1. Refactor registry module and `SkillUtil` → `SkillRegistry` with link rewriting
2. Migrate `skill-data/test-skill/` (`references/` → `sk-references/`, `$REF_*` → links in `SKILL.md`)
3. Compose the CLI instance in `constants.ts`; rewire `skills get`
4. Rewrite the four test files around instances and link integrity
5. Rollback: revert the change; no external consumers or persisted state exist
