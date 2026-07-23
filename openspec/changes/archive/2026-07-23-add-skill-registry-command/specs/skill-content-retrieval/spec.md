## ADDED Requirements

### Requirement: Retrieve registered skill content
The CLI SHALL provide `llw skills get <name>` for registered skills and SHALL print the complete contents of that skill's `SKILL.md` to standard output after reference transformation.

#### Scenario: Retrieve a known skill
- **WHEN** a user runs `llw skills get test-skill`
- **THEN** the CLI prints the transformed contents of `skills-data/test-skill/SKILL.md`

#### Scenario: Reject an unknown skill
- **WHEN** a user runs `llw skills get <name>` with a name absent from the skill registry
- **THEN** the CLI reports that the skill is unknown and exits unsuccessfully

### Requirement: Transform declared reference placeholders
When retrieving content, the system SHALL replace every occurrence of each declared `$REF_*` placeholder with the raw absolute filesystem path of its target file in the installed `skills-data` tree. The system MUST leave dollar expressions outside the `$REF_*` namespace unchanged.

#### Scenario: Transform multiple references
- **WHEN** a registered `SKILL.md` uses multiple declared `$REF_*` placeholders
- **THEN** every occurrence is replaced with the corresponding raw absolute reference-file path

#### Scenario: Preserve ordinary shell variables
- **WHEN** skill content contains a token such as `$HOME` that does not match the `$REF_*` namespace
- **THEN** the token remains unchanged in the returned Markdown

#### Scenario: Reject an undeclared reference placeholder
- **WHEN** a registered skill contains a `$REF_*` placeholder not declared by its registry entry
- **THEN** skill retrieval fails rather than returning unresolved reference content

### Requirement: Return the installed skill folder path
The CLI SHALL support `llw skills get <name> --path` as an exclusive output mode that prints the raw absolute path to the registered skill's folder.

#### Scenario: Request a known skill path
- **WHEN** a user runs `llw skills get test-skill --path`
- **THEN** the CLI prints only the absolute path ending in `skills-data/test-skill`

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
- **THEN** it contains `dist/index.js`, each registered `SKILL.md`, and each registered reference file under `skills-data`
