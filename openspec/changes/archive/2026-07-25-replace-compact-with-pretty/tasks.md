## 1. Shared CLI Option Contract

- [x] 1.1 Replace `compact?: boolean` with `pretty?: boolean` in `FormatOpt`.
- [x] 1.2 Remove the `--compact`/`-c` and `--no-compact` option definitions and register the optional `--pretty` flag in the shared output-format options.

## 2. Command Formatting Integration

- [x] 2.1 Update bundle list and bundle view to pass `compact: !opts.pretty` to `formatOutput`.
- [x] 2.2 Update concept view to pass `compact: !options.pretty` to `formatOutput`.
- [x] 2.3 Search all formatted-output command call sites and confirm none still depend on the removed CLI `compact` property.

## 3. Verification

- [x] 3.1 Add or update tests proving JSON and TOON output remain compact when `--pretty` is omitted and become non-compact when it is supplied.
- [x] 3.2 Add or update CLI option tests proving `--pretty` is advertised while `--compact`, `-c`, and `--no-compact` are unsupported.
- [x] 3.3 Run the project test suite, type check, and lint checks; resolve any regressions caused by the option rename.
