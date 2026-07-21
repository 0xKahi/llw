import { BUNDLE_TEMPLATE, BUNDLES_FOLDER } from '../../constants';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

const BUNDLE_SEGMENT_FORMAT = /^[a-z0-9][a-z0-9_-]*$/;

type BundleCreateOptions = {
  description: string;
  triggers?: string;
  parent?: string;
};

export class BundleCreateCommand implements CommandStrategy {
  readonly config = {
    name: 'create',
    description: 'Create a new bundle.md file and set its properties',
    args: [{ name: '<bundle_folder>', description: 'bundle folder path' }],
    options: [
      { flag: '--description <description>', description: 'bundle description', required: true },
      { flag: '--triggers [triggers]', description: 'comma separated bundle triggers (optional)' },
      { flag: '--parent [parent_bundle_folder]', description: 'parent bundle folder path (optional)' },
    ],
  };

  async execute(bundle: string, options: BundleCreateOptions): Promise<void> {
    const { description, triggers, parent } = options;
    const segments = bundle.split('/');

    if (segments[0] !== BUNDLES_FOLDER) {
      console.error(`Error: bundle must be created in the "${BUNDLES_FOLDER}" folder`);
      process.exit(1);
    }

    if (segments.length < 2) {
      console.error(
        `Error: cannot create a bundle at the root of the "${BUNDLES_FOLDER}" folder, provide a bundle name (e.g. "${BUNDLES_FOLDER}/my-bundle")`,
      );
      process.exit(1);
    }

    if (!segments.slice(1).every(segment => BUNDLE_SEGMENT_FORMAT.test(segment))) {
      console.error(
        `Error: invalid bundle path "${bundle}", folder names must be lowercase snake/kebab-case (no spaces, no empty segments, no trailing slash)`,
      );
      process.exit(1);
    }

    if (parent) {
      const isValidParent = await OkfBundleGuard.isValidBundle(parent);
      if (!isValidParent) {
        console.error(`Error: parent bundle "${parent}" not a valid bundle`);
        process.exit(1);
      }
    }

    const isValidBundle = await OkfBundleGuard.isValidBundle(bundle, true);
    if (isValidBundle) {
      console.error(`Error: bundle "${bundle}" bundle.md already exists`);
      process.exit(1);
    }
    await VaultCli.vaultBaseCli(['create', 'name=bundle', `path=${bundle}`, `template=${BUNDLE_TEMPLATE}`]);

    const bundlePath = `${bundle}/bundle.md`;
    const title = bundle.split('/').pop() || '';
    await VaultCli.setProperties({ path: bundlePath, name: 'title', value: title, type: 'text' });
    await VaultCli.setProperties({ path: bundlePath, name: 'description', value: description, type: 'text' });

    if (triggers) {
      await VaultCli.setProperties({ path: bundlePath, name: 'triggers', value: triggers, type: 'list' });
    }

    if (parent) {
      const parentTitle = parent.split('/').pop() || '';
      await VaultCli.setProperties({ path: bundlePath, name: 'parent', value: `[[${parent}/bundle|${parentTitle}]]`, type: 'text' });
    }
  }
}
