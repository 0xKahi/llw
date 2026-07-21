# command-module-integration Specification

## Purpose

Define how CLI command modules integrate with the canonical local command infrastructure, formatting utilities, and OKF validation guards.

## Requirements

### Requirement: Commands use canonical local modules
All command modules SHALL import command infrastructure, output-format declarations, output formatting, and validation guards from their current canonical modules within `src/` rather than removed shared or legacy utility locations.

#### Scenario: Project resolves command dependencies
- **WHEN** the TypeScript compiler resolves the modules reachable from `src/commands/`
- **THEN** every command dependency resolves to an existing local module with an exported compatible API

### Requirement: Commands use the renamed OKF bundle guard
Bundle and concept commands SHALL use `OkfBundleGuard` for bundle and concept validation, including inherited shared output-format validation, without retaining references to `LlmWikiGuards`.

#### Scenario: A command validates an argument
- **WHEN** a bundle or concept command invokes its existing validation flow
- **THEN** it calls the corresponding static API on `OkfBundleGuard` and preserves the existing validation result and error behavior

### Requirement: Commands format structured output through the tokenizer utility
Commands that support structured output SHALL use `formatOutput` exported by `src/utils/tokenizer.util.ts` while preserving their existing JSON and TOON output behavior.

#### Scenario: A structured-output command renders data
- **WHEN** a list or view command formats its result using a supported output format
- **THEN** it obtains the rendered string from the tokenizer utility's `formatOutput` function

### Requirement: Reorganized command graph passes type verification
The command source graph SHALL pass the repository's TypeScript type-check after import migration.

#### Scenario: Maintainer verifies the migration
- **WHEN** the maintainer runs the configured type-check command
- **THEN** it completes without unresolved command imports, incompatible APIs, or stale guard symbol errors
