## ADDED Requirements

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

### Requirement: Use standardized reference declarations
Reference declaration keys MUST match `$REF_[A-Z][A-Z0-9_]*`, and their target values SHALL be paths relative to the shared `skills-data` root.

#### Scenario: Validate a reference key
- **WHEN** a registry entry declares `$REF_SHARED_GUIDE`
- **THEN** the declaration satisfies the reference-key convention

#### Scenario: Reject a nonstandard reference key
- **WHEN** a registry entry declares a key such as `$EXAMPLE_REF`, `$REF_`, or `$REF_example`
- **THEN** registry integrity validation fails

### Requirement: Constrain reference targets to bundled assets
Every declared reference target MUST resolve to an existing file within `skills-data`, including references shared between different skills, and MUST NOT escape the `skills-data` root.

#### Scenario: Resolve a skill-local reference
- **WHEN** a declaration targets `test-skill/references/example-reference.md`
- **THEN** it resolves to that existing file under the absolute `skills-data` root

#### Scenario: Resolve a shared reference
- **WHEN** multiple skills declare paths to the same file elsewhere within `skills-data`
- **THEN** each declaration resolves to the same existing bundled file

#### Scenario: Reject a missing reference
- **WHEN** a registry declaration targets a file that does not exist
- **THEN** registry integrity validation fails

#### Scenario: Reject path traversal
- **WHEN** a registry declaration resolves outside the `skills-data` root
- **THEN** registry integrity validation fails

### Requirement: Keep placeholders and declarations synchronized
For each registered skill, the set of `$REF_*` placeholders present in `SKILL.md` MUST equal the set of reference keys declared by its registry entry.

#### Scenario: Validate synchronized references
- **WHEN** every placeholder in `SKILL.md` is declared and every declaration is used
- **THEN** registry integrity validation succeeds for reference synchronization

#### Scenario: Reject an undeclared placeholder
- **WHEN** `SKILL.md` contains a `$REF_*` placeholder absent from its registry entry
- **THEN** registry integrity validation fails

#### Scenario: Reject an unused declaration
- **WHEN** a registry entry declares a `$REF_*` key absent from `SKILL.md`
- **THEN** registry integrity validation fails

### Requirement: Test all current and future registry entries
The automated test suite SHALL derive its integrity cases from the skill registry rather than maintaining a separate hard-coded list of skill names.

#### Scenario: Add a registry entry
- **WHEN** a new skill is added to the registry
- **THEN** the existing parameterized integrity suite automatically validates its identity, assets, placeholders, and reference targets
