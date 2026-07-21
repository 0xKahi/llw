import { dye } from '@0xkahi/cli-dye';
import { COLORS } from '../../constants';
import type { BundleMetadata } from '../../types/bundle-metadata.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultCli } from '../../utils/vault-cli.util';

export class VaultInfoCommand implements CommandStrategy {
  readonly config = {
    name: 'info',
    description: 'View Vault Full Info',
  };

  async execute(): Promise<void> {
    const map = await VaultCli.getBundleMap();
    const childrenByParent = this.buildHierarchy(map);

    const conceptMapCount = new Map<string, number>();
    let totalConcepts = 0;
    const vaultPath = await VaultCli.getVaultPath();
    for (const bundle of map.values()) {
      const concepts = await VaultCli.getBundleConcepts({ bundle: bundle.folder, vaultPath });
      totalConcepts += concepts.length;
      conceptMapCount.set(bundle.folder, concepts.length);
    }

    const lines: string[] = [dye.colorize('bundles', { fg: dye.hex(COLORS.blue) })];
    const roots = childrenByParent.get(null) ?? [];
    roots.forEach((bundle, i) => {
      this.renderNode({
        bundle,
        childrenByParent,
        bundleConceptCountMap: conceptMapCount,
        lines,
        prefix: '',
        numberPath: `${i + 1}`,
        isLast: i === roots.length - 1,
      });
    });

    console.log(lines.join('\n'));
    console.log('');
    console.log(`TOTAL_BUNDLES: ${dye.colorize(`${map.size}`, { fg: 'brightGreen' })}`);
    console.log(`TOTAL_CONCEPTS: ${dye.colorize(`${totalConcepts}`, { fg: 'brightYellow' })}`);
  }

  /** Groups bundles by parent folder (null = root). Orphans (missing parent) are treated as roots. */
  private buildHierarchy(map: Map<string, BundleMetadata>): Map<string | null, BundleMetadata[]> {
    const childrenByParent = new Map<string | null, BundleMetadata[]>();

    for (const bundle of map.values()) {
      let parentFolder = bundle.parentFolder;
      if (parentFolder !== null && !map.has(parentFolder)) parentFolder = null; // orphan -> root
      const siblings = childrenByParent.get(parentFolder) ?? [];
      siblings.push(bundle);
      childrenByParent.set(parentFolder, siblings);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => a.title.localeCompare(b.title));
    }
    return childrenByParent;
  }

  private renderNode(args: {
    bundle: BundleMetadata;
    childrenByParent: Map<string | null, BundleMetadata[]>;
    bundleConceptCountMap: Map<string, number>;
    lines: string[];
    prefix: string;
    numberPath: string;
    isLast: boolean;
  }): void {
    const { bundle, childrenByParent, bundleConceptCountMap, lines, prefix, numberPath, isLast } = args;

    const branch = isLast ? '└── ' : '├── ';

    const conceptCount = bundleConceptCountMap.get(bundle.folder) ?? 0;
    const conceptCountStr = dye.colorize(`${conceptCount}`, { fg: 'brightYellow' });
    const conceptCounter = conceptCount > 0 ? conceptCountStr : dye.dim(conceptCountStr);

    lines.push(
      `${dye.dim(prefix)}${dye.dim(branch)}${dye.colorize(`${numberPath}.`, { fg: 'brightCyan' })} ${dye.colorize(bundle.title, { fg: 'brightGreen' })} ${conceptCounter}`,
    );

    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const children = childrenByParent.get(bundle.folder) ?? [];

    children.forEach((child, i) => {
      this.renderNode({
        bundle: child,
        childrenByParent,
        bundleConceptCountMap,
        lines,
        prefix: childPrefix,
        numberPath: `${numberPath}.${i + 1}`,
        isLast: i === children.length - 1,
      });
    });
  }
}
