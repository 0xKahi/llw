import { noul } from '@typesafe-ai/sdk';
import { type FormatOpt, OUTPUT_FORMAT_COMMAND_OPT_FLAGS } from '../../types/output-format-options.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { OkfBundleGuard } from '../../utils/guards/okf-bundle.guard';
import { JevUtil, type ScoredBundle } from '../../utils/jev.util';
import { formatOutput } from '../../utils/tokenizer.util';
import { VaultCli } from '../../utils/vault-cli.util';

const STATE = {
  knowledge_base:
    'A personal knowledge base organized into bundles. Each bundle is a folder of notes (concepts) on one area. ' +
    "Every question includes one concept note's full markdown content (frontmatter and body).",
};

const CRITERIA = {
  true: 'The note contains information about the topic the question asks about.',
  false: 'The note is about unrelated topics or only mentions the topic in passing.',
};

// Jev limits: 64k tokens per request, 32k per question (~4 chars/token). Keep headroom for state + instructions.
const MAX_CONCEPT_CHARS = 60_000;
const MAX_REQUEST_CHARS = 160_000;

type SearchOpts = FormatOpt & { question: string };

type ConceptInput = { bundle: string; concept: string; fullpath: string; content: string };
type ScoredConcept = Record<string, unknown> & { fullpath: string; probability: number };
type SearchBundleResult = ScoredBundle & { concepts: ScoredConcept[] };

export class JevSearchCommand implements CommandStrategy {
  readonly config = {
    name: 'search',
    description: 'Ask Jev which bundles and concepts are likely to contain information about a question',
    options: [
      { flag: '--question -q <question>', description: 'question to search the knowledge base for', required: true },
      ...OUTPUT_FORMAT_COMMAND_OPT_FLAGS,
    ],
  };

  async execute(opts: SearchOpts): Promise<void> {
    const { valid, format } = OkfBundleGuard.validateOutputFormat(opts.format);
    if (!valid) {
      process.exit(1);
    }

    const [bundleMap, vaultPath] = await Promise.all([VaultCli.getBundleMap(), VaultCli.getVaultPath()]);
    const candidates = await JevUtil.searchBundles({ bundleMap, question: opts.question });

    const results = await Promise.all(candidates.map(bundle => this.searchBundle({ question: opts.question, bundle, vaultPath })));
    const bundles = results.filter((b): b is SearchBundleResult => b !== null);

    console.log(formatOutput({ question: opts.question, bundles }, { type: format, compact: !opts.pretty }));
  }

  /** Filters a bundle's concepts with Jev. Returns null when no concept qualifies. */
  private async searchBundle({
    question,
    bundle,
    vaultPath,
  }: {
    question: string;
    bundle: ScoredBundle;
    vaultPath: string;
  }): Promise<SearchBundleResult | null> {
    const conceptNames = await VaultCli.getBundleConcepts({ bundle: bundle.folder, vaultPath });
    if (conceptNames.length === 0) return null;

    const inputs: ConceptInput[] = await Promise.all(
      conceptNames.map(async concept => {
        const fullpath = `${vaultPath}/${bundle.folder}/${concept}.md`;
        const content = (await Bun.file(fullpath).text()).slice(0, MAX_CONCEPT_CHARS);
        return { bundle: bundle.folder, concept, fullpath, content };
      }),
    );

    const scores = new Map<string, number>();
    const batchAnswers = await Promise.all(this.batch(inputs).map(batch => this.askJev(question, batch)));
    for (const answers of batchAnswers) {
      for (const [concept, p] of answers) scores.set(concept, p);
    }

    const qualifying = inputs.filter(input => {
      const p = scores.get(input.concept);
      return p !== undefined && JevUtil.noulVerdict(p) !== 'no';
    });
    if (qualifying.length === 0) return null;

    const concepts: ScoredConcept[] = await Promise.all(
      qualifying.map(async input => {
        const props = await VaultCli.getConceptProperties({ bundle: input.bundle, concept: input.concept });
        return { ...props, fullpath: input.fullpath, probability: Number((scores.get(input.concept) ?? 0).toFixed(3)) };
      }),
    );
    concepts.sort((a, b) => b.probability - a.probability);

    return { ...bundle, concepts };
  }

  private async askJev(question: string, batch: ConceptInput[]): Promise<[string, number][]> {
    const questions = Object.fromEntries(batch.map(input => [input.concept, noul(this.instructions(question, input), CRITERIA)]));
    const { answers } = await JevUtil.createJevClient().systemOne({ state: STATE, questions });
    return Object.entries(answers).map(([concept, response]) => [concept, response.noul]);
  }

  /** Packs concepts into request-sized batches to stay under Jev's per-request context limit. */
  private batch(inputs: ConceptInput[]): ConceptInput[][] {
    const batches: ConceptInput[][] = [];
    let current: ConceptInput[] = [];
    let size = 0;
    for (const input of inputs) {
      if (current.length > 0 && size + input.content.length > MAX_REQUEST_CHARS) {
        batches.push(current);
        current = [];
        size = 0;
      }
      current.push(input);
      size += input.content.length;
    }
    if (current.length > 0) batches.push(current);
    return batches;
  }

  private instructions(question: string, input: ConceptInput) {
    return {
      question,
      content: input.content,
    };
  }
}
