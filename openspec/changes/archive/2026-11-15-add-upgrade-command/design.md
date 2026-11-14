# Design

## Context

See `proposal.md` for motivation and `specs/cli-self-upgrade/spec.md` for the required behavior.

Current state that shapes the approach:

- **Runtime:** `llw` is a Bun-only CLI.
  - The shebang is `#!/usr/bin/env bun` and `engines.bun >= 1.4`.
  - The build target is `--target bun`.
  - The README documents two install paths: `bun add -g @0xkahi/llw` and `npm install -g @0xkahi/llw`. Under npm, Bun must still be on the PATH.
- **Commands:**
  - Commands are `CommandStrategy` classes (`src/utils/commander/command-strategy.ts`) registered as `subCommands` of `mainCommand` in `src/index.ts`.
  - `CommandLoader.wrapAction` turns any thrown `Error` into a stderr message and exit code `1`.
- **Version:** `CURRENT_VERSION` comes from `package.json` via `src/meta.ts`.
- **Dependencies:** `@clack/prompts` and `@0xkahi/cli-dye` are already dependencies.
- **Reference implementation:** the sibling `ocp` CLI (`ocp/src/commands/upgrade.ts`) implements a similar command. It has known weaknesses:
  - It shells out to `npm config get registry`, and its fallback for an empty result is broken.
  - It detects the package manager through `process.execPath` plus four `list -g` subprocesses.
  - It compares versions with string equality, so downgrades happen silently.
  - It installs with `update -g pkg@ver`.

## Goals / Non-Goals

**Goals:**
- Keep the command self-contained, like ocp's: version resolution, comparison, install-method detection, and install-command construction are private methods on `UpgradeCommand`, using `fetch` and `Bun.spawn` directly. Behavior is covered by end-to-end CLI tests against a local registry stub.
- Match ocp's UX shape so the sibling CLIs feel consistent: `@clack/prompts` steps, spinners, and a `✓` outro, with versions and the detected manager highlighted green via `@0xkahi/cli-dye`.
- Add no new runtime dependencies.

**Non-Goals:**
- No background or passive "update available" notifier, and no update-check cache.
- No `sudo`/elevation, and no retry logic.
- No re-sync of vault files previously copied from `obsidian-setup/`.
- No Homebrew, Windows-specific, or standalone-binary install methods.

## Decisions

### 1. Resolve versions with a direct registry fetch

`GET {registry}/@0xkahi%2fllw/{target}`, where `target` is the user's version or `latest`. The `.version` field is read from the JSON response.

- **Registry base:** defaults to `https://registry.npmjs.org`. It can be overridden by the `LLW_NPM_REGISTRY` env var, which serves both mirrors and tests. A trailing `/` is stripped.
- **Error handling:**
  - Use `AbortSignal.timeout(10_000)`.
  - A `404` is treated as "version not published".
  - Any other non-2xx status, a network or timeout error, or a missing or invalid `version` is treated as a registry failure.
- **Alternative rejected:** `npm view` or `npm config get registry`. It requires npm even for bun-only users, adds subprocess latency, and the ocp fallback for this is broken.
- **Alternative rejected:** fetching the full packument and reading `dist-tags`. The per-version endpoint is much smaller and resolves tags server-side.

### 2. Compare versions with `Bun.semver.order`

The comparison is classified as `upgrade | downgrade | same`. Combined with whether the user passed a version explicitly, this classification drives the behavior:

| explicit? | classification | action |
|---|---|---|
| any | same | "already up to date", exit 0 |
| no | upgrade | install |
| no | downgrade | "installed X is newer than latest Y", no install, exit 0 |
| yes | upgrade | install |
| yes | downgrade | warn "downgrading X -> Y", install |

A version argument that isn't valid semver (`Bun.semver.satisfies`-style validation fails) is rejected before any network call.

- **Alternative rejected:** the `semver` npm package. It adds a dependency for functionality Bun already ships.

### 3. Detect the install method from the CLI's real path

`realpath(process.argv[1])` gives the location of the running `dist/index.js`, with global bin symlinks resolved. Detection works as follows:

1. If the path does not contain `/node_modules/@0xkahi/llw/`, the method is `unknown`. This covers a source checkout running `src/index.ts`, and a repo-local `dist/`.
2. Match manager markers in specificity order, checking pnpm and yarn before npm because all three paths contain `node_modules`:

   | Manager | Marker |
   |---|---|
   | bun | `$BUN_INSTALL/install/global/` or `/.bun/install/global/` |
   | pnpm | `/pnpm/global/` |
   | yarn | `/yarn/global/` or `/Yarn/Data/global/` |
   | npm | `/lib/node_modules/@0xkahi/llw/` |

3. Anything else is `unknown`. Examples are a project-local `node_modules`, or a `bunx`/`npx` cache directory.

Paths are normalized to `/` separators before matching.

- **Alternative rejected:** `process.execPath`. It is always the bun binary for llw, whichever manager installed it.
- **Alternative rejected:** running `npm/pnpm/yarn/bun list -g`. It needs four subprocesses, matches substrings loosely, and fails noisily when a manager is missing.

### 4. Install with `add`/`install`, not `update`

| Manager | Command |
|---|---|
| bun | `bun add -g @0xkahi/llw@<v>` |
| npm | `npm install -g @0xkahi/llw@<v>` |
| pnpm | `pnpm add -g @0xkahi/llw@<v>` |
| yarn | `yarn global add @0xkahi/llw@<v>` |

These commands pin the exact version reliably, which `update` does not guarantee across managers. They run through `Bun.spawn`:
- stdout and stderr are both captured while an "Upgrading packages" spinner runs, as in ocp.
- On failure, the captured stderr is written to stderr before the error, so the manager's output is still visible.

A non-zero exit throws `Upgrade failed (<manager> exited with code N)`. If stderr matches `/EACCES|EPERM|permission denied/i`, a hint about global-install permissions is appended. For npm, the hint says to fix the npm prefix ownership or use a user-level prefix.

Tests never reach the install step: the e2e tests run from the source checkout, where the install method is `unknown`.

### 5. Report unknown install methods as an error with manual commands

The thrown `Error` lists the manual commands for bun and npm (the two documented in the README) with the resolved target version. `wrapAction` then writes the message to stderr and exits with code `1`.

This check happens **after** version resolution and the comparison. As a result:
- "already up to date" still exits 0 from a dev checkout.
- `--check` never needs install-method detection.

### 6. Module layout

Everything lives in one file, `src/commands/upgrade/index.ts`, following ocp's `upgrade.ts` shape:
- `UpgradeCommand` (CommandStrategy). Argument: `[version]`. Option: `--check`. `execute` orchestrates the flow and clack output.
- Private methods: `resolveVersion`, `classifyChange`, `isValidVersion`, `detectInstallMethod`, `buildInstallCommand`, `manualInstructions`, `runInstall`.
- **Alternative rejected:** separate `src/utils/upgrade/*` modules with injected `fetch`/spawner for unit testing. Too much structure for a single command; e2e tests cover the behavior.

The command is registered in `src/index.ts`'s `subCommands`.

## Risks / Trade-offs

- **[Risk]** Manager path layouts differ across versions and OSes, so detection could return the wrong manager or `unknown`.
  → Unknown falls back to manual instructions, so nothing breaks. The markers mirror the documented global layouts for macOS and Linux.
- **[Risk]** After an npm global install, the same binary name may also exist in bun's global bin, so `PATH` order could hide the upgrade.
  → Out of scope. The success message prints the new version so the user can verify with `llw --version`.
- **[Risk]** Replacing the package while the old process is still running.
  → The process only prints a final message after the install. Bun has already loaded the bundle, so overwriting `dist/` is safe.
- **[Trade-off]** Install output is captured rather than streamed, so a spinner can run cleanly and EACCES can be detected. The user sees no live progress from the package manager during a successful install, only on failure.
- **[Trade-off]** The `LLW_NPM_REGISTRY` override is a small new env surface. It is justified by testability with a local `Bun.serve` stub and by mirror users.
