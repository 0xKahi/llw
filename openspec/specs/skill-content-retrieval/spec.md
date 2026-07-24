# skill-content-retrieval Specification

## Purpose

Define how the CLI retrieves bundled skill content and installed skill paths with portable absolute reference resolution.

## Requirements

### Requirement: Retrieve registered skill content
The CLI SHALL provide `llw skills view <name>` for registered skills and SHALL print the complete contents of that skill's `SKILL.md` to standard output after reference transformation. `<name>` MAY be either the registered skill name or a registered alias; an alias SHALL resolve to the same skill content as its skill name. The CLI MUST NOT accept `llw skills get` as a command name.

#### Scenario: Retrieve a known skill
- **WHEN** a user runs `llw skills view test-skill`
- **THEN** the CLI prints the transformed contents of `skills-data/test-skill/SKILL.md`

#### Scenario: Retrieve a skill by alias
- **WHEN** a user runs `llw skills view <alias>` where `<alias>` is registered for a skill
- **THEN** the CLI prints the same transformed `SKILL.md` content as viewing that skill by its name

#### Scenario: Reject an unknown skill
- **WHEN** a user runs `llw skills view <name>` with a name that is neither a registered skill name nor a registered alias
- **THEN** the CLI reports that the skill is unknown and exits unsuccessfully

#### Scenario: Former get command name is unavailable
- **WHEN** a user runs `llw skills get <name>`
- **THEN** the CLI rejects the invocation as an unknown command and exits unsuccessfully

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

### Requirement: Return the installed skill folder path
The CLI SHALL support `llw skills view <name> --path` as an exclusive output mode that prints the raw absolute path to the registered skill's folder. `<name>` MAY be either the registered skill name or a registered alias; an alias SHALL resolve to the canonical skill's folder.

#### Scenario: Request a known skill path
- **WHEN** a user runs `llw skills view test-skill --path`
- **THEN** the CLI prints only the absolute path ending in `skills-data/test-skill`

#### Scenario: Request a skill path by alias
- **WHEN** a user runs `llw skills view <alias> --path` where `<alias>` is registered for a skill
- **THEN** the CLI prints the absolute path ending in the canonical `skills-data/<skillName>` folder

#### Scenario: Path output is a folder
- **WHEN** the CLI returns a registered skill path
- **THEN** that path identifies the skill directory rather than its `SKILL.md` file

### Requirement: Resolve paths independently of the working directory
The system MUST derive installed skill and reference paths from the CLI package location and MUST NOT depend on the caller's current working directory.

#### Scenario: Retrieve a skill from another directory
- **WHEN** a user invokes the installed CLI while their current working directory is outside the package
- **THEN** content and path modes resolve the same installed skill assets successfully

### Requirement: Ship retrievable skill assets
The published package SHALL include both the executable bundle under `dist` and the authored `skills-data` tree.

#### Scenario: Inspect the packed package
- **WHEN** a package artifact is produced for publication
- **THEN** it contains `dist/index.js`, each registered skill's `SKILL.md`, and every file linked via `sk-references/` under `skills-data`
