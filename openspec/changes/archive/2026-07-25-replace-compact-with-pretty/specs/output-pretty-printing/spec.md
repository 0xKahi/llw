## ADDED Requirements

### Requirement: Compact output is the default
Commands that support formatted output SHALL emit compact output when the user does not provide a presentation-style option.

#### Scenario: Default JSON output
- **WHEN** a user runs a formatted-output command with JSON format and without `--pretty`
- **THEN** the command emits compact JSON without pretty-print indentation

#### Scenario: Default TOON output
- **WHEN** a user runs a formatted-output command with TOON format and without `--pretty`
- **THEN** the command uses the existing compact TOON encoding behavior

### Requirement: Pretty output is opt-in
Commands that support formatted output SHALL provide an optional `--pretty` flag that disables compact formatting for the selected output format.

#### Scenario: Pretty JSON output
- **WHEN** a user runs a formatted-output command with JSON format and `--pretty`
- **THEN** the command emits human-readable JSON with indentation

#### Scenario: Pretty TOON output
- **WHEN** a user runs a formatted-output command with TOON format and `--pretty`
- **THEN** the command emits the existing non-compact TOON representation

### Requirement: Compact CLI flags are removed
Commands that support formatted output SHALL NOT register `--compact`, `-c`, or `--no-compact` as output-format options.

#### Scenario: User requests default compact behavior
- **WHEN** a user wants compact output
- **THEN** the user can omit `--pretty` without supplying a compact-specific flag

#### Scenario: User supplies a removed flag
- **WHEN** a user invokes a formatted-output command with `--compact`, `-c`, or `--no-compact`
- **THEN** the CLI treats the argument as an unsupported option
