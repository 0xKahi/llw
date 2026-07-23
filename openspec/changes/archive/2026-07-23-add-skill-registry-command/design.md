## Context

The CLI is bundled to `dist/index.js`, while skill instructions and reference Markdown live under the repository-level `skills-data` directory. The package currently publishes only `dist`, and `SkillUtil` has no implementation. Reading paths relative to the caller's working directory would fail when the globally installed CLI is invoked elsewhere, while embedding reference content would prevent agents from opening the actual shared files.

The command surface is intentionally narrow: `llw skills get <name>` returns skill content, and adding `--path` switches the output to the installed skill folder. Skill names are defined by the registry and match both their folder and `SKILL.md` frontmatter name.

## Goals / Non-Goals

**Goals:**
- Ship `skills-data` as package assets alongside the bundled CLI.
- Resolve skill and reference paths independently of `process.cwd()` in both source tests and installed bundles.
- Return skill Markdown whose reserved `$REF_*` placeholders are replaced globally with raw absolute filesystem paths.
- Provide deterministic folder-path output through `llw skills get <name> --path`.
- Detect registry drift through runtime checks where needed for safe retrieval and through parameterized tests covering every registry entry.

**Non-Goals:**
- Inline reference-file contents into `SKILL.md` output.
- Copy or materialize transformed skill files.
- Support arbitrary unregistered skill directories, environment overrides, remote references, or user-installed skills.
- Add `skills list`, JSON output, or an `agent-browser`-style separate `path` subcommand.
- Interpret ordinary shell variables such as `$HOME` as references.

## Decisions

### Publish assets at the package root

`package.json` will include both `dist` and `skills-data` in its publication allowlist. The installed shape remains easy to inspect and mirrors tools such as `agent-browser`:

```text
<package-root>/
├── dist/index.js
└── skills-data/<skill-name>/
    ├── SKILL.md
    └── ...references
```

A packaging lifecycle step will ensure the ignored `dist` output is built before packing. Keeping assets at package root is preferred over copying them into `dist`, because it avoids duplicate assets and preserves their authored structure.

### Discover the package root from the executing module

Path resolution will start from the module location rather than `process.cwd()` and walk upward to the package root containing the expected package metadata and `skills-data`. This accommodates direct source imports during tests and the bundled `dist/index.js` location after installation. All public paths will be normalized absolute filesystem paths.

A fixed cwd-relative path was rejected because CLI callers may execute from any directory. A fixed number of parent traversals was rejected because source and bundled modules have different depths.

### Keep registry reference paths relative to `skills-data`

A registry entry is keyed by the canonical folder/CLI name. Its reference targets are paths relative to the shared `skills-data` root, allowing references to be shared across skill folders without tying declarations to a development or installation location.

Resolved targets must remain within `skills-data` and exist as files. This prevents accidental traversal and catches stale declarations.

### Reserve strict `$REF_*` placeholders

Reference placeholders use uppercase identifiers matching `$REF_[A-Z][A-Z0-9_]*`, such as `$REF_EXAMPLE` and `$REF_SHARED_GUIDE`. Registry keys use the complete placeholder spelling, including `$`.

Every placeholder found in a skill must have exactly one registry declaration, and every declaration must be used. Ordinary dollar expressions outside the `$REF_*` namespace remain untouched. Replacement uses literal global substitution rather than constructing dynamic regular expressions.

### Treat folder name as canonical skill identity

For each registry entry, the registry key, immediate folder under `skills-data`, and frontmatter `name` must match. `SKILL.md` is always located directly within that folder. The existing test fixture will use `test-skill` consistently.

### Make `--path` an exclusive output mode

`llw skills get <name>` prints only transformed Markdown. `llw skills get <name> --path` prints only the absolute skill-folder path, not the `SKILL.md` path and not both values. Unknown names fail through normal CLI error handling with a non-zero exit.

## Risks / Trade-offs

- **Raw paths containing spaces may not be portable Markdown destinations in every renderer** → This is an explicit product choice optimized for agents and filesystem tools; paths will not be converted to `file://` URLs or URI-encoded.
- **Runtime package-root discovery could select the wrong ancestor in an unusual nested layout** → Require the expected package metadata together with `skills-data`, and test resolution independently of cwd.
- **A generated `dist` directory may be missing at publish time because it is Git-ignored** → Build during the package lifecycle and verify packed assets.
- **Strict placeholder equality makes temporarily unused registry entries invalid** → This is intentional to prevent stale mappings; update skill content and registry together.
- **Absolute paths expose installation locations in output** → This is required so agents can open bundled reference files directly.
