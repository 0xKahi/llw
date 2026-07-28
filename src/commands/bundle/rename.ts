import { rename } from 'node:fs/promises';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

type BundleRenameOptions = {
  bundle: string;
  title: string;
};

export class BundleRenameCommand implements CommandStrategy {
  readonly config = {
    name: 'rename',
    description: 'Rename Bundle title and bundle folder',
    options: [
      { flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true },
      { flag: '--title <title>', description: 'new bundle title', required: true },
    ],
  };

  async execute(options: BundleRenameOptions): Promise<void> {
    const { bundle, title } = options;

    const isValidBundle = await OkfBundleGuard.isValidBundle(bundle);
    if (!isValidBundle) {
      process.exit(1);
    }

    const pathSegments = bundle.split('/');
    const bundleRoot = pathSegments.slice(0, -1).join('/');
    const newBundle = `${bundleRoot}/${title}`;

    const isExistingBundle = await OkfBundleGuard.isValidBundle(newBundle, true);
    if (isExistingBundle) {
      console.error(`Error: bundle "${newBundle}" already exists`);
      process.exit(1);
    }

    const vaultFullPath = await VaultCli.getVaultPath();
    const oldBundlePath = `${bundle}/bundle.md`;

    await VaultCli.setProperties({ path: oldBundlePath, name: 'title', value: title, type: 'text' });
    const oldBundleFullPath = `${vaultFullPath}/${bundle}`;
    const newBundleFullPath = `${vaultFullPath}/${newBundle}`;

    await rename(oldBundleFullPath, newBundleFullPath);
    const lines = [
      `Bundle renamed successfully:`,
      `- Old bundle path: ${oldBundleFullPath}`,
      `- New bundle path: ${newBundleFullPath}`,
      `- bundle changed from ${bundle} -> ${newBundle}`,
    ];
    console.log(lines.join('\n'));
  }
}
