## 1. Migrate Command Infrastructure Imports

- [x] 1.1 Update every command module to import `CommandStrategy` from `src/utils/commander/command-strategy.ts` using the correct relative path.
- [x] 1.2 Update bundle and concept list/view commands to import output-format declarations from `src/types/output-format-options.type.ts`.

## 2. Migrate Formatting and Guard APIs

- [x] 2.1 Update bundle and concept list/view commands to import `formatOutput` from `src/utils/tokenizer.util.ts`.
- [x] 2.2 Replace legacy guard imports with `OkfBundleGuard` imports from `src/utils/guards/okf-bundle.guard.ts` in all affected bundle and concept commands.
- [x] 2.3 Rename all `LlmWikiGuards` call sites to `OkfBundleGuard`, including bundle, concept, and inherited output-format validation calls.

## 3. Verify the Command Graph

- [x] 3.1 Search `src/commands/` and confirm no former shared import paths, removed output formatter paths, or `LlmWikiGuards` references remain.
- [x] 3.2 Run the configured TypeScript type-check and resolve any command migration errors.
