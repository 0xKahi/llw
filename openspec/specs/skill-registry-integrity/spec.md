# skill-registry-integrity Specification

## Purpose

Define the consistency and safety requirements for bundled skill registry entries, assets, identities, and reference links.

## Requirements

### Requirement: Use canonical skill identity
Each registry key SHALL identify an immediate folder of the same name under `skills-data`, and that folder's `SKILL.md` frontmatter `name` MUST equal the registry key.

#### Scenario: Validate a registered skill identity
- **WHEN** registry integrity is tested for a skill
- **THEN** its registry key, folder name, and frontmatter name are equal

### Requirement: Require complete skill assets
Every registered skill SHALL have an existing folder and a directly contained `SKILL.md` file within the published `skills-data` tree.

#### Scenario: Validate every registry entry
- **WHEN** the registry integrity suite iterates over all current and future entries
- **THEN** each entry resolves to an existing skill folder and `SKILL.md`

### Requirement: Resolve skill reference links within the skill folder
For each registered skill, every markdown link in `SKILL.md` whose target starts exactly with `sk-references/` MUST resolve to an existing file inside that skill's own folder and MUST NOT escape the skill folder, including via symlinks. Files present in `sk-references/` that are not linked from `SKILL.md` MUST NOT fail validation.

#### Scenario: Resolve skill-local reference links
- **WHEN** a skill's `SKILL.md` links to `sk-references/example-reference.md`
- **THEN** the link resolves to that existing file within the skill folder

#### Scenario: Reject a missing reference target
- **WHEN** a skill's `SKILL.md` contains an `sk-references/` link whose target file does not exist
- **THEN** registry integrity validation fails

#### Scenario: Reject a reference link escaping the skill folder
- **WHEN** a skill's `SKILL.md` contains an `sk-references/` link that resolves outside the skill folder, including via symlinks
- **THEN** registry integrity validation fails

#### Scenario: Allow unlinked reference files
- **WHEN** a file exists in a skill's `sk-references/` folder that is not linked from `SKILL.md`
- **THEN** registry integrity validation succeeds

### Requirement: Test all current and future registry entries
The automated test suite SHALL derive its integrity cases from the skill registry entries (obtained via `getSkillEntries`) rather than maintaining a separate hard-coded list of skill names.

#### Scenario: Add a registry entry
- **WHEN** a new skill is added to the registry
- **THEN** the existing parameterized integrity suite automatically validates its identity, assets, and reference links
