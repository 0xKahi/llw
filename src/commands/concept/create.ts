import { CONCEPT_TEMPLATE } from '../../constants';
import { BundleFormatter } from '../../utils/bundle-formatter.util';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

type ConceptCreateOptions = {
  bundle: string;
  type: string;
  description: string;
  resource?: string;
  tags?: string;
};

export class ConceptCreateCommand implements CommandStrategy {
  readonly config = {
    name: 'create',
    description: 'Create a new concept file and set its properties',
    args: [{ name: '<concept_name>', description: 'concept name (without .md extension)' }],
    options: [
      { flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true },
      { flag: '--type <type>', description: 'concept type', required: true },
      { flag: '--description <description>', description: 'concept description', required: true },
      { flag: '--resource [resource]', description: 'concept resource (optional)' },
      { flag: '--tags [tags]', description: 'comma separated concept tags (optional)' },
    ],
  };

  async execute(concept: string, options: ConceptCreateOptions): Promise<void> {
    const { bundle, type, description, resource, tags } = options;

    const isValidBundle = await OkfBundleGuard.isValidBundle(bundle);
    if (!isValidBundle) {
      process.exit(1);
    }

    if (!OkfBundleGuard.isValidConceptName(concept)) {
      process.exit(1);
    }

    const { valid, fullConceptPath } = await OkfBundleGuard.isValidConcept({ bundle, concept });

    if (valid) {
      console.error(`Error: concept "${concept}" already exists at path "${fullConceptPath}"`);
      process.exit(1);
    }

    await VaultCli.vaultBaseCli(['create', `name=${concept}`, `path=${bundle}`, `template=${CONCEPT_TEMPLATE}`]);

    const conceptPath = `${bundle}/${concept}.md`;
    await VaultCli.setProperties({ path: conceptPath, name: 'title', value: concept, type: 'text' });
    await VaultCli.setProperties({ path: conceptPath, name: 'type', value: type, type: 'text' });
    await VaultCli.setProperties({ path: conceptPath, name: 'description', value: description, type: 'text' });

    if (resource) {
      await VaultCli.setProperties({ path: conceptPath, name: 'resource', value: resource, type: 'text' });
    }

    if (tags) {
      await VaultCli.setProperties({ path: conceptPath, name: 'tags', value: BundleFormatter.parseInputToObsidianTagProperty(tags), type: 'tags' });
    }

    console.info('INFO: Full path to concept file for writing content:', `'${fullConceptPath}'`);
  }
}
