import { realpathSync } from 'node:fs';
import { dye } from '@0xkahi/cli-dye';
import { log, outro, spinner } from '@clack/prompts';
import { CURRENT_VERSION } from '../../meta';
import type { CommandStrategy } from '../../utils/commander/command-strategy';

const PACKAGE_NAME = '@0xkahi/llw';
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

const green = (text: string) => dye.colorize(text, { fg: 'green' });

function successOutro(message?: string) {
  outro(`${green('✓')} ${message ?? 'Done'}`);
}

type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn';

type UpgradeOptions = {
  check?: boolean;
};

export class UpgradeCommand implements CommandStrategy {
  readonly config = {
    name: 'upgrade',
    description: 'Update llw using the package manager that installed it',
    args: [{ name: '[version]', description: 'published version to install (defaults to latest)' }],
    options: [{ flag: '--check', description: 'report installed and target versions without installing' }],
  };

  async execute(version: string | undefined, options: UpgradeOptions): Promise<void> {
    if (version !== undefined && !this.isValidVersion(version)) {
      throw new Error(`Invalid version: ${version}. Expected a semantic version such as 0.2.0.`);
    }

    log.step('Checking for updates');
    const spin = spinner();
    const requested = version ?? 'latest';
    spin.start(`Fetching ${requested} version`);

    let target: string;
    try {
      target = await this.resolveVersion(version);
    } catch (error) {
      spin.error(`Failed to fetch ${green(requested)} version`);
      throw error;
    }

    const change = this.classifyChange(CURRENT_VERSION, target);
    if (change === 'same') {
      spin.error(`llw upgrade skipped ${green(target)} already installed (up to date)`);
      successOutro();
      return;
    }
    if (version === undefined && change === 'downgrade') {
      spin.error(`llw upgrade skipped installed ${green(CURRENT_VERSION)} is newer than latest ${green(target)}`);
      successOutro();
      return;
    }

    spin.stop(`Valid version found: ${green(target)}`);

    if (options.check) {
      log.info(`${green(target)} is available (installed ${green(CURRENT_VERSION)}; ${change})`);
      successOutro();
      return;
    }
    if (change === 'downgrade') {
      log.warn(`Downgrading llw from ${green(CURRENT_VERSION)} to ${green(target)}`);
    }

    log.step('Checking installation method');
    const scriptPath = process.argv[1];
    const method = scriptPath ? this.detectInstallMethod(realpathSync(scriptPath)) : 'unknown';
    if (method === 'unknown') {
      throw new Error(this.manualInstructions(target));
    }
    log.info(`Detected method: ${green(method)}`);

    const installSpin = spinner();
    installSpin.start('Upgrading packages');
    try {
      await this.runInstall(this.buildInstallCommand(method, target));
    } catch (error) {
      installSpin.error('Upgrade failed');
      throw error;
    }
    installSpin.stop(`llw ${green(CURRENT_VERSION)} -> ${green(target)}`);
    successOutro(`Upgraded llw from ${CURRENT_VERSION} to ${target}`);
  }

  private async resolveVersion(target: string | undefined): Promise<string> {
    const registry = (process.env.LLW_NPM_REGISTRY || DEFAULT_REGISTRY).replace(/\/+$/, '');
    const requested = target ?? 'latest';
    const url = `${registry}/@0xkahi%2fllw/${requested}`;
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Registry request to ${url} failed: ${message}`);
    }
    if (response.status === 404) {
      throw new Error(`Version ${requested} of ${PACKAGE_NAME} is not published`);
    }
    if (!response.ok) {
      throw new Error(`Registry request to ${url} failed with HTTP ${response.status}`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Registry request to ${url} failed: ${message}`);
    }
    if (typeof data !== 'object' || data === null || !('version' in data) || typeof data.version !== 'string') {
      throw new Error(`Registry response from ${url} is missing a string version`);
    }
    return data.version;
  }

  private classifyChange(current: string, target: string): 'upgrade' | 'downgrade' | 'same' {
    const order = Bun.semver.order(current, target);
    return order < 0 ? 'upgrade' : order > 0 ? 'downgrade' : 'same';
  }

  private isValidVersion(input: string): boolean {
    const numeric = '(?:0|[1-9][0-9]*)';
    const prerelease = '(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)';
    const pattern = new RegExp(
      `^${numeric}\\.${numeric}\\.${numeric}(?:-${prerelease}(?:\\.${prerelease})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`,
    );
    return pattern.exec(input)?.[0] === input;
  }

  private detectInstallMethod(scriptPath: string): PackageManager | 'unknown' {
    const path = scriptPath.replaceAll('\\', '/');
    if (!path.includes('/node_modules/@0xkahi/llw/')) return 'unknown';

    const bunInstall = process.env.BUN_INSTALL?.replaceAll('\\', '/').replace(/\/+$/, '');
    if ((bunInstall && path.startsWith(`${bunInstall}/install/global/`)) || path.includes('/.bun/install/global/')) return 'bun';
    if (path.includes('/pnpm/global/')) return 'pnpm';
    if (path.includes('/yarn/global/') || path.includes('/Yarn/Data/global/')) return 'yarn';
    if (path.includes('/lib/node_modules/@0xkahi/llw/')) return 'npm';
    return 'unknown';
  }

  private buildInstallCommand(method: PackageManager, version: string): string[] {
    const commands: Record<PackageManager, string[]> = {
      bun: ['bun', 'add', '-g'],
      npm: ['npm', 'install', '-g'],
      pnpm: ['pnpm', 'add', '-g'],
      yarn: ['yarn', 'global', 'add'],
    };
    return [...commands[method], `${PACKAGE_NAME}@${version}`];
  }

  private manualInstructions(version: string): string {
    return `Unable to detect the install method. Install manually with one of these commands:
  ${this.buildInstallCommand('bun', version).join(' ')}
  ${this.buildInstallCommand('npm', version).join(' ')}`;
  }

  private async runInstall(argv: string[]): Promise<void> {
    const child = Bun.spawn(argv, { stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' });
    const [, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    if (code === 0) return;

    if (stderr.trim()) {
      process.stderr.write(stderr.endsWith('\n') ? stderr : `${stderr}\n`);
    }
    let message = `Upgrade failed (${argv[0]} exited with code ${code})`;
    if (/EACCES|EPERM|permission denied/i.test(stderr)) {
      message +=
        argv[0] === 'npm'
          ? '\nFix npm prefix ownership or use a user-level prefix (npm config set prefix ~/.npm-global).'
          : '\nCheck global-install permissions and use a writable, user-level install location.';
    }
    throw new Error(message);
  }
}
