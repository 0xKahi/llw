import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { VaultCli } from '../../utils/vault-cli.util';

type ConceptOpenOptions = {
  bundle: string;
};

export class ConceptOpenCommand implements CommandStrategy {
  readonly config = {
    name: 'open',
    description: 'Open a concept file in Obsidian',
    args: [{ name: '<concept_name>', description: 'concept name' }],
    options: [{ flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true }],
  };

  async execute(concept: string, options: ConceptOpenOptions): Promise<void> {
    const { bundle } = options;

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

    await VaultCli.vaultBaseCli(['open', `path=${bundle}/${concept}.md`]);
  }
}
