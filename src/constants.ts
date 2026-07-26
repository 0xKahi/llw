import { getSkillEntries } from './utils/skill-registry/registry';
import { SkillRegistry } from './utils/skill-registry/skill-registry';

// Test-only skills are exposed to the CLI when LLW_TEST_SKILLS=1 (used by the test suite).
export const skillRegistry = new SkillRegistry(getSkillEntries({ testSkills: process.env.LLW_TEST_SKILLS === '1' }));
// export const skillRegistry = new SkillRegistry(getSkillEntries({ testSkills: true }));

export const EXCLUDE_FILES = ['bundle', 'log', 'index'];
export const BUNDLE_OBSIDIAN_BASE = 'bases/bundles-index.base';
export const BUNDLES_FOLDER = 'bundles';

export const BUNDLE_TEMPLATE = 'bundle';
export const CONCEPT_TEMPLATE = 'concept';

export const COLORS = {
  blue: '#82aaff',
};

export const VAULT_CACHE_FOLDER = 'cache';
