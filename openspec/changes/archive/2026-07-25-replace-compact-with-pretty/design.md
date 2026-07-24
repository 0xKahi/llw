## Context

Formatted-output commands currently expose `--compact`/`-c` with a `true` default and `--no-compact` as the way to request readable output. Commander therefore presents an implementation-oriented positive/negative option pair even though users only need to choose whether to opt into pretty output. The command handlers forward `opts.compact` to the existing formatter, whose internal `compact` option already controls JSON indentation and compact TOON encoding.

## Goals / Non-Goals

**Goals:**
- Expose one optional `--pretty` CLI flag instead of the compact option pair.
- Preserve compact output when no formatting-style flag is supplied.
- Translate `--pretty` consistently for every command using the shared output-format options.
- Cover default, pretty, and removed-flag behavior with tests.

**Non-Goals:**
- Change the available `json` or `toon` formats or their default selection.
- Redesign the formatter's internal compact encoding behavior.
- Preserve aliases or compatibility for the removed flags.

## Decisions

1. **Represent the CLI option as `pretty?: boolean`.** The shared `FormatOpt` type and option metadata will expose only `--pretty`, with no explicit default required because Commander yields a falsey value when the flag is absent. This keeps the public option aligned with user intent. Retaining `compact` and merely adding a pretty alias was rejected because it leaves conflicting options and ambiguous precedence.

2. **Translate at command-to-formatter boundaries using `compact: !opts.pretty`.** The formatter's `compact` setting remains an internal mechanism, while each bundle and concept command maps the new positive CLI intent to it. Changing the formatter API to `pretty` was rejected as unnecessary scope: compact TOON behavior is an implementation concept used by formatter-specific logic and can remain stable.

3. **Remove both legacy flags without compatibility handling.** `--compact`, `-c`, and `--no-compact` will no longer be registered, so Commander handles them as unknown options. This makes the breaking change explicit and avoids silently accepting obsolete syntax.

4. **Test the shared contract and affected command paths.** Tests will assert compact output by default and readable output with `--pretty` for supported formats, plus confirm removed flags are not advertised or accepted where command integration tests make that practical.

## Risks / Trade-offs

- **[Breaking scripts that pass legacy flags]** → Document the migration: omit compact flags for default behavior or replace `--no-compact` with `--pretty`.
- **[Inversion errors at one of several command call sites]** → Update all `formatOutput` usages sourced from `FormatOpt` and add command-level coverage for both flag states.
- **[Terminology split between CLI `pretty` and formatter `compact`]** → Keep the inversion localized and explicit at the command boundary rather than mixing both concepts in option metadata.
