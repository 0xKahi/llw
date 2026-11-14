# Tasks

## 1. Version resolution and comparison (private methods on `UpgradeCommand`)

- [x] 1.1 Implement `resolveVersion(target)` in `src/commands/upgrade/index.ts`:
  - Fetch `{registry}/@0xkahi%2fllw/{target|latest}`, with a 10s timeout.
  - Use the `LLW_NPM_REGISTRY` override (default `https://registry.npmjs.org`, trailing `/` stripped).
  - Report a 404 as a "version not published" error naming the version.
  - Report other failures and a missing or invalid `version` as a registry error.
  - Verify via e2e tests in `test/upgrade-command.test.ts` (404, 500, trailing-slash override).
- [x] 1.2 Implement `classifyChange(current, target)` (`upgrade | downgrade | same` via `Bun.semver.order`) and `isValidVersion(input)` for user input.
  - Verify via e2e tests (same, newer, older `latest`; invalid version rejected before any network call).

## 2. Install-method detection and install execution (private methods on `UpgradeCommand`)

- [x] 2.1 Implement `detectInstallMethod(scriptPath)` returning `bun | npm | pnpm | yarn | unknown`, using the path rules in design.md decision 3. Path separators are normalized, and pnpm and yarn are checked before npm.
  - Verify via e2e test: a source checkout resolves to `unknown`.
- [x] 2.2 Implement `buildInstallCommand(method, version)`, producing `bun add -g`, `npm install -g`, `pnpm add -g`, or `yarn global add` for `@0xkahi/llw@<v>`, and `manualInstructions(version)` listing the bun and npm commands.
  - Verify via e2e test: the unknown-method error prints both manual commands.
- [x] 2.3 Implement `runInstall(argv)`:
  - Capture stdout and stderr under a spinner; write captured stderr on failure.
  - On a non-zero exit, throw `Upgrade failed (<manager> exited with code N)`.
  - Append a global-permissions hint when stderr matches `EACCES|EPERM|permission denied`.

## 3. Upgrade command

- [x] 3.1 Create `src/commands/upgrade/index.ts` `UpgradeCommand` (CommandStrategy), with argument `[version]` and option `--check`. It runs the flow from design.md:
  1. Validate input.
  2. Resolve the version.
  3. Classify the change.
  4. Branch per the decision 2 table.
  5. Check `--check`.
  6. Detect the install method; an unknown method throws with manual instructions.
  7. Install.
  8. Report the previous and new versions.

  Use `@clack/prompts` steps, spinners, and a `✓` outro consistent with ocp, highlighting versions and the manager with `@0xkahi/cli-dye` green. Verify with `bun run type-check`.
- [x] 3.2 Register `new UpgradeCommand()` in `src/index.ts` `subCommands`. Verify that `bun run dev upgrade --help` shows the `[version]` argument and the `--check` option.
- [x] 3.3 Add `test/upgrade-command.test.ts`. Spawn the CLI from source (pattern in `test/skills-command.test.ts`), with `LLW_NPM_REGISTRY` pointing at a local `Bun.serve` stub. Assert:
  - `--check` with a newer `latest` reports availability and exits 0.
  - Same-version `latest` reports up to date and exits 0.
  - An older `latest` does not install and exits 0.
  - An unpublished explicit version exits 1 with an error on stderr.
  - An upgrade from the source checkout (an unknown install method) exits 1 and prints the manual install commands.

  Verify with `bun test`.
- [x] 3.4 Add an `llw upgrade` entry to the README command reference (`README.md`, "Command reference").
  - Cover `upgrade [version] [--check]`: no-downgrade-by-default, explicit downgrade, and the manual fallback.
  - Mention `llw upgrade` in the Installation section as the way to update.
  - Verify that the documented commands match `llw upgrade --help`.

## 4. Integration checks

- [x] 4.1 Run `bun run check` (Biome + type-check) and `bun test`. Both must pass.
- [x] 4.2 Smoke test manually with a global install:
  1. `bun run build`, then `bun add -g` the packed tarball, or link it.
  2. Run `llw upgrade --check` against the real registry, and confirm the installed and latest versions it reports.

## Workflow follow-up

- Add a changeset (`bun run changeset`, minor bump) describing the new `llw upgrade` command before release.
- Archive the change after review and release.
