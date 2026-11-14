# cli-self-upgrade Specification

## Purpose

Lets users keep the installed `llw` CLI, and the agent skills bundled with it, current by checking for and installing published versions of the package from the CLI itself.

## Requirements

### Requirement: Upgrade command resolves the target version from the registry
The CLI SHALL provide `llw upgrade [version]`, which resolves the target version from the public npm registry for `@0xkahi/llw`. If no version is given, the target is the version published under the `latest` tag. The CLI SHALL NOT require the `npm` executable to resolve versions.

#### Scenario: Resolve latest
- **WHEN** the user runs `llw upgrade` with no version argument
- **THEN** the CLI resolves the target to the version currently tagged `latest` on the registry

#### Scenario: Resolve explicit version
- **WHEN** the user runs `llw upgrade 0.2.0` and `0.2.0` is published
- **THEN** the CLI resolves the target to `0.2.0`

#### Scenario: Unknown version
- **WHEN** the user runs `llw upgrade 9.9.9` and that version is not published
- **THEN** the CLI writes an error naming the requested version to stderr, installs nothing, and exits with code `1`

#### Scenario: Registry unreachable
- **WHEN** the registry request fails, times out, or returns a non-success status or a response without a version
- **THEN** the CLI writes an error describing the registry failure to stderr, installs nothing, and exits with code `1`

### Requirement: Same version is a successful no-op
When the target version equals the installed version, the CLI SHALL report that it is already up to date, install nothing, and exit with code `0`.

#### Scenario: Already on latest
- **WHEN** the installed version equals the version tagged `latest` and the user runs `llw upgrade`
- **THEN** the CLI reports that `llw` is already up to date, performs no installation, and exits with code `0`

### Requirement: Implicit upgrades never downgrade
When no version argument is given and the resolved `latest` version is semantically older than the installed version, the CLI SHALL NOT install it. It SHALL report that the installed version is newer than `latest` and exit with code `0`.

#### Scenario: Latest tag older than installed
- **WHEN** the installed version is `0.3.0`, `latest` resolves to `0.2.0`, and the user runs `llw upgrade`
- **THEN** the CLI installs nothing, reports that `0.3.0` is newer than `latest` (`0.2.0`), and exits with code `0`

### Requirement: Explicit older versions install as reported downgrades
When the user names a version that is semantically older than the installed version, the CLI SHALL install it and SHALL clearly state in its output that the operation is a downgrade from the installed version to the target.

#### Scenario: Explicit downgrade
- **WHEN** the installed version is `0.3.0` and the user runs `llw upgrade 0.1.0`
- **THEN** the CLI reports a downgrade from `0.3.0` to `0.1.0`, installs `0.1.0`, and exits with code `0` on success

### Requirement: Check mode reports without installing
`llw upgrade --check` SHALL resolve the target version, report the installed and target versions and whether an upgrade, downgrade, or no change would occur, and SHALL NOT install anything.

#### Scenario: Update available
- **WHEN** the installed version is `0.1.0`, `latest` is `0.2.0`, and the user runs `llw upgrade --check`
- **THEN** the CLI reports that `0.2.0` is available over `0.1.0`, installs nothing, and exits with code `0`

#### Scenario: Check with no update
- **WHEN** the installed version equals `latest` and the user runs `llw upgrade --check`
- **THEN** the CLI reports that `llw` is up to date and exits with code `0`

### Requirement: Install uses the package manager that installed the CLI
The CLI SHALL determine whether the running `llw` was installed globally by bun, npm, pnpm, or yarn. It SHALL install the target version through that same package manager as a global install of `@0xkahi/llw@<target>`.

#### Scenario: Bun global install
- **WHEN** the running CLI is a bun global install and an upgrade to `0.2.0` proceeds
- **THEN** the CLI installs `@0xkahi/llw@0.2.0` globally using bun

#### Scenario: npm global install
- **WHEN** the running CLI is an npm global install and an upgrade to `0.2.0` proceeds
- **THEN** the CLI installs `@0xkahi/llw@0.2.0` globally using npm

### Requirement: Undetectable install method falls back to manual instructions
When the install method cannot be determined (for example a project-local install, a `bunx`/`npx` run, or a source checkout), the CLI SHALL NOT attempt an installation. It SHALL write the manual global install commands for the target version to stderr and exit with code `1`.

#### Scenario: Running from a source checkout
- **WHEN** the user runs `llw upgrade` from a development checkout of the repository and an upgrade would otherwise proceed
- **THEN** the CLI installs nothing, prints the manual install commands for the target version, and exits with code `1`

### Requirement: Installation failures are reported
If the package manager install exits unsuccessfully, the CLI SHALL report the failure on stderr and exit with code `1`. When the failure is a permission error, the output SHALL include a hint about global install permissions.

#### Scenario: Install command fails
- **WHEN** the package manager exits with a non-zero code during installation
- **THEN** the CLI reports that the upgrade failed with that exit code and exits with code `1`

#### Scenario: Permission denied
- **WHEN** the package manager fails because it lacks permission to write the global install location
- **THEN** the CLI's error output includes a hint about fixing global install permissions, and the CLI exits with code `1`

### Requirement: Successful upgrade is confirmed
After a successful installation, the CLI SHALL report the previous and new versions and exit with code `0`.

#### Scenario: Upgrade succeeds
- **WHEN** the installed version is `0.1.0` and the installation of `0.2.0` succeeds
- **THEN** the CLI reports that `llw` was upgraded from `0.1.0` to `0.2.0` and exits with code `0`
