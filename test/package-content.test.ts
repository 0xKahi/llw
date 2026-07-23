import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import packageJson from '../package.json';
import { getSkillEntries } from '../src/utils/skill-registry/registry';

const REFERENCE_LINK_SEARCH_PATTERN = /\]\((sk-references\/[^)\s]+)\)/g;

const packageRoot = resolve(import.meta.dir, '..');

const run = async (command: string[]) => {
  const process = Bun.spawn(command, {
    cwd: packageRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);

  if (exitCode !== 0) {
    throw new Error(`Command failed (${command.join(' ')}):\n${stderr || stdout}`);
  }

  return stdout;
};

describe('published package content', () => {
  test('includes the CLI bundle and every registered skill asset', async () => {
    expect(packageJson.files).toContain('dist');
    expect(packageJson.files).toContain('skill-data');
    expect(packageJson.scripts.prepack).toBe('bun run build');

    await run([process.execPath, 'run', 'build']);
    const packOutput = await run(['npm', 'pack', '--dry-run', '--json', '--ignore-scripts']);
    const packResult = JSON.parse(packOutput) as [{ files: { path: string }[] }];
    const packedFiles = new Set(packResult[0]?.files.map(file => file.path));

    expect(packedFiles.has('dist/index.js')).toBeTrue();

    for (const { skillName } of getSkillEntries({ testSkills: true })) {
      expect(packedFiles.has(`skill-data/${skillName}/SKILL.md`)).toBeTrue();

      const skillContent = readFileSync(join(packageRoot, 'skill-data', skillName, 'SKILL.md'), 'utf8');
      for (const [, referencePath] of skillContent.matchAll(REFERENCE_LINK_SEARCH_PATTERN)) {
        expect(packedFiles.has(`skill-data/${skillName}/${referencePath}`)).toBeTrue();
      }
    }
  }, 20_000);
});
