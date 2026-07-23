import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSkillEntries } from '../src/utils/skill-registry/registry';
import { SkillRegistry } from '../src/utils/skill-registry/skill-registry';

const registry = new SkillRegistry(getSkillEntries({ testSkills: true }));

describe('SkillRegistry', () => {
  test('returns the complete test skill with absolute reference paths', () => {
    const skillPath = registry.getSkillPath('test-skill');
    const exampleReference = join(skillPath, 'sk-references/example-reference.md');
    const otherReference = join(skillPath, 'sk-references/some-other-reference.md');

    const expected = `---
name: test-skill
description: >
  a simple test skill for llw to test the llw skill output with  
  references
---

# LLW Test Skill

this skill does nothing its only meant to test the skill output with references.

## References
- TEST_REFERENCE_1: [Test Reference 1](${exampleReference})
- TEST_REFERENCE_2: [Test Reference 2](${otherReference})

Ordinary shell variables such as \`$HOME\` are not skill references.
Repeated reference: [Test Reference 1](${exampleReference})

some other gibberish text
`;

    const content = registry.getSkill('test-skill');

    expect(content).toBe(expected);
    expect(content).not.toContain('](sk-references/');
    expect(content).toContain('$HOME');
  });

  test('returns the absolute skill folder rather than the skill file', () => {
    const skillPath = registry.getSkillPath('test-skill');

    expect(skillPath).toBe(join(registry.getSkillsDataPath(), 'test-skill'));
    expect(skillPath).not.toEndWith('SKILL.md');
  });

  test('throws on duplicate skill entries', () => {
    const entries = [
      { skillName: 'test-skill', entry: { description: 'one' } },
      { skillName: 'test-skill', entry: { description: 'two' } },
    ];

    expect(() => new SkillRegistry(entries)).toThrow('Duplicate skill entry: test-skill');
  });

  test('throws for an unknown skill', () => {
    expect(() => registry.getSkill('missing-skill')).toThrow('Unknown skill: missing-skill');
  });
});

describe('SkillRegistry reference safety', () => {
  let skillsDataPath: string;

  const writeSkill = (skillName: string, skillContent: string) => {
    const skillPath = join(skillsDataPath, skillName);
    mkdirSync(join(skillPath, 'sk-references'), { recursive: true });
    writeFileSync(join(skillPath, 'SKILL.md'), skillContent);
    return skillPath;
  };

  const registryFor = (skillName: string) => new SkillRegistry([{ skillName, entry: { description: 'fixture' } }], { skillsDataPath });

  beforeAll(() => {
    skillsDataPath = mkdtempSync(join(tmpdir(), 'llw-skill-registry-'));
  });

  afterAll(() => {
    rmSync(skillsDataPath, { recursive: true, force: true });
  });

  test('throws when a reference link target does not exist', () => {
    writeSkill('broken-skill', '[Missing](sk-references/nope.md)\n');

    expect(() => registryFor('broken-skill').getSkill('broken-skill')).toThrow('Skill reference file not found for skill "broken-skill": sk-references/nope.md');
  });

  test('throws when a reference link escapes the skill folder', () => {
    writeSkill('traversing-skill', '[Evil](sk-references/../../secret.md)\n');

    expect(() => registryFor('traversing-skill').getSkill('traversing-skill')).toThrow('Skill reference escapes the skill folder: sk-references/../../secret.md');
  });

  test('throws when a reference link escapes the skill folder via symlink', () => {
    const skillPath = writeSkill('symlink-skill', '[Linked](sk-references/secret.md)\n');
    writeFileSync(join(skillsDataPath, 'secret.md'), 'outside the skill folder');
    symlinkSync(join(skillsDataPath, 'secret.md'), join(skillPath, 'sk-references/secret.md'));

    expect(() => registryFor('symlink-skill').getSkill('symlink-skill')).toThrow('Skill reference escapes the skill folder: sk-references/secret.md');
  });

  test('rewrites links and preserves other content in fixture skills', () => {
    const skillPath = writeSkill(
      'linked-skill',
      '[Doc](sk-references/doc.md) and [External](https://example.com) and [Anchor](#section) and [Relative](./sk-references/doc.md)\n',
    );
    writeFileSync(join(skillPath, 'sk-references/doc.md'), 'doc');

    const content = registryFor('linked-skill').getSkill('linked-skill');

    expect(content).toBe(
      `[Doc](${join(skillPath, 'sk-references/doc.md')}) and [External](https://example.com) and [Anchor](#section) and [Relative](./sk-references/doc.md)\n`,
    );
  });
});
