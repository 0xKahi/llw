import { BUNDLE_OBSIDIAN_BASE } from '../../constants';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultCli } from '../../utils/vault-cli.util';

export class VaultBaseCommand implements CommandStrategy {
  readonly config = {
    name: 'base',
    description: 'View obsidian bundle base',
  };

  async execute(): Promise<void> {
    await VaultCli.vaultBaseCli(['base:query', `path=${BUNDLE_OBSIDIAN_BASE}`, 'format=json']);
  }
}
