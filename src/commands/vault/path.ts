import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultCli } from '../../utils/vault-cli.util';

export class VaultPathCommand implements CommandStrategy {
  readonly config = {
    name: 'path',
    description: 'View Full Path To The Vault',
  };
  async execute(): Promise<void> {
    const vaultPath = await VaultCli.getVaultPath();
    console.log(vaultPath);
  }
}
