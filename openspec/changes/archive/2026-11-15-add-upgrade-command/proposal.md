# Proposal

## Why

Upgrading `llw` today means users must remember which package manager installed it (`bun add -g` or `npm install -g`, per the README) and run the right command by hand. Because the skills served by `llw skills view` ship inside the package, a stale CLI also means stale agent workflows. A built-in `llw upgrade` command gives users and agents one reliable way to stay current. The sibling `ocp` CLI already offers this.

## What Changes

- Add a top-level `llw upgrade [version]` command that installs the latest published `@0xkahi/llw`, or a specific version, using the package manager that originally installed the running CLI.
- Add a `--check` flag that reports the installed and target versions without installing anything.
- Resolve versions directly from the npm registry. Do not depend on the `npm` CLI being installed.
- Compare versions semantically:
  - A plain `llw upgrade` never downgrades.
  - An explicit older version is allowed and is clearly reported as a downgrade.
  - An identical version is a successful no-op.
- Detect the install method (bun, npm, pnpm, yarn global) from the running CLI's installed location. When it cannot be determined (local, `bunx`, or dev checkout), print the manual command to run and exit `1`.
- Report failures (registry errors, unknown version, install failure, permission denied) on stderr with exit code `1`. Permission failures include a remediation hint.
- Document the command in the README command reference.

This change is not breaking. It only adds a new command.

## Capabilities

### New Capabilities
- `cli-self-upgrade`: how the installed `llw` CLI checks for and installs newer (or explicitly requested) published versions of itself, including version resolution, downgrade protection, install-method detection, and failure reporting.

### Modified Capabilities
<!-- None: existing command, output, and skill capabilities are unchanged. -->

## Impact

- **Code:**
  - New self-contained command module `src/commands/upgrade/index.ts`.
  - Registration in `src/index.ts`.
  - Reuses `CURRENT_VERSION` from `src/meta.ts`.
- **Dependencies:** none added. The command uses existing `@clack/prompts`, `@0xkahi/cli-dye`, and Bun built-ins (`fetch`, `Bun.spawn`, `Bun.semver`).
- **Network:** the command contacts `registry.npmjs.org` only when `llw upgrade` is run. No background checks.
- **Docs:** `README.md` command reference.
- **Tests:** new `bun test` coverage in `test/`.
