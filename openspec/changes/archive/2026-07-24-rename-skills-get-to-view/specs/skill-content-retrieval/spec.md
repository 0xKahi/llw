# skill-content-retrieval Delta

## MODIFIED Requirements

### Requirement: Retrieve registered skill content
The CLI SHALL provide `llw skills view <name>` for registered skills and SHALL print the complete contents of that skill's `SKILL.md` to standard output after reference transformation. The CLI MUST NOT accept `llw skills get` as a command name.

#### Scenario: Retrieve a known skill
- **WHEN** a user runs `llw skills view test-skill`
- **THEN** the CLI prints the transformed contents of `skills-data/test-skill/SKILL.md`

#### Scenario: Reject an unknown skill
- **WHEN** a user runs `llw skills view <name>` with a name absent from the skill registry
- **THEN** the CLI reports that the skill is unknown and exits unsuccessfully

#### Scenario: Former get command name is unavailable
- **WHEN** a user runs `llw skills get <name>`
- **THEN** the CLI rejects the invocation as an unknown command and exits unsuccessfully

### Requirement: Return the installed skill folder path
The CLI SHALL support `llw skills view <name> --path` as an exclusive output mode that prints the raw absolute path to the registered skill's folder.

#### Scenario: Request a known skill path
- **WHEN** a user runs `llw skills view test-skill --path`
- **THEN** the CLI prints only the absolute path ending in `skills-data/test-skill`

#### Scenario: Path output is a folder
- **WHEN** the CLI returns a registered skill path
- **THEN** that path identifies the skill directory rather than its `SKILL.md` file
