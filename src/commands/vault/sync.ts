import { mkdir, writeFile } from 'node:fs/promises';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultCli } from '../../utils/vault-cli.util';

export class VaultSyncCommand implements CommandStrategy {
  readonly config = {
    name: 'sync',
    description: 'Generate the fresh wiki sync manifest',
  };

  async execute(): Promise<void> {
    const vaultPath = await VaultCli.getVaultPath();
    const bundles = await VaultCli.getAllBundles();
    const syncBundles = await Promise.all(
      bundles.map(async bundle => {
        const bundleHashes = await VaultCli.getBundleHashes({ bundle: bundle.folder, vaultPath });
        const concepts = Object.fromEntries(bundleHashes.concepts.map(concept => [concept.path, concept.hash]));

        return {
          title: bundle.title,
          folder: bundle.folder,
          hash: bundleHashes.bundle,
          numberOfConcepts: bundleHashes.concepts.length,
          bundleFilePath: `${bundle.folder}/bundle.md`,
          concepts,
        };
      }),
    );

    const syncManifest = {
      vaultPath,
      totalBundles: bundles.length,
      generatedTimestamp: new Date().toISOString(),
      bundles: syncBundles,
    };

    const cachePath = `${vaultPath}/cache`;
    const syncPath = `${cachePath}/new_vault_map.json`;
    await mkdir(cachePath, { recursive: true });
    await writeFile(syncPath, `${JSON.stringify(syncManifest, null, 2)}\n`);
    console.log(syncPath);
  }
}
