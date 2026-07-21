import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultBaseCommand } from './base';
import { VaultInfoCommand } from './info';
import { VaultPathCommand } from './path';
import { VaultSyncCommand } from './sync';

export class VaultCommand implements CommandStrategy {
  readonly config = {
    name: 'vault',
    description: 'View Vault Info',
    subCommands: [new VaultPathCommand(), new VaultBaseCommand(), new VaultInfoCommand(), new VaultSyncCommand()],
  };
}
