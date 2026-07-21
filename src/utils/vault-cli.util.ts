import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { $ } from 'bun';
import { BUNDLE_OBSIDIAN_BASE, EXCLUDE_FILES } from '../constants';
import type { BundleBaseMetadata, BundleMetadata } from '../types/bundle-metadata.type';
import { BundleFormatter } from './bundle-formatter.util';
import { replaceFileExtension } from './replace-file-extension.util';

export class VaultCli {
  static vaultBaseCli(cmds: string[]) {
    const args = ['vault=llm-wiki', ...cmds];
    return $`obsidian ${args}`;
  }

  static async getVaultPath() {
    const shell = VaultCli.vaultBaseCli(['vault', 'info=path']);
    return (await shell.text()).trim();
  }

  static async getBundleFolders() {
    const shell = VaultCli.vaultBaseCli(['base:query', `path=${BUNDLE_OBSIDIAN_BASE}`, 'format=paths']);
    const folders: Set<string> = new Set();

    for await (const line of shell.lines()) {
      const trimmed = line.trim();
      if (trimmed) {
        folders.add(trimmed.replace(/\/bundle\.md$/, ''));
      }
    }
    return folders;
  }

  static async getAllBundles(): Promise<BundleMetadata[]> {
    const shell = VaultCli.vaultBaseCli(['base:query', `path=${BUNDLE_OBSIDIAN_BASE}`, 'format=json']);
    const output = (await shell.json()) as BundleBaseMetadata[];
    return output.map(bundle => BundleFormatter.parseBaseMeta(bundle));
  }

  static async getBundleMap(): Promise<Map<string, BundleMetadata>> {
    const map = new Map<string, BundleMetadata>();
    const bundles = await VaultCli.getAllBundles();
    for (const bundle of bundles) {
      map.set(bundle.folder, bundle);
    }
    return map;
  }

  static async getBundleConcepts({ bundle, vaultPath }: { bundle: string; vaultPath: string }): Promise<string[]> {
    const fullBundlePath = `${vaultPath}/${bundle}`;

    const entries = await readdir(fullBundlePath, { withFileTypes: true });
    const concepts = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => replaceFileExtension({ fileName: e.name, extension: '.md' }))
      .filter(name => !EXCLUDE_FILES.includes(name));
    return concepts;
  }

  static async getBundleHashes({
    bundle,
    vaultPath,
  }: {
    bundle: string;
    vaultPath: string;
  }): Promise<{ bundle: string; concepts: Array<{ path: string; hash: string }> }> {
    const fullBundlePath = `${vaultPath}/${bundle}`;
    const entries = await readdir(fullBundlePath, { withFileTypes: true });
    const conceptFiles = entries.filter(
      e => e.isFile() && e.name.endsWith('.md') && !EXCLUDE_FILES.includes(replaceFileExtension({ fileName: e.name, extension: '.md' })),
    );

    const concepts = await Promise.all(
      conceptFiles.map(async entry => {
        const content = await readFile(`${fullBundlePath}/${entry.name}`);
        const hash = createHash('md5').update(content).digest('hex');
        return { path: `${bundle}/${entry.name}`, hash };
      }),
    );
    concepts.sort((a, b) => a.path.localeCompare(b.path));

    const bundleHash = createHash('md5')
      .update(concepts.map(concept => concept.hash).join(''))
      .digest('hex');
    return { bundle: bundleHash, concepts };
  }

  static async getConceptProperties({ bundle, concept }: { bundle: string; concept: string }): Promise<Record<string, unknown>> {
    const shell = VaultCli.vaultBaseCli(['properties', `path=${bundle}/${concept}.md`, 'format=json']);
    const output = await shell.json();
    return output;
  }

  static async getBundleProperties(bundle: string): Promise<Record<string, unknown>> {
    const shell = VaultCli.vaultBaseCli(['properties', `path=${bundle}/bundle.md`, 'format=json']);
    const output = await shell.json();
    return output;
  }

  static async setProperties({
    path,
    name,
    value,
    type,
  }: {
    path: string;
    name: string;
    value: string;
    type: 'text' | 'list' | 'datetime' | 'tags';
  }) {
    const shell = VaultCli.vaultBaseCli(['property:set', `path=${path}`, `name=${name}`, `value=${value}`, `type=${type}`]);
    await shell;
  }
}
