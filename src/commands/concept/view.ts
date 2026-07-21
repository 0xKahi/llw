import { type FormatOpt, OUTPUT_FORMAT_COMMAND_OPT_FLAGS } from '../../types/output-format-options.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { formatOutput } from '../../utils/tokenizer.util';
import { VaultCli } from '../../utils/vault-cli.util';

type ConceptViewOptions = {
  bundle: string;
} & FormatOpt;

export class ConceptViewCommand implements CommandStrategy {
  readonly config = {
    name: 'view',
    description: 'View Concept Metadata',
    args: [{ name: '<concept_name>', description: 'concept name' }],
    options: [{ flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true }, ...OUTPUT_FORMAT_COMMAND_OPT_FLAGS],
  };

  async execute(concept: string, options: ConceptViewOptions): Promise<void> {
    const { bundle } = options;

    const { valid: validFormat, format } = OkfBundleGuard.validateOutputFormat(options.format);

    if (!validFormat) {
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

    const data = await VaultCli.getConceptProperties({ bundle, concept });
    const payload = {
      ...data,
      fullpath: fullConceptPath,
    };

    const output = formatOutput(payload, { type: format, compact: options.compact });

    console.log(output);
  }
}
