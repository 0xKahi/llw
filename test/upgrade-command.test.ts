import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { version as current } from '../package.json';

const cliPath = resolve(import.meta.dir, '../src/index.ts');
const [major, minor, patch] = current.split(/[.-]/).map(Number) as [number, number, number];
const newer = `${major + 1}.0.0`;
const older = patch > 0 ? `${major}.${minor}.${patch - 1}` : minor > 0 ? `${major}.${minor - 1}.0` : `${major - 1}.0.0`;

const runCli = async (latest: string, args: string[], status = 200, registrySuffix = '') => {
  const requests: string[] = [];
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const path = decodeURIComponent(new URL(request.url).pathname);
      requests.push(path);
      if (!path.startsWith('/@0xkahi/llw/')) {
        return new Response('Unexpected registry path', { status: 400 });
      }
      return Response.json({ version: latest }, { status });
    },
  });

  try {
    const subprocess = Bun.spawn([process.execPath, cliPath, 'upgrade', ...args], {
      env: { ...process.env, LLW_NPM_REGISTRY: server.url.toString() + registrySuffix },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(subprocess.stdout).text(),
      new Response(subprocess.stderr).text(),
      subprocess.exited,
    ]);
    return { stdout, stderr, output: stdout + stderr, exitCode, requests };
  } finally {
    await server.stop(true);
  }
};

describe('llw upgrade', () => {
  test('--check reports a newer latest without installing', async () => {
    const result = await runCli(newer, ['--check']);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain(`${newer} is available`);
    expect(result.output).toContain(`installed ${current}`);
    expect(result.requests).toEqual(['/@0xkahi/llw/latest']);
  });

  test('same-version latest is already up to date, including --check', async () => {
    for (const args of [[], ['--check']]) {
      const result = await runCli(current, args);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('up to date');
    }
  });

  test('older latest never attempts an install', async () => {
    const result = await runCli(older, []);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain(`${current} is newer than latest ${older}`);
    expect(result.output).not.toContain('Installing');
    expect(result.output).not.toContain('Install manually');
  });

  test('unpublished explicit version is an error on stderr', async () => {
    const result = await runCli(newer, [newer], 404);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`Version ${newer}`);
    expect(result.stderr).toContain('not published');
    expect(result.requests).toEqual([`/@0xkahi/llw/${newer}`]);
  });

  test('source checkout reports manual install commands on stderr', async () => {
    const result = await runCli(newer, []);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`bun add -g @0xkahi/llw@${newer}`);
    expect(result.stderr).toContain(`npm install -g @0xkahi/llw@${newer}`);
  });

  test.each(['not-a-version', 'latest', '1.2', 'v1.2.3', '01.2.3', '1.2.3-01', '1.2.3\n', '^1.2.3'])(
    'rejects invalid version %j before contacting the registry',
    async version => {
      const result = await runCli(newer, [version]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain(`Invalid version: ${version}`);
      expect(result.requests).toEqual([]);
    },
  );

  test('strips trailing slashes from the registry override', async () => {
    const result = await runCli(newer, ['--check'], 200, '//');
    expect(result.exitCode).toBe(0);
    expect(result.requests).toEqual(['/@0xkahi/llw/latest']);
  });

  test('registry failures are errors on stderr', async () => {
    const result = await runCli(newer, [], 500);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Registry request');
    expect(result.stderr).toContain('HTTP 500');
  });

  test('explicit older version warns before manual fallback', async () => {
    const result = await runCli(older, [older]);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(`Downgrading llw from ${current} to ${older}`);
    expect(result.stderr).toContain(`bun add -g @0xkahi/llw@${older}`);
  });

  test('--check reports an explicit downgrade without installing', async () => {
    const result = await runCli(older, [older, '--check']);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain(`installed ${current}; downgrade`);
    expect(result.output).toContain(older);
  });
});
