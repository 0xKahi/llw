import { type FormatOpt, OUTPUT_FORMAT_COMMAND_OPT_FLAGS } from '../../types/output-format-options.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { JevUtil } from '../../utils/jev.util';
import { formatOutput } from '../../utils/tokenizer.util';
import { VaultCli } from '../../utils/vault-cli.util';

type BundleSearchOpts = FormatOpt & { question: string };

export class JevBundleSearchCommand implements CommandStrategy {
  readonly config = {
    name: 'bundle_search',
    description: 'Ask Jev which bundles are likely to contain information about a question',
    options: [
      { flag: '--question -q <question>', description: 'question to ask about each bundle', required: true },
      ...OUTPUT_FORMAT_COMMAND_OPT_FLAGS,
    ],
  };

  async execute(opts: BundleSearchOpts): Promise<void> {
    const { valid, format } = OkfBundleGuard.validateOutputFormat(opts.format);
    if (!valid) {
      process.exit(1);
    }

    const bundleMap = await VaultCli.getBundleMap();
    const bundles = await JevUtil.searchBundles({ bundleMap, question: opts.question });
    console.log(formatOutput({ question: opts.question, bundles }, { type: format, compact: !opts.pretty }));
  }
}
