## Context

The command modules predate a source-tree reorganization. They still resolve `CommandStrategy`, output-format types, and `formatOutput` through paths under a former `shared` area, while those APIs now live under `src/utils` and `src/types`. They also import the removed `LlmWikiGuards` class even though its bundle and concept validation behavior now belongs to `OkfBundleGuard` (with output-format validation inherited from `SharedGuard`). The public APIs needed by the commands already exist; consumers have not yet been migrated.

## Goals / Non-Goals

**Goals:**
- Make every module under `src/commands/` resolve the current local command strategy, output-format, tokenizer, and guard APIs.
- Replace both imports and static call sites for the renamed guard class.
- Preserve existing command registration, validation, formatting, exit behavior, and output.
- Restore successful project type-checking.

**Non-Goals:**
- Redesigning command behavior or utility APIs.
- Moving source files again or introducing compatibility re-export modules.
- Changing CLI flags, output formats, bundle validation rules, or concept validation rules.
- Refactoring unrelated imports or utilities.

## Decisions

1. **Update command consumers directly to canonical local modules.** `CommandStrategy` will come from `src/utils/commander/command-strategy.ts`, output-format declarations from `src/types/output-format-options.type.ts`, and `formatOutput` from `src/utils/tokenizer.util.ts`. Relative paths from each command subdirectory remain consistent with the project's current import style. Compatibility shims at old paths were considered, but rejected because the old shared area no longer belongs to this package and shims would preserve obsolete coupling.

2. **Rename guard usage to `OkfBundleGuard` at imports and call sites.** Commands will import the class from `src/utils/guards/okf-bundle.guard.ts`. Calls to bundle and concept methods continue to target the same static APIs, while `validateOutputFormat` remains available through static inheritance from `SharedGuard`. Aliasing `OkfBundleGuard as LlmWikiGuards` was considered, but rejected because it would retain stale domain terminology and obscure the completed rename.

3. **Use TypeScript as migration verification.** Type-checking detects unresolved paths, missing exports, incompatible APIs, and stale identifiers. The production build is not yet set up for verification and is explicitly outside this change; no new runtime abstraction is required for an import-only migration.

## Risks / Trade-offs

- **[Risk] A stale import may remain in a less obvious command module** → Search all files under `src/commands/` for former `shared` paths, `output-formatter`, and `LlmWikiGuards`, then run the full type-check.
- **[Risk] Static inherited format validation could be mistaken for a missing API on `OkfBundleGuard`** → Preserve `OkfBundleGuard extends SharedGuard` and verify list/view command call sites through TypeScript.
- **[Trade-off] Relative imports remain sensitive to future source moves** → Prefer the repository's existing relative-import convention in this focused fix rather than introducing path aliases outside scope.
