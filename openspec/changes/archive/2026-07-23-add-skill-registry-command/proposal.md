## Why

Agents need a reliable way to retrieve the skill instructions bundled with the installed `llw` CLI. Relative links in `SKILL.md` become ambiguous when Markdown is printed outside its source directory, and the current package does not publish the skill assets needed to resolve those links after a global Bun or npm installation.

## What Changes

- Add `llw skills get <name>` to print a registered skill's `SKILL.md` with declared `$REF_*` placeholders replaced by raw absolute paths to the installed reference files.
- Add `llw skills get <name> --path` to print only the absolute path to the registered skill's folder.
- Establish registry and formatting conventions for skill names, folders, frontmatter names, `$REF_*` declarations, and paths relative to the shared `skills-data` root.
- Publish `skills-data` alongside `dist` so skills and shared references remain available in installed packages.
- Add behavior and registry-integrity tests covering transformed output, skill existence, reference existence, placeholder/declaration consistency, and name consistency.

## Capabilities

### New Capabilities
- `skill-content-retrieval`: Retrieve installed skill content or its folder path through the CLI, with portable absolute reference resolution.
- `skill-registry-integrity`: Define and verify the conventions that keep registered skills, frontmatter, placeholders, and reference files consistent.

### Modified Capabilities

None.

## Impact

- Adds a top-level `skills` command module and `get` subcommand.
- Completes `src/utils/skill-registry/skill.util.ts` and updates the registry format and test skill fixture.
- Changes package publication configuration to include `skills-data` and ensure build output exists before packing.
- Adds Bun tests for utility behavior, command behavior where appropriate, registry integrity, and package asset inclusion.
- Does not add a third-party runtime dependency.
