## Why

Compact output is the normal CLI behavior, but expressing that default through `--compact` plus a negated `--no-compact` flag makes the user-facing interface unnecessarily confusing. A positive, optional `--pretty` flag makes the exceptional behavior explicit and easier to discover.

## What Changes

- **BREAKING** Remove the `--compact`/`-c` and `--no-compact` output-format flags.
- Add an optional `--pretty` flag to commands that support formatted output.
- Keep compact output as the default when `--pretty` is absent.
- Produce non-compact, human-readable output when `--pretty` is present.
- Update command option types, output-format call sites, and tests to use the new positive flag semantics.

## Capabilities

### New Capabilities
- `output-pretty-printing`: Defines the CLI contract for default compact output and opt-in pretty output across supported formats.

### Modified Capabilities

None.

## Impact

This changes the public CLI options for bundle and concept output commands and is therefore breaking for callers using `--compact`, `-c`, or `--no-compact`. The primary affected areas are `src/types/output-format-options.type.ts`, the bundle/concept command handlers that pass formatting options, and their related tests or documentation. No new runtime dependencies are expected.
