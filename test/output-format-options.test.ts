import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { resolve } from 'node:path';
import { BundleListCommand } from '../src/commands/bundle/list';
import { formatOutput } from '../src/utils/tokenizer.util';
import { VaultCli } from '../src/utils/vault-cli.util';

const cliPath = resolve(import.meta.dir, '../src/index.ts');
const bundles = [
  {
    title: 'Example',
    path: 'bundles/example/bundle.md',
    folder: 'bundles/example',
    description: 'Example bundle',
    triggers: ['first', 'second'],
    parent: null,
    parentFolder: null,
  },
];
const payload = { bundles };

const runCli = async (...args: string[]) => {
  const subprocess = Bun.spawn([process.execPath, cliPath, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
    subprocess.exited,
  ]);

  return { stdout, stderr, exitCode };
};

afterEach(() => {
  mock.restore();
});

describe('formatted output presentation', () => {
  test('bundle list emits compact JSON by default and pretty JSON with --pretty', async () => {
    spyOn(VaultCli, 'getAllBundles').mockResolvedValue(bundles);
    const log = spyOn(console, 'log').mockImplementation(() => {});
    const command = new BundleListCommand();

    await command.execute({ format: 'json' });
    expect(log).toHaveBeenLastCalledWith(formatOutput(payload, { type: 'json', compact: true }));

    await command.execute({ format: 'json', pretty: true });
    expect(log).toHaveBeenLastCalledWith(formatOutput(payload, { type: 'json', compact: false }));
  });

  test('bundle list emits compact TOON by default and pretty TOON with --pretty', async () => {
    spyOn(VaultCli, 'getAllBundles').mockResolvedValue(bundles);
    const log = spyOn(console, 'log').mockImplementation(() => {});
    const command = new BundleListCommand();

    await command.execute({ format: 'toon' });
    expect(log).toHaveBeenLastCalledWith(formatOutput(payload, { type: 'toon', compact: true }));

    await command.execute({ format: 'toon', pretty: true });
    expect(log).toHaveBeenLastCalledWith(formatOutput(payload, { type: 'toon', compact: false }));
  });
});

describe('formatted output CLI options', () => {
  test('help advertises --pretty and omits the removed compact options', async () => {
    const result = await runCli('bundle', 'list', '--help');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('--pretty');
    expect(result.stdout).not.toContain('--compact');
    expect(result.stdout).not.toContain('--no-compact');
  });

  test('rejects removed compact options', async () => {
    for (const flag of ['--compact', '-c', '--no-compact']) {
      const result = await runCli('bundle', 'list', flag);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain(`unknown option '${flag}'`);
    }
  });
});
