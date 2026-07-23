export interface SkillRegistryEntry {
  description: string;
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
    description: 'the core llm-wiki skill to update, create, enrich, bundles and concepts based on the okf standard',
  },
};

export function getSkillEntries({ testSkills }: { testSkills: boolean }): SkillEntryInput[] {
  return Object.entries(SKILL_ENTRIES)
    .filter(([, entry]) => testSkills || !entry.testOnly)
    .map(([skillName, entry]) => ({ skillName, entry }));
}
