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

  static parseInputToObsidianTagProperty(tags: string): string {
    const tagList = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => `"${tag}"`);
    const tagValue = `[${tagList.join(',')}]`;
    return tagValue;
  }

  /**
   * Replacer function for compact TOON output that converts triggers and tags arrays into comma-separated strings.
   * @param key - The key of the property being processed.
   * @param value - The value of the property being processed.
   * @returns The modified value for the triggers and tags properties, or the original value for other properties.
   */
  static compactToonReplacer(key: string, value: unknown): unknown {
    if (key === 'triggers' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : null;
    }
    if (key === 'tags' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : null;
    }
    return value;
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
