import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { getSkillEntries } from '../src/utils/skill-registry/registry';
import { SkillRegistry } from '../src/utils/skill-registry/skill-registry';

const cliPath = resolve(import.meta.dir, '../src/index.ts');
const registry = new SkillRegistry(getSkillEntries({ testSkills: true }));
let externalWorkingDirectory: string;

const runCli = async (...args: string[]) => {
  const subprocess = Bun.spawn([process.execPath, cliPath, ...args], {
    cwd: externalWorkingDirectory,
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

beforeAll(() => {
  externalWorkingDirectory = mkdtempSync(join(tmpdir(), 'llw-skills-command-'));
});

afterAll(() => {
  rmSync(externalWorkingDirectory, { recursive: true, force: true });
});

describe('llw skills view', () => {
  test('prints transformed skill content from outside the package', async () => {
    const result = await runCli('skills', 'view', 'test-skill');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(registry.getSkill('test-skill'));
  });

  test('--path prints only the absolute skill folder', async () => {
    const result = await runCli('skills', 'view', 'test-skill', '--path');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`${registry.getSkillPath('test-skill')}\n`);
  });

  test('prints the same content when viewing by alias', async () => {
    const result = await runCli('skills', 'view', 'core');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(registry.getSkill('llw-okf'));
  });

  test('--path prints the canonical skill folder when viewing by alias', async () => {
    const result = await runCli('skills', 'view', 'core', '--path');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`${registry.getSkillPath('llw-okf')}\n`);
  });

  test('rejects an unknown skill', async () => {
    const result = await runCli('skills', 'view', 'missing-skill');

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Unknown skill: missing-skill');
  });

  test('rejects the former get command name', async () => {
    const result = await runCli('skills', 'get', 'test-skill');

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
  });
});
