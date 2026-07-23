import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { getSkillEntries } from '../src/utils/skill-registry/registry';
import { SkillRegistry } from '../src/utils/skill-registry/skill-registry';

const REFERENCE_LINK_SEARCH_PATTERN = /\]\((sk-references\/[^)\s]+)\)/g;

const getFrontmatterName = (content: string): string | undefined => {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  return frontmatter?.[1]?.match(/^name:\s*(.+?)\s*$/m)?.[1];
};

const registry = new SkillRegistry(getSkillEntries({ testSkills: true }));

describe('skill registry integrity', () => {
  for (const { skillName } of getSkillEntries({ testSkills: true })) {
    test(`${skillName} has valid identity, assets, and reference links`, () => {
      const skillPath = registry.getSkillPath(skillName);
      const skillFilePath = registry.getSkillFilePath(skillName);

      expect(basename(skillPath)).toBe(skillName);
      expect(existsSync(skillPath)).toBeTrue();
      expect(statSync(skillPath).isDirectory()).toBeTrue();
      expect(skillFilePath).toBe(join(skillPath, 'SKILL.md'));
      expect(existsSync(skillFilePath)).toBeTrue();
      expect(statSync(skillFilePath).isFile()).toBeTrue();

      const content = readFileSync(skillFilePath, 'utf8');
      expect(getFrontmatterName(content)).toBe(skillName);

      const referenceLinks = content.matchAll(REFERENCE_LINK_SEARCH_PATTERN);
      for (const [, referencePath] of referenceLinks) {
        expect(referencePath).toBeDefined();
        if (referencePath === undefined) throw new Error('Missing reference link target');
        expect(isAbsolute(referencePath)).toBeFalse();

        const resolvedReference = resolve(skillPath, referencePath);
        expect(relative(skillPath, resolvedReference).startsWith('..')).toBeFalse();
        expect(isAbsolute(relative(skillPath, resolvedReference))).toBeFalse();
        expect(existsSync(resolvedReference)).toBeTrue();
        expect(statSync(resolvedReference).isFile()).toBeTrue();
      }

      expect(() => registry.getSkill(skillName)).not.toThrow();
    });
  }
});
