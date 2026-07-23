## REMOVED Requirements

### Requirement: Use standardized reference declarations
**Reason**: The registry no longer declares references; `SKILL.md` markdown links into `sk-references/` are the single source of truth, so there are no declaration keys to standardize.
**Migration**: Remove each entry's `references` mapping from the registry and express the same references as `sk-references/` markdown links in the skill's `SKILL.md`.

### Requirement: Constrain reference targets to bundled assets
**Reason**: Reference targets are no longer declared in the registry; target safety is now defined over markdown links in `SKILL.md` (see the added link-integrity requirement), and shared cross-skill references are no longer supported.
**Migration**: Move any file previously shared between skills into each consuming skill's own `sk-references/` folder and link to it from that skill's `SKILL.md`.

### Requirement: Keep placeholders and declarations synchronized
**Reason**: `$REF_*` placeholders and registry declarations are both removed; synchronization between two declaration sites is no longer a concept.
**Migration**: Replace `$REF_*` placeholders in `SKILL.md` with `sk-references/` markdown links and delete registry `references` declarations.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Test all current and future registry entries
The automated test suite SHALL derive its integrity cases from the skill registry entries (obtained via `getSkillEntries`) rather than maintaining a separate hard-coded list of skill names.

#### Scenario: Add a registry entry
- **WHEN** a new skill is added to the registry
- **THEN** the existing parameterized integrity suite automatically validates its identity, assets, and reference links
