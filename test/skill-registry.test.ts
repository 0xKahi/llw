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

  test('throws for an input that is neither a skill name nor an alias', () => {
    expect(registry.has('not-an-alias')).toBe(false);
    expect(() => registry.getSkillPath('not-an-alias')).toThrow('Unknown skill: not-an-alias');
  });
});

describe('SkillRegistry aliases', () => {
  test('resolves lookups by alias to the canonical skill', () => {
    expect(registry.has('core')).toBe(true);
    expect(registry.getSkill('core')).toBe(registry.getSkill('llw-okf'));
    expect(registry.getSkillPath('core')).toBe(registry.getSkillPath('llw-okf'));
    expect(registry.getSkillPath('core')).toBe(join(registry.getSkillsDataPath(), 'llw-okf'));
    expect(registry.getSkillFilePath('core')).toBe(registry.getSkillFilePath('llw-okf'));
  });

  test('skills without aliases are not aliased by their own name', () => {
    expect(registry.getSkillPath('test-skill')).toBe(join(registry.getSkillsDataPath(), 'test-skill'));
  });

  test('throws when an alias equals its own skill name', () => {
    const entries = [{ skillName: 'self-alias', entry: { description: 'fixture', alias: 'self-alias' } }];

    expect(() => new SkillRegistry(entries)).toThrow('Skill alias must differ from its skill name: self-alias');
  });

  test('throws when an alias collides with another skill name', () => {
    const entries = [
      { skillName: 'alpha-skill', entry: { description: 'fixture', alias: 'beta-skill' } },
      { skillName: 'beta-skill', entry: { description: 'fixture' } },
    ];

    expect(() => new SkillRegistry(entries)).toThrow('Skill alias collides with a skill name: beta-skill');
  });

  test('throws when two skills declare the same alias', () => {
    const entries = [
      { skillName: 'alpha-skill', entry: { description: 'fixture', alias: 'shared' } },
      { skillName: 'beta-skill', entry: { description: 'fixture', alias: 'shared' } },
    ];

    expect(() => new SkillRegistry(entries)).toThrow('Duplicate skill alias: shared (claimed by "alpha-skill" and "beta-skill")');
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
