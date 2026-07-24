import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SkillEntryInput, SkillRegistryEntry } from './registry';

const PACKAGE_NAME = '@0xkahi/llm-wiki';
const SKILLS_DATA_DIRECTORY = 'skill-data';
const SKILL_FILE_NAME = 'SKILL.md';
const REFERENCES_PREFIX = 'sk-references/';
const REFERENCE_LINK_SEARCH_PATTERN = /\]\((sk-references\/[^)\s]+)\)/g;

type SkillRegistryOptions = {
  skillsDataPath?: string;
};

export class SkillRegistry {
  private readonly entries: ReadonlyMap<string, SkillRegistryEntry>;
  private readonly aliases: ReadonlyMap<string, string>;
  private readonly skillsDataPathOverride: string | undefined;
  private packageRoot: string | undefined;

  constructor(entries: SkillEntryInput[], options: SkillRegistryOptions = {}) {
    const registryMap = new Map<string, SkillRegistryEntry>();
    const aliasMap = new Map<string, string>();
    for (const { skillName, entry } of entries) {
      if (registryMap.has(skillName)) {
        throw new Error(`Duplicate skill entry: ${skillName}`);
      }
      registryMap.set(skillName, entry);
    }

    // Alias validation runs after all skill names are registered so that
    // alias-vs-name collision detection does not depend on entry order.
    for (const { skillName, entry } of entries) {
      const alias = entry.alias;
      if (!alias) continue;
      if (alias === skillName) {
        throw new Error(`Skill alias must differ from its skill name: ${skillName}`);
      }
      if (registryMap.has(alias)) {
        throw new Error(`Skill alias collides with a skill name: ${alias}`);
      }
      const existingSkillName = aliasMap.get(alias);
      if (existingSkillName !== undefined) {
        throw new Error(`Duplicate skill alias: ${alias} (claimed by "${existingSkillName}" and "${skillName}")`);
      }
      aliasMap.set(alias, skillName);
    }

    this.entries = registryMap;
    this.aliases = aliasMap;
    this.skillsDataPathOverride = options.skillsDataPath;
  }

  has(nameOrAlias: string): boolean {
    return this.entries.has(this.resolveSkillName(nameOrAlias));
  }

  getSkillsDataPath(): string {
    return this.skillsDataPathOverride ?? join(this.getPackageRoot(), SKILLS_DATA_DIRECTORY);
  }

  getSkillPath(nameOrAlias: string): string {
    const skillName = this.resolveSkillName(nameOrAlias);
    this.getEntry(skillName);

    const skillPath = join(this.getSkillsDataPath(), skillName);
    if (!existsSync(skillPath) || !statSync(skillPath).isDirectory()) {
      throw new Error(`Skill folder not found: ${skillName}`);
    }

    return skillPath;
  }

  getSkillFilePath(nameOrAlias: string): string {
    const skillName = this.resolveSkillName(nameOrAlias);
    const skillFilePath = join(this.getSkillPath(skillName), SKILL_FILE_NAME);
    if (!existsSync(skillFilePath) || !statSync(skillFilePath).isFile()) {
      throw new Error(`Skill file not found: ${skillName}/${SKILL_FILE_NAME}`);
    }

    return skillFilePath;
  }

  getSkill(nameOrAlias: string): string {
    const skillName = this.resolveSkillName(nameOrAlias);
    this.getEntry(skillName);

    const skillPath = this.getSkillPath(skillName);
    const content = readFileSync(this.getSkillFilePath(skillName), 'utf8');

    return content.replace(REFERENCE_LINK_SEARCH_PATTERN, (_match, referencePath: string) => {
      return `](${this.resolveReferencePath(skillName, skillPath, referencePath)})`;
    });
  }

  private resolveReferencePath(skillName: string, skillPath: string, referencePath: string): string {
    const resolvedPath = resolve(skillPath, referencePath);
    SkillRegistry.assertPathWithinSkillFolder(resolvedPath, skillPath, referencePath);

    if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
      throw new Error(`Skill reference file not found for skill "${skillName}": ${referencePath}`);
    }

    const realSkillPath = realpathSync(skillPath);
    const realReferencePath = realpathSync(resolvedPath);
    SkillRegistry.assertPathWithinSkillFolder(realReferencePath, realSkillPath, referencePath);

    return resolvedPath;
  }

  private resolveSkillName(nameOrAlias: string): string {
    return this.aliases.get(nameOrAlias) ?? nameOrAlias;
  }

  private getEntry(skillName: string): SkillRegistryEntry {
    const entry = this.entries.get(skillName);
    if (!entry) {
      throw new Error(`Unknown skill: ${skillName}`);
    }
    return entry;
  }

  private getPackageRoot(): string {
    if (this.packageRoot) return this.packageRoot;

    let currentPath = dirname(fileURLToPath(import.meta.url));

    while (true) {
      const packageJsonPath = join(currentPath, 'package.json');
      const skillsDataPath = join(currentPath, SKILLS_DATA_DIRECTORY);

      if (existsSync(packageJsonPath) && existsSync(skillsDataPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };
        if (packageJson.name === PACKAGE_NAME) {
          this.packageRoot = currentPath;
          return currentPath;
        }
      }

      const parentPath = dirname(currentPath);
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    throw new Error(`Unable to locate ${PACKAGE_NAME} package root`);
  }

  private static assertPathWithinSkillFolder(candidatePath: string, skillPath: string, referencePath: string): void {
    const relativePath = relative(skillPath, candidatePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error(`Skill reference escapes the skill folder: ${referencePath}`);
    }
  }
}

export { REFERENCES_PREFIX };
