import { type FormatOpt, OUTPUT_FORMAT_COMMAND_OPT_FLAGS } from '../../types/output-format-options.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { formatOutput } from '../../utils/tokenizer.util';
import { VaultCli } from '../../utils/vault-cli.util';

type BundleViewOptions = {
  bundle: string;
} & FormatOpt;

export class BundleViewCommand implements CommandStrategy {
  readonly config = {
    name: 'view',
    description: 'View Bundle Metadata, Concept, Child Bundles',
    options: [{ flag: '--bundle <bundle_folder>', description: 'bundle folder path', required: true }, ...OUTPUT_FORMAT_COMMAND_OPT_FLAGS],
  };

  async execute(opts: BundleViewOptions): Promise<void> {
    const { bundle } = opts;

    const { valid: validFormat, format } = OkfBundleGuard.validateOutputFormat(opts.format);

    if (!validFormat) {
      process.exit(1);
    }

    const { validBundle, children } = await OkfBundleGuard.validateBundleAndGetChildren(bundle);

    if (!validBundle) {
      process.exit(1);
    }

    const vaultPath = await VaultCli.getVaultPath();
    const concepts = await this.getBundleConcepts({ bundle, vaultPath });
    const payload = {
      ...validBundle,
      concepts: concepts,
      childBundles: children,
    };

    const output = formatOutput(payload, { type: format, compact: opts.compact });
    console.log(output);
  }

  private async getBundleConcepts({ bundle, vaultPath }: { bundle: string; vaultPath: string }): Promise<Record<string, unknown>[]> {
    const fullBundlePath = `${vaultPath}/${bundle}`;

    const concepts = await VaultCli.getBundleConcepts({ bundle, vaultPath });
    const conceptWithProperties: Record<string, unknown>[] = [];
    for (const concept of concepts) {
      const data = await VaultCli.getConceptProperties({ bundle, concept });
      const fullPath = `${fullBundlePath}/${concept}.md`;
      conceptWithProperties.push({
        ...data,
        fullpath: fullPath,
      });
    }
    return conceptWithProperties;
  }
}
