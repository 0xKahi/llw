import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

type BundleUpdateOptions = {
  bundle: string;
  description?: string;
  triggers?: string;
  parent?: string;
};

export class BundleUpdateCommand implements CommandStrategy {
  readonly config = {
    name: 'update',
    description: 'Update Bundle Metadata (only sets provided properties)',
    options: [
      { flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true },
      { flag: '--description [description]', description: 'bundle description (optional)' },
      { flag: '--triggers [triggers]', description: 'comma separated bundle triggers (optional)' },
      { flag: '--parent [parent_bundle_folder]', description: 'parent bundle folder path (optional)' },
    ],
  };

  async execute(options: BundleUpdateOptions): Promise<void> {
    const { bundle, description, triggers, parent } = options;

    if (!description && !triggers && !parent) {
      console.error('Error: no properties provided to update, provide at least one of --description, --triggers, --parent');
      process.exit(1);
    }

    const isValidBundle = await OkfBundleGuard.isValidBundle(bundle);
    if (!isValidBundle) {
      process.exit(1);
    }

    if (parent) {
      const isValidParent = await OkfBundleGuard.isValidBundle(parent);
      if (!isValidParent) {
        console.error(`Error: parent bundle "${parent}" not a valid bundle`);
        process.exit(1);
      }
    }

    const bundlePath = `${bundle}/bundle.md`;

    if (description) {
      await VaultCli.setProperties({ path: bundlePath, name: 'description', value: description, type: 'text' });
    }

    if (triggers) {
      await VaultCli.setProperties({ path: bundlePath, name: 'triggers', value: triggers, type: 'list' });
    }

    if (parent) {
      const parentTitle = parent.split('/').pop() || '';
      await VaultCli.setProperties({ path: bundlePath, name: 'parent', value: `[[${parent}/bundle|${parentTitle}]]`, type: 'text' });
    }
  }
}
