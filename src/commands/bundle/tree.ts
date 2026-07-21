import type { BundleMetadata } from '../../types/bundle-metadata.type';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { VaultCli } from '../../utils/vault-cli.util';

type BundleTreeOptions = {
  verbose?: boolean;
};

const DISPLAY_PROPERTIES = ['path', 'folder', 'description', 'triggers'] as const;

export class BundleTreeCommand implements CommandStrategy {
  readonly config = {
    name: 'tree',
    description: 'View all bundles in the Knowledge Base as a tree structure',
    options: [{ flag: '--verbose -V [value]', description: 'return tree as verbose format' }],
  };

  async execute(options: BundleTreeOptions): Promise<void> {
    const { verbose } = options;
    const map = await VaultCli.getBundleMap();
    const childrenByParent = this.buildHierarchy(map);

    const lines: string[] = ['bundles'];
    const roots = childrenByParent.get(null) ?? [];
    roots.forEach((bundle, i) => {
      this.renderNode({
        bundle,
        childrenByParent,
        lines,
        prefix: '',
        numberPath: `${i + 1}`,
        isLast: i === roots.length - 1,
        verbose: verbose === true,
      });
    });

    console.log(lines.join('\n'));
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
    lines: string[];
    prefix: string;
    numberPath: string;
    isLast: boolean;
    verbose: boolean;
  }): void {
    const { bundle, childrenByParent, lines, prefix, numberPath, isLast, verbose } = args;

    const branch = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${branch}${numberPath}. ${bundle.title}`);

    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const children = childrenByParent.get(bundle.folder) ?? [];

    if (verbose) {
      // properties get a `│` continuation when children follow below them
      const propPrefix = childPrefix + (children.length > 0 ? '│ ' : '  ');
      for (const prop of DISPLAY_PROPERTIES) {
        const value = bundle[prop];
        let displayValue: string = 'null';
        if (typeof value === 'string') displayValue = `"${value}"`;
        if (Array.isArray(value)) displayValue = `[${value.map(v => `"${v}"`).join(', ')}]`;
        lines.push(`${propPrefix}* ${prop}: ${displayValue}`);
      }
    }

    children.forEach((child, i) => {
      this.renderNode({
        bundle: child,
        childrenByParent,
        lines,
        prefix: childPrefix,
        numberPath: `${numberPath}.${i + 1}`,
        isLast: i === children.length - 1,
        verbose,
      });
    });
  }
}
