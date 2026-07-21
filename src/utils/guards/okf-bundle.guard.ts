import { EXCLUDE_FILES } from '../../constants';
import type { BundleMetadata } from '../../types/bundle-metadata.type';
import { PathUtil } from '../path.util';
import { VaultCli } from '../vault-cli.util';
import { SharedGuard } from './shared.guard';

export class OkfBundleGuard extends SharedGuard {
  static async isValidBundle(bundle: string, skipErrors?: boolean): Promise<boolean> {
    const bundleFolders = await VaultCli.getBundleFolders();
    if (!bundleFolders.has(bundle)) {
      if (!skipErrors) {
        console.error(`Error: bundle "${bundle}" path not a valid bundle`);
        console.error(`DEBUG: bundle "${bundle}" either has a missing bundle.md file or bundle dir does not exists`);
        console.error(`DEBUG: current available bundles "${Array.from(bundleFolders)}"`);
      }
      return false;
    }
    return true;
  }

  static isValidConceptName(concept: string): boolean {
    if (concept.endsWith('.md') === true) {
      console.error('ERROR: DO NOT include the .md extension in the concept name, it will be handled by the script');
      return false;
    }

    if (!/^[a-z0-9][a-z0-9_-]*$/.test(concept)) {
      console.error(`Error: invalid concept name "${concept}", must be lowercase snake/kebab-case with no spaces`);
      return false;
    }

    if (EXCLUDE_FILES.includes(concept)) {
      console.error(`Error: invalid concept name "${concept}", it is a reserved file name`);
      console.error(`DEBUG: reserved file names "${EXCLUDE_FILES}"`);
      return false;
    }
    return true;
  }

  static async isValidConcept({ bundle, concept }: { bundle: string; concept: string }): Promise<{ valid: boolean; fullConceptPath: string }> {
    const vaultPath = await VaultCli.getVaultPath();
    const conceptPath = `${bundle}/${concept}.md`;
    const fullConceptPath = `${vaultPath}/${conceptPath}`;

    if (PathUtil.findFile(fullConceptPath).exists) {
      return { valid: true, fullConceptPath };
    }
    return { valid: false, fullConceptPath };
  }

  static async validateBundleAndGetChildren(bundle: string): Promise<{ validBundle?: BundleMetadata; children: BundleMetadata[] }> {
    const bundles = await VaultCli.getAllBundles();
    const validBundle = bundles.find(b => b.folder === bundle);
    if (!validBundle) {
      console.error(`Error: bundle "${bundle}" path not a valid bundle`);
      console.error(`DEBUG: bundle "${bundle}" either has a missing bundle.md file or bundle dir does not exists`);
      console.error(`DEBUG: current available bundles "${bundles.map(b => b.folder)}"`);
      return { children: [] };
    }
    const children = bundles.filter(b => b.parentFolder === validBundle.folder);
    return { validBundle, children };
  }
}
