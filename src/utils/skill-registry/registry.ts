export interface SkillRegistryEntry {
  description: string;
  alias?: string;
  testOnly?: boolean;
}

export interface SkillEntryInput {
  skillName: string;
  entry: SkillRegistryEntry;
}

const SKILL_ENTRIES: Record<string, SkillRegistryEntry> = {
  'test-skill': {
    description: 'A test skill for demonstration purposes.',
    testOnly: true,
  },
  'llw-okf': {
    alias: 'core',
    description: 'the core llm-wiki skill to update, create, enrich, bundles and concepts based on the OKF standard',
  },
  'llw-okf-sync': {
    alias: 'bundle-sync',
    description: `sync all knowledge bundles in the vault, get outdated bundle.md files for agents to update with directory of contents`,
  },
};

export function getSkillEntries({ testSkills }: { testSkills: boolean }): SkillEntryInput[] {
  return Object.entries(SKILL_ENTRIES)
    .filter(([, entry]) => testSkills || !entry.testOnly)
    .map(([skillName, entry]) => ({ skillName, entry }));
}
