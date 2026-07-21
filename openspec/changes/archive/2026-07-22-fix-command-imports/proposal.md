## Why

The command modules still import utilities and types from their former shared-package locations and reference the removed `LlmWikiGuards` symbol. These stale imports prevent the CLI from type-checking after the source reorganization.

## What Changes

- Update command modules to import command strategy and output-format types from their current locations under `src/`.
- Import `formatOutput` from `src/utils/tokenizer.util.ts` instead of the removed shared output formatter.
- Replace command references to `LlmWikiGuards` with `OkfBundleGuard` from `src/utils/guards/okf-bundle.guard.ts`.
- Verify all command modules type-check against the reorganized source tree without changing command behavior.

## Capabilities

### New Capabilities
- `command-module-integration`: Command modules resolve and use the current local command, formatting, and guard APIs.

### Modified Capabilities

None.

## Impact

Affected code is limited primarily to imports and renamed guard references in `src/commands/`. The change relies on the existing APIs in `src/utils/commander/`, `src/types/output-format-options.type.ts`, `src/utils/tokenizer.util.ts`, and `src/utils/guards/okf-bundle.guard.ts`; no CLI flags or user-facing output contracts are intentionally changed.
