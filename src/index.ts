#!/usr/bin/env bun

import { BundleCommand } from './commands/bundle';
import { ConceptCommand } from './commands/concept';
import { SkillsCommand } from './commands/skills';
import { VaultCommand } from './commands/vault';
import { CURRENT_VERSION } from './meta';
import { CommandEx } from './utils/commander/command-ex';
import type { CommandStrategy } from './utils/commander/command-strategy';

const mainCommand: CommandStrategy = {
  config: {
    name: 'llw',
    description: 'LLM Wiki CLI',
    version: CURRENT_VERSION,
    subCommands: [new BundleCommand(), new ConceptCommand(), new SkillsCommand(), new VaultCommand()],
  },
};

async function main() {
  const program = new CommandEx();
  program.use(mainCommand);
  await program.parseAsync(process.argv);
}

main().catch(err => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
