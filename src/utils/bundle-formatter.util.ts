import type { BundleBaseMetadata, BundleMetadata, BundleProperties } from '../types/bundle-metadata.type';

export class BundleFormatter {
  static parseBaseMeta(data: BundleBaseMetadata): BundleMetadata {
    return {
      title: data.title,
      folder: data.folder,
      path: data.path,
      description: data.description,
      triggers: data.triggers ? data.triggers.split(',').map(trigger => trigger.trim()) : [],
      parent: data.parent,
      parentFolder: BundleFormatter.parseParentFolder(data.parent),
    };
  }

  static parseBundleProps(data: BundleProperties): BundleMetadata {
    return {
      ...data,
      parentFolder: BundleFormatter.parseParentFolder(data.parent),
    };
  }

  /** Extracts title from an obsidian wikilink, e.g. `[[bundles/shuffle/bundle|shuffle]]` -> `shuffle` */
  static parseParentTitle(parent: string | null): string | null {
    if (!parent) return null;
    const match = parent.match(/\|([^\]]+)\]\]$/);
    return match?.[1] ?? null;
  }

  /** Extracts parent folder from an obsidian wikilink, e.g. `[[bundles/shuffle/bundle|shuffle]]` -> `bundles/shuffle` */
  static parseParentFolder(parent: string | null): string | null {
    if (!parent) return null;
    const match = parent.match(/^\[\[(.+)\/bundle(?:\.md)?(?:\|[^\]]+)?\]\]$/);
    return match?.[1] ?? null;
  }
}
