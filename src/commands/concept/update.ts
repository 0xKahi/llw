import { BundleFormatter } from '../../utils/bundle-formatter.util';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

type ConceptUpdateOptions = {
  bundle: string;
  type?: string;
  description?: string;
  resource?: string;
  tags?: string;
  timestamp?: string | boolean;
};

const TIMESTAMP_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export class ConceptUpdateCommand implements CommandStrategy {
  readonly config = {
    name: 'update',
    description: 'Update Concept Metadata (only sets provided properties)',
    args: [{ name: '<concept_name>', description: 'concept name (without .md extension)' }],
    options: [
      { flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true },
      { flag: '--type [type]', description: 'concept type (optional)' },
      { flag: '--description [description]', description: 'concept description (optional)' },
      { flag: '--resource [resource]', description: 'concept resource (optional)' },
      { flag: '--tags [tags]', description: 'comma separated concept tags (optional)' },
      { flag: '--timestamp [timestamp]', description: 'timestamp value (YYYY-MM-DDTHH:mm), pass without a value to use now (optional)' },
    ],
  };

  async execute(concept: string, options: ConceptUpdateOptions): Promise<void> {
    const { bundle, type, description, resource, tags, timestamp } = options;

    if (!type && !description && !resource && !tags && !timestamp) {
      console.error('Error: no properties provided to update, provide at least one of --type, --description, --resource, --tags, --timestamp');
      process.exit(1);
    }

    if (typeof timestamp === 'string' && !TIMESTAMP_FORMAT.test(timestamp)) {
      console.error(`Error: invalid timestamp value "${timestamp}", expected format YYYY-MM-DDTHH:mm (e.g. 2026-07-02T03:37)`);
      process.exit(1);
    }

    const isValidBundle = await OkfBundleGuard.isValidBundle(bundle);
    if (!isValidBundle) {
      process.exit(1);
    }

    if (!OkfBundleGuard.isValidConceptName(concept)) {
      process.exit(1);
    }

    const { valid, fullConceptPath } = await OkfBundleGuard.isValidConcept({ bundle, concept });
    if (!valid) {
      console.error(`Error: concept "${concept}" does not exists at path "${fullConceptPath}"`);
      process.exit(1);
    }

    const conceptPath = `${bundle}/${concept}.md`;

    if (type) {
      await VaultCli.setProperties({ path: conceptPath, name: 'type', value: type, type: 'text' });
    }

    if (description) {
      await VaultCli.setProperties({ path: conceptPath, name: 'description', value: description, type: 'text' });
    }

    if (resource) {
      await VaultCli.setProperties({ path: conceptPath, name: 'resource', value: resource, type: 'text' });
    }

    if (tags) {
      await VaultCli.setProperties({ path: conceptPath, name: 'tags', value: BundleFormatter.parseInputToObsidianTagProperty(tags), type: 'tags' });
    }

    if (timestamp) {
      // Format: YYYY-MM-DDTHH:mm in local time (e.g. 2026-07-02T03:37)
      const now = new Date();
      const pad = (n: number): string => String(n).padStart(2, '0');
      const value =
        typeof timestamp === 'string'
          ? timestamp
          : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      await VaultCli.setProperties({ path: conceptPath, name: 'timestamp', value, type: 'datetime' });
    }

    console.info('INFO: Full path to concept file for writing content:', `'${fullConceptPath}'`);
  }
}
