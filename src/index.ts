#!/usr/bin/env bun

import { BundleCommand } from './commands/bundle';
import { ConceptCommand } from './commands/concept';
import { VaultCommand } from './commands/vault';
import { CommandEx } from './utils/commander/command-ex';
import type { CommandStrategy } from './utils/commander/command-strategy';

const mainCommand: CommandStrategy = {
  config: {
    name: 'llw',
    description: 'LLM Wiki CLI',
    subCommands: [new BundleCommand(), new ConceptCommand(), new VaultCommand()],
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
