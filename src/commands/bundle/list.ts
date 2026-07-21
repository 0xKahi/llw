import { type FormatOpt, OUTPUT_FORMAT_COMMAND_OPT_FLAGS } from '../../types/output-format-options.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { formatOutput } from '../../utils/tokenizer.util';
import { VaultCli } from '../../utils/vault-cli.util';

export class BundleListCommand implements CommandStrategy {
  readonly config = {
    name: 'list',
    alias: 'ls',
    description: 'View all bundles in the Knowledge Base',
    options: [...OUTPUT_FORMAT_COMMAND_OPT_FLAGS],
  };

  async execute(opts: FormatOpt): Promise<void> {
    const { valid, format } = OkfBundleGuard.validateOutputFormat(opts.format);

    if (!valid) {
      process.exit(1);
    }

    const bundles = await VaultCli.getAllBundles();
    const bundleJson = { bundles: bundles };

    const output = formatOutput(bundleJson, { type: format, compact: opts.compact });
    console.log(output);
  }
}
