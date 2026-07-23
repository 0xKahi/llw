## REMOVED Requirements

### Requirement: Transform declared reference placeholders
**Reason**: Reference declarations are removed from the registry; `SKILL.md` is now the single source of truth and references are expressed as ordinary markdown links into the skill's `sk-references/` folder, making placeholder indirection obsolete.
**Migration**: Replace each `$REF_*` placeholder used inside a markdown link with the link's relative destination `sk-references/<file>` (for example `[Guide]($REF_GUIDE)` becomes `[Guide](sk-references/guide.md)`), move reference files into the skill's `sk-references/` folder, and delete the entry's `references` declarations from the registry.

## ADDED Requirements

### Requirement: Rewrite skill reference links
When retrieving content, the system SHALL replace the destination of every markdown link whose target starts exactly with `sk-references/` with the raw absolute filesystem path of the resolved target file in the installed `skills-data` tree. The system MUST leave all other content unchanged, including external URLs, anchor links, relative links with other prefixes (such as `./`), shell variables, and plain text. The rewritten destination MUST be emitted as the raw absolute path without angle-bracket wrapping.

#### Scenario: Rewrite multiple reference links
- **WHEN** a registered `SKILL.md` contains multiple markdown links targeting `sk-references/` files
- **THEN** every such link destination is replaced with the corresponding raw absolute reference-file path

#### Scenario: Rewrite repeated links to the same file
- **WHEN** a registered `SKILL.md` links to the same `sk-references/` file more than once
- **THEN** every occurrence is rewritten to the same absolute path

#### Scenario: Preserve non-reference content
- **WHEN** skill content contains external URLs, anchor links, relative links not starting with `sk-references/`, or tokens such as `$HOME`
- **THEN** that content remains unchanged in the returned Markdown

#### Scenario: Reject a broken reference link
- **WHEN** a registered skill contains an `sk-references/` link whose target file does not exist
- **THEN** skill retrieval fails rather than returning content with an unresolved reference

#### Scenario: Reject a reference link escaping the skill folder
- **WHEN** a registered skill contains an `sk-references/` link that resolves outside its own skill folder, including via symlinks
- **THEN** skill retrieval fails

## MODIFIED Requirements

### Requirement: Ship retrievable skill assets
The published package SHALL include both the executable bundle under `dist` and the authored `skills-data` tree.

#### Scenario: Inspect the packed package
- **WHEN** a package artifact is produced for publication
- **THEN** it contains `dist/index.js`, each registered skill's `SKILL.md`, and every file linked via `sk-references/` under `skills-data`
